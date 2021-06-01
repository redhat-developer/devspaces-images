(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KUBERNETES_SCHEMA_URL = 'https://raw.githubusercontent.com/instrumenta/kubernetes-json-schema/master/v1.17.0-standalone-strict/all.json';
    exports.JSON_SCHEMASTORE_URL = 'https://www.schemastore.org/api/json/catalog.json';
});
//# sourceMappingURL=schemaUrls.js.map