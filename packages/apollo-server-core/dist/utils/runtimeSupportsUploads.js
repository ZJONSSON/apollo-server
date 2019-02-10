"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const runtimeSupportsUploads = (() => {
    if (process &&
        process.release &&
        process.release.name === 'node' &&
        process.versions &&
        typeof process.versions.node === 'string') {
        const [nodeMajor, nodeMinor] = process.versions.node
            .split('.', 2)
            .map(segment => parseInt(segment, 10));
        if (nodeMajor < 8 || (nodeMajor === 8 && nodeMinor < 5)) {
            return false;
        }
        return true;
    }
    return false;
})();
exports.default = runtimeSupportsUploads;
//# sourceMappingURL=runtimeSupportsUploads.js.map