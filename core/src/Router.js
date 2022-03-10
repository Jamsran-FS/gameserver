import { ActionRepository, Schema } from '@rivalis/data'
import { Logger, toHex } from '@rivalis/utils'
import Room from './Room'

/**
 * @callback Listener
 * @param {import('./Actor').default} sender
 * @param {string} topic
 * @param {Object<string,any>} data
 */

class Router {

    /**
     * @protected
     * @type {string}
     */
    key = null

    /**
     * @protected
     * @type {Room}
     */
    room = null
    
    /** @private */
    keyRegExp = new RegExp(/(?!.*[./]{2})^(?!\.)[a-z0-9\-_.].*[^.]+$/)

    /**
     * @private
     * @type {Map<string,Router>}
     */
    routers = null

    /**
     * @private
     * @type {Map<string,Listener>}
     */
    listeners = null

    /** @private */
    counter = 0

    /**
     * @private
     * @type {Router}
     */
    root = null

    /**
     * @private
     * @type {ActionRepository}
     */
    actions = null

    /**
     * @protected
     * @type {Logger}
     */
    logger = null

    /**
     * 
     * @param {Room} room 
     * @param {string} key 
     * @param {ActionRepository} actions 
     * @param {Router} [root=null] 
     */
    constructor(room, actions, key = null, root = null) {
        this.room = room
        this.actions = actions
        this.key = key
        this.root = root
        this.logger = room.logger
        if (root === null) {
            this.routers = new Map()
            this.listeners = new Map()
        } else {
            this.routers = this.root.routers
            this.listeners = this.root.listeners
        }
    }

    /** @protected */
    onCreate() {}

    /**
     * @protected
     * @param {string} routerKey 
     * @param {typeof Router} subRouterClass 
     */
    use(routerKey, subRouterClass) {
        if (!this.keyRegExp.test(routerKey)) {
            throw new Error(`router error: invalid key=(${routerKey})`)
        }
        let routeKey = this.getAbsoluteKey(routerKey)
        if (this.routers.has(routeKey)) {
            throw new Error(`router error: router key=(${routeKey}) is already registered`)
        }

        if (!(subRouterClass.prototype instanceof Router)) {
            throw new Error(`router error: subRouterClass=(${subRouterClass}) must extends Router`)
        }
        let router = new subRouterClass(this.room, this.actions, routeKey, this.getRoot())
        this.routers.set(routeKey, router)
        router.onCreate()
    }

    /**
     * @protected
     * @param {string} eventName 
     * @param {Listener} listener 
     * @param {string} inputSchema 
     * @param {string} [outputSchema=null]
     */
    listen(eventName, listener, inputSchema, outputSchema = null) {
        if (!this.keyRegExp.test(eventName)) {
            throw new Error(`router error: invalid event name=(${eventName})`)
        }
        let listenerKey = this.getAbsoluteKey(eventName)
        if (typeof listener !== 'function') {
            throw new Error('router error: listener argument must be of the type function')
        }
        if (this.listeners.has(listenerKey)) {
            throw new Error(`'router error: topic=(${listenerKey}) is already registered'`)
        }

        if (Schema.getSchema(inputSchema) === null) {
            throw new Error(`'router error: listener topic=(${listenerKey}) input schema does not exist'`)
        }

        if (outputSchema !== null && Schema.getSchema(outputSchema) === null) {
            throw new Error(`'router error: listener topic=(${listenerKey}) output schema does not exist'`)
        }

        if (outputSchema === null) {
            outputSchema = inputSchema
        }

        let index = ++this.getRoot().counter
        let hash = toHex(index, 4)
        this.listeners.set(listenerKey, listener.bind(this))
        this.actions.register(hash, listenerKey, inputSchema, outputSchema)
    }

    /**
     * @protected
     * @param {string} eventName 
     * @returns {string}
     */
    getTopic(eventName) {
        return this.getAbsoluteKey(eventName)
    }


    /**
     * @private
     * @param {string} key 
     */
    getAbsoluteKey(key) {
        if (this.key === null) {
            return key
        } else {
            return `${this.key}.${key}`
        }
    }

    /**
     * @private
     * @returns {Router}
     */
    getRoot() {
        if (this.root === null) {
            return this
        }
        return this.root
    }
}

/**
 * 
 * @param {Router} router 
 * @param {string} key 
 */
Router.getListener = (router, key) => {
    let root = router.getRoot()
    return root.listeners.get(key) || null
}

/**
 * 
 * @param {Router} router 
 * @param {string} key 
 * @returns 
 */
Router.getSubRouter = (router, key) => {
    let root = router.getRoot()
    return root.routers.get(key) || null
}

export default Router