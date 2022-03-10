import AuthService from './AuthService'
import FleetService from './FleetService'

/**
 * @typedef RoomAccess
 * @property {string} roomId
 * @property {string} endpointUrl
 * @property {string} token
 */

class RoomService {

    /**
     * @private
     */
    fleets = FleetService.getInstance()

    /**
     * @private
     */
    auth = AuthService.getInstance()

    /**
     * 
     * @param {string} appId 
     * @param {string} fleetName
     * @param {string} roomType
     * @param {Object<string,any>} userPayload
     * @returns {RoomAccess} 
     */
    async create(appId, fleetName, roomType, userPayload = {}) {
        if (typeof userPayload !== 'object') {
            throw new Error(`user payload must be an object`)
        }
        const fleet = this.fleets.fleets.find(fleet => fleet.name === fleetName && fleet.appId === appId) || null
        if (fleet === null) {
            throw new Error(`fleet "${fleetName}" does not exist`)
        }
        const instance = this.getInstance(fleet, roomType)
        if (instance === null) {
            throw new Error(`fleet "${fleetName}" roomType "${roomType}": not available instance`)
        }
        let roomId = await this.fleets.createRoom(fleet.id, instance, roomType)
        let token = this.auth.signRoomToken(instance.id, roomId, userPayload)
        return {
            roomId,
            endpointUrl: instance.endpointUrl,
            token
        }
    }

    /**
     * 
     * @param {string} appId 
     * @param {string} fleetName
     * @param {string} roomId
     * @returns {RoomAccess} 
     */
    async join(appId, fleetName, roomId, userPayload = {}) {
        if (typeof userPayload !== 'object') {
            throw new Error(`user payload must be an object`)
        }
        const fleet = this.fleets.fleets.find(fleet => fleet.name === fleetName && fleet.appId === appId) || null
        if (fleet === null) {
            throw new Error(`fleet "${fleetName}" does not exist`)
        }
        const room = this.fleets.rooms.find(room => room.id === roomId && room.fleetId === fleet.id) || null
        if (room === null) {
            throw new Error(`room "${roomId}" does not exist`)
        }
        const instance = this.fleets.instances.find(instance => instance.id === room.instanceId) || null
        let token = this.auth.signRoomToken(instance.id, room.id, userPayload)
        return {
            roomId,
            endpointUrl: instance.endpointUrl,
            token
        }
    }

    /**
     * @private
     * @param {import('./FleetService').Fleet} fleet
     * @param {string} roomType 
     */
    getInstance(fleet, roomType) {
        if (!fleet.roomTypes.includes(roomType)) {
            return null
        }
        const [ instance = null ] = this.fleets.instances.filter(instance => {
            return instance.fleet === fleet.id && instance.roomTypes.includes(roomType)
        }).sort((instance1, instance2) => instance1.connections - instance2.connections)

        return instance
    }
}


/** @type {RoomService} */
let instance = null
RoomService.getInstance = () => {
    if (instance === null) {
        instance = new RoomService()
    }
    return instance
}
export default RoomService