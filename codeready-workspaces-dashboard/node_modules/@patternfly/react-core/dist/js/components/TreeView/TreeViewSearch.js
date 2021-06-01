"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeViewSearch = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const react_styles_1 = require("@patternfly/react-styles");
const tree_view_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/TreeView/tree-view"));
const form_control_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/FormControl/form-control"));
exports.TreeViewSearch = (_a) => {
    var props = tslib_1.__rest(_a, []);
    return (React.createElement("div", { className: react_styles_1.css(tree_view_1.default.treeViewSearch) },
        React.createElement("input", Object.assign({ className: react_styles_1.css(form_control_1.default.formControl, form_control_1.default.modifiers.search), type: "search" }, props))));
};
exports.TreeViewSearch.displayName = 'TreeViewSearch';
//# sourceMappingURL=TreeViewSearch.js.map