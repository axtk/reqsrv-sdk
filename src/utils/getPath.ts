import {join} from 'node:path'
import type {Params} from '../types/Params';

export function getPath(path = '', params: Params) {
    let targetArg: string | null | undefined = process.argv[2];

    if (!targetArg || targetArg.startsWith('-'))
        targetArg = null;

    let targetDir = params.target ?? targetArg ?? '.';

    return join(process.cwd(), targetDir, path);
}
