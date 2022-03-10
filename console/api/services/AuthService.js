import fs from 'fs'
import { generateId, Logger, env } from '@rivalis/utils'
import { createSigner, createVerifier } from 'fast-jwt'

class AuthService {

    /** @private */
    logger = Logger.getLogger('auth')

    /**
     * @private
     * @type {string}
     */
    rootPassword = null

    /**
     * @private
     * @type {import('fast-jwt').SignerSync}
     */
    signer = null

    /**
     * @private
     * @type {import('fast-jwt').VerifierSync}
     */
    verifier = null

    constructor() {
        const variables = this.extractSecretKeys()
        this.signer = createSigner({
            algorithm: 'RS256',
            key: variables.JWT_PRIVATE_KEY
        })

        this.verifier = createVerifier({
            key: variables.JWT_PUBLIC_KEY
        })
    }

    signIn(password) {
        if (password !== this.rootPassword) {
            throw new Error('invalid password')
        }
        return this.issueJwtToken({ scope: [] }, 60 * 120, 'admin')
    }

    extractToken(authHeader = '') {
        if (typeof authHeader !== 'string') {
            return null
        }
        let [ tokenType = null, token = null ] = authHeader.split(' ')
        return { type: tokenType, token }
    }

    verify(token) {
        try {
            this.verifier(token)
        } catch (error) {
            return false
        }
        return true
    }

    signRoomToken(instanceId, roomId, payload = {}) {
        const jwtPayload = { ...payload, instanceId, roomId }
        return this.issueJwtToken(jwtPayload, 10, roomId)
    }

    /**
     * 
     * @param {Object<string,string>} payload 
     * @param {number} expiresIn 
     * @param {string} subject 
     * @param {string} audience 
     * @param {string} uid 
     * @param {string} issuer 
     * @returns {string}
     */
    issueJwtToken(payload = {}, expiresIn = 0, subject = null, audience = null, uid = null, issuer = null) {
        const tokenPayload = { ...payload }
        if (subject !== null) {
            tokenPayload['sub'] = subject
        }
        if (audience !== null) {
            tokenPayload['aud'] = audience
        }
        if (typeof expiresIn !== 'number') {
            expiresIn = 0
        }
        tokenPayload['exp'] = Math.floor(new Date().getTime() / 1000) + expiresIn
        tokenPayload['jti'] = uid !== null ? uid : generateId(12)
        tokenPayload['iss'] = issuer !== null ? issuer : '@rivalis/console'
        return this.signer(tokenPayload)
    }

    /**
     * @private
     */
    extractSecretKeys() {
        this.rootPassword = env('CONSOLE_API_ROOT_PASSWORD', null)
        const variables = {
            JWT_PUBLIC_KEY: env('CONSOLE_API_AUTH_RS256_PUBLIC_KEY', null),
            JWT_PRIVATE_KEY: env('CONSOLE_API_AUTH_RS256_PRIVATE_KEY', null)
        }

        if (this.rootPassword === null) {
            try {
                let path = env('CONSOLE_API_ROOT_PASSWORD_FILE', null)
                this.rootPassword = fs.readFileSync(path).toString()
            } catch (error) {
                this.rootPassword = 'admin'
            }
        }

        if (variables.JWT_PUBLIC_KEY === null) {
            try {
                let path = env('CONSOLE_API_AUTH_RS256_PUBLIC_KEY_FILE', null)
                variables.JWT_PUBLIC_KEY = fs.readFileSync(path).toString()
            } catch (error) {
                this.logger.error('[CONSOLE_API_AUTH_RS256_PUBLIC_KEY] variable is missing')
                process.exit()
            }
        }

        if (variables.JWT_PRIVATE_KEY === null) {
            try {
                let path = env('CONSOLE_API_AUTH_RS256_PRIVATE_KEY_FILE', null)
                variables.JWT_PRIVATE_KEY = fs.readFileSync(path).toString()
            } catch (error) {
                this.logger.error('[CONSOLE_API_AUTH_RS256_PRIVATE_KEY] variable is missing')
                process.exit()
            }
        }
        this.logger.info(`admin password: ${this.rootPassword}`)
        return variables
    }

}

/** @type {AuthService} */
let instance = null
AuthService.getInstance = () => {
    if (instance === null) {
        instance = new AuthService()
    }
    return instance
}

export default AuthService