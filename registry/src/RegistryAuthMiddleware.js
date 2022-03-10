import { interfaces } from "@rivalis/core";

class RegistryAuthMiddleware extends interfaces.AuthMiddleware {

    /**
     * @private
     * @type {string}
     */
    token = null

    /**
     * 
     * @param {string} token 
     */
    constructor(token) {
        super()
        this.token = token
    }

    /**
     * 
     * @param {string} ticket 
     */
    getRoomId(ticket) {
        if (ticket !== this.token) {
            throw new Error('invalid token')
        }
    }

    extract() {
        return {}
    }

}

export default RegistryAuthMiddleware