"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DropdownGroup = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const react_styles_1 = require("@patternfly/react-styles");
const dropdownConstants_1 = require("./dropdownConstants");
exports.DropdownGroup = ({ children = null, className = '', label = '' }) => (React.createElement(dropdownConstants_1.DropdownContext.Consumer, null, ({ sectionClass, sectionTitleClass, sectionComponent }) => {
    const SectionComponent = sectionComponent;
    return (React.createElement(SectionComponent, { className: react_styles_1.css(sectionClass, className) },
        label && (React.createElement("h1", { className: react_styles_1.css(sectionTitleClass), "aria-hidden": true }, label)),
        React.createElement("ul", { role: "none" }, children)));
}));
exports.DropdownGroup.displayName = 'DropdownGroup';
//# sourceMappingURL=DropdownGroup.js.map