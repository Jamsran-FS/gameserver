import AuthService from '../services/AuthService'


const authMiddleware = (permissions = []) => {
    
    const authService = AuthService.getInstance()
    /**
     * 
     * @param {import("fastify").FastifyRequest} request 
     * @param {import("fastify").FastifyReply} reply 
     * @param {Function} done 
     */
    const authHook = async (request, reply) => {
        const { authorization = null } = request.headers || {}
        let auth = authService.extractToken(authorization)
        if (auth === null) {
            return reply.status(401).send({ message: 'FAIL', cause: 'unauthorized' })
        }
        if (auth.type !== 'Bearer') {
            return reply.status(401).send({ message: 'FAIL', cause: 'unauthorized' })
        }
        let jwtToken = auth.token
        if (jwtToken === null) {
            return reply.status(401).send({ message: 'FAIL', cause: 'unauthorized' })
        }
        let canAccess = authService.verify(jwtToken, permissions)
        if (!canAccess) {
            return reply.status(401).send({ message: 'FAIL', cause: 'unauthorized' })
        }
        return
    }
    return authHook

}

export default authMiddleware