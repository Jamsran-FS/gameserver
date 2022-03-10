import http from 'http'
import { generateId } from '@rivalis/core'

class Config {

    /**
     * @type {number}
     */
    httpPort = null

    /**
     * @type {boolean}
     */
    apiEnabled = null

    /**
     * @type {string}
     */
    token = null

    /**
     * @type {import('fastify').FastifyServerFactory}
     */
    serverFactory = null

    /**
     * 
     * @param {Config} config 
     */
    constructor(config = {}) {
        if (typeof config !== 'object') {
            throw new Error('config error: provided config is not an object')
        }
        if (typeof config.serverFactory !== 'function') {
            this.serverFactory = this.defaultHttpServerFactory
        }
        if (typeof config.httpPort !== 'number') {
            this.httpPort = 2335
        } else {
            this.httpPort = config.httpPort
        }
        if (typeof config.token !== 'string') {
            this.token = generateId(12)
        } else {
            this.token = config.token
        }
        if (typeof config.apiEnabled !== 'boolean') {
            this.apiEnabled = true
        } else {
            this.apiEnabled = config.apiEnabled
        }
    }

    /**
     * @private
     * @param {import('fastify').FastifyServerFactoryHandler} handler 
     */
    defaultHttpServerFactory = (handler) => {
        const httpServer = http.createServer(handler)
        return httpServer
    }

}

export default Config