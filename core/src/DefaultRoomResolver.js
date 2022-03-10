import RoomResolver from './interfaces/RoomResolver'
import Rivalis from './Rivalis'

class DefaultRoomResolver extends RoomResolver {

    /**
     * @type {Rivalis}
     */
    rivalis = null

    /**
     * 
     * @param {Rivalis} rivalis 
     */
    constructor(rivalis) {
        super()
        this.rivalis = rivalis
    }

    resolve(roomId) {
        return this.rivalis.rooms.get(roomId)
    }

}

export default DefaultRoomResolver