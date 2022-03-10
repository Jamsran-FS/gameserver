import TransportBroker from './TransportBroker'

class Actor {

    /**
     * @readonly
     * @type {string}
     */
    id = null

    /**
     * @readonly
     * @type {Object<string,any>}
     */
    data = null

    /**
     * @readonly
     * @type {Date}
     */
    since = null

    /**
     * @private
     * @type {TransportBroker}
     */
    broker = null

    /**
     * 
     * @param {string} id 
     * @param {Object<string,any>} data 
     * @param {TransportBroker} broker 
     */
    constructor(id, data, broker = null) {
        this.id = id
        this.data = data
        this.broker = broker
        this.since = new Date()
    }

    kick() {
        if (this.broker === null) {
            return
        }
        this.broker.kick(this.id)
    }

}

export default Actor