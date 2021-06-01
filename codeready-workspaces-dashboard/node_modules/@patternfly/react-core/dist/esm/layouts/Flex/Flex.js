import { __rest } from "tslib";
import * as React from 'react';
import { css } from '@patternfly/react-styles';
import styles from '@patternfly/react-styles/css/layouts/Flex/flex';
import { formatBreakpointMods } from '../../helpers/util';
export const Flex = (_a) => {
    var { children = null, className = '', spacer, spaceItems, grow, shrink, flex, direction, alignItems, alignContent, alignSelf, align, justifyContent, display, fullWidth, flexWrap } = _a, props = __rest(_a, ["children", "className", "spacer", "spaceItems", "grow", "shrink", "flex", "direction", "alignItems", "alignContent", "alignSelf", "align", "justifyContent", "display", "fullWidth", "flexWrap"]);
    return (React.createElement("div", Object.assign({ className: css(styles.flex, formatBreakpointMods(spacer, styles), formatBreakpointMods(spaceItems, styles), formatBreakpointMods(grow, styles), formatBreakpointMods(shrink, styles), formatBreakpointMods(flex, styles), formatBreakpointMods(direction, styles), formatBreakpointMods(alignItems, styles), formatBreakpointMods(alignContent, styles), formatBreakpointMods(alignSelf, styles), formatBreakpointMods(align, styles), formatBreakpointMods(justifyContent, styles), formatBreakpointMods(display, styles), formatBreakpointMods(fullWidth, styles), formatBreakpointMods(flexWrap, styles), className) }, props), children));
};
Flex.displayName = 'Flex';
//# sourceMappingURL=Flex.js.map