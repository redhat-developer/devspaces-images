(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(["require", "exports", './a', './b'], factory);
    }
})(function (require, exports) {
    "use strict";
    var a_1 = require('./a');
    var b_1 = require('./b');
    var hello = a_1.default() + b_1.default();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = hello;
});
//# sourceMappingURL=umd.js.map