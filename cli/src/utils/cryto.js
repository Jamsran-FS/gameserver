import crypto from 'crypto'

const generateKeyPair = () => {
    let pair = crypto.generateKeyPairSync('rsa', {
        modulusLength: 4096,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    })
    return pair
}

export { generateKeyPair }