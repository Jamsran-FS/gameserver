import { Command } from 'commander'
import { Logger } from '@rivalis/utils'
import { changePackageTag, getNpmWorkspaces, getPublishedVersions, isNpmPackage } from '../utils/npm'
import { getPath } from '../utils/essentials'
import semver from 'semver'

const npmRelease = new Command('release')

const logger = Logger.getLogger('npm/release')

npmRelease.option('-d --debug', 'show debug logs')
    .option('-t --tag [tag]', 'set publishing tag, default: latest')
    .option('-s --source [tag]', 'set source tag, default: latest')
    .argument('[path]', 'root project location on file system').action(rootPath => {
    const { debug, tag = 'latest', source = 'latest' } = npmRelease.opts()
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

    if (tag === source) {
        logger.error('desired tag (-t) and source tag (-t) can not be with same value!')
        return
    }

    let candidates = []

    for (let workspace of workspaces) {
        let versions = getPublishedVersions(workspace.name)
        if (!versions[source]) {
            logger.warning(`[SKIP] ${workspace.name} is not tagged with ${source}`)
            continue
        }

        let latestRelease = versions[tag] || '0.0.0'
        if (semver.gte(latestRelease, versions[source])) {
            continue
        }

        candidates.push({
            name: workspace.name,
            version: versions[source]
        })
    }

    for (let { name, version } of candidates) {
        logger.info(`${name}: ${source}:${version} -> ${tag}:${version} `)
        let succeed = changePackageTag(name, version, tag)
        if (!succeed) {
            logger.error(`${name}@${version} tagging ${tag} failed`)
        }
    }
})

export default npmRelease