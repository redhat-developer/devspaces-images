import { __rest } from "tslib";
import * as React from 'react';
import { css } from '@patternfly/react-styles';
import styles from '@patternfly/react-styles/css/components/Sidebar/sidebar';
export const SidebarContent = (_a) => {
    var { children, hasNoBackground } = _a, props = __rest(_a, ["children", "hasNoBackground"]);
    return (React.createElement("div", Object.assign({ className: css(styles.sidebarContent, hasNoBackground && styles.modifiers.noBackground) }, props), children));
};
SidebarContent.displayName = 'SidebarContent';
//# sourceMappingURL=SidebarContent.js.map