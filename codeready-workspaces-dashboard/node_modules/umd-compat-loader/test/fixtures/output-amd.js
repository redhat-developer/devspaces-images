define(["require", "exports", './a', './b'], function (require, exports) {
    "use strict";
    var a_1 = require('./a');
    var b_1 = require('./b');
    var hello = a_1.default() + b_1.default();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = hello;
});