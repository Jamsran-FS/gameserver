import FleetService from '../services/FleetService'
import AuthService from '../services/AuthService'
import authMiddleware from '../hooks/authMiddleware'

/**
 * 
 * @param {import("fastify").FastifyInstance} fastifyInstance 
 * @param {import("fastify").FastifyPluginOptions} options 
 */
 const infraRouter = async (fastifyInstance) => {

    const fleetService = FleetService.getInstance()

    fastifyInstance.get('/', { preHandler: authMiddleware([]) }, async (request, reply) => {
        reply.status(200).send({
            message: 'OK',
            data: {
                fleets: fleetService.fleets,
                instances: fleetService.instances
            }
        })
    })

    fastifyInstance.post('/fleets', { preHandler: authMiddleware([]) }, async (request, reply) => {
        const { name, url, token } = request.body || {}
        let isValid = await fleetService.validate(url, token)
        if (!isValid) {
            return reply.status(422).send({ message: 'FAIL', cause: 'fleet registry is not available' })
        }
        try {
            let fleet = await fleetService.register(name, url, token)
            return reply.status(200).send({ message: 'OK', data: fleet })
        } catch (error) {
            return reply.status(500).send({ message: 'FAIL', cause: error.message })
        }
    })

    fastifyInstance.delete('/fleets/:fleetId', { preHandler: authMiddleware([]) }, async (request, reply) => {
        const { fleetId } = request.params
        try {
            await fleetService.remove(fleetId)
            return reply.status(200).send({ message: 'OK' })
        } catch (error) {
            return reply.status(422).send({ message: 'FAIL', cause: error.message })
        }
        
    })

    fastifyInstance.get('/fleets', { preHandler: authMiddleware([]) }, (request, reply) => {
        reply.status(200).send({
            message: 'OK',
            data: fleetService.fleets
        })
    })

    fastifyInstance.get('/instances', { preHandler: authMiddleware([]) }, (request, reply) => {
        reply.status(200).send({
            message: 'OK',
            data: fleetService.instances
        })
    })
}

export default infraRouter