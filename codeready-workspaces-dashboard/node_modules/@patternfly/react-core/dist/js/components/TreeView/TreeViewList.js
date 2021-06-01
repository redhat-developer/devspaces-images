"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeViewList = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const react_styles_1 = require("@patternfly/react-styles");
const TreeViewSearch_1 = require("./TreeViewSearch");
const Divider_1 = require("../Divider");
exports.TreeViewList = (_a) => {
    var { isNested = false, onSearch, searchProps, children } = _a, props = tslib_1.__rest(_a, ["isNested", "onSearch", "searchProps", "children"]);
    return (React.createElement(React.Fragment, null,
        onSearch && (React.createElement(React.Fragment, null,
            React.createElement(TreeViewSearch_1.TreeViewSearch, Object.assign({ onChange: onSearch }, searchProps)),
            React.createElement(Divider_1.Divider, null))),
        React.createElement("ul", Object.assign({ className: react_styles_1.css('pf-c-tree-view__list'), role: isNested ? 'group' : 'tree' }, props), children)));
};
exports.TreeViewList.displayName = 'TreeViewList';
//# sourceMappingURL=TreeViewList.js.map