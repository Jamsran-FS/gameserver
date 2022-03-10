import { generateId, Logger } from '@rivalis/utils'
import axios from 'axios'
import { getInstance, Models } from '../database'

/**
 * @typedef Fleet
 * @property {string} id
 * @property {string} name
 * @property {boolean} isLive
 * @property {string} appId
 * @property {number} instances
 * @property {number} connections
 * @property {number} rooms
 * @property {Array<string>} roomTypes
 */

/**
 * @typedef Instance
 * @property {string} id
 * @property {string} name
 * @property {string} fleet
 * @property {string} endpointUrl
 * @property {number} connections
 * @property {number} rooms
 * @property {Array<string>} roomTypes
 * @property {string} appId
 */

/**
 * @typedef Room
 * @property {string} id
 * @property {string} fleetId
 * @property {string} instanceId
 */

class FleetService {

    /** @private */
    httpClient = axios.create()

    /** @private */
    sync = true

    /**
     * @private
     * @type {Map<string,import('../database').Fleet>}
     */
    fleetMap = new Map()

    /**
     * @type {Array<Fleet>}
     */
    fleets = []

    /**
     * @type {Array<Instance>}
     */
    instances = []

    /**
     * @type {Array<Room>}
     */
    rooms = []

    /**
     * @private
     * @type {Map<string,string>}
     */
    roomMap = new Map()

    logger = Logger.getLogger('fleet service')

    constructor() {
        setInterval(() => {
            try {
                this.updateTick()
            } catch (error) {
                this.logger.error('update failed', error.message)
            }
        }, 1000)
    }

    /**
     * 
     * @param {string} host 
     * @param {number} port 
     * @param {string} token 
     * @returns {boolean}
     */
    async validate(url, token) {
        let overview = await this.getFleetOverview(url, token)
        return overview !== null ? true : false
    }

    /**
     * 
     * @param {string} name 
     * @param {string} url 
     * @param {string} token 
     * @returns {PromiseLike<import('../database').Fleet>}
     */
    async register(name, url, token) {
        let id = this.generateUniqueId()
        let fleet = Models.Fleets.build({ id, name, token, url })
        await fleet.save()
        this.sync = true
        await this.updateTick()
        return fleet.get()
    }

    async remove(fleetId) {
        if (!this.fleetMap.has(fleetId)) {
            throw new Error(`fleet id=(${fleetId}) does not exist`)
        }
        return getInstance().transaction(async() => {
            let fleet = await Models.Fleets.findOne({ where: { id: fleetId } })
            if (fleet === null) {
                throw new Error(`fleet id="${fleetId}" does not exist`)
            }
            let allocatedFleets = this.fleets.filter(f => f.appId === fleet.get().appId && f.appId !== null)
            if (allocatedFleets.length === 1 && fleet.get().appId !== null) {
                throw new Error(`fleet "${fleet.get().name}" can not be disconnected, app id="${fleet.get().appId}" relay on this fleet`)
            }
            fleet.destroy()
        }).then(() => {
            this.sync = true
            return this.updateTick()
        })
    }

    async assignFleet(fleetId, appId) {
        let fleet = await Models.Fleets.findOne({ where: { id: fleetId } })
        if (fleet === null) {
            throw new Error(`fleet id="${fleetId}" does not exist`)
        }
        fleet.set('appId', appId)
        await fleet.save()
        this.sync = true
        return fleet.get()
    }

    async freeFleet(fleetId) {
        let fleet = await Models.Fleets.findOne({ where: { id: fleetId } })
        if (fleet === null) {
            throw new Error(`fleet id="${fleetId}" does not exist`)
        }
        fleet.set('appId', null)
        await fleet.save()
        this.sync = true
        return fleet.get()
    }

    invokeUpdate = () => this.updateTick()

    /**
     * 
     * @param {string} fleetId
     * @param {Instance} instance 
     * @param {string} roomType
     * @returns {string} 
     */
    async createRoom(fleetId, instance, roomType) {
        const roomId = this.generateRoomId(instance.id)
        const { url = null, token } = this.fleetMap.get(fleetId) || {}
        try {
            await this.httpClient.post(`${url}/api/instances/${instance.id}/rooms`, { roomId, type: roomType }, { headers: { Authorization: token } })
        } catch (error) {
            this.logger.warning(error.response.data)
            throw new Error(`fail to create a room fleet id=(${fleetId}) room type=(${roomType})`)
        }
        this.roomMap.set(roomId, fleetId)
        return roomId
    }

    /**
     * @private
     */
    updateTick = async () => {
        let fleetList = []
        let instanceList = []
        let roomList = []
        let roomMap = new Map()
        
        if (this.sync) {
            this.sync = false
            const fleets = await Models.Fleets.findAll()
            this.fleetMap.clear()
            for (let fleet of fleets) {
                this.fleetMap.set(fleet.id, fleet.get({ clone: true }))
            }
        }

        for (let fleetId of this.fleetMap.keys()) {
            const { id, url, token, appId, name } = this.fleetMap.get(fleetId)
            /** @type {Fleet} */
            let fleet = { id, appId, name, isLive: true, connections: 0, instances: 0, rooms: 0, roomTypes: [] }
            let overview = await this.getFleetOverview(url, token)
            if (overview === null) {
                fleet.isLive = false
                fleetList.push(fleet)
                continue
            }
            const { connections, roomTypes = [], instances, rooms } = overview
            fleet.instances = instances
            fleet.rooms = rooms
            fleet.connections = connections
            fleet.roomTypes = roomTypes
            let instList = await this.getFleetInstances(url, token)
            if (instanceList === null) {
                fleet.isLive = false
            }
            fleetList.push(fleet)

            instList.forEach(record => {
                const { id, name, connections, endpointUrl, rooms, roomTypes } = record
                rooms.forEach(roomId => {
                    roomMap.set(roomId, fleet.id)
                    roomList.push({
                        id: roomId,
                        instanceId: id,
                        fleetId: fleet.id
                    })
                })
                /** @type {Instance} */
                let instance = { id, name, connections, endpointUrl, rooms: rooms.length, roomTypes, appId, fleet: fleet.id }
                instanceList.push(instance)
            })
        }
        this.fleets = fleetList
        this.instances = instanceList
        this.rooms = roomList
        this.roomMap = roomMap
    }

    async getFleetOverview(url, token) {
        try {
            const { data: { data } } = await this.httpClient.get(`${url}/api/stats`, { headers: { Authorization: token } })
            return data
        } catch (error) {
            return null
        }
    }

    /**
     * 
     * @param {string} url 
     * @param {string} token 
     * @returns {Array}
     */
    async getFleetInstances(url, token) {
        try {
            const { data: { data } } = await this.httpClient.get(`${url}/api/instances`, { headers: { Authorization: token } })
            return data
        } catch (error) {
            return null
        }
    }

    /**
     * @private
     * @returns {string}
     */
    generateUniqueId() {
        let id = generateId(4)
        while(this.fleetMap.has(id)) {
            id = generateId(4)
        }
        return id
    }

    /**
     * 
     * @private
     * @param {string} instanceId
     * @returns {string} 
     */
    generateRoomId(instanceId) {
        let roomId = `${instanceId}.${generateId(4)}`
        while(this.roomMap.has(roomId)) {
            roomId = `${instanceId}.${generateId(4)}`
        }
        return roomId
    }
}

/** @type {FleetService} */
let instance = null
FleetService.getInstance = () => {
    if (instance === null) {
        instance = new FleetService()
    }
    return instance
}

export default FleetService