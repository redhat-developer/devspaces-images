"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextContent = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const content_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/Content/content"));
const react_styles_1 = require("@patternfly/react-styles");
exports.TextContent = (_a) => {
    var { children = null, className = '' } = _a, props = tslib_1.__rest(_a, ["children", "className"]);
    return (React.createElement("div", Object.assign({}, props, { className: react_styles_1.css(content_1.default.content, className) }), children));
};
exports.TextContent.displayName = 'TextContent';
//# sourceMappingURL=TextContent.js.map