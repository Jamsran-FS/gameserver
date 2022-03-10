import { URL } from 'url'
import { WebSocket } from 'ws'
import { Broadcast, Logger } from '@rivalis/utils'
import { ActionRepository, ProtocolSerializer, SyncSchema } from '@rivalis/data'

/**
 * @typedef EventTypes
 * @type {('socket:connect'|'socket:disconnect')}
 */

/**
 * @extends {Broadcast<EventTypes,string,any>}
 */
class WebSocketClient extends Broadcast {

    /**
     * @private
     * @type {string}
     */
    baseURL = null

     /**
      * @private
      * @type {Logger}
      */
    logger = null

    /**
     * @type {WebSocket}
     */
    socket = null

    /**
     * @readonly
     * @type {string}
     */
    roomId = null

    /**
     * @readonly
     * @type {string}
     */
    actorId = null

    /**
     * @private
     */
    serializer = new ProtocolSerializer()

    /**
     * @private
     * @type {ActionRepository}
     */
    actions = null

    /**
     * 
     * @param {string} baseURL 
     */
    constructor(baseURL) {
        super()
        this.baseURL = baseURL
    }

    /**
     * 
     * @param {string} baseURL 
     */
    setBaseURL(baseURL) {
        this.baseURL = baseURL
    }

    get isConnected() {
        return this.socket !== null
    }

    /**
     * 
     * @param {string} ticket 
     */
    connect(ticket) {
        let url = new URL(this.baseURL)
        url.searchParams.append('ticket', ticket)
        this.socket = new WebSocket(url.toString())
        this.socket.once('open', () => {
            this.socket.once('message', this.onSync)
        })
        this.socket.once('close', this.onClose)
    }

    /**
     * @returns {Array<string>}
     */
    get keys() {
        return this.actions.getActionKeys()
    }

    disconnect() {
        this.socket.close()
    }

    /**
     * 
     * @param {string} key 
     * @param {Object<string,any>} data 
     */
    send(key, data = {}) {
        let hash = this.actions.getHash(key)
        if (hash === null) {
            this.logger.warning(`send fail: server can not accept message key=(${key})`)
            return
        }
        let schema = this.actions.getIncoming(hash)
        let keyBuffer = Buffer.from(hash, 'hex')
        let dataBuffer = this.serializer.encode(schema, data)
        let buffer = Buffer.concat([ keyBuffer, dataBuffer ])
        this.socket.send(buffer)
    }

    /**
     * @private
     * @param {Buffer} data 
     */
    onSync = (buffer) => {
        const { roomId, actorId, actions, schemas } = this.serializer.decode(SyncSchema, buffer)
        const schemaList = JSON.parse(schemas)
        this.actions = new ActionRepository()
        this.actions.loadList(actions)
        for (let [ hash, fields ] of schemaList) {
            this.serializer.addSchema(hash, fields)
        }
        let answer = this.serializer.encode(SyncSchema, { actorId })
        this.socket.send(answer)
        this.roomId = roomId
        this.actorId = actorId
        this.socket.on('message', this.onMessage)
        this.logger = Logger.getLogger(`room=${this.contextId}`)
        this.emit('socket:connect', actorId)
    }

    /**
     * @private
     * @param {Buffer} buffer 
     */
    onMessage = (buffer) => {
        let hash = buffer.slice(0, 2).toString('hex')
        let senderId = buffer.slice(2, 6).toString('hex')
        let schema = this.actions.getOutgoing(hash)
        let data = this.serializer.decode(schema, buffer.slice(6))
        let key = this.actions.getKey(hash)
        this.emit(key, key, senderId, data)
    }

    /**
     * @private
     * @param {number} code 
     */
    onClose = (code) => {
        this.emit('socket:disconnect', code)
        this.socket.removeAllListeners()
        this.socket = null
        this.contextId = null
        this.actorId = null
        
    }

}

export default WebSocketClient