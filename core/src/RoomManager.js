import { ProtocolSerializer } from '@rivalis/data'
import { Broadcast } from '@rivalis/utils'
import Room from './Room'
import TransportLayer from './TransportLayer'

/**
 * @typedef EventTypes
 * @type {('define'|'create'|'destroy')}
 */

/**
 * @extends {Broadcast<EventTypes,string,Object<string,any>>}
 */
class RoomManager extends Broadcast {

    /**
     * @private
     * @type {TransportLayer}
     */
    transportLayer = null

    /**
     * @private
     * @type {ProtocolSerializer}
     */
    serializer = null

    /**
     * @private
     * @type {Map<string, typeof Room>}
     */
    defs = new Map()

    /**
     * @private
     * @type {Map<string,Room>}
     */
    rooms = new Map()

    /**
     * 
     * @param {TransportLayer} transportLayer 
     * @param {ProtocolSerializer} serializer 
     */
    constructor(transportLayer, serializer) {
        super()
        this.transportLayer = transportLayer
        this.serializer = serializer
    }

    /**
     * @type {Array<string>}
     */
    get types() {
        let list = []
        this.defs.forEach((_, key) => list.push(key))
        return list
    }

    /**
     * @type {Array<string>}
     */
    get ids() {
        let list = []
        this.rooms.forEach((_, key) => list.push(key))
        return list
    }

    /**
     * 
     * @param {string} roomId 
     * @returns {Room}
     */
    get(roomId) {
        return this.rooms.get(roomId) || null
    }

    /**
     * 
     * @param {string} key 
     * @param {typeof Room} roomClass 
     */
    define(key, roomClass) {
        if (typeof key !== 'string') {
            throw new Error(`room define error: definition key=(${key}) must be of the type string`)
        }
        if (typeof roomClass !== 'function') {
            throw new Error(`room define error: roomClass=(${roomClass}) is not a class`)
        }
        if (!(roomClass.prototype instanceof Room)) {
            throw new Error(`room define error: roomClass=(${roomClass}) must extends Room`)
        }
        if (this.defs.has(key)) {
            throw new Error(`room define error: definition key=(${key}) exists`)
        }
        this.defs.set(key, roomClass)
        this.emit('define', key)
    }

    /**
     * 
     * @param {string} roomId 
     * @param {string} key 
     * @returns {Room}
     */
    create(roomId, type) {
        if (typeof roomId !== 'string') {
            throw new Error(`room create error: roomId=(${roomId}) must be of the type string`)
        }
        if (typeof type !== 'string') {
            throw new Error(`room create error: type=(${type}) must be of the type string`)
        }
        if (this.rooms.has(roomId)) {
            throw new Error(`room create error: roomId=(${roomId}) is taken`)
        }
        if (!this.defs.has(type)) {
            throw new Error(`room create error: type=(${type}) is not defined`)
        }
        /** @type {Room} */
        let room = null
        let RoomClass = this.defs.get(type)
        room = new RoomClass(roomId, type, this.transportLayer, this.serializer)
        this.rooms.set(roomId, room)
        room.once('destroy', () => this.destroy(roomId))
        this.emit('create', roomId)
    }

    /**
     * 
     * @param {string} roomId 
     */
    destroy(roomId) {
        if (typeof roomId !== 'string') {
            throw new Error(`room destroy error: roomId=(${roomId}) must be of the type string`)
        }
        if (!this.rooms.has(roomId)) {
            throw new Error(`room destroy error: roomId=(${roomId}) does not exist`)
        }
        this.rooms.get(roomId).destroy()
        this.rooms.delete(roomId)
        this.emit('destroy', roomId)
    }

}

export default RoomManager