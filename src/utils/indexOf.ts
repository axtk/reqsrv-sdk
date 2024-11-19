export function indexOf(s: string, refs: string[]) {
    let k = -1;

    for (let ref of refs) {
        k = s.indexOf(ref, k);

        if (k === -1)
            break;
    }

    return k;
}
