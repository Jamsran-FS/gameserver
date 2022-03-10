import { EventEmitter } from '@rivalis/utils'

/**
 * @callback EventListener
 * @param {string} actorId
 * @param {Uint8Array} message
 */

class TransportBroker {

    /**
     * @private
     * @type {EventEmitter}
     */
    emitter = null

    /**
     * 
     * @param {EventEmitter} emitter 
     */
    constructor(emitter) {
        this.emitter = emitter
    }

    /**
     * 
     * @param {('message'|'leave')} event 
     * @param {string} actorId 
     * @param {EventListener} listener 
     * @param {any} [context] 
     */
    on(event, actorId, listener, context) {
        if (event === 'message') {
            this.emitter.on(`incoming:${actorId}`, listener, context)
        } else if (event === 'leave') {
            this.emitter.on(`leave:${actorId}`, listener, context)
        }
    }

    /**
     * 
     * @param {('message'|'leave')} event 
     * @param {string} actorId 
     * @param {EventListener} listener 
     * @param {any} [context] 
     */
    once(event, actorId, listener, context) {
        if (event === 'message') {
            this.emitter.once(`incoming:${actorId}`, listener, context)
        } else if (event === 'leave') {
            this.emitter.once(`leave:${actorId}`, listener, context)
        }
    }

    /**
     * 
     * @param {('message'|'leave')} event 
     * @param {string} actorId 
     * @param {EventListener} listener 
     * @param {any} [context] 
     */
    off(event, actorId, listener, context) {
        if (event === 'message') {
            this.emitter.off(`incoming:${actorId}`, listener, context)
        } else if (event === 'leave') {
            this.emitter.off(`leave:${actorId}`, listener, context)
        }
    }

    /**
     * 
     * @param {string} actorId 
     * @param {Uint8Array} message 
     */
    send(actorId, message) {
        this.emitter.emit(`outgoing:${actorId}`, actorId, message)
    }

    /**
     * 
     * @param {string} actorId 
     */
    kick(actorId) {
        this.emitter.emit(`kick:${actorId}`, actorId)
    }

}

export default TransportBroker