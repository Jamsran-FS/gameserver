import { toHex } from '@rivalis/utils'

/**
 * @typedef Types
 * @type {('sint32'|'uint32'|'sint64'|'uint64'|'bool'|'string'|'bytes'|'sint32[]'|'uint32[]'|'sint64[]'|'uint64[]'|'bool[]'|'string[]')}
 */

/**
 * @typedef Fields
 * @type {Object<string,Types>}
 */

/**
 * @typedef SchemaType
 * @type {string}
 */

/**
 * 
 * @param {Schema} schema 
 */
const validateSchema = (schema) => {
    for (let key in schema.fields) {
        const fieldType = schema.fields[key]
        if (!Schema.typeList.includes(fieldType)) {
            throw new Error(`field type=(${fieldType}) is not valid, available types=(${Schema.typeList.join(', ')})`)
        }
    }
}

class Schema {

    /**
     * @readonly
     * @type {string}
     */
    hash = null

    /**
     * @readonly
     * @type {Fields}
     */
    fields = null

    /**
     * 
     * @param {string} type 
     * @param {Fields} fields 
     */
    constructor(hash, fields) {
        this.hash = hash
        this.fields = fields
    }

    /**
     * 
     * @param {Types} type 
     * @returns {boolean}
     */
    isArray(fieldType) {
        return fieldType.split('[]').length === 2
    }

    /**
     * 
     * @param {Types} type
     * @returns {string} 
     */
    getBaseType(fieldType) {
        return fieldType.split('[]')[0]
    }

}

/**
 * @enum {string}
 */
Schema.Type = {
    SIGNED_INT32: 'sint32',
    UNSIGNED_INT32: 'uint32',
    SIGNED_INT64: 'sint64',
    UNSIGNED_INT64: 'uint64',
    BOOL: 'bool',
    STRING: 'string',
    BYTES: 'bytes',
    FOLAT: 'float',
    DOUBLE: 'double',
    ARRAY_SIGNED_INT32: 'sint32[]',
    ARRAY_UNSIGNED_INT32: 'uint32[]',
    ARRAY_SIGNED_INT64: 'sint64[]',
    ARRAY_UNSIGNED_INT64: 'uint64[]',
    ARRAY_BOOL: 'bool[]',
    ARRAY_STRING: 'string[]',
    ARRAY_FOLAT: 'float[]',
    ARRAY_DOUBLE: 'double[]',
}

/**
 * @type {Array<string>}
 */
Schema.typeList = Object.keys(Schema.Type).map(key => Schema.Type[key])

/**
 * @type {Map<string,Schema>}
 */
const schemas = new Map()

let schemaCounter = 0

/**
 * 
 * @param {Fields} fields 
 * @returns {SchemaType}
 */
Schema.define = (fields) => {
    let hash = toHex(schemaCounter, 4)
    const schema = new Schema(hash, fields)
    validateSchema(schema)
    schemaCounter++
    schemas.set(hash, schema)
    return hash
}

/**
 * @readonly
 * @type {string}
 */
Schema.Empty = Schema.define({})

/**
 * @param {string} hash
 * @returns {Schema}
 */
Schema.getSchema = (hash) => {
    return schemas.get(hash) || null
}

export default Schema