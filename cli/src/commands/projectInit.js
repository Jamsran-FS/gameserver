import path from 'path'
import { Command } from 'commander'
import { Logger } from '@rivalis/utils'
import { createDir, createFile, getPath, isDirEmpty } from '../utils/essentials'
import * as templates from '../utils/templates'
import { getPublishedVersion, installDependencies } from '../utils/npm'
import ora from 'ora'

const projectInit = new Command('init')

const logger = Logger.getLogger('init')

/**
 * @callback StepCallback
 * @param {string} name
 */

/**
 * 
 * @param {Array<string>} dependnencyList 
 * @param {StepCallback} stepCallback
 */
const getDependencies = (dependnencyList = [], stepCallback) => {
    let dependencies = {}
    for (let dependency of dependnencyList) {
        stepCallback(dependency)
        const version = getPublishedVersion(dependency, 'latest')
        dependencies[dependency] = `^${version}`
    }
    return dependencies
}

projectInit
    .option('-i --install', 'install npm dependencies after creating, default: disabled')
    .option('-t --template', 'project template, default: basic')
    .argument('[path]', 'root project location on file system').action((rootPath = './') => {

    const { install = false, template = 'basic' } = projectInit.opts()
    
    let projectPath = getPath(rootPath)

    let dirEmpty = isDirEmpty(projectPath)
    if (dirEmpty === false) {
        console.log(`❌ the directory [${projectPath}] is not empty`)
        return
    }

    const spinner = ora('project setup')
    spinner.start()
    if (dirEmpty === null) {
        spinner.text = '❇️ creating the directory...'
        createDir(projectPath)
    }

    const printDependencyLogs = (dependency) => {
        spinner.text = `📦 fetching dependency [${dependency}]`
        spinner.render()
    }

    let dependencies = getDependencies(['@rivalis/boot', '@rivalis/core', '@rivalis/registry', '@rivalis/transports'], printDependencyLogs)
    let devDependencies = getDependencies(['@rivalis/cli', '@rivalis/console', '@babel/cli', '@babel/core', '@babel/node', '@babel/plugin-proposal-class-properties', '@babel/preset-env', 'nodemon'], printDependencyLogs)

    spinner.text = '❇️ creating the project...'
    spinner.render()

    let packageJson = JSON.parse(templates.get('package.json'))
    packageJson.name ='rivalis-app'
    packageJson.dependencies = dependencies
    packageJson.devDependencies = devDependencies
    packageJson.scripts = {
        'start': 'rivalis project start',
        'build': 'rivalis project build'
    }
    packageJson = JSON.stringify(packageJson, null, '\t')

    const sourcePath = path.join(projectPath, 'src')
    const rivalisConfigPath = path.join(projectPath, '.rivalis')

    createFile('.gitignore', projectPath, templates.get('template.gitignore'))
    createFile('babelrc.json', projectPath, templates.get('babelrc.json'))
    createFile('package.json', projectPath, packageJson)
    createDir(rivalisConfigPath)
    templates.clone('basic', sourcePath)

    
    if (install) {
        spinner.text = 'installing dependencies...'
        spinner.color = 'green'
        spinner.render()
        installDependencies(projectPath)
    }

    spinner.succeed('project created!')
    if (!install) {
        console.log('📦 [WARNING] dependencies are not installed')
    }
    const guide = `
    execute:
        - cd ${rootPath}
        ${!install ? '- npm install' : ''}
        - npm start
     `
     console.log(guide)
})

export default projectInit