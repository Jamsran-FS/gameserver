import AuthService from "../services/AuthService"

/**
 * 
 * @param {import("fastify").FastifyInstance} fastifyInstance 
 * @param {import("fastify").FastifyPluginOptions} options 
 */
const authRouter = async (fastifyInstance, options) => {
    fastifyInstance.post('/', (request, reply) => {
        const { password } = request.body || {}
        try {
            let token = AuthService.getInstance().signIn(password)
            return reply.status(200).send({ message: 'OK', data: { token } })
        } catch (error) {
            return reply.status(401).send({ message: 'FAIL', cause: error.message })
        }
    })
}

export default authRouter