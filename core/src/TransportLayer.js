import { EventEmitter, generateId, Logger } from '@rivalis/utils'
import AuthMiddleware from './interfaces/AuthMiddleware'
import RoomResolver from './interfaces/RoomResolver'
import TransportBroker from './TransportBroker'

/**
 * @callback EventListener
 * @param {string} actorId
 * @param {Uint8Array} message
 */

class TransportLayer {

    /**
     * @type {TransportBroker}
     */
    broker = null

    /**
     * @private
     * @type {AuthMiddleware}
     */
    authMiddleware = null

    /**
     * @private
     * @type {RoomResolver}
     */
    roomResolver = null

    /**
     * @private
     * @type {EventEmitter}
     */
    emitter = new EventEmitter()

    /**
     * @private
     * @type {Map<string,string>}
     */
    connected = new Map()

    logger = Logger.getLogger('transport layer')

    /**
     * 
     * @param {AuthMiddleware} authMiddleware 
     * @param {RoomResolver} roomResolver 
     */
    constructor(authMiddleware, roomResolver) {
        this.authMiddleware = authMiddleware
        this.roomResolver = roomResolver
        this.broker = new TransportBroker(this.emitter)
    }

    get connections() {
        return this.connected.size
    }

    /**
     * 
     * @param {string} ticket 
     * @returns {string}
     */
    async authorize(ticket = null) {
        let roomId = null
        try {
            roomId = await this.authMiddleware.getRoomId(ticket)
        } catch (error) {
            throw new Error(`transport layer error: ${error.message}`)
        }
        let room = this.roomResolver.resolve(roomId)
        if (room === null) {
            throw new Error(`transport layer error: room does not exist`)
        }
        let actorId = this.generateId()
        if (actorId === null) {
            throw new Error(`transport layer error: can not reserve unique id for the actor`)
        }
        try {
            await room.actors.authorize(this.authMiddleware, actorId, ticket)
        } catch (error) {
            console.error(error)
            throw new Error(`transport layer error: actor id=(${actorId}) ticket=(${ticket}) can not join the room`)
        }
        this.connected.set(actorId, room.id)
        this.logger.trace(`🔌 actor id=(${actorId}) join the room id=(${room.id})`)
        return actorId
    }

    async synchronize(actorId) {
        if (!this.connected.has(actorId)) {
            return
        }
        let roomId = this.connected.get(actorId)
        let room = this.roomResolver.resolve(roomId)
        room.actors.synchronize(actorId)
    }

    /**
     * 
     * @param {('message'|'kick')} event 
     * @param {string} actorId 
     * @param {EventListener} listener 
     * @param {any} [context] 
     */
     on(event, actorId, listener, context) {
        if (event === 'message') {
            this.emitter.on(`outgoing:${actorId}`, listener, context)
        } else if (event === 'kick') {
            this.emitter.on(`kick:${actorId}`, listener, context)
        }
    }

    /**
     * 
     * @param {('message'|'kick')} event 
     * @param {string} actorId 
     * @param {EventListener} listener 
     * @param {any} [context] 
     */
    once(event, actorId, listener, context) {
        if (event === 'message') {
            this.emitter.once(`outgoing:${actorId}`, listener, context)
        } else if (event === 'kick') {
            this.emitter.once(`kick:${actorId}`, listener, context)
        }
    }

    /**
     * 
     * @param {('message'|'kick')} event 
     * @param {string} actorId 
     * @param {EventListener} listener 
     * @param {any} [context] 
     */
    off(event, actorId, listener, context) {
        if (event === 'message') {
            this.emitter.off(`outgoing:${actorId}`, listener, context)
        } else if (event === 'kick') {
            this.emitter.off(`kick:${actorId}`, listener, context)
        }
    }

    /**
     * 
     * @param {string} actorId 
     * @param {Uint8Array} message 
     */
    send(actorId, message) {
        this.emitter.emit(`incoming:${actorId}`, actorId, message)
    }

    /**
     * 
     * @param {string} actorId 
     */
    leave(actorId) {
        let roomId = this.connected.get(actorId)
        this.connected.delete(actorId)
        this.logger.debug(`👋 actor id=(${actorId}) leave the room id=(${roomId})`)
        this.emitter.emit(`leave:${actorId}`, actorId)
        this.emitter.removeListener(`incoming:${actorId}`)
        this.emitter.removeListener(`outgoing:${actorId}`)
        this.emitter.removeListener(`kick:${actorId}`)
        this.emitter.removeListener(`leave:${actorId}`)
    }

    /**
     * @private
     */
    generateId() {
        let attempts = 10
        let id = generateId(8)
        let rootId = '0'.repeat(8)
        while((this.connected.has(id) || id === rootId) && attempts > 0) {
            id = generateId(8)
            attempts--
        }
        if (this.connected.has(id)) {
            return null
        }
        return id
    }

}

export default TransportLayer