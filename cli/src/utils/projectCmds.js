import { env } from '@rivalis/utils'
import path from 'path'
/**
 * 
 * @param {string} entryPoint 
 * @param {string} watchDir 
 * @param {string} babelConfigFile 
 * @param {Array<string>} nodeOptions 
 * @returns 
 */

let workspacesEnabled = env('CLI_NPM_WORKSPACES', false, 'boolean')

let nodeModulesPath = workspacesEnabled ? '../node_modules/.bin' : './node_modules/.bin'

const generateInstanceCMD = (entryPoint = null, watchDir = null, babelConfigFile = './babelrc.json', nodeOptions = ['--unhandled-rejections=strict']) => {
    let runBabelCMD = `${nodeModulesPath}/babel-node --config-file ${babelConfigFile} ${nodeOptions.join(' ')} ${entryPoint}`
    return `nodemon --deplay 1000ms -q -e js -w ${watchDir} --exec "${runBabelCMD}"`
}

const generateBuildCMD = () => {
    return `${nodeModulesPath}/babel --config-file ./babelrc.json src --out-dir build`
}

export { generateInstanceCMD, generateBuildCMD }