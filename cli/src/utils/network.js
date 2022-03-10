import net from 'net'

const isPortFree = (port) => {
    return new Promise((resolve, reject) => {
        let tcpServer = net.createServer()
        tcpServer.once('error', error => {
            if (error.code === 'EADDRINUSE') {
                resolve(false)
            }
        })
        tcpServer.once('listening', () => {
            tcpServer.close()
            resolve(true)
        })
        tcpServer.listen(port)
    })
}

export { isPortFree }