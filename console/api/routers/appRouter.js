import { Logger } from '@rivalis/utils'
import appAuthMiddleware from '../hooks/appAuthMiddleware'
import authMiddleware from '../hooks/authMiddleware'
import AppService from '../services/AppService'
import RoomService from '../services/RoomService'

/**
 * 
 * @param {import("fastify").FastifyInstance} fastifyInstance 
 * @param {import("fastify").FastifyPluginOptions} options 
 */
 const appRouter = async (fastifyInstance, options) => {
    
    const appService = AppService.getInstance()
    const roomService = RoomService.getInstance()

    fastifyInstance.get('/', { preHandler: authMiddleware([]) }, async(request, reply) => {
        try {
            let appList = await appService.getAll() || []
            return reply.status(200).send({ message: 'OK', data: appList })
        } catch (error) {
            return reply.status(500).send({ message: 'FAIL', data: error.message })
        }    
    })
    
    fastifyInstance.post('/', { preHandler: authMiddleware([]) }, async(request, reply) => {
        const { name = null, active = false, secured = false, fleets = [], security = [] } = request.body || {}
        try {
            let app = await appService.create(name, active, secured, fleets, security)
            reply.status(200).send({ message: 'OK', data: app })
        } catch (error) {
            reply.status(422).send({ message: 'FAIL', cause: error.message })
        }
    })

    fastifyInstance.get('/:appId', { preHandler: authMiddleware([]) }, async (request, reply) => {
        const { appId } = request.params || {}
        try {
            let app = await appService.getOne(appId)
            reply.status(200).send({ message: 'OK', data: app })
        } catch (error) {
            reply.status(422).send({ message: 'FAIL', cause: error.message })
        }
    })

    fastifyInstance.put('/:appId', { preHandler: authMiddleware([]) }, async(request, reply) => {
        const { appId } = request.params || {}
        const { name = null, active = false, secured = false, fleets = [], security = [] } = request.body || {}
        try {
            let app = await appService.update(appId, name, active, secured, fleets, security)
            reply.status(200).send({ message: 'OK', data: app })
        } catch (error) {
            reply.status(422).send({ message: 'FAIL', cause: error.message })
        }
    })

    fastifyInstance.delete('/:appId', { preHandler: authMiddleware([]) }, async(request, reply) => {
        const { appId } = request.params || {}
        try {
            await appService.delete(appId)
            reply.status(200).send({ message: 'OK' })
        } catch (error) {
            reply.status(422).send({ message: 'FAIL', cause: error.message })
        }
    })

    fastifyInstance.post('/:appId/rooms', { preHandler: appAuthMiddleware() }, async (request, reply) => {
        const { appId } = request.params || {}
        const { fleet, roomType, userPayload = null } = request.body || {}
        try {
            let roomAccess = await roomService.create(appId, fleet, roomType, userPayload)
            return reply.status(200).send({ message: 'OK', data: roomAccess })
        } catch (error) {
            return reply.status(422).send({ message: 'FAIL', cause: error.message })
        }
    })

    fastifyInstance.post('/:appId/rooms/join', { preHandler: appAuthMiddleware() }, async (request, reply) => {
        const { appId } = request.params || {}
        const { fleet, roomId, userPayload = null } = request.body || {}
        try {
            let roomAccess = await roomService.join(appId, fleet, roomId, userPayload)
            return reply.status(200).send({ message: 'OK', data: roomAccess })
        } catch (error) {
            return reply.status(422).send({ message: 'FAIL', cause: error.message })
        }
    })
}

export default appRouter