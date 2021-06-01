"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DualListSelectorTree = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const react_styles_1 = require("@patternfly/react-styles");
const dual_list_selector_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/DualListSelector/dual-list-selector"));
const DualListSelectorTreeItem_1 = require("./DualListSelectorTreeItem");
exports.DualListSelectorTree = (_a) => {
    var { data, isChosen, hasBadges = false, isNested = false, defaultAllExpanded = false, parentItem, onOptionSelect, onOptionCheck, selectedOptions = [] } = _a, props = tslib_1.__rest(_a, ["data", "isChosen", "hasBadges", "isNested", "defaultAllExpanded", "parentItem", "onOptionSelect", "onOptionCheck", "selectedOptions"]);
    return (React.createElement("ul", Object.assign({ className: react_styles_1.css(dual_list_selector_1.default.dualListSelectorList), role: isNested ? 'group' : 'tree' }, props), data.map(item => (React.createElement(DualListSelectorTreeItem_1.DualListSelectorTreeItem, Object.assign({ key: item.id, text: item.text, id: item.id, isChosen: isChosen, isSelected: selectedOptions.includes(item.id), defaultExpanded: item.defaultExpanded !== undefined ? item.defaultExpanded : defaultAllExpanded, onOptionSelect: onOptionSelect, onOptionCheck: onOptionCheck, isChecked: item.isChecked, checkProps: item.checkProps, hasBadge: item.hasBadge !== undefined ? item.hasBadge : hasBadges, badgeProps: item.badgeProps, parentItem: parentItem, itemData: item }, (item.children && {
        children: (React.createElement(exports.DualListSelectorTree, { isNested: true, data: item.children, parentItem: item, hasBadges: hasBadges, isChosen: isChosen, defaultAllExpanded: defaultAllExpanded, onOptionSelect: onOptionSelect, onOptionCheck: onOptionCheck, selectedOptions: selectedOptions }))
    })))))));
};
exports.DualListSelectorTree.displayName = 'DualListSelectorTree';
//# sourceMappingURL=DualListSelectorTree.js.map