"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableHeader = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const base_1 = require("./base");
const TableContext_1 = require("./TableContext");
const ContextHeader = (_a) => {
    var { className = '', headerRows = undefined } = _a, props = tslib_1.__rest(_a, ["className", "headerRows"]);
    return React.createElement(base_1.Header, Object.assign({}, props, { headerRows: headerRows, className: className }));
};
exports.TableHeader = (_a) => {
    var props = tslib_1.__rest(_a, []);
    return (React.createElement(TableContext_1.TableContext.Consumer, null, ({ headerRows }) => React.createElement(ContextHeader, Object.assign({}, props, { headerRows: headerRows }))));
};
exports.TableHeader.displayName = 'TableHeader';
//# sourceMappingURL=Header.js.map