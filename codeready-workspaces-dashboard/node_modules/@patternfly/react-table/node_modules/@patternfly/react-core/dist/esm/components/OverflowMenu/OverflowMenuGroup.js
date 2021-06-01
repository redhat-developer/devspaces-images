import * as React from 'react';
import { css } from '@patternfly/react-styles';
import styles from '@patternfly/react-styles/css/components/OverflowMenu/overflow-menu';
import { OverflowMenuContext } from './OverflowMenuContext';
export const OverflowMenuGroup = ({ className, children, isPersistent = false, groupType }) => (React.createElement(OverflowMenuContext.Consumer, null, value => (isPersistent || !value.isBelowBreakpoint) && (React.createElement("div", { className: css(styles.overflowMenuGroup, groupType === 'button' && styles.modifiers.buttonGroup, groupType === 'icon' && styles.modifiers.iconButtonGroup, className) }, children))));
OverflowMenuGroup.displayName = 'OverflowMenuGroup';
//# sourceMappingURL=OverflowMenuGroup.js.map