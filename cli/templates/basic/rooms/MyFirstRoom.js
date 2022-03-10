import { Room } from '@rivalis/core'
import ChatRouter from '../routers/ChatRouter'

class MyFirstRoom extends Room {

    onCreate() {
        this.use('chat', ChatRouter)
    }

}

export default MyFirstRoom