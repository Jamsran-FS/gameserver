import { Broadcast, Logger } from '@rivalis/utils'
import { ProtocolSerializer } from '@rivalis/data'
import Config from './Config'
import DefaultRoomResolver from './DefaultRoomResolver'
import TransportLayer from './TransportLayer'
import RoomManager from './RoomManager'

/**
 * @typedef EventTypes
 * @type {('run'|'shutdown')}
 */

/**
 * @extends {Broadcast<EventTypes,string,Object<string,any>>}
 */
class Rivalis extends Broadcast {

    /**
     * @type {RoomManager}
     */
    rooms = null

    /**
     * @protected
     * @type {Logger}
     */
    logger = null

    /**
     * @private
     * @type {Config}
     */
    config = null

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
     * 
     * @param {Config} [config=null] 
     */
    constructor(config = null) {
        super()
        this.config = new Config(config)
        this.logger = Logger.getLogger(`rivalis=${this.name}`)
    }

    get name() {
        return this.config.name
    }

    get connections() {
        return this.transportLayer.connections
    }

    run() {
        if (this.transportLayer === null) {
            const roomResolver = new DefaultRoomResolver(this)
            this.transportLayer = new TransportLayer(this.config.auth, roomResolver)
        }
        if (this.serializer === null) {
            this.serializer = new ProtocolSerializer()
        }
        for (let transport of this.config.transports) {
            transport.initialize(this.transportLayer)
        }
        this.rooms = new RoomManager(this.transportLayer, this.serializer)
        this.logger.info('started')
        this.emit('run')
    }

    shutdown() {
        for (let transport of this.config.transports) {
            transport.dispose()
        }
        this.logger.info('terminated')
        this.emit('shutdown')
    }

}

export default Rivalis