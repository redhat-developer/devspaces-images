"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageHeaderToolsGroup = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const page_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/Page/page"));
const react_styles_1 = require("@patternfly/react-styles");
const util_1 = require("../../helpers/util");
exports.PageHeaderToolsGroup = (_a) => {
    var { children, className, visibility } = _a, props = tslib_1.__rest(_a, ["children", "className", "visibility"]);
    return (React.createElement("div", Object.assign({ className: react_styles_1.css(page_1.default.pageHeaderToolsGroup, util_1.formatBreakpointMods(visibility, page_1.default), className) }, props), children));
};
exports.PageHeaderToolsGroup.displayName = 'PageHeaderToolsGroup';
//# sourceMappingURL=PageHeaderToolsGroup.js.map