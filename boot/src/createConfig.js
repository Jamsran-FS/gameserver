import { Logger, env } from '@rivalis/core'

/**
 * @typedef InstanceConfig
 * @property {string} name
 * @property {string} namespace
 * @property {number} port
 * @property {string} hostname
 * @property {string} registryToken
 * @property {string} registryUrl
 * @property {string} jwtPublicKey
 */

const logger = Logger.getLogger('boot')

/**
 * @returns {InstanceConfig}
 */
const createConfig = () => {

    let NAME = env('INSTANCE_NAME', null)
    let PORT = env('INSTANCE_PORT', 2334, 'number')
    let HOSTNAME = env('INSTANCE_HOSTNAME', '0.0.0.0')
    let REGISTRY_TOKEN = env('INSTANCE_REGISTRY_TOKEN', '')
    let REGISTRY_URL = env('INSTANCE_REGISTRY_URL', null)
    let PUBLIC_KEY = env('INSTANCE_RS256_PUBLIC_KEY', null)

    let LOG_LEVEL = env('INSTANCE_LOG_LEVEL', 6, 'number')
    if (LOG_LEVEL < 0 || LOG_LEVEL > 6) {
        LOG_LEVEL = 6
    }

    Logger.setLevel(LOG_LEVEL)

    return {
        name: NAME,
        port: PORT,
        hostname: HOSTNAME,
        registryToken: REGISTRY_TOKEN,
        registryUrl: REGISTRY_URL,
        jwtPublicKey: PUBLIC_KEY
    }

}

export default createConfig