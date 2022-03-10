import { generateId } from '@rivalis/utils'
import AuthMiddleware from './interfaces/AuthMiddleware'
import Transport from './interfaces/Transport'

class Config {

    /**
     * @readonly
     * @type {string}
     */
    name = null

    /**
     * @type {AuthMiddleware}
     */
    auth = null

    /**
     * @type {Array<Transport>}
     */
    transports = null

    /**
     * 
     * @param {Config} config 
     */
    constructor(config = {}) {
        if (typeof config !== 'object') {
            throw new Error('config error: provided config is not an object')
        }
        if (!Array.isArray(config.transports)) {
            throw new Error('config error: transports must be an array of Transport instances')
        }
        for (let [ index, transport ] of config.transports.entries()) {
            if (!(transport instanceof Transport)) {
                throw new Error(`config error: transports[${index}] must be an instance of Transport`)
            }
        }
        if (typeof config.name !== 'string') {
            this.name = generateId(8)
        } else {
            this.name = config.name
        }
        this.auth = config.auth
        this.transports = config.transports
    }

}

export default Config