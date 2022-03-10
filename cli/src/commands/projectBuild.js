import { Command } from 'commander'
import { exec } from 'child_process'
import ora from 'ora'
import { generateBuildCMD } from '../utils/projectCmds'
const projectBuild = new Command('build')


projectBuild.action(async () => {

    const spinner = ora('creating production build...')
    spinner.start()
    exec(generateBuildCMD(), error => {
        if (error) {
            spinner.fail(error.message)
        } else {
            spinner.succeed('Build completed successfully.')
        }
    })
})


export default projectBuild