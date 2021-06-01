"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tr = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const react_core_1 = require("@patternfly/react-core");
const table_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/Table/table"));
const inline_edit_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/InlineEdit/inline-edit"));
const react_styles_1 = require("@patternfly/react-styles");
const TrBase = (_a) => {
    var { children, className, isExpanded, isEditable, isHidden = false, innerRef, ouiaId, ouiaSafe = true } = _a, props = tslib_1.__rest(_a, ["children", "className", "isExpanded", "isEditable", "isHidden", "innerRef", "ouiaId", "ouiaSafe"]);
    const ouiaProps = react_core_1.useOUIAProps('TableRow', ouiaId, ouiaSafe);
    return (React.createElement("tr", Object.assign({ className: react_styles_1.css(className, isExpanded !== undefined && table_1.default.tableExpandableRow, isExpanded && table_1.default.modifiers.expanded, isEditable && inline_edit_1.default.modifiers.inlineEditable), hidden: isHidden || (isExpanded !== undefined && !isExpanded), ref: innerRef }, ouiaProps, props), children));
};
exports.Tr = React.forwardRef((props, ref) => (React.createElement(TrBase, Object.assign({}, props, { innerRef: ref }))));
exports.Tr.displayName = 'Tr';
//# sourceMappingURL=Tr.js.map