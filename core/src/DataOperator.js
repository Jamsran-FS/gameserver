import { ActionRepository, bufferToHex, hexToBuffer, ProtocolSerializer, Schema, SyncSchema } from '@rivalis/data'
import Actor from './Actor'
import Room from './Room'
import Router from './Router'

class DataOperator {

    /**
     * @type {Router}
     */
    router = null

    /**
     * @private
     * @type {ActionRepository}
     */
    actions = null

    /**
     * @private
     * @type {string}
     */
    roomId = null

    /**
     * @private
     * @type {ProtocolSerializer}
     */
    serializer = null

    /**
     * 
     * @param {Room} room 
     * @param {ProtocolSerializer} serializer 
     */
    constructor(room, serializer) {
        this.roomId = room.id
        this.serializer = serializer
        this.actions = new ActionRepository()
        this.router = new Router(room, this.actions)
    }

    /**
     * 
     * @param {string} actorId
     * @returns {Uint8Array} 
     */
    createSyncPackage(actorId) {
        let actionList = this.actions.getList()
        let usedSchemas = this.actions.getSchemaList()
        let schemaList = []
        for (let hash of usedSchemas) {
            let schema = Schema.getSchema(hash)
            schemaList.push([hash, schema.fields])
        }
        return this.serializer.encode(SyncSchema, {
            roomId: this.roomId,
            actorId: actorId,
            actions: actionList,
            schemas: JSON.stringify(schemaList)
        })
    }

    /**
     * 
     * @param {Uint8Array} buffer
     * @returns {string} 
     */
    decodeSyncPackage(buffer) {
        let { actorId = null } = this.serializer.decode(SyncSchema, buffer) || {}
        return actorId
    }

    /**
     * 
     * @param {Uint8Array} buffer 
     */
    getPackageKey(buffer) {
        let hash = bufferToHex(buffer.slice(0, 2))
        let key = this.actions.getKey(hash)
        if (key === null) {
            throw new Error('invalid message key')
        }
        return key
    }

    /**
     * 
     * @param {Uint8Array} buffer 
     */
    getPackageData(buffer) {
        let hash = bufferToHex(buffer.slice(0, 2))
        let incomingHash = this.actions.getIncoming(hash)
        if (incomingHash === null) {
            throw new Error('incoming message fromat is not valid')
        }
        let data = null
        try {
            data = this.serializer.decode(incomingHash, buffer.slice(2))
        } catch (error) {
            throw new Error('error on deserialization')
        }
        return data

    }

    /**
     * 
     * @param {string} senderId 
     * @param {string} key 
     * @param {Object<string,any>} data 
     * @returns 
     */
    messageToBuffer(senderId = null, key, data) {
        let hash = this.actions.getHash(key)
        if (hash === null) {
            throw new Error(`key=(${key}) does not exist`)
        }
        let outgoingHash = this.actions.getOutgoing(hash)
        if (outgoingHash === null) {
            throw new Error(`output schema missing for key=(${key})`)
        }
        if (senderId === null) {
            throw new Error('sender id can not be null')
        }
        let keyBuffer = hexToBuffer(hash)
        let senderIdBuffer = hexToBuffer(senderId)
        let dataBuffer = this.serializer.encode(outgoingHash, data)
        let buffer = new Uint8Array(keyBuffer.length + senderIdBuffer.length + dataBuffer.length)
        buffer.set(keyBuffer)
        buffer.set(senderIdBuffer, keyBuffer.length)
        buffer.set(dataBuffer, keyBuffer.length + senderIdBuffer.length)
        return buffer
    }

    /**
     * 
     * @param {Actor} actor 
     * @param {string} key 
     * @param {Object<string,any>} data 
     */
    invokeListener(actor, key, data) {
        let listener = Router.getListener(this.router, key)
        if (listener === null) {
            throw new Error(`listener key=(${key}) is not registered`)
        }
        try {
            listener(actor, key, data)
        } catch (error) {
            throw new Error(`listener key=(${key}) error: ${error.stack}`)
        }
    }

}

export default DataOperator