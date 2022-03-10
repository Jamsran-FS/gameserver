import process from 'process'
import os from 'os'
import { Broadcast, Logger, Rivalis } from '@rivalis/core'
import { WebSocketClient } from '@rivalis/nodejs'
import md5 from 'md5'


/**
 * @typedef EventTypes
 * @type {('connect'|'disconnect'|'sync')}
 */


class Watcher extends Broadcast {

    /**
     * @type {string}
     */
    endpointUrl = null

    /**
     * @private
     * @type {Rivalis}
     */
    rivalisInstance = null

    /**
     * @private
     * @type {WebSocketClient}
     */
    client = null

    /**
     * @private
     * @type {number}
     */
    syncTimeMs = 5000

    /** 
     * @private
     * @type {number}
     */
    syncId = null

    /**
     * @private
     * @type {string}
     */
    syncHash = null

    /**
     * @private
     */
    logger = Logger.getLogger('watcher')

    constructor(rivalisInstance, registryUrl, token, syncTimeMs = 5000) {
        super()
        this.rivalisInstance = rivalisInstance
        this.client = new WebSocketClient(registryUrl)
        this.syncTimeMs = syncTimeMs
        this.client.on('socket:connect', this.onConnect, this)
        this.client.on('socket:disconnect', this.onDisconnect, this)
        this.client.connect(token)
    }

    /**
     * @private
     */
    onConnect() {
        this.client.on('sync.instance', this.onCommand, this)
        this.rivalisInstance.rooms.on('create', this.synchronize, this)
        this.rivalisInstance.rooms.on('destroy', this.synchronize, this)
        this.rivalisInstance.rooms.on('define', this.synchronize, this)
        this.syncId = setInterval(this.synchronize.bind(this), this.syncTimeMs)
        this.synchronize()
    }

    /**
     * @private
     */
    onDisconnect() {
        clearInterval(this.syncId)
        this.rivalisInstance.rooms.off('create', this.synchronize, this)
        this.rivalisInstance.rooms.off('destroy', this.synchronize, this)
        this.rivalisInstance.rooms.off('define', this.synchronize, this)
    }

    /**
     * @private
     */
    onCommand(key, senderId, data) {
        this.logger.debug('command received', data)
        const { command, roomId, type } = data
        if (command === 'create') {
            this.rivalisInstance.rooms.create(roomId, type)
        } else if (command === 'destroy') {
            this.rivalisInstance.rooms.destroy(roomId)
        }

    }

    synchronize() {
        let rooms = []
        for (let roomId of this.rivalisInstance.rooms.ids) {
            let room = this.rivalisInstance.rooms.get(roomId)
            rooms.push(JSON.stringify([ room.id, room.type, room.actors.count ]))
        }
        let data = {
            name: this.rivalisInstance.name,
            types: this.rivalisInstance.rooms.types,
            rooms: rooms,
            endpointUrl: this.endpointUrl
        }
        let hash = md5(JSON.stringify(data))
        if (this.syncHash !== hash) {
            this.client.send('sync.instance', data)
            this.syncHash = hash
        }
    }

}

export default Watcher