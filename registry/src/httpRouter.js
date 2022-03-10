import RegistryAPI from './RegistryAPI'
/**
 * 
 * @param {import("fastify").FastifyInstance} fastifyInstance 
 * @param {import("fastify").FastifyPluginOptions} options 
 */
const httpRouter = async (fastifyInstance, options) => {

    /** @type {RegistryAPI} */
    const api = fastifyInstance.api
    const token = fastifyInstance.token

    fastifyInstance.get('/stats', async (request, reply) => {
        const { authorization = null } = request.headers
        if (authorization !== token) {
            return reply.status(401).send({ message: 'FAIL', cause: 'unauthorized' })
        }
        reply.status(200).send({
            message: 'OK',
            data: {
                connections: api.connections,
                instances: api.instances.length,
                rooms: api.rooms.length,
                roomTypes: api.roomTypes
            }
        })
    })

    fastifyInstance.get('/instances', async (request, reply) => {
        const { authorization = null } = request.headers
        if (authorization !== token) {
            return reply.status(401).send({ message: 'FAIL', cause: 'unauthorized' })
        }
        reply.status(200).send({
            message: 'OK',
            data: api.instances
        })
    })

    fastifyInstance.get('/instances/:instanceId', async (request, reply) => {
        const { authorization = null } = request.headers
        if (authorization !== token) {
            return reply.status(401).send({ message: 'FAIL', cause: 'unauthorized' })
        }
        const { instanceId = null } = request.params
        const [ instance = null ] = api.instances.filter(instance => instance.id === instanceId)
        if (instance === null) {
            return reply.status(404).send({ message: 'FAIL', cause: `instance id=${instanceId} does not exist` })
        }
        reply.status(200).send({
            message: 'OK',
            data: instance
        })
    })

    fastifyInstance.get('/instances/:instanceId/rooms', async (request, reply) => {
        const { authorization = null } = request.headers
        if (authorization !== token) {
            return reply.status(401).send({ message: 'FAIL', cause: 'unauthorized' })
        }
        const { instanceId = null } = request.params
        const [ instance = null ] = api.instances.filter(instance => instance.id === instanceId)
        if (instance === null) {
            return reply.status(404).send({ message: 'FAIL', cause: `instance id=${instanceId} does not exist` })
        }
        reply.status(200).send({
            message: 'OK',
            data: api.rooms.filter(room => room.instance === instanceId)
        })
    })

    fastifyInstance.get('/rooms', async (request, reply) => {
        const { authorization = null } = request.headers
        if (authorization !== token) {
            return reply.status(401).send({ message:'FAIL', cause: 'unauthorized' })
        }
        reply.status(200).send({
            message: 'OK',
            data: api.rooms
        })
    })

    fastifyInstance.get('/rooms/:roomId', async (request, reply) => {
        const { authorization = null } = request.headers
        if (authorization !== token) {
            return reply.status(401).send({  message: 'FAIL', cause: 'unauthorized' })
        }
        const { roomId = null } = request.params
        const rooms = api.rooms.filter(room => room.id === roomId)
        reply.status(200).send({
            message: 'OK',
            data: rooms
        })
    })

    fastifyInstance.post('/instances/:instanceId/rooms', async (request, reply) => {
        const { authorization = null } = request.headers
        if (authorization !== token) {
            return reply.status(401).send({ message: 'FAIL', cause: 'unauthorized' })
        }
        const { instanceId = null } = request.params
        const { roomId, type } = request.body || {}
        try {
            api.create(instanceId, roomId, type)
            reply.status(200).send({ message: 'OK' })
        } catch (error) {
            reply.status(400).send({ message: 'FAIL', cause: error.message })
        }
    })

    fastifyInstance.delete('/instances/:instanceId/rooms/:roomId', async (request, reply) => {
        const { authorization = null } = request.headers
        if (authorization !== token) {
            return reply.status(401).send({ message: 'FAIL', cause: 'unauthorized' })
        }
        const { instanceId = null, roomId = null } = request.params
        try {
            api.destroy(instanceId, roomId)
            reply.status(200).send({ message: 'OK' })
        } catch (error) {
            reply.status(400).send({ message: 'FAIL', cause: error.message })
        }
    })
}

export default httpRouter