import { Actor, generateId, Router, Schema } from '@rivalis/core'

const InstanceUpdate = Schema.define({
    name: Schema.Type.STRING,
    namespace: Schema.Type.STRING,
    types: Schema.Type.ARRAY_STRING,
    rooms: Schema.Type.ARRAY_STRING,
    endpointUrl: Schema.Type.STRING
})

const InstanceCommand = Schema.define({
    command: Schema.Type.STRING,
    roomId: Schema.Type.STRING,
    type: Schema.Type.STRING
})

/**
 * @typedef Room
 * @property {string} id
 * @property {string} type
 * @property {number} connections
 */

/**
 * @typedef Instance
 * @property {string} id
 * @property {string} name
 * @property {string} namespace
 * @property {Array<string>} types
 * @property {Array<Room>} rooms
 * @property {string} endpointUrl
 * @property {number} connections
 */

class SyncRouter extends Router {

    /**
     * @type {Map<string,Instance>}
     */
    instances = new Map()

    hash = generateId(12)

    /** @private */
    onCreate() {
        this.listen('instance', this.syncInstance, InstanceUpdate, InstanceCommand)
        this.room.on('leave', this.onLeave, this)
    }

    /**
     * @private
     * @param {Actor} sender 
     * @param {string} key 
     * @param {Object<string,any>} data 
     */
    syncInstance(sender, key, data) {
        this.logger.debug('instance sync data', JSON.stringify(data))
        const { name = null, types = [], rooms = [], endpointUrl = null } = data
        let instanceConnections = 0
        const roomList = rooms.map(entry => {
            const [ id, type, connections ] = JSON.parse(entry)
            instanceConnections += connections
            return { id, type, connections }
        })
        this.instances.set(sender.id, {
            id: sender.id,
            name: name,
            types: types,
            rooms: roomList,
            endpointUrl: endpointUrl,
            connections: instanceConnections
        })
        this.hash = generateId(12)
    }

    /**
     * @private
     * @param {Actor} actor 
     */
    onLeave(actor) {
        this.instances.delete(actor.id)
        this.hash = generateId(12)
    }

    /**
     * 
     * @param {string} instanceId 
     * @param {string} roomId 
     * @param {string} type 
     */
    create(instanceId, roomId, type) {
        let instance = this.room.actors.get(instanceId)
        if (instance === null) {
            throw new Error(`room create error: instance id=(${instanceId}) is not registered`)
        }
        for (let room of this.instances.get(instanceId).rooms) {
            if (room.id === roomId) {
                throw new Error(`room create error: instance id=(${instanceId}) room id=(${roomId}) already exist`)
            }
        }
        if (!this.instances.get(instanceId).types.includes(type)) {
            throw new Error(`room create error: instance id=(${instanceId}) can not create room of type=(${type})`)
        }
        this.room.send(instance, `${this.key}.instance`, {
            command: 'create',
            roomId: roomId,
            type: type
        })
    }

    /**
     * 
     * @param {string} instanceId 
     * @param {string} roomId 
     */
    destroy(instanceId, roomId) {
        let instance = this.room.actors.get(instanceId)
        if (instance === null) {
            throw new Error(`room destroy error: instance id=(${instanceId}) is not registered`)
        }
        let found = this.instances.get(instanceId).rooms.find(room => room.id === roomId) || null
        if (found === null) {
            throw new Error(`room destroy error: instance id=(${instanceId}) room id=(${roomId}) does not exist`)
        }
        this.room.send(instance, `${this.key}.instance`, {
            command: 'destroy',
            roomId: roomId
        })
    }




}

export default SyncRouter