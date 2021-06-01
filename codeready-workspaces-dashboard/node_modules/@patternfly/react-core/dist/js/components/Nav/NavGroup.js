"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NavGroup = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const nav_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/Nav/nav"));
const react_styles_1 = require("@patternfly/react-styles");
const util_1 = require("../../helpers/util");
exports.NavGroup = (_a) => {
    var { title, children = null, className = '', id = util_1.getUniqueId() } = _a, props = tslib_1.__rest(_a, ["title", "children", "className", "id"]);
    return (React.createElement("section", Object.assign({ className: react_styles_1.css(nav_1.default.navSection, className), "aria-labelledby": id }, props),
        React.createElement("h2", { className: react_styles_1.css(nav_1.default.navSectionTitle), id: id }, title),
        React.createElement("ul", null, children)));
};
exports.NavGroup.displayName = 'NavGroup';
//# sourceMappingURL=NavGroup.js.map