#!/usr/bin/env node

import { Logger } from '@rivalis/utils'
import { Command } from 'commander'
import dockerStatus from './commands/dockerStatus'
import npmPublish from './commands/npmPublish'
import npmRelease from './commands/npmRelease'
import npmStatus from './commands/npmStatus'
import projectBuild from './commands/projectBuild'
import projectInit from './commands/projectInit'
import projectStart from './commands/projectStart'

const cli = new Command()

Logger.setLevel(Logger.LEVEL.INFO)
const logger = Logger.getLogger('rivalis/cli')



cli.version('1.5.11', '-v --version')

// register commands
const npm = new Command('npm')
npm.addCommand(npmPublish)
npm.addCommand(npmRelease)
npm.addCommand(npmStatus)

const docker = new Command('docker')
docker.addCommand(dockerStatus)

const project = new Command('project')
project.addCommand(projectStart)
project.addCommand(projectBuild)

cli.addCommand(npm)
cli.addCommand(docker)
cli.addCommand(project)

cli.addCommand(projectInit)

try {
    cli.parse(process.argv)
} catch (error) {
    logger.error('cli error:', error.message)
}