import { __rest } from "tslib";
import * as React from 'react';
import styles from '@patternfly/react-styles/css/components/Page/page';
import { css } from '@patternfly/react-styles';
import { formatBreakpointMods } from '../../helpers/util';
export const PageHeaderToolsGroup = (_a) => {
    var { children, className, visibility } = _a, props = __rest(_a, ["children", "className", "visibility"]);
    return (React.createElement("div", Object.assign({ className: css(styles.pageHeaderToolsGroup, formatBreakpointMods(visibility, styles), className) }, props), children));
};
PageHeaderToolsGroup.displayName = 'PageHeaderToolsGroup';
//# sourceMappingURL=PageHeaderToolsGroup.js.map