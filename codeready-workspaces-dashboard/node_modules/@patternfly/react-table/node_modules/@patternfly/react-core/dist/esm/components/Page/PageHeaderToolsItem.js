import * as React from 'react';
import styles from '@patternfly/react-styles/css/components/Page/page';
import { css } from '@patternfly/react-styles';
import { formatBreakpointMods } from '../../helpers/util';
export const PageHeaderToolsItem = ({ children, id, className, visibility, isSelected }) => (React.createElement("div", { className: css(styles.pageHeaderToolsItem, isSelected && styles.modifiers.selected, formatBreakpointMods(visibility, styles), className), id: id }, children));
PageHeaderToolsItem.displayName = 'PageHeaderToolsItem';
//# sourceMappingURL=PageHeaderToolsItem.js.map