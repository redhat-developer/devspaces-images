"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardTitle = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const react_styles_1 = require("@patternfly/react-styles");
const card_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/Card/card"));
exports.CardTitle = (_a) => {
    var { children = null, className = '', component = 'div' } = _a, props = tslib_1.__rest(_a, ["children", "className", "component"]);
    const Component = component;
    return (React.createElement(Component, Object.assign({ className: react_styles_1.css(card_1.default.cardTitle, className) }, props), children));
};
exports.CardTitle.displayName = 'CardTitle';
//# sourceMappingURL=CardTitle.js.map