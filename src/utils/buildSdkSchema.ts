import {writeFile} from 'node:fs/promises';
import {dirname, relative, posix, sep} from 'node:path';
import type {SdkMap} from '../types/SdkMap';
import type {SchemaMap} from '../types/SchemaMap';
import type {Params} from '../types/Params';
import {getPath} from './getPath';

type ImportItem = [string, string];

function toTitleCase(s: string) {
    return s[0].toUpperCase() + s.slice(1);
}

function compareImports([, locationA]: ImportItem, [, locationB]: ImportItem) {
    if (locationA === locationB)
        return 0;
    return locationA < locationB ? -1 : 1;
}

function getRelativePath(path: string, params: Params) {
    let outputDir = dirname(getPath(params.output, params));
    let relativePath = posix.join(
        ...relative(outputDir, getPath(path, params)).split(sep),
    );

    if (!relativePath.startsWith('.'))
        relativePath = `./${relativePath}`;

    return relativePath;
}

export async function buildSdkSchema(
    sdkMap: SdkMap,
    schemaMap: SchemaMap,
    params: Params,
) {
    let path = getPath(params.output, params);
    let tabSize = params.tab;

    let reqsrvImports = ['ResBody', 'ResShape'];
    let sdkMapValues = Object.values(sdkMap);

    if (sdkMapValues.some(([, mode]) => mode === 'query'))
        reqsrvImports.push('ReqQuery');

    if (sdkMapValues.some(([, mode]) => mode === 'full'))
        reqsrvImports.push('ReqShape');

    let depImports: ImportItem[] = [
        [`type {${reqsrvImports.sort().join(', ')}}`, 'reqsrv'],
    ];

    let methodTypesDir = getRelativePath(params.methods, params);
    let localImports: ImportItem[] = Object.values(schemaMap)
        .map(s => [`type {${s}}`, `${methodTypesDir}/${s}`]);

    let extraLines: string[] = [];

    if (params.error) {
        let errorPath = getRelativePath(params.error, params)
            .replace(/\.[jt]sx?$/, '');

        localImports.push(['type {Error as ErrorShape}', errorPath]);
        extraLines.push(`export type ${params.ns}Error = ErrorShape;`);
    }

    let allImports = [
        ...depImports.sort(compareImports),
        ...localImports.sort(compareImports),
    ];

    let t = allImports
        .map(([target, location]) => `import ${target} from '${location}';`)
        .join('\n');

    let tree: Record<string, unknown> = {};
    let rootNs = [
        params.nsin ?? `${params.ns}In`,
        params.nsout ?? `${params.ns}Out`,
        params.nsres ?? `${params.ns}Response`,
    ];

    for (let i = 0; i < rootNs.length; i++) {
        for (let [key, [method, mode]] of Object.entries(sdkMap)) {
            let splitKey = key.split('.').map(toTitleCase);
            let p: Record<string, unknown> = tree;

            while (splitKey.length > 1) {
                let nsKey = `export namespace ${splitKey.shift()}`;

                if (!p[nsKey])
                    p[nsKey] = {};

                p = p[nsKey] as Record<string, unknown>;
            }

            let methodType = schemaMap[method];
            let type = 'never';

            switch (i) {
                case 0:
                    type = mode === 'query'
                        ? `ReqQuery<${methodType}>`
                        : `ReqShape<${methodType}>`;
                    break;
                case 1:
                    type = `ResBody<${methodType}>`;
                    break;
                case 2:
                    type = `ResShape<${methodType}>`;
                    break;
            }

            p[`export type ${splitKey[0]}`] = `${type};`;
        }

        let nsContent = JSON.stringify(tree, null, tabSize)
            .replace(/^(\s+)"/mg, '$1')
            .replace(/": "/g, ' = ')
            .replace(/": \{/g, ' {')
            .replace(/",?$/mg, '')
            .replace(/\},$/mg, '}')
            .replace(/\}(\s+export (type|namespace) )/g, '}\n$1')
            .replace(/;(\s+export namespace )/g, ';\n$1');

        t += `\n\nexport namespace ${rootNs[i]} ${nsContent}`;
    }

    if (extraLines.length)
        t += '\n\n' + extraLines.join('\n');

    await writeFile(path, t + '\n');
}
