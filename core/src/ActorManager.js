import { Logger } from '@rivalis/utils'
import Actor from './Actor'
import DataOperator from './DataOperator'
import AuthMiddleware from './interfaces/AuthMiddleware'
import Room from './Room'
import TransportBroker from './TransportBroker'

/**
 * @callback ForEachListener
 * @param {Actor} actor
 * @returns {void}
 */

class ActorManager {

    /**
     * @private
     * @type {Map<string,Actor>}
     */
    actors = new Map()

    /**
     * @private
     * @type {Room}
     */
    room = null

    /**
     * @private
     * @type {TransportBroker}
     */
    broker = null

    /**
     * @private
     * @type {DataOperator}
     */
    operator = null

    /**
     * @private
     * @type {Logger}
     */
    logger = null

    /**
     * @private
     */
    root = new Actor('00000000', {})

    /**
     * 
     * @param {Room} room 
     * @param {TransportBroker} broker
     * @param {DataOperator} operator
     */
    constructor(room, broker, operator, logger) {
        this.room = room
        this.broker = broker
        this.operator = operator
        this.logger = logger
    }

    get count() {
        return this.actors.size
    }

    /**
     * @protected
     * @param {AuthMiddleware} authMiddleware 
     * @param {string} actorId 
     * @param {string} ticket 
     */
    async authorize(authMiddleware, actorId, ticket) {
        if (this.actors.has(actorId)) {
            throw new Error(`actor id=(${actorId}) already exist inside room id=(${this.room.id})`)
        }
        this.broker.once('message', actorId, this.handleSync, this)
        this.broker.once('leave', actorId, this.handleLeave, this)
        let data = await authMiddleware.extract(ticket)
        let actor = new Actor(actorId, data, this.broker)
        this.actors.set(actorId, actor)
    }

    /**
     * @protected
     * @param {string} actorId 
     */
    synchronize(actorId) {
        if (!this.actors.has(actorId)) {
            throw new Error(`sync error: actor id=(${actorId}) does not exist`)
        }
        let data = this.operator.createSyncPackage(actorId)
        this.broker.send(actorId, data)
    }

    /**
     * 
     * @param {ForEachListener} forEachListener 
     */
    forEach(forEachListener) {
        for (let key of this.actors.keys()) {
            forEachListener(this.actors.get(key))
        }
    }

    /**
     * 
     * @param {string} actorId 
     * @returns {Actor}
     */
    get(actorId) {
        return this.actors.get(actorId) || null
    }

    /**
     * @private
     * @param {string} actorId 
     * @param {Uint8Array} buffer 
     */
    handleSync(actorId, buffer) {
        let receivedActorId = null
        let actor = this.actors.get(actorId)
        try {
            receivedActorId = this.operator.decodeSyncPackage(buffer)
        } catch (error) {
            this.logger.warning(`protocol error: client to server sync failed actor id=(${actorId}) data=(${actor.data})`)
            actor.kick()
        }
        
        if (receivedActorId !== actorId) {
            actor.kick()
            return
        }
        this.broker.on('message', actorId, this.handleMessage, this)
        this.room.emit('join', actor)
    }

    /**
     * @private
     * @param {string} actorId 
     */
    handleLeave(actorId) {
        this.room.emit('leave', this.actors.get(actorId))
        this.actors.delete(actorId)
    }

    /**
     * @private
     * @param {string} actorId 
     * @param {Uint8Array} buffer 
     */
    handleMessage(actorId, buffer) {
        let actor = this.actors.get(actorId)
        try {
            let key = this.operator.getPackageKey(buffer)
            let data = this.operator.getPackageData(buffer)
            this.room.emit('message', actor, key, data)
            this.operator.invokeListener(actor, key, data)
        } catch (error) {
            this.logger.warning(`protocol error: can not handle incoming message, ${error.stack}`)
            actor.kick()
        }

    }

}

export default ActorManager