import {join} from 'node:path'
import type {Params} from '../types/Params';

export function getPath(path = '', params: Params) {
    let targetDir = process.argv[2] ?? params.target ?? '.';

    return join(process.cwd(), targetDir, path);
}
