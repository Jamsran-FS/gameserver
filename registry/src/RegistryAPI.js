import { Room as RivalisRoom } from '@rivalis/core'
import SyncRouter from './SyncRouter'

/**
 * @typedef Instance
 * @property {string} id
 * @property {string} name
 * @property {number} connections
 * @property {string} endpointUrl
 * @property {Array<string>} rooms
 * @property {Array<string>} roomTypes
 */

/**
 * @typedef Room
 * @property {string} id
 * @property {string} type
 * @property {number} connections
 * @property {string} instance
 * @property {string} endpointUrl
 * 
 */

class RegistryAPI {

    /** 
     * @private
     * @type {RivalisRoom}
     */
    room = null

    /**
     * @private
     */
    data = {
        hash: null,
        connections: 0,
        /** @type {Array<Room>} */
        rooms: [],
        /** @type {Array<Instance>} */
        instances: [],
        /** @type {Array<string>} */
        roomTypes: []
    }

    /**
     * 
     * @param {RivalisRoom} room 
     */
    constructor(room) {
        this.room = room
    }

    get connections() {
        this.update()
        return this.data.connections
    }

    get rooms() {
        this.update()
        return this.data.rooms
    }

    get instances() {
        this.update()
        return this.data.instances
    }

    /**
     * @type {Array<string>}
     */
    get roomTypes() {
        return this.data.roomTypes
    }

    /**
     * 
     * @param {string} instanceId 
     * @param {string} roomId 
     * @param {string} type 
     * @returns {void}
     */
    create(instanceId, roomId, type) {
        return this.sync.create(instanceId, roomId, type)
    }

    /**
     * 
     * @param {string} instanceId 
     * @param {string} roomId 
     * @returns {void}
     */
    destroy(instanceId, roomId) {
        return this.sync.destroy(instanceId, roomId)
    }

    /**
     * @private
     * @type {SyncRouter}
     */
    get sync() {
        return this.room.getRouter('sync')
    }

    /** @private */
    update() {
        if (this.data.hash === this.sync.hash) {
            return
        }
        this.data.hash = this.sync.hash
        this.data.rooms = []
        this.data.instances = []
        this.data.connections = 0

        let roomTypeSet = new Set()

        this.sync.instances.forEach(instance => {
            
            let roomIds = instance.rooms.map(room => {
                this.data.rooms.push({
                    id: room.id,
                    type: room.type,
                    connections: room.connections,
                    instance: instance.id,
                    endpointUrl: instance.endpointUrl
                })
                return room.id
            })

            this.data.instances.push({
                id: instance.id,
                name: instance.name,
                connections: instance.connections,
                endpointUrl: instance.endpointUrl,
                rooms: roomIds,
                roomTypes: instance.types
            })
            instance.types.forEach(type => {
                roomTypeSet.add(type)
            })
            this.data.connections += instance.connections
        })
        this.data.roomTypes = Array.from(roomTypeSet)
    }
}

export default RegistryAPI