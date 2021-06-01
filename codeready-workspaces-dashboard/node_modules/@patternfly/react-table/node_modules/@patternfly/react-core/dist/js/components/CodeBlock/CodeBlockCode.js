"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeBlockCode = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const code_block_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/CodeBlock/code-block"));
const react_styles_1 = require("@patternfly/react-styles");
exports.CodeBlockCode = (_a) => {
    var { children = null } = _a, props = tslib_1.__rest(_a, ["children"]);
    return (React.createElement("pre", Object.assign({ className: react_styles_1.css(code_block_1.default.codeBlockPre) }, props),
        React.createElement("code", { className: react_styles_1.css(code_block_1.default.codeBlockCode) }, children)));
};
exports.CodeBlockCode.displayName = 'CodeBlockCode';
//# sourceMappingURL=CodeBlockCode.js.map