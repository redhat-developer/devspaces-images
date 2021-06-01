"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DualListSelectorTreeItem = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const dual_list_selector_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/DualListSelector/dual-list-selector"));
const react_styles_1 = require("@patternfly/react-styles");
const Badge_1 = require("../Badge");
const angle_right_icon_1 = tslib_1.__importDefault(require("@patternfly/react-icons/dist/js/icons/angle-right-icon"));
const treeUtils_1 = require("./treeUtils");
class DualListSelectorTreeItem extends React.Component {
    constructor() {
        super(...arguments);
        this.ref = React.createRef();
        this.state = {
            isExpanded: this.props.defaultExpanded || false
        };
    }
    render() {
        const _a = this.props, { onOptionCheck, 
        /* eslint-disable @typescript-eslint/no-unused-vars */
        onOptionSelect, children, className, id, text, isSelected, isChosen, defaultExpanded, hasBadge, isChecked, checkProps, badgeProps, parentItem, itemData } = _a, props = tslib_1.__rest(_a, ["onOptionCheck", "onOptionSelect", "children", "className", "id", "text", "isSelected", "isChosen", "defaultExpanded", "hasBadge", "isChecked", "checkProps", "badgeProps", "parentItem", "itemData"]);
        const { isExpanded } = this.state;
        return (React.createElement("li", Object.assign({ className: react_styles_1.css(dual_list_selector_1.default.dualListSelectorListItem, className, children && dual_list_selector_1.default.modifiers.expandable, isExpanded && dual_list_selector_1.default.modifiers.expanded), id: id }, props, { "aria-selected": isSelected, role: "treeitem" }, (isExpanded && { 'aria-expanded': 'true' })),
            React.createElement("div", { className: react_styles_1.css(dual_list_selector_1.default.dualListSelectorItem, isSelected && dual_list_selector_1.default.modifiers.selected, dual_list_selector_1.default.modifiers.check), ref: this.ref, tabIndex: -1, onClick: evt => {
                    onOptionCheck && onOptionCheck(evt, !isChecked, isChosen, itemData);
                } },
                React.createElement("span", { className: react_styles_1.css(dual_list_selector_1.default.dualListSelectorItemMain) },
                    children && (React.createElement("div", { className: react_styles_1.css(dual_list_selector_1.default.dualListSelectorItemToggle), onClick: e => {
                            if (children) {
                                this.setState({ isExpanded: !this.state.isExpanded });
                            }
                            e.stopPropagation();
                        } },
                        React.createElement("span", { className: react_styles_1.css(dual_list_selector_1.default.dualListSelectorItemToggleIcon) },
                            React.createElement(angle_right_icon_1.default, { "aria-hidden": true })))),
                    React.createElement("span", { className: react_styles_1.css(dual_list_selector_1.default.dualListSelectorItemCheck) },
                        React.createElement("input", Object.assign({ type: "checkbox", onChange: (evt) => onOptionCheck && onOptionCheck(evt, !isChecked, isChosen, itemData), onClick: (evt) => evt.stopPropagation(), ref: elem => elem && (elem.indeterminate = isChecked === null), checked: isChecked || false }, checkProps))),
                    React.createElement("span", { className: react_styles_1.css(dual_list_selector_1.default.dualListSelectorItemText) }, text),
                    hasBadge && children && (React.createElement("span", { className: react_styles_1.css(dual_list_selector_1.default.dualListSelectorItemCount) },
                        React.createElement(Badge_1.Badge, Object.assign({}, badgeProps), treeUtils_1.flattenTree(children.props.data).length))))),
            isExpanded && children));
    }
}
exports.DualListSelectorTreeItem = DualListSelectorTreeItem;
DualListSelectorTreeItem.displayName = 'DualListSelectorTreeItem';
//# sourceMappingURL=DualListSelectorTreeItem.js.map