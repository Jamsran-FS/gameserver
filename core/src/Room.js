import { ProtocolSerializer } from '@rivalis/data'
import { Broadcast, Logger } from '@rivalis/utils'
import Actor from './Actor'
import ActorManager from './ActorManager'
import DataOperator from './DataOperator'
import Router from './Router'
import TransportBroker from './TransportBroker'
import TransportLayer from './TransportLayer'

/**
 * @callback Filter
 * @param {Actor} sender
 * @param {Actor} receiver
 * @param {string} topic
 * @param {Object<string,any>} data
 * @returns {PromiseLike<boolean>}
 */


/**
 * @typedef EventTypes
 * @type {('create'|'destroy'|'join'|'leave'|'update'|'message')}
 */

/**
 * @extends {Broadcast<EventTypes,string,Object<string,any>>}
 */
class Room extends Broadcast {

    /**
     * @readonly
     * @type {string}
     */
    id = null
    
    /**
     * @readonly
     * @type {string}
     */
    type = null

    /** @type {ActorManager} */
    actors = null

    /**
     * @private
     * @type {DataOperator}
     */
    operator = null

    /**
     * @protected
     * @type {TransportBroker}
     */
    broker = null

    /**
     * @type {Logger}
     */
    logger = null

    /**
     * @private
     * @type {number}
     */
    intervalId = null

    /**
     * 
     * @param {string} id 
     * @param {string} type 
     * @param {TransportLayer} transportLayer 
     * @param {ProtocolSerializer} serializer 
     */
    constructor(id, type, transportLayer, serializer) {
        super()
        this.id = id
        this.type = type
        this.logger = Logger.getLogger(`room=${id}`)
        this.broker = transportLayer.broker
        this.operator = new DataOperator(this, serializer)
        this.actors = new ActorManager(this, transportLayer.broker, this.operator, this.logger)
        setTimeout(() => {
            this.onCreate()
            this.emit('create')
            this.logger.trace('created')
        })
        this.intervalId = setInterval(this.onTickInvoke, 100)
    }

    /** @protected */
    onCreate() {}

    destroy() {
        clearInterval(this.intervalId)
        this.actors.forEach(actor => actor.kick())
        this.emit('destroy')
    }

    /**
     * 
     * @param {string} key
     * @returns {Router} 
     */
    getRouter(routerKey) {
        return Router.getSubRouter(this.operator.router, routerKey) || null
    }

    /**
     * 
     * @param {Actor} receiver 
     * @param {string} topic 
     * @param {string} data 
     * @param {Actor} [sender=null] 
     */
    send(receiver, topic, data, sender = null) {
        let buffer = null
        if (sender === null) {
            sender = this.actors.root
        }
        try {
            buffer = this.operator.messageToBuffer(sender.id, topic, data)
        } catch (error) {
            throw new Error(`fail on message serialization, ${error.stack}`)
        }
        this.broker.send(receiver.id, buffer)
    }

    /**
     * 
     * @param {string} topic 
     * @param {Object<string,any>} data 
     * @param {Actor} [sender=null] 
     * @param {Filter} [filter=null] 
     */
    async broadcast(topic, data, sender = null, filter = null) {
        if (filter === null) {
            filter = this.defaultFilter
        }
        if (typeof filter !== 'function') {
            throw new Error('broadcast error: filter must be a function')
        }
        if (sender === null) {
            sender = this.actors.root
        }
        let buffer = null
        try {
            buffer = this.operator.messageToBuffer(sender.id, topic, data)
        } catch (error) {
            throw new Error(`broadcast error: sender id=(${sender.id}) data=(${JSON.stringify(data)}) reason: ${error.message}`)
        }
        buffer = this.operator.messageToBuffer(sender.id, topic, data)

        this.actors.forEach(actor => {
            filter(sender, actor, topic, data).then(canProceed => {
                if (canProceed) {
                    this.broker.send(actor.id, buffer)
                }
            })

        })
    }

    /**
     * 
     * @param {string} routerKey 
     * @param {typeof Router} subRouterClass 
     */
    use(routerKey, subRouterClass) {
        this.operator.router.use(routerKey, subRouterClass)
    }

    /**
     * @private
     */
    onTickInvoke = () => this.emit('update')

    /** @private */
    defaultFilter = async () => true

}

export default Room