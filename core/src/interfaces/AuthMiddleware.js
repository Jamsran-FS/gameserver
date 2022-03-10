class AuthMiddleware {

    /**
     * 
     * @param {string} ticket
     * @returns {PromiseLike<string>} 
     */
    async getRoomId(ticket) {}

    /**
     * 
     * @param {string} ticket
     * @returns {PromiseLike<Object<string,any>>} 
     */
    async extract(ticket) {}

}

export default AuthMiddleware