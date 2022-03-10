#!/usr/bin/env node
const { InstanceRegistry } = require('../lib/registry')
const { generateId, env } = require('@rivalis/core')

const HTTP_PORT = env('REGISTRY_HTTP_PORT', 26000, 'number')
const TOKEN = env('REGISTRY_TOKEN', generateId(12))

const registry = new InstanceRegistry({
    httpPort: HTTP_PORT,
    apiEnabled: true,
    token: TOKEN
})

registry.run()