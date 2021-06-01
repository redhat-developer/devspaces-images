"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelectColumn = exports.RowSelectVariant = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
var RowSelectVariant;
(function (RowSelectVariant) {
    RowSelectVariant["radio"] = "radio";
    RowSelectVariant["checkbox"] = "checkbox";
})(RowSelectVariant = exports.RowSelectVariant || (exports.RowSelectVariant = {}));
exports.SelectColumn = (_a) => {
    var { children = null, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    className, onSelect = null, selectVariant } = _a, props = tslib_1.__rest(_a, ["children", "className", "onSelect", "selectVariant"]);
    return (React.createElement(React.Fragment, null,
        React.createElement("input", Object.assign({}, props, { type: selectVariant, onChange: onSelect })),
        children));
};
exports.SelectColumn.displayName = 'SelectColumn';
//# sourceMappingURL=SelectColumn.js.map