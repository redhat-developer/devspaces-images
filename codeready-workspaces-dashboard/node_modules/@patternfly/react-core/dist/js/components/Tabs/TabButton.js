"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TabButton = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const helpers_1 = require("../../helpers");
exports.TabButton = (_a) => {
    var { children, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    tabContentRef, ouiaId, ouiaSafe } = _a, props = tslib_1.__rest(_a, ["children", "tabContentRef", "ouiaId", "ouiaSafe"]);
    const Component = (props.href ? 'a' : 'button');
    return (React.createElement(Component, Object.assign({}, helpers_1.getOUIAProps(exports.TabButton.displayName, ouiaId, ouiaSafe), props), children));
};
exports.TabButton.displayName = 'TabButton';
//# sourceMappingURL=TabButton.js.map