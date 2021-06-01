import { __rest } from "tslib";
import * as React from 'react';
import { css } from '@patternfly/react-styles';
import styles from '@patternfly/react-styles/css/components/Table/table';
import stylesTreeView from '@patternfly/react-styles/css/components/Table/table-tree-view';
import { Tr } from '../TableComposable';
export const TreeRowWrapper = (_a) => {
    var { className, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    rowProps, row } = _a, props = __rest(_a, ["className", "rowProps", "row"]);
    const { 'aria-level': level, 'aria-posinset': posinset, 'aria-setsize': setsize, isExpanded, isDetailsExpanded, isHidden } = row.props;
    return (React.createElement(Tr, Object.assign({ "aria-level": level, "aria-posinset": posinset, "aria-setsize": setsize, "aria-expanded": !!isExpanded, isHidden: isHidden, className: css(className, isExpanded && styles.modifiers.expanded, isDetailsExpanded && stylesTreeView.modifiers.treeViewDetailsExpanded) }, props)));
};
TreeRowWrapper.displayName = 'TreeRowWrapper';
//# sourceMappingURL=TreeRowWrapper.js.map