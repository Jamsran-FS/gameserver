import { Command } from 'commander'
import { Logger } from '@rivalis/utils'
import { getNpmWorkspaces, getPublishedVersion, isNpmPackage } from '../utils/npm'
import { createFile, getPath } from '../utils/essentials'
import semver from 'semver'
import { getDockerImageTags, hasDockerFile } from '../utils/docker'

const dockerStatus = new Command('status')

const logger = Logger.getLogger('npm/status')

dockerStatus
    .option('-f --file [file]', 'set file output name')
    .option('-o --org [org]', 'set file output name')
    .argument('[path]', 'root project location on file system').action(async rootPath => {
    const { file = null, org = null } = dockerStatus.opts()
    let execPath = getPath(rootPath)
    
    let candidates = []

    let workspaces = getNpmWorkspaces(execPath)
    for (let workspace of workspaces) {
        if (!hasDockerFile(workspace.directory)) {
            continue
        }
        let repoId = org !== null ? `${org}/${workspace.id}` : workspace.id
        let tags = await getDockerImageTags(repoId)
        if (!tags.includes(workspace.version)) {
            candidates.push(`${workspace.id}:${workspace.version}`)
        }
    }

    if (file !== null) {
        let filePath = getPath(file)
        createFile('', filePath, JSON.stringify(candidates))
    }

})

export default dockerStatus