import { createVerifier } from 'fast-jwt'
import AppService from '../services/AppService'
import AuthService from '../services/AuthService'

const appAuthMiddleware = () => {

    const appService = AppService.getInstance()
    const authService = AuthService.getInstance()
    const authJWT = async (token, publicKey) => {
        let verifier = createVerifier({ key: publicKey })
        verifier(token)
    }
    /**
     * 
     * @param {import("fastify").FastifyRequest} request 
     * @param {import("fastify").FastifyReply} reply 
     * @param {Function} done 
     */
    const appAuthHook = async (request, reply) => {
        const { authorization } = request.headers || {}
        const { appId = null } = request.params || {}
        const [ app = null ] = appService.apps.filter(app => app.id === appId)
        if (app === null || app.active === false) {
            return reply.status(401).send({ message: 'FAIL', cause: 'unauthorized' })
        }
        if (!app.secured) {
            return
        }
        let auth = authService.extractToken(authorization)
        if (auth.type === 'Bearer') {
            const [ securityMethod = null ] = app.security.filter(method => method.kind === 'JWT')
            if (securityMethod === null) {
                return reply.status(401).send({ message: 'FAIL', cause: 'unauthorized' })
            }
            try {
                await authJWT(auth.token, securityMethod.value)
                return
            } catch (error) {
                return reply.status(401).send({ message: 'FAIL', cause: 'unauthorized' })
            }
        }

        return reply.status(401).send({ message: 'FAIL', cause: 'unauthorized' })

        // if (auth.type === 'SSID') {
        //     return reply.status(401).send({ message: 'FAIL', cause: 'unauthorized' })
        // }

        

    }

    return appAuthHook 
}

export default appAuthMiddleware