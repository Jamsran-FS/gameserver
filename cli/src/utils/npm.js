import path from 'path'
import fs from 'fs'
import { execSync as exec } from 'child_process'

/**
 * @typedef Workspace
 * @property {string} id
 * @property {string} name
 * @property {string} version
 * @property {string} directory
 */

const getPackageJson = (dirPath) => {
    const location = path.join(dirPath, 'package.json')
    try {
        let packageJson =  fs.readFileSync(location).toString()
        return JSON.parse(packageJson)
    } catch (error) {
        return null
    }
}

const isNpmPackage = (dirPath) => {
    return getPackageJson(dirPath) !== null
}

/**
 * 
 * @param {string} dirPath 
 * @returns {Array<Workspace>}
 */
const getNpmWorkspaces = (dirPath) => {
    let packageJson = getPackageJson(dirPath)
    if (packageJson === null) {
        return []
    }
    const { workspaces = null } = packageJson
    if (workspaces === null) {
        return []
    }
    
    let workspaceList = []
    for (let workspacePath of workspaces) {
        const fullPath = path.join(dirPath, workspacePath)
        const packageJson = getPackageJson(fullPath)
        if (packageJson === null) {
            continue
        }
        const { name, version, private : privateRepo = false } = packageJson
        if (privateRepo) {
            continue
        }
        let dirList = fullPath.split(path.sep).filter(path => path !== '')
        let id = dirList[dirList.length - 1]
        workspaceList.push({ id, name, version, directory: fullPath })
    }
    return workspaceList
}

const getPublishedVersions = (packageName) => {
    try {
        let versions = exec(`npm dist-tag ls ${packageName}`, { encoding: 'utf-8', windowsHide: true, stdio: [ 'pipe', 'pipe', 'ignore' ] }) || ''
        let lines = versions.split('\n')
        let map = {}
        for (let line of lines) {
            if (line.length === 0) {
                continue
            }
            const [tag, version] = line.split(': ')
            map[tag] = version
        }
        return map
    } catch (error) {
        return {}
    }
}

const getPublishedVersion = (packageName, desiredTag) => {
    let versions = getPublishedVersions(packageName)
    return versions[desiredTag] || null
}

const execPublishWorkspace = (packageName, tag) => {
    try {
        exec(`npm publish -w ${packageName} --tag ${tag}`, { encoding: 'utf-8', windowsHide: true, stdio: [ 'pipe', 'pipe', 'ignore' ] })
        return true
    } catch (error) {
        return false
    }
}

const changePackageTag = (packageName, version, tag) => {
    try {
        exec(`npm dist-tag add ${packageName}@${version} ${tag}`, { encoding: 'utf-8', windowsHide: true, stdio: [ 'pipe', 'pipe', 'ignore' ] })
        return true
    } catch (error) {
        return false
    }
}

/**
 * 
 * @param {string} projectPath 
 * @returns {boolean}
 */
const installDependencies = (projectPath) => {
    try {
        exec('npm install', { cwd:projectPath ,encoding: 'utf-8', windowsHide: true, stdio: [ 'pipe', 'pipe', 'ignore' ] })
        return true
    } catch (error) {
        return false
    }
}


export { 
    getPackageJson,
    isNpmPackage,
    getNpmWorkspaces,
    getPublishedVersions,
    getPublishedVersion,
    execPublishWorkspace,
    changePackageTag,
    installDependencies
}