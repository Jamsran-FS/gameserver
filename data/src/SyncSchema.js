import Schema from './Schema'

const SyncSchema = Schema.define({
    roomId: Schema.Type.STRING,
    actorId: Schema.Type.STRING,
    actions: Schema.Type.ARRAY_STRING,
    schemas: Schema.Type.STRING
})

export default SyncSchema