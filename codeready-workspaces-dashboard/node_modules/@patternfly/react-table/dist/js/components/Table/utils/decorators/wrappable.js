"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wrappable = exports.truncate = exports.nowrap = exports.fitContent = exports.breakWord = void 0;
const tslib_1 = require("tslib");
const table_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/Table/table"));
exports.breakWord = () => ({
    className: table_1.default.modifiers.breakWord
});
exports.fitContent = () => ({
    className: table_1.default.modifiers.fitContent
});
exports.nowrap = () => ({
    className: table_1.default.modifiers.nowrap
});
exports.truncate = () => ({
    className: table_1.default.modifiers.truncate
});
exports.wrappable = () => ({
    className: table_1.default.modifiers.wrap
});
//# sourceMappingURL=wrappable.js.map