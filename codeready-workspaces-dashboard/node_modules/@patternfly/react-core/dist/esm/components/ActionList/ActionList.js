import { __rest } from "tslib";
import * as React from 'react';
import { css } from '@patternfly/react-styles';
import styles from '@patternfly/react-styles/css/components/ActionList/action-list';
export const ActionList = (_a) => {
    var { children, isIconList } = _a, props = __rest(_a, ["children", "isIconList"]);
    return (React.createElement("div", Object.assign({ className: css(styles.actionList, isIconList && styles.modifiers.icons) }, props), children));
};
ActionList.displayName = 'ActionList';
//# sourceMappingURL=ActionList.js.map