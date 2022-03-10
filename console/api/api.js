import path from 'path'
import { Logger, env } from '@rivalis/utils'
import fastify from 'fastify'
import cors from 'fastify-cors'
import fastifyStatic from 'fastify-static'
import authRouter from './routers/authRouter'
import infraRouter from './routers/infraRouter'
import { databaseInit, Models } from './database'
import appRouter from './routers/appRouter'
import FleetService from './services/FleetService'
import AppService from './services/AppService'

const setupDevelopment = async () => {
    const DEV_FLEET_NAME = env('CONSOLE_DEV_FLEET_NAME', 'my PC')
    const DEV_FLEET_URL = env('CONSOLE_DEV_FLEET_URL', 'http://localhost:26000')
    const DEV_FLEET_TOKEN = env('CONSOLE_DEV_FLEET_TOKEN', null)
    const DEV_APP_NAME = env('CONSOLE_DEV_APP_NAME', 'my local project')
    
    const fleet = await Models.Fleets.findOne({ where: { url: DEV_FLEET_URL } })
    if (fleet === null) {
        let fleet = await FleetService.getInstance().register(DEV_FLEET_NAME, DEV_FLEET_URL, DEV_FLEET_TOKEN)
        await AppService.getInstance().create(DEV_APP_NAME, true, false, [fleet.id], [])
    }

}

const runConsoleAPI = () => {
    const PORT = env('CONSOLE_API_PORT', 2334, 'number')
    const ENABLE_WEBAPP = env('CONSOLE_ENABLE_WEBAPP', false, 'boolean')
    const ENV = env('CONSOLE_ENV', 'production')

    const httpServer = fastify()
    const logger = Logger.getLogger('console/api')

    Logger.setLevel(Logger.LEVEL.DEBUG)

    httpServer.register(cors)

    httpServer.register(authRouter, { prefix: '/api/auth' })
    httpServer.register(infraRouter, { prefix: '/api/infrastructure' })
    httpServer.register(appRouter, { prefix: '/api/apps' })

    if (ENABLE_WEBAPP) {
        const staticPath = path.join(__dirname, '../client')
        httpServer.register(fastifyStatic, {
            root: staticPath,
            prefix: '/public'
        })
        httpServer.get('*', (request, reply) => {
            reply.status(200).sendFile('index.html', staticPath)
        })
    } else {
        httpServer.get('*', (request, reply) => {
            return reply.status(404).send({ message: 'not found' })
        })
    }

    databaseInit().then(() => {
        FleetService.getInstance().invokeUpdate()
        AppService.getInstance().getAll()
        if (ENV === 'development') {
            setupDevelopment()
        }
    })

    httpServer.listen(PORT, '0.0.0.0', (error = null) => {
        if (error !== null) {
            logger.error('server fail:', error.stack)
            process.exit()
        }
        logger.info(`server started port=(${PORT})`)
        
    })
}

export { runConsoleAPI }