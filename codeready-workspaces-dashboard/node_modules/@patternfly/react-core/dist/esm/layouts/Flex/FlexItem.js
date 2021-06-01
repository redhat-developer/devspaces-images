import { __rest } from "tslib";
import * as React from 'react';
import { css } from '@patternfly/react-styles';
import styles from '@patternfly/react-styles/css/layouts/Flex/flex';
import { formatBreakpointMods } from '../../helpers/util';
export const FlexItem = (_a) => {
    var { children = null, className = '', spacer, grow, shrink, flex, alignSelf, align, fullWidth } = _a, props = __rest(_a, ["children", "className", "spacer", "grow", "shrink", "flex", "alignSelf", "align", "fullWidth"]);
    return (React.createElement("div", Object.assign({}, props, { className: css(formatBreakpointMods(spacer, styles), formatBreakpointMods(grow, styles), formatBreakpointMods(shrink, styles), formatBreakpointMods(flex, styles), formatBreakpointMods(alignSelf, styles), formatBreakpointMods(align, styles), formatBreakpointMods(fullWidth, styles), className) }), children));
};
FlexItem.displayName = 'FlexItem';
//# sourceMappingURL=FlexItem.js.map