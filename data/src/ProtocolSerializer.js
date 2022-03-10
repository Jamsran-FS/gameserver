import protobuf from 'protobufjs/light'
import Schema from './Schema'

class ProtocolSerializer {

    /**
     * @private
     * @type {Map<string,protobuf.Type>}
     */
    models = new Map()


    /**
     * @private
     */
    writer = new protobuf.Writer()

    /**
     * @private
     */
    root = new protobuf.Root()

    /**
     * @private
     */
    package = this.root.define('rivalis')

    /**
     * 
     * @param {string} hash 
     * @param {Object<string,any>} data
     * @returns {Uint8Array} 
     */
    encode(hash, data) {
        this.checkSchemaHash(hash)
        this.writer.reset()
        return this.models.get(hash).encode(data, this.writer).finish()
    }

    /**
     * 
     * @param {string} hash 
     * @param {Uint8Array} buffer 
     * @returns {Object<string,any>}
     */
    decode(hash, buffer) {
        this.checkSchemaHash(hash)
        return this.models.get(hash).decode(buffer).toJSON()
    }

    /**
     * @private
     * @param {string} hash 
     */
    checkSchemaHash(hash) {
        if (this.models.has(hash)) {
            return
        }
        let schema = Schema.getSchema(hash)
        if (schema === null) {
            throw new Error('invalid schema')
        }
        if (this.models.has(hash)) {
            return
        }
        this.buildSchema(schema)
    }

    /**
     * 
     * @param {string} hash 
     * @param {Object<string,any>} fields 
     */
    addSchema(hash, fields) {
        let schema = new Schema(hash, fields)
        this.buildSchema(schema)
    }

    /**
     * @private
     * @param {Schema} schema 
     */
    buildSchema(schema) {
        const key = parseInt(schema.hash, 16).toString(36)
        const ProtobufType = new protobuf.Type(`Message$${key}`)
        for (let [ index, key ] of Object.keys(schema.fields).entries()) {
            let fieldType = schema.getBaseType(schema.fields[key])
            let rule = schema.isArray(schema.fields[key]) ? 'repeated': null
            if (rule !== null) {
                ProtobufType.add(new protobuf.Field(key, index + 1, fieldType, rule))
            } else {
                ProtobufType.add(new protobuf.Field(key, index + 1, fieldType))
            }
        }
        this.models.set(schema.hash, ProtobufType)
        this.package.add(ProtobufType)
    }

}

export default ProtocolSerializer