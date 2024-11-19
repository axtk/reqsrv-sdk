import {readFile} from 'node:fs/promises';
import type {AssignMode} from '../types/AssignMode';
import type {Params} from '../types/Params';
import type {SdkMap} from '../types/SdkMap';
import {getPath} from './getPath';
import {indexOf} from './indexOf';

function parseReturnedObject(s: string, map: SdkMap): void {
    let k0 = indexOf(s, ['export function', 'return', '{']);
    let k1 = s.indexOf('};', k0);

    if (k0 === -1 || k1 === -1)
        return;

    let prefix: string[] = [];
    let nextLeaves = false;
    let skippedSection = false;
    let mode: AssignMode = 'full';

    for (let t of s.slice(k0, k1).split(/\r?\n/)) {
        t = t.trim();

        if (!t)
            continue;

        if (/^\/\*\*\s*namespace\s+\./.test(t)) {
            // sections under the namespace comments are
            // parsed by `parseMarkedDefinitions()`
            skippedSection = true;
        }
        else if (t.includes(':') && !skippedSection) {
            let [key, value] = t.split(/:\s+/);

            key = key.trim().replace(/(^['"]|['"]$)/g, '');

            if (value === '{')
                prefix.push(key);
            else if (/^\w+\.assignQuery\s*\(/.test(value)) {
                prefix.push(key);
                nextLeaves = true;
                mode = 'query';
            }
            else if (/^\w+\.assign\s*\(/.test(value)) {
                prefix.push(key);
                nextLeaves = true;
                mode = 'full';
            }
            else if (/^'[^']+',?$/.test(value) && nextLeaves)
                map[[...prefix, key].join('.')] = [
                    value.slice(1).replace(/',?$/, ''),
                    mode,
                ];
        }
        else if (/^\.\.\.\w+\.assignQuery\s*\(/.test(t)) {
            nextLeaves = true;
            mode = 'query';
        }
        else if (/^\.\.\.\w+\.assign\s*\(/.test(t)) {
            nextLeaves = true;
            mode = 'full';
        }
        else if (t.startsWith('}')) {
            nextLeaves = false;
            skippedSection = false;
            prefix.pop();
        }
    }
}

function parseMarkedDefinitions(s: string, map: SdkMap): void {
    let nsRegExp = /\/\*\*\s*namespace\s+\.(\S+)?(\s+(\((query)\))?)\s*\*\//g;
    let nsMatches: RegExpExecArray | null;

    while ((nsMatches = nsRegExp.exec(s)) !== null) {
        let prefix = nsMatches[1] ? `${nsMatches[1]}.` : '';
        let mode = nsMatches[4] as AssignMode | undefined;

        let k0 = s.indexOf('{', nsMatches.index);
        let k1 = s.indexOf('}', k0);

        if (k0 === -1 || k1 === -1)
            continue;

        if (/\bassignQuery\s*\(/.test(s.slice(nsMatches.index, k0)))
            mode = 'query';

        for (let t of s.slice(k0, k1).split(/\r?\n/)) {
            t = t.trim();

            if (!t.includes(':'))
                continue;

            let [key, value] = t.split(/:\s+/);

            key = key.trim().replace(/(^['"]|['"]$)/g, '');
            value = value.trim().replace(/(^['"]|['"],?$)/g, '');

            map[prefix + key] = [value, mode ?? 'full'];
        }
    }
}

export async function parseSdk(params: Params): Promise<SdkMap> {
    let path = getPath(params.sdk, params);
    let s = (await readFile(path)).toString();

    let map: SdkMap = {};

    parseMarkedDefinitions(s, map);
    parseReturnedObject(s, map);

    return map;
}
