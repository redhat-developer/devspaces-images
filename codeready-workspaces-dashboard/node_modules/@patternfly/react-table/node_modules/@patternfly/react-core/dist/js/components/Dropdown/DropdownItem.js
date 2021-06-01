"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DropdownItem = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const InternalDropdownItem_1 = require("./InternalDropdownItem");
const dropdownConstants_1 = require("./dropdownConstants");
const helpers_1 = require("../../helpers");
exports.DropdownItem = (_a) => {
    var { children, className, component = 'a', isDisabled = false, isPlainText = false, isHovered = false, href, tooltip, tooltipProps = {}, listItemClassName, onClick, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ref, // Types of Ref are different for React.FC vs React.Component
    additionalChild, customChild, tabIndex = -1, icon = null, autoFocus, description = null, styleChildren, ouiaId, ouiaSafe } = _a, props = tslib_1.__rest(_a, ["children", "className", "component", "isDisabled", "isPlainText", "isHovered", "href", "tooltip", "tooltipProps", "listItemClassName", "onClick", "ref", "additionalChild", "customChild", "tabIndex", "icon", "autoFocus", "description", "styleChildren", "ouiaId", "ouiaSafe"]);
    const ouiaProps = helpers_1.useOUIAProps(exports.DropdownItem.displayName, ouiaId, ouiaSafe);
    return (React.createElement(dropdownConstants_1.DropdownArrowContext.Consumer, null, context => (React.createElement(InternalDropdownItem_1.InternalDropdownItem, Object.assign({ context: context, role: "menuitem", tabIndex: tabIndex, className: className, component: component, isDisabled: isDisabled, isPlainText: isPlainText, isHovered: isHovered, href: href, tooltip: tooltip, tooltipProps: tooltipProps, listItemClassName: listItemClassName, onClick: onClick, additionalChild: additionalChild, customChild: customChild, icon: icon, autoFocus: autoFocus, styleChildren: styleChildren, description: description }, ouiaProps, props), children))));
};
exports.DropdownItem.displayName = 'DropdownItem';
//# sourceMappingURL=DropdownItem.js.map