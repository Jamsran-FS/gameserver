import axios from 'axios'

/**
 * @typedef RoomAccess
 * @property {string} roomId
 * @property {string} endpointUrl
 * @property {string} token
 */

class AppClient {

    /**
     * @private
     * @type {import("axios").AxiosInstance}
     */
    httpClient = null

    /**
     * @private
     * @type {string}
     */
    appId = null

    /**
     * @private
     * @type {string}
     */
    authHeader = null

    /**
     * 
     * @param {string} consoleUrl 
     * @param {string} appId 
     */
    constructor(consoleUrl, appId) {
        this.appId = appId
        this.httpClient = axios.create({ baseURL: consoleUrl })
    }

    setConsoleUrl(consoleUrl) {
        this.httpClient.defaults.baseURL = consoleUrl
        return this
    }

    setAppId(appId) {
        this.appId = appId
        return this
    }

    setAuth(type, value) {
        throw new Error('not implemented')
    }

    removeAuth() {
        this.authHeader = null
        return this
    }

    /**
     * 
     * @param {string} fleet 
     * @param {string} roomType 
     * @param {Object<string,any>} userPayload 
     * @returns {PromiseLike<RoomAccess>}
     */
    async createRoom(fleet = null, roomType = null, userPayload = {}) {
        let headers = {}
        if (this.authHeader !== null) {
            headers['Authorization'] = this.authHeader
        }
        return this.httpClient.post(`/api/apps/${this.appId}/rooms`, {
            fleet: fleet,
            roomType: roomType,
            userPayload: userPayload
        }, {
            headers: headers
        }).then(response => {
            const { roomId, endpointUrl, token } = response.data.data
            /** @type {RoomAccess} */
            let roomAccess = { roomId, endpointUrl, token }
            return roomAccess
        }).catch(error => {
            let message = null
            try {
                let cause = error.response.data.cause || null
                if (cause !== null) {
                    message = cause
                }
            } catch (e) {
                throw new Error(`create room error: ${error.message}`)
            }
            throw new Error(`create room error: ${message}`)
        })
    }

    async joinRoom(fleet, roomId, userPayload) {
        let headers = {}
        if (this.authHeader !== null) {
            headers['Authorization'] = this.authHeader
        }
        return this.httpClient.post(`/api/apps/${this.appId}/rooms/join`, {
            fleet: fleet,
            roomId: roomId,
            userPayload: userPayload
        }, { headers: headers }).then(response => {
            const { roomId, endpointUrl, token } = response.data.data
            /** @type {RoomAccess} */
            let roomAccess = { roomId, endpointUrl, token }
            return roomAccess
        }).catch(error => {
            let message = null
            try {
                let cause = error.response.data.cause || null
                if (cause !== null) {
                    message = cause
                }
            } catch (e) {
                throw new Error(`join room error: ${error.message}`)
            }
            throw new Error(`join room error: ${message}`)
        })
    }

}

export default AppClient