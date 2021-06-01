import { __rest } from "tslib";
import * as React from 'react';
import { useOUIAProps } from '@patternfly/react-core';
import styles from '@patternfly/react-styles/css/components/Table/table';
import inlineStyles from '@patternfly/react-styles/css/components/InlineEdit/inline-edit';
import { css } from '@patternfly/react-styles';
const TrBase = (_a) => {
    var { children, className, isExpanded, isEditable, isHidden = false, innerRef, ouiaId, ouiaSafe = true } = _a, props = __rest(_a, ["children", "className", "isExpanded", "isEditable", "isHidden", "innerRef", "ouiaId", "ouiaSafe"]);
    const ouiaProps = useOUIAProps('TableRow', ouiaId, ouiaSafe);
    return (React.createElement("tr", Object.assign({ className: css(className, isExpanded !== undefined && styles.tableExpandableRow, isExpanded && styles.modifiers.expanded, isEditable && inlineStyles.modifiers.inlineEditable), hidden: isHidden || (isExpanded !== undefined && !isExpanded), ref: innerRef }, ouiaProps, props), children));
};
export const Tr = React.forwardRef((props, ref) => (React.createElement(TrBase, Object.assign({}, props, { innerRef: ref }))));
Tr.displayName = 'Tr';
//# sourceMappingURL=Tr.js.map