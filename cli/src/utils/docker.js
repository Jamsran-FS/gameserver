import fs from 'fs'
import path from 'path'
import axios from 'axios'

const fetch = axios.create()

/**
 * 
 * @param {string} modulePath
 */
const hasDockerFile = (modulePath) => {

    let filePath = path.join(modulePath, 'Dockerfile')
    return fs.existsSync(filePath)

}

/**
 * 
 * @param {string} repositoryName 
 */
const getDockerImageTags = async (repositoryName) => {
    let promise = fetch({
        method: 'GET',
        url: `https://registry.hub.docker.com/v1/repositories/${repositoryName}/tags`
    })
    let list = []
    try {
        const { data } = await promise
        data.forEach(( { layer, name } ) => {
            list.push(name)
        })
    } catch (error) {
        return list
    }
    return list
}

export { hasDockerFile, getDockerImageTags }