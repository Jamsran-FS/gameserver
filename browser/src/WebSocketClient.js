import { Broadcast, Logger } from '@rivalis/utils'
import { ActionRepository, bufferToHex, hexToBuffer, ProtocolSerializer, SyncSchema } from '@rivalis/data'

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
     * @private
     * @type {globalThis.WebSocket}
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
    serializer = null

    /**
     * @private
     * @type {ActionRepository}
     */
    actions = null

    /**
     * @private
     * @type {Map<string,import('@rivalis/data/lib/Schema').Fields>}
     */
    fields = new Map()

    /**
     * 
     * @param {string} baseURL 
     */
    constructor(baseURL) {
        super()
        this.setBaseURL(baseURL)
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
        let url = new window.URL(this.baseURL)
        url.searchParams.append('ticket', ticket)
        this.socket = new window.WebSocket(url.toString())
        this.socket.onopen = () => {
            this.socket.onmessage = this.onSync
        }
        this.socket.onclose = this.onClose
        this.socket.binaryType = 'arraybuffer'
    }

    disconnect() {
        this.socket.close()
    }

    /**
     * @returns {Array<string>}
     */
    get keys() {
        return this.actions.getActionKeys()
    }

    /**
     * 
     * @param {string} key
     * @returns {import('@rivalis/data/lib/Schema').Fields} 
     */
    getFields(key = null) {
        if (key === null) {
            return null
        }
        let hash = this.actions.getHash(key)
        if (hash === null) {
            return null
        }
        let schema = this.actions.getIncoming(hash)
        return this.fields.get(schema) || null
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
        
        let keyBuffer = hexToBuffer(hash)
        let dataBuffer = this.serializer.encode(schema, data)
        let buffer = new Uint8Array(keyBuffer.length + dataBuffer.length)
        buffer.set(keyBuffer)
        buffer.set(dataBuffer, keyBuffer.length)
        this.socket.send(buffer)
    }

    
    /**
     * @private
     * @param {MessageEvent<ArrayBuffer>} event 
     */
    onSync = (event) => {
        this.serializer = new ProtocolSerializer()
        let buffer = new Uint8Array(event.data)
        const { roomId, actorId, actions = [], schemas } = this.serializer.decode(SyncSchema, buffer)
        const schemaList = JSON.parse(schemas)
        this.actions = new ActionRepository()
        this.actions.loadList(actions)
        for (let [ hash, fields ] of schemaList) {
            this.serializer.addSchema(hash, fields)
            this.fields.set(hash, fields)
        }
        let answer = this.serializer.encode(SyncSchema, { actorId })
        this.socket.send(answer)
        this.roomId = roomId
        this.actorId = actorId
        this.socket.onmessage = this.onMessage
        this.logger = Logger.getLogger(`room=${this.roomId}`)
        this.emit('socket:connect', actorId)
    }

    /**
     * @private
     * @param {MessageEvent} event 
     */
    onMessage = (event) => {
        let buffer = new Uint8Array(event.data)
        let hash = bufferToHex(buffer.slice(0, 2))
        let senderId = bufferToHex(buffer.slice(2, 6))
        let schema = this.actions.getOutgoing(hash)
        let data = this.serializer.decode(schema, buffer.slice(6))
        let key = this.actions.getKey(hash)
        this.emit(key, key, senderId, data)
    }

    /**
     * @private
     * @param {CloseEvent} event 
     */
    onClose = (event) => {
        this.emit('socket:disconnect', event.code)
        this.clearListeners()
        this.socket = null
        this.roomId = null
        this.actorId = null
        this.actions = null
        this.serializer = null
        this.fields.clear()
    }

}

export default WebSocketClient