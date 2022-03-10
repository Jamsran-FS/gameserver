class ActionRepository {

    /**
     * @private
     * @type {Map<string,string>}
     */
    keys = new Map()

    /**
     * @private
     * @type {Map<string,string>}
     */
    incoming = new Map()

    /**
     * @private
     * @type {Map<string,string>}
     */
    outgoing = new Map()

    /**
     * @private
     * @type {Map<string,string>}
     */
    hashes = new Map()

    /**
     * @private
     * @type {Set<string>}
     */
    schemas = new Set()

    /**
     * 
     * @returns {Array<string>}
     */
    getActionKeys() {
        let keys = []
        this.hashes.forEach((_, key) => keys.push(key))
        return keys
    }

    getIncoming(hash) {
        return this.incoming.get(hash) || null
    }

    getOutgoing(hash) {
        return this.outgoing.get(hash) || null
    }

    getKey(hash) {
        return this.keys.get(hash) || null
    }

    getHash(key) {
        return this.hashes.get(key) || null        
    }

    getSchemaList() {
        let schemaList = []
        this.schemas.forEach(schema => {
            schemaList.push(schema)
        })
        return schemaList
    }

    getList() {
        let actionList = []
        this.keys.forEach((key, hash) => {
            let values = [hash, key]
            values.push(this.incoming.get(hash), this.outgoing.get(hash))
            actionList.push(values.join(','))
        })
        return actionList
    }

    /**
     * 
     * @param {Array<string>} actionList 
     */
    loadList(actionList = []) {
        this.keys.clear()
        this.incoming.clear()
        this.outgoing.clear()
        this.hashes.clear()
        this.schemas.clear()
        for (let action of actionList) {
            const [ hash, key, incoming, outgoing ] = action.split(',')
            this.register(hash, key, incoming, outgoing)
        }
    }

    /**
     * @param {string} hash 
     * @param {string} key 
     * @param {string} incoming 
     * @param {string} outgoing 
     */
    register(hash, key, incoming, outgoing) {
        this.keys.set(hash, key)
        this.incoming.set(hash, incoming)
        this.outgoing.set(hash, outgoing)
        this.hashes.set(key, hash)
        this.schemas.add(incoming)
        this.schemas.add(outgoing)
    }

}

export default ActionRepository