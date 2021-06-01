"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tbody = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const react_styles_1 = require("@patternfly/react-styles");
const table_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/Table/table"));
const TbodyBase = (_a) => {
    var { children, className, isExpanded, innerRef } = _a, props = tslib_1.__rest(_a, ["children", "className", "isExpanded", "innerRef"]);
    return (React.createElement("tbody", Object.assign({ role: "rowgroup", className: react_styles_1.css(className, isExpanded && table_1.default.modifiers.expanded), ref: innerRef }, props), children));
};
exports.Tbody = React.forwardRef((props, ref) => (React.createElement(TbodyBase, Object.assign({}, props, { innerRef: ref }))));
exports.Tbody.displayName = 'Tbody';
//# sourceMappingURL=Tbody.js.map