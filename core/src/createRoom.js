import { ProtocolSerializer } from '@rivalis/data'
import Room from './Room'
import RoomResolver from './interfaces/RoomResolver'
import TransportLayer from './TransportLayer'
import AuthMiddleware from './interfaces/AuthMiddleware'
import Transport from './interfaces/Transport'

class SingleRoomResolver extends RoomResolver {

    roomHolder = null

    constructor(roomHolder) {
        super()
        this.roomHolder = roomHolder
    }

    resolve() {
        return this.roomHolder.room
    }

}

/**
 * 
 * @param {string} id 
 * @param {AuthMiddleware} authMiddleware 
 * @param {Array<Transport>} transports 
 * @returns {Room}
 */
const createRoom = (id, authMiddleware, transports = []) => {
    const roomHolder = { room: null }
    const roomResolver = new SingleRoomResolver(roomHolder)
    const transportLayer = new TransportLayer(authMiddleware, roomResolver)
    const serializer = new ProtocolSerializer()
    roomHolder.room = new Room(id, null, transportLayer, serializer)
    for (let transport of transports) {
        transport.initialize(transportLayer)
    }
    return roomHolder.room
}

export default createRoom