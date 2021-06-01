"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpandableRowContent = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const react_styles_1 = require("@patternfly/react-styles");
const table_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/Table/table"));
exports.ExpandableRowContent = (_a) => {
    var { children = null } = _a, props = tslib_1.__rest(_a, ["children"]);
    return (React.createElement("div", Object.assign({}, props, { className: react_styles_1.css(table_1.default.tableExpandableRowContent) }), children));
};
exports.ExpandableRowContent.displayName = 'ExpandableRowContent';
//# sourceMappingURL=ExpandableRowContent.js.map