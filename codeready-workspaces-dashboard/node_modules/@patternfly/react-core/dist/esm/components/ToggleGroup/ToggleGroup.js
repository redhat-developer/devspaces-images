import { __rest } from "tslib";
import * as React from 'react';
import { css } from '@patternfly/react-styles';
import styles from '@patternfly/react-styles/css/components/ToggleGroup/toggle-group';
import ToggleGroupContext from './ToggleGroupContext';
import { Divider } from '../Divider';
export var ToggleGroupVariant;
(function (ToggleGroupVariant) {
    ToggleGroupVariant["default"] = "default";
    ToggleGroupVariant["light"] = "light";
})(ToggleGroupVariant || (ToggleGroupVariant = {}));
export const ToggleGroup = (_a) => {
    var { className, children, variant = ToggleGroupVariant.default, 'aria-label': ariaLabel } = _a, props = __rest(_a, ["className", "children", "variant", 'aria-label']);
    const toggleGroupItemList = [];
    const length = React.Children.count(children);
    React.Children.forEach(children, (child, index) => {
        toggleGroupItemList.push(child);
        const dividerKey = `${index} divider`;
        if (index !== length - 1) {
            toggleGroupItemList.push(React.createElement(Divider, { key: dividerKey, isVertical: true, component: "div" }));
        }
    });
    return (React.createElement(ToggleGroupContext.Provider, { value: { variant } },
        React.createElement("div", Object.assign({ className: css(styles.toggleGroup, className), role: "group", "aria-label": ariaLabel }, props), toggleGroupItemList)));
};
ToggleGroup.displayName = 'ToggleGroup';
//# sourceMappingURL=ToggleGroup.js.map