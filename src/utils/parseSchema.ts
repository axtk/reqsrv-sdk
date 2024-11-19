import {readFile} from 'node:fs/promises';
import type {Params} from '../types/Params';
import type {SchemaMap} from '../types/SchemaMap';
import {getPath} from './getPath';

export async function parseSchema(params: Params): Promise<SchemaMap> {
    let path = getPath(params.schema, params);
    let s = (await readFile(path)).toString();

    let startString = ' Schema<{';

    let k0 = s.indexOf(startString);
    let k1 = s.indexOf('}>', k0);

    s = s.slice(k0 + startString.length, k1);

    let map: SchemaMap = {};

    for (let t of s.split(/\r?\n/)) {
        t = t.trim();

        if (!t)
            continue;

        let [key, value] = t.split(/:\s+/);

        if (!key || !value)
            continue;

        if (/^['"]/.test(key))
            key = key.slice(1, -1);

        map[key] = value.replace(/[,;]$/, '');
    }

    return map;
}
