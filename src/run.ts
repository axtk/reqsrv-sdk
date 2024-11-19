#!/usr/bin/env node
import {parseArgs} from 'args-json';
import {defaultParams} from './const/defaultParams';
import type {Params} from './types/Params';
import {parseSdk} from './utils/parseSdk';
import {parseSchema} from './utils/parseSchema';
import {buildSdkSchema} from './utils/buildSdkSchema';

async function run() {
    let params = {
        ...defaultParams,
        ...parseArgs<Params>(process.argv.slice(2)),
    };

    let [sdkMap, schemaMap] = await Promise.all([
        parseSdk(params),
        parseSchema(params),
    ]);

    await buildSdkSchema(sdkMap, schemaMap, params);
}

(async () => {
    await run();
})();
