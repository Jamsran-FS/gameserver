import http from 'http'
import { WebSocketTransport } from '@rivalis/transports'
import JwtAuthMiddleware from './auth/JwtAuthMiddleware'
import createConfig from './createConfig'
import Instance from './Instance'
import { Logger } from '@rivalis/core'

/**
 * @callback InstanceReadyHandler
 * @param {Instance} instance
 * @returns {void}
 */


const logger = Logger.getLogger('@rivalis/boot')

/**
 * @param {InstanceReadyHandler} handler
 * @returns {Instance}
 */
const createInstance = (handler) => {
    const httpServer = http.createServer()
    const config = createConfig()

    if (config.jwtPublicKey === null) {
        logger.error('JWT public key is missing, setup using env variable [INSTANCE_RS256_PUBLIC_KEY]')
        return
    }

    const authMiddleware = new JwtAuthMiddleware(config.jwtPublicKey)
    const wsTransport = new WebSocketTransport({
        server: httpServer
    })
    const instance = new Instance(httpServer, config.name, authMiddleware, [ wsTransport ])
    instance.run()
    instance.on('ready', handler)
}

export default createInstance