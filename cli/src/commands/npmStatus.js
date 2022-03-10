import { Command } from 'commander'
import { Logger } from '@rivalis/utils'
import { getNpmWorkspaces, getPublishedVersion, isNpmPackage } from '../utils/npm'
import { createFile, getPath } from '../utils/essentials'
import semver from 'semver'

const npmStatus = new Command('status')

const logger = Logger.getLogger('npm/status')

npmStatus.option('-d --debug', 'show package changes')
    .option('-t --tag [tag]', 'set scanning tag, default: latest')
    .option('-f --file [file]', 'set file output name')
    .argument('[path]', 'root project location on file system').action(rootPath => {
    const { debug, tag = 'latest', file = null } = npmStatus.opts()
    if (debug) {
        Logger.setLevel(Logger.LEVEL.TRACE)
        logger.trace('debug logging enabled')
    }

    let execPath = getPath(rootPath)

    if (!isNpmPackage(execPath)) {
        console.log('❌ works only with NPM projects')
        return
    }

    let workspaces = getNpmWorkspaces(execPath)
    let candidates = []
    for (let workspace of workspaces) {
        let publishedVersion = getPublishedVersion(workspace.name, tag) || '0.0.0'
        if (semver.gt(workspace.version, publishedVersion)) {
            console.log(`📦 ${workspace.name}@${tag} (${publishedVersion}) -> (${workspace.version})`)
            candidates.push(workspace.name)
        }
    }

    if (file !== null) {
        let filePath = getPath(file)
        createFile('', filePath, JSON.stringify(candidates))
    }
    
})

export default npmStatus