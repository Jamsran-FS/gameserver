import { URL } from 'url'
import { IncomingMessage } from 'http'
import ws, { WebSocketServer, WebSocket } from 'ws'
import { interfaces, TransportLayer, Logger } from '@rivalis/core'

class WebSocketTransport extends interfaces.Transport {

    httpServer = null

    /**
     * @private
     * @type {WebSocketServer}
     */
    ws = null

    /**
     * @private
     * @type {string}
     */
    queryTicketParam = null

    /**
     * @private
     * @type {TransportLayer}
     */
    transportLayer = null

    logger = Logger.getLogger('transport=ws')

    /**
     * 
     * @param {import('ws').ServerOptions} options 
     * @param {string} queryTicketParam
     */
    constructor(options = null, queryTicketParam = 'ticket') {
        super()
        this.queryTicketParam = queryTicketParam
        this.ws = new WebSocketServer(options)
    }

    /**
     * 
     * @param {TransportLayer} transportLayer 
     */
    initialize(transportLayer) {
        this.transportLayer = transportLayer
        this.ws.off('connection', this.handleReject)
        this.ws.on('connection', this.handleConnection)
    }

    dispose() {
        this.ws.off('connection', this.handleConnection)
        this.ws.on('connection', this.handleReject)
        this.logger.debug('disposed')
    }

    /**
     * @private
     * @param {WebSocket} socket 
     * @param {IncomingMessage} request 
     */
    handleReject = (socket, request) => socket.close(4001)

    /**
     * @private
     * @param {WebSocket} socket 
     * @param {IncomingMessage} request 
     */
    handleConnection = async (socket, request) => {
        let actorId = null
        const ticket = this.extractTicket(request)
        if (ticket === null) {
            this.logger.trace('client disconected, invalid ticket', ticket)
            return socket.close(4001)
        }
        try {
            actorId = await this.transportLayer.authorize(ticket)
        } catch (error) {
            this.logger.trace('fail to authenticate:', error.message)
            return socket.close(4001)
        }

        socket.on('message', (data, isBinary) => {
            if (!isBinary) {
                this.logger.trace(`client associated with id=(${actorId}) ticket=(${ticket}) sent non-binary data`)
                socket.close(4002)
            }
            this.transportLayer.send(actorId, data)
        })
        socket.once('close', () => this.transportLayer.leave(actorId))
        this.transportLayer.on('message', actorId, (_, message) => socket.send(message))
        this.transportLayer.on('kick', actorId, () => socket.close(4003))
        this.transportLayer.synchronize(actorId)
    }

    /**
     * @private
     * @param {IncomingMessage} request 
     */
    extractTicket(request) {
        let requestUrl = request.headers.host + request.url
        let url = new URL(requestUrl)
        return url.searchParams.get(this.queryTicketParam) || null
    }

}

export default WebSocketTransport