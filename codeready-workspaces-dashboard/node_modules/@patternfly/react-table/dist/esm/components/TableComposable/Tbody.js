import { __rest } from "tslib";
import * as React from 'react';
import { css } from '@patternfly/react-styles';
import styles from '@patternfly/react-styles/css/components/Table/table';
const TbodyBase = (_a) => {
    var { children, className, isExpanded, innerRef } = _a, props = __rest(_a, ["children", "className", "isExpanded", "innerRef"]);
    return (React.createElement("tbody", Object.assign({ role: "rowgroup", className: css(className, isExpanded && styles.modifiers.expanded), ref: innerRef }, props), children));
};
export const Tbody = React.forwardRef((props, ref) => (React.createElement(TbodyBase, Object.assign({}, props, { innerRef: ref }))));
Tbody.displayName = 'Tbody';
//# sourceMappingURL=Tbody.js.map