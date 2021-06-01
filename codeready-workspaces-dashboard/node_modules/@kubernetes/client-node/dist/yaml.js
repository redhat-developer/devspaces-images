"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dumpYaml = exports.loadAllYaml = exports.loadYaml = void 0;
const yaml = require("js-yaml");
function loadYaml(data, opts) {
    return yaml.safeLoad(data, opts);
}
exports.loadYaml = loadYaml;
function loadAllYaml(data, opts) {
    return yaml.safeLoadAll(data, undefined, opts);
}
exports.loadAllYaml = loadAllYaml;
function dumpYaml(object, opts) {
    return yaml.safeDump(object, opts);
}
exports.dumpYaml = dumpYaml;
//# sourceMappingURL=yaml.js.map