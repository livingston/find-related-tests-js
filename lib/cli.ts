import yargs from 'yargs';
import fs from 'fs';
import log from 'loglevel';

import { FindRelatedFiles } from "./index";
import {strict} from "assert";

export function getChangedFilesFromStream(config: any) {
    return new Promise<Set<string>>((resolve, reject) => {
        const stdin = process.stdin;
        let data: string = '';
        let changeSet: Set<string> = new Set();

        stdin.setEncoding('utf8');
        stdin.on('data', function (chunk) {
            data += chunk;
        });

        stdin.on('end', function () {
            console.log(data);
            for (let temp of data.toString().split("\n")) {
                if (config.gitIncludeFilter(temp)) {
                    changeSet.add(config.gitRoot + '/' + temp);
                }
            }
            resolve(changeSet);
        });

        stdin.on('error', reject);
    });
}

console.log('Searching for related test files..');

export async function Run(config: any) {
    log.info("Project directory: ", process.cwd());
    if (process.stdin.isTTY) {
        log.info('No stdin');
    } else {
        log.info("Reading input stream..");
        await getChangedFilesFromStream(config).then((changeSet) => {
            log.info("\n\nModified Candidates..");
            log.info(changeSet);
            log.info("\n\n");

            log.info("Entry point file: ", config.entryPoint);
            log.info("Search Dir: ", config.searchDir);
            const res: any = FindRelatedFiles(config.entryPoint, config.searchDir, changeSet, config);
            log.info("\nTest Candidates..");
            log.info(res);
            log.info("\n\n");
        });
    }
}

function getConfig() {
    const argv = yargs.options({
        configPath: {type: "string", demandOption: true},
    }).argv;

    log.debug("Config file path: ", argv.configPath);

    let config: any;
    if (fs.existsSync(argv.configPath)) {
        log.debug('Config file exists');
        config = require(argv.configPath);
        log.debug("Config Object: ", config);
    } else {
        log.error('Config file does not exists or wrong path: ', argv.configPath);
    }

    return config;
}

log.setDefaultLevel('info');
Run(getConfig());