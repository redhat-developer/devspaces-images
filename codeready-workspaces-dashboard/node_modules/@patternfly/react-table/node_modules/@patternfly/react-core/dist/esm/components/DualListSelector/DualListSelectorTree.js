import { __rest } from "tslib";
import * as React from 'react';
import { css } from '@patternfly/react-styles';
import styles from '@patternfly/react-styles/css/components/DualListSelector/dual-list-selector';
import { DualListSelectorTreeItem } from './DualListSelectorTreeItem';
export const DualListSelectorTree = (_a) => {
    var { data, isChosen, hasBadges = false, isNested = false, defaultAllExpanded = false, parentItem, onOptionSelect, onOptionCheck, selectedOptions = [] } = _a, props = __rest(_a, ["data", "isChosen", "hasBadges", "isNested", "defaultAllExpanded", "parentItem", "onOptionSelect", "onOptionCheck", "selectedOptions"]);
    return (React.createElement("ul", Object.assign({ className: css(styles.dualListSelectorList), role: isNested ? 'group' : 'tree' }, props), data.map(item => (React.createElement(DualListSelectorTreeItem, Object.assign({ key: item.id, text: item.text, id: item.id, isChosen: isChosen, isSelected: selectedOptions.includes(item.id), defaultExpanded: item.defaultExpanded !== undefined ? item.defaultExpanded : defaultAllExpanded, onOptionSelect: onOptionSelect, onOptionCheck: onOptionCheck, isChecked: item.isChecked, checkProps: item.checkProps, hasBadge: item.hasBadge !== undefined ? item.hasBadge : hasBadges, badgeProps: item.badgeProps, parentItem: parentItem, itemData: item }, (item.children && {
        children: (React.createElement(DualListSelectorTree, { isNested: true, data: item.children, parentItem: item, hasBadges: hasBadges, isChosen: isChosen, defaultAllExpanded: defaultAllExpanded, onOptionSelect: onOptionSelect, onOptionCheck: onOptionCheck, selectedOptions: selectedOptions }))
    })))))));
};
DualListSelectorTree.displayName = 'DualListSelectorTree';
//# sourceMappingURL=DualListSelectorTree.js.map