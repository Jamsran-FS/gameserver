import { Broadcast, EventEmitter, Logger, generateId, toHex, env } from '@rivalis/utils'
import { Schema, ActionRepository, ProtocolSerializer, SyncSchema, bufferToHex, hexToBuffer } from '@rivalis/data'

import AuthMiddleware from './interfaces/AuthMiddleware'
import RoomResolver from './interfaces/RoomResolver'
import Transport from './interfaces/Transport'

import Rivalis from './Rivalis'
import Config from './Config'
import Room from './Room'
import Router from './Router'
import Actor from './Actor'
import TransportLayer from './TransportLayer'
import createRoom from './createRoom'

/** @namespace interfaces */
const interfaces = {
    AuthMiddleware,
    RoomResolver,
    Transport
}

export {
    interfaces,
    Rivalis,
    Config,
    Room,
    Router,
    Actor,
    TransportLayer,
    createRoom,

    Broadcast,
    EventEmitter,
    Logger,
    generateId,
    toHex,
    env,

    Schema,
    ActionRepository,
    ProtocolSerializer,
    SyncSchema,
    bufferToHex,
    hexToBuffer
}