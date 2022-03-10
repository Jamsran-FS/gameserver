import http from 'http'
import { interfaces, Rivalis } from '@rivalis/core'
import { Watcher } from '@rivalis/registry'
import createConfig from './createConfig'

class Instance extends Rivalis {
    
    /**
     * @type {http.Server}
     */
    httpServer = null

    /**
     * @private
     * @type {import('./createConfig').InstanceConfig}
     */
    instanceConfig = null

    /**
     * @private
     * @type {Watcher}
     */
    watcher = null

    /**
     * 
     * @param {http.Server}
     * @param {string} name 
     * @param {interfaces.AuthMiddleware} auth 
     * @param {Array<interfaces.Transport>} transports 
     */
    constructor(httpServer, name, auth, transports) {
        super({
            name: name,
            auth: auth,
            transports: transports
        })
        this.httpServer = httpServer
        this.instanceConfig = createConfig()
    }

    run() {
        super.run()
        if (this.instanceConfig.registryUrl !== null) {
            this.watcher = new Watcher(this, this.instanceConfig.registryUrl, this.instanceConfig.registryToken)
            this.watcher.endpointUrl = this.createEndpointURL()
        }
        this.httpServer.on('error', this.errorOnBoot)
        this.httpServer.listen(this.instanceConfig.port, () => {
            this.httpServer.off('error', this.errorOnBoot)
            this.emit('ready', this)
        })
    }

    shutdown() {
        super.shutdown()
        if (this.watcher !== null) {
            // disconnect watcher
        }
    }

    /**
     * @private
     * @param {Error} error 
     */
    errorOnBoot = (error) => {
        this.logger.error('http server fail:', error.message)
    }

    /**
     * @private
     */
    createEndpointURL() {
        return `ws://${this.instanceConfig.hostname}:${this.instanceConfig.port}`
    }
}

export default Instance