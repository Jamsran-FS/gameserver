import { Room, createRoom, Logger } from '@rivalis/core'
import { WebSocketTransport } from '@rivalis/transports'
import fastify from 'fastify'
import Config from './Config'
import httpRouter from './httpRouter'
import RegistryAPI from './RegistryAPI'
import RegistryAuthMiddleware from './RegistryAuthMiddleware'
import SyncRouter from './SyncRouter'

class InstanceRegistry {

    /**
     * @type {RegistryAPI}
     */
    api = null

    /**
     * @private
     * @type {Config}
     */
    config = null

    /**
     * @private
     * @type {import('fastify').FastifyInstance}
     */
    fastify = null

    /**
     * @private
     * @type {Room}
     */
    room = null

    /**
     * @private
     */
    logger = Logger.getLogger('registry')

    /**
     * 
     * @param {Config} config 
     */
    constructor(config = {}) {
        this.config = new Config(config)
    }

    get token() {
        return this.config.token
    }

    run() {
        this.fastify = fastify()
        const wsTransport = new WebSocketTransport({
            server: this.fastify.server
        })
        this.room = createRoom('@rivalis/registry', new RegistryAuthMiddleware(this.config.token), [ wsTransport ])
        this.configure()
        this.api = new RegistryAPI(this.room)

        this.fastify.listen(this.config.httpPort, '0.0.0.0', error => {
            if (error) {
                this.logger.error('http server error', error.stack)
                return
            }
            this.logger.info(`registry started, port=(${this.config.httpPort}) token=(${this.config.token})`)
        })
        if (this.config.apiEnabled) {
            this.configureHTTPServer()
        }
        this.fastify.all('*', (_, reply) => reply.status(404).send({ message: 'not found' }))

    }

    /**
     * @private
     */
    configure() {
        this.room.use('sync', SyncRouter)
    }

    /**
     * @private
     */
    configureHTTPServer() {
        this.fastify.decorate('api', this.api)
        this.fastify.decorate('token', this.token)
        this.fastify.register(httpRouter, { prefix: '/api' })
    }

}

export default InstanceRegistry