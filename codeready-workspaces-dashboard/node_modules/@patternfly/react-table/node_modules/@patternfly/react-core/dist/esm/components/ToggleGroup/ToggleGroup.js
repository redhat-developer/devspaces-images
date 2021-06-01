import { __rest } from "tslib";
import * as React from 'react';
import { css } from '@patternfly/react-styles';
import styles from '@patternfly/react-styles/css/components/ToggleGroup/toggle-group';
export const ToggleGroup = (_a) => {
    var { className, children, isCompact = false, 'aria-label': ariaLabel } = _a, props = __rest(_a, ["className", "children", "isCompact", 'aria-label']);
    const toggleGroupItemList = [];
    React.Children.forEach(children, child => {
        toggleGroupItemList.push(child);
    });
    return (React.createElement("div", Object.assign({ className: css(styles.toggleGroup, isCompact && styles.modifiers.compact, className), role: "group", "aria-label": ariaLabel }, props), toggleGroupItemList));
};
ToggleGroup.displayName = 'ToggleGroup';
//# sourceMappingURL=ToggleGroup.js.map