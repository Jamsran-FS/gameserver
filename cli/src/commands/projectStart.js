import path from 'path'
import { env, generateId, Logger } from '@rivalis/utils'
import { Command } from 'commander'
import concurrently from 'concurrently'
import { generateInstanceCMD } from '../utils/projectCmds'
import { createDir, createFile, getFile, getPath, isDirEmpty, removeFile } from '../utils/essentials'
import Color from '../utils/Color'
import { generateKeyPair } from '../utils/cryto'
import { isPortFree } from '../utils/network'

const projectStart = new Command('start')

/**
 * @type {Array<import('concurrently').ConcurrentlyCommandInput>}
 */
const commands = []

projectStart.action(async () => {

    const ports = [2334, 16000, 16001]

    for (let port of ports) {
        let isFree = await isPortFree(port)
        if (!isFree) {
            console.log(`❌ project can not be started, port=${port} is already in use`)
            process.exit()
        }
    }

    
    if (isDirEmpty(getPath('.rivalis')) === null) {
        createDir(getPath('.rivalis'))
    }

    let rootPath = getPath()
    let config = getFile(getPath('.rivalis/config.json'), 'json')

    if (config === null) {
        config = {
            registryToken: generateId(8),
            logLevel: 3
        }
        createFile('.rivalis/config.json', rootPath, JSON.stringify(config, null, 4))
    }

    let privateKey = getFile(getPath('.rivalis/secret.key'))
    let publicKey = getFile(getPath('.rivalis/secret.key.pub'))

    if (privateKey === null || publicKey === null) {
        
        removeFile(getPath('.rivalis/secret.key'))
        removeFile(getPath('.rivalis/secret.key.pub'))
        let keyPair = generateKeyPair()
        createFile('.rivalis/secret.key', rootPath, keyPair.privateKey)
        createFile('.rivalis/secret.key.pub', rootPath, keyPair.publicKey)
        privateKey = keyPair.privateKey
        publicKey = keyPair.publicKey
    }

    commands.push({
        command: 'rivalis-registry',
        name: 'registry',
        prefixColor: Color.RED,
        cwd: rootPath,
        env: {
            REGISTRY_HTTP_PORT: 26000,
            REGISTRY_TOKEN: config.registryToken
        }  
    })

    commands.push({
        command: 'rivalis-console',
        name: 'console',
        prefixColor: Color.LIGHT_GREEN,
        cwd: rootPath,
        env: {
            CONSOLE_API_DB_DIALECT: 'sqlite',
            CONSOLE_API_DB_SQLITE_PATH: '.rivalis/console.sqlite',
            CONSOLE_ENABLE_WEBAPP: true,
            CONSOLE_API_AUTH_RS256_PRIVATE_KEY: privateKey,
            CONSOLE_API_AUTH_RS256_PUBLIC_KEY: publicKey,
            CONSOLE_ENV: 'development',
            CONSOLE_DEV_FLEET_TOKEN: config.registryToken
        }  
    })

    const instanceEntrypoint = env('ENTRYPOINT', './src/index.js')
    const watchDir = path.join(instanceEntrypoint, '../')

    commands.push({
        command: generateInstanceCMD(instanceEntrypoint, watchDir),
        name: 'instance',
        prefixColor: Color.TEAL,
        cwd: rootPath,
        env: {
            INSTANCE_NAME: 'instance',
            INSTANCE_PORT: 26001,
            INSTANCE_HOSTNAME: 'localhost',
            INSTANCE_REGISTRY_TOKEN: config.registryToken,
            INSTANCE_REGISTRY_URL: 'ws://localhost:26000',
            INSTANCE_RS256_PUBLIC_KEY: publicKey,
            INSTANCE_LOG_LEVEL: config.logLevel
        }
    })

    let runClientCommand = env('RUN_CLIENT', null)
    if (runClientCommand !== null) {
        commands.push({
            command: runClientCommand,
            name: 'client',
            prefixColor: Color.LIGHT_BLUE,
            cwd: rootPath
        })
    }

    let processes = concurrently(commands, {
        outputStream: process.stdout
    })

    console.log(`
        http://localhost:2334
        password: admin
    `)

    processes.result.then(() => {
        process.exit()
    }).catch(error => {
        console.log('❌ error: ', error.message)
        process.exit()
    })

})

export default projectStart