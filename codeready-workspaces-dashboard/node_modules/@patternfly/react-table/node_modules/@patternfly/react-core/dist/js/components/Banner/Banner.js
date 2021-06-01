"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Banner = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const banner_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/Banner/banner"));
const react_styles_1 = require("@patternfly/react-styles");
exports.Banner = ({ children, className, variant = 'default', isSticky = false }) => (React.createElement("div", { className: react_styles_1.css(banner_1.default.banner, banner_1.default.modifiers[variant], isSticky && banner_1.default.modifiers.sticky, className) }, children));
exports.Banner.displayName = 'Banner';
//# sourceMappingURL=Banner.js.map