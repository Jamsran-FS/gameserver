import { Logger, env } from '@rivalis/utils'
import { Sequelize, DataTypes } from 'sequelize'

/**
 * @typedef Fleet
 * @property {string} id
 * @property {string} name
 * @property {string} url
 * @property {string} token
 * @property {string} appId
 */

/**
 * @typedef App
 * @property {string} id
 * @property {string} name
 * @property {string} active
 * @property {string} secured
 */

/**
 * @typedef AppSecurityEntry
 * @property {string} appId
 * @property {string} kind
 * @property {string} value
 */

const sequelize = {
    /** @type {Sequelize} */
    connection: null
}

const Models = {
    /** @type {import('sequelize').ModelStatic<import('sequelize').Model<Fleet,Fleet>>} */
    Fleets: null,
    /** @type {import('sequelize').ModelStatic<import('sequelize').Model<App,App>>} */
    Apps: null,
    /** @type {import('sequelize').ModelStatic<import('sequelize').Model<AppSecurityEntry,AppSecurityEntry>>} */
    AppSecurity: null
}

/**
 * 
 * @param {Sequelize} sequelize 
 */
const createFleetModel = async (sequelize) => {
    const Model = await sequelize.define('fleets', {
        id: { type: DataTypes.STRING, allowNull: false, unique: true, primaryKey: true },
        name: { type: DataTypes.STRING, allowNull: false, unique: true },
        url: { type: DataTypes.STRING, allowNull: false, unique: true },
        token: { type: DataTypes.STRING, allowNull: false },
        appId: { type: DataTypes.STRING, allowNull: true, defaultValue: null }
    })
    Model.sync()
    Models.Fleets = Model
}

/**
 * 
 * @param {Sequelize} sequelize 
 */
const createAppModel = async (sequelize) => {
    const Model = await sequelize.define('apps', {
        id: { type: DataTypes.STRING, allowNull: false, unique: true, primaryKey: true },
        name: { type: DataTypes.STRING, allowNull: false },
        active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        secured: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
    })
    Model.sync()
    Models.Apps = Model
}

/**
 * 
 * @param {Sequelize} sequelize 
 */
 const createAppSecurityModel = async (sequelize) => {
    const Model = await sequelize.define('app_security', {
        appId: { type: DataTypes.STRING, allowNull: false },
        kind: { type: DataTypes.STRING, allowNull: false },
        value: { type: DataTypes.STRING, allowNull: false }
    })
    Model.sync()
    Models.AppSecurity = Model
}

const logger = Logger.getLogger('database')

const loggingFunc = (message) => {
    logger.trace(message)
}

const settings = {
    DB_DIALECT: env('CONSOLE_API_DB_DIALECT', 'sqlite'),
    DB_SQLITE_PATH: env('CONSOLE_API_DB_SQLITE_PATH', null),
    DB_MARIADB_URI: env('CONSOLE_API_DB_MARIADB_URI', '')
}


/**
 * 
 * @param {('sqlite'|'mariadb')} dialect 
 * @param {string} mariadbUri 
 * @param {string} sqlitePath 
 */
const databaseInit = async () => {
    const dialects = ['sqlite', 'mariadb']
    if (!dialects.includes(settings.DB_DIALECT)) {
        throw new Error(`unsupported database dialect=(${dialect}), available=(${dialects.join(', ')})`)
    }

    if (settings.DB_DIALECT === 'sqlite') {
        let storage = settings.DB_SQLITE_PATH ? settings.DB_SQLITE_PATH : ':memory:'
        sequelize.connection = new Sequelize({
            dialect: settings.DB_DIALECT,
            storage: storage,
            logging: loggingFunc
        })   
    } else if (settings.DB_DIALECT === 'mariadb') {
        throw new Error('mariadb connection not implemented')
    }
    
    try {
        await sequelize.connection.authenticate()
        createFleetModel(sequelize.connection)
        createAppModel(sequelize.connection)
        createAppSecurityModel(sequelize.connection)
    } catch (error) {
        throw new Error(`database connection fail: ${error.stack}`)
    }
}

const getInstance = () => sequelize.connection

export { databaseInit, Models, getInstance }