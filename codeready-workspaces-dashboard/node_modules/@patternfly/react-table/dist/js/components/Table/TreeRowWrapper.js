"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeRowWrapper = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const react_styles_1 = require("@patternfly/react-styles");
const table_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/Table/table"));
const table_tree_view_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/Table/table-tree-view"));
const TableComposable_1 = require("../TableComposable");
exports.TreeRowWrapper = (_a) => {
    var { className, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    rowProps, row } = _a, props = tslib_1.__rest(_a, ["className", "rowProps", "row"]);
    const { 'aria-level': level, 'aria-posinset': posinset, 'aria-setsize': setsize, isExpanded, isDetailsExpanded, isHidden } = row.props;
    return (React.createElement(TableComposable_1.Tr, Object.assign({ "aria-level": level, "aria-posinset": posinset, "aria-setsize": setsize, "aria-expanded": !!isExpanded, isHidden: isHidden, className: react_styles_1.css(className, isExpanded && table_1.default.modifiers.expanded, isDetailsExpanded && table_tree_view_1.default.modifiers.treeViewDetailsExpanded) }, props)));
};
exports.TreeRowWrapper.displayName = 'TreeRowWrapper';
//# sourceMappingURL=TreeRowWrapper.js.map