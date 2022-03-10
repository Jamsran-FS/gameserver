import { Actor, Router, Schema } from '@rivalis/core'

const ChatMessage = Schema.define({
    message: Schema.Type.STRING
})

class ChatRouter extends Router {

    onCreate() {
        this.listen('message', this.onMessage, ChatMessage)
    }

    /**
     * 
     * @param {Actor} sender 
     * @param {string} topic 
     * @param {string} data 
     */
    onMessage(sender, topic, data) {
        this.room.broadcast(topic, data, sender)
    }

}

export default ChatRouter