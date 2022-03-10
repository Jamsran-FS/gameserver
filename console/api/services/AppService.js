import { generateId, Logger } from '@rivalis/utils'
import { Models, getInstance } from '../database'
import FleetService from './FleetService'

/**
 * @typedef SecurityMethod
 * @property {string} kind
 * @property {string} value
 */

/**
 * @typedef App
 * @property {string} id
 * @property {string} name
 * @property {boolean} active
 * @property {boolean} secured
 * @property {Array<import('./FleetService').Fleet>} fleets
 * @property {Array<SecurityMethod>} security
 */

class AppService {

    /**
     * @private
     */
    fleetService = FleetService.getInstance()

    /**
     * @private
     */
    securityMethods = ['JWT', 'Steam']

    /**
     * @private
     * @type {Array<App>}
     */
    apps = []

    /**
     * @private
     */
    logger = Logger.getLogger('app service')

    /**
     * 
     * @returns {PromiseLike<Array<App>>}
     */
    async getAll() {
        let apps = await Models.Apps.findAll()
        let appList = []
        for (let app of apps) {
            const { id, name, active, secured } = app.get()
            const fleets = []
            this.fleetService.fleets.filter(fleet => fleet.appId === id).forEach(fleet => {
                fleets.push(fleet)
            })
            const security = []
            let methods = await Models.AppSecurity.findAll({ where: { appId: id } })
            methods.forEach(method => {
                const { kind, value } = method.get()
                security.push({ kind, value })
            })
            appList.push({ id, name, active, secured, fleets, security })
        }
        this.apps = appList
        return appList
    }

    /**
     * 
     * @param {string} id 
     * @returns {PromiseLike<App>}
     */
    async getOne(id) {
        let app = await Models.Apps.findOne({ where: { id } })
        if (app === null) {
            throw new Error(`app id="${id}" doesn not exist`)
        }
        const { name, secured, active } = app.get()
        const fleets = []
        this.fleetService.fleets.filter(fleet => fleet.appId === id).forEach(fleet => {
            fleets.push(fleet)
        })
        const security = []
        let methods = await Models.AppSecurity.findAll({ where: { appId: id } })
        methods.forEach(method => {
            const { kind, value } = method.get()
            security.push({ kind, value })
        })
        return { id, name, active, secured, fleets, security }
    }

    /**
     * 
     * @param {string} name 
     * @param {string} active 
     * @param {boolean} secured 
     * @param {Array<string>} fleets 
     * @param {Array<SecurityMethod>} security 
     */
    async create(name, active, secured, fleets, security) {
        this.validate(name, active, secured, fleets, security)
        return getInstance().transaction(async () => {
            let id = generateId(12)
            let app = Models.Apps.build({ id, name, active, secured })
            await app.save()
            for (let method of security) {
                let security = Models.AppSecurity.build({ appId: id, kind: method.kind, value: method.value })
                await security.save()
            }
            for (let fleetId of fleets) {
                await this.fleetService.assignFleet(fleetId, id)
            }
            return app.get()
        }).then(() => {
            this.fleetService.invokeUpdate()
            this.getAll()
        }).catch(error => {
            throw new Error(`internal server error: ${error.message}`)
        })
        
    }

    /**
     * @param {string} id
     * @param {string} name 
     * @param {string} active 
     * @param {boolean} secured 
     * @param {Array<string>} fleets 
     * @param {Array<SecurityMethod>} security 
     */
    async update(id, name, active, secured, fleets, security) {
        this.validate(name, active, secured, fleets, security)
        return getInstance().transaction(async () => {
            let app = await Models.Apps.findOne({ where: { id } })
            if (app === null) {
                throw new Error(`app id="${id}" does not exist`)
            }
            app.set('name', name)
            app.set('active', active)
            app.set('secured', secured)
            let assignedFleets = this.fleetService.fleets.filter(fleet => fleet.appId === id)
            for (let fleet of assignedFleets) {
                await this.fleetService.freeFleet(fleet.id)
            }
            let oldSecurityMethods = await Models.AppSecurity.findAll({ where: { appId: id } })
            for (let securityMethod of oldSecurityMethods) {
                await securityMethod.destroy()
            }
            for (let method of security) {
                let security = Models.AppSecurity.build({ appId: id, kind: method.kind, value: method.value })
                await security.save()
            }
            for (let fleetId of fleets) {
                await this.fleetService.assignFleet(fleetId, id)
            }
            await app.save()
            this.fleetService.invokeUpdate()
            this.getAll()
            return app.get()
        })
    }

    async delete(id) {
        return getInstance().transaction(async () => {
            let app = await Models.Apps.findOne({ where: { id } })
            if (app === null) {
                throw new Error(`app id="${id}" does not exist`)
            }
            let assignedFleets = this.fleetService.fleets.filter(fleet => fleet.appId === id)
            for (let fleet of assignedFleets) {
                await this.fleetService.freeFleet(fleet.id)
            }
            let oldSecurityMethods = await Models.AppSecurity.findAll({ where: { appId: id } })
            for (let securityMethod of oldSecurityMethods) {
                await securityMethod.destroy()
            }
            await app.destroy()
            this.fleetService.invokeUpdate()
            this.getAll()
            return null
        })
    }

    /**
     * 
     * @param {string} name 
     * @param {string} active 
     * @param {boolean} secured 
     * @param {Array<string>} fleets 
     * @param {Array<SecurityMethod>} security 
     */
    validate(name, active, secured, fleets, security) {
        if (typeof name !== 'string' || name.length < 3) {
            throw new Error('"name" must be a string and greater than 3 characters')
        }
        if (typeof active !== 'boolean') {
            throw new Error('"active" must be a boolean type')
        }
        if (typeof secured !== 'boolean') {
            throw new Error('"secured" must be a boolean type')
        }
        if (!Array.isArray(fleets)) {
            throw new Error('"fleets" must be an array of strings (fleet ids)')
        }
        if (fleets.length === 0) {
            throw new Error('application can not be created without assigned fleet(s) of instances')
        }
        for (let [ index, fleetId ] of fleets.entries()) {
            const [ fleet = null ] = this.fleetService.fleets.filter(fleet => fleet.id === fleetId)
            if (fleet === null) {
                throw new Error(`"fleets[${index}]" fleet id=(${fleetId}) does not exist`)
            }
        }
        if (!Array.isArray(security)) {
            throw new Error('"security" must be an array of Objects { kind, value }')
        }
        if (secured && security.length === 0) {
            throw new Error('server can not be marked as secured without any security method')
        }
        if (!secured && security.length > 0) {
            throw new Error('"security" can be applied only on secured servers')
        }
        for (let [ index, method ] of security.entries()) {
            if (typeof method !== 'object') {
                throw new Error(`"security[${index}]" is not a object`)
            }
            if (!this.securityMethods.includes(method.kind)) {
                throw new Error(`"security[${index}]" type=(${method.kind}) is not allowed`)
            }
        }
    }

}

/** @type {AppService} */
let instance = null
AppService.getInstance = () => {
    if (instance === null) {
        instance = new AppService()
    }
    return instance
}
export default AppService