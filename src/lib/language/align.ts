import { normalizeToken } from "./text.ts";

/**
 * Align two word sequences of the same verse from different editions
 * (longest common subsequence on normalized words). Returns, for each
 * index of `target`, the matching index in `source` or null.
 */
export function alignTokens(
    source: readonly string[],
    target: readonly string[],
): (number | null)[] {
    const a = source.map(normalizeToken);
    const b = target.map(normalizeToken);
    const rows = a.length + 1;
    const cols = b.length + 1;
    // lcs[i][j] = LCS length of a[i:] and b[j:]
    const lcs = new Uint16Array(rows * cols);
    for (let i = a.length - 1; i >= 0; i--) {
        for (let j = b.length - 1; j >= 0; j--) {
            lcs[i * cols + j] =
                a[i] && a[i] === b[j]
                    ? lcs[(i + 1) * cols + j + 1] + 1
                    : Math.max(lcs[(i + 1) * cols + j], lcs[i * cols + j + 1]);
        }
    }
    const result: (number | null)[] = new Array(b.length).fill(null);
    let i = 0;
    let j = 0;
    while (i < a.length && j < b.length) {
        if (a[i] && a[i] === b[j]) {
            result[j] = i;
            i++;
            j++;
        } else if (lcs[(i + 1) * cols + j] >= lcs[i * cols + j + 1]) {
            i++;
        } else {
            j++;
        }
    }
    return result;
}
