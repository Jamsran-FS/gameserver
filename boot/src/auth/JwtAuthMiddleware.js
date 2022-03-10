import { createVerifier } from 'fast-jwt'
import { interfaces } from '@rivalis/core'

class JwtAuthMiddleware extends interfaces.AuthMiddleware {

    /**
     * @private
     * @type {import('fast-jwt').VerifierSync}
     */
    verifier = null

    constructor(jwtPublicKey) {
        super()
        try {
            this.verifier = createVerifier({ key: jwtPublicKey })
        } catch (error) {
            throw new Error(`JwtAuthMiddleware error: ${error.message}`)
        }
    }

    /**
     * @private
     * @param {string} token 
     */
    getRoomId(token) {
        try {
            let { roomId = null } = this.verifier(token) || {}
            if (roomId === null) {
                throw new Error('jwt auth: roomId is missing')
            }
            return roomId
        } catch (error) {
            throw new Error(`jwt auth: ${error.message}`)
        }
    }

    /**
     * @private
     * @param {string} token 
     */
    extract(token) {
        return this.verifier(token) || {}
    }

}

export default JwtAuthMiddleware