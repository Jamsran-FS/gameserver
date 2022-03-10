import { Command } from 'commander'
import { Logger } from '@rivalis/utils'
import { execPublishWorkspace, getNpmWorkspaces, getPublishedVersion, isNpmPackage } from '../utils/npm'
import { getPath } from '../utils/essentials'
import semver from 'semver'

const npmPublish = new Command('publish')

const logger = Logger.getLogger('npm/publish')

npmPublish.option('-d --debug', 'show debug logs')
    .option('-t --tag [tag]', 'set publishing tag, default: latest')
    .argument('[path]', 'root project location on file system').action(rootPath => {
    const { debug, tag = 'latest' } = npmPublish.opts()
    if (debug) {
        Logger.setLevel(Logger.LEVEL.TRACE)
        logger.trace('debug logging enabled')
    }

    let execPath = getPath(rootPath)

    if (!isNpmPackage(execPath)) {
        logger.error(`works only with npm projects!`)
        return
    }

    let workspaces = getNpmWorkspaces(execPath)
    let candidates = []
    for (let workspace of workspaces) {
        let publishedVersion = getPublishedVersion(workspace.name, tag) || '0.0.0'
        if (semver.gt(workspace.version, publishedVersion)) {
            logger.info(`${workspace.name}@${tag}: ${workspace.version} -> ${publishedVersion}`)
            candidates.push(workspace.name)
        }
    }

    if (candidates.length === 0) {
        logger.info('no publishing candidates!')
    }

    for (let candidate of candidates) {
        let succeed = execPublishWorkspace(candidate, tag)
        if (!succeed) {
            logger.info(`${candidate}@${tag} publish failed!`)
        }
    }

    
})

export default npmPublish