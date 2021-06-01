"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardActions = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const react_styles_1 = require("@patternfly/react-styles");
const card_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/Card/card"));
exports.CardActions = (_a) => {
    var { children = null, className = '' } = _a, props = tslib_1.__rest(_a, ["children", "className"]);
    return (React.createElement("div", Object.assign({ className: react_styles_1.css(card_1.default.cardActions, className) }, props), children));
};
exports.CardActions.displayName = 'CardActions';
//# sourceMappingURL=CardActions.js.map