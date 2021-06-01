import { __rest } from "tslib";
import * as React from 'react';
import { css } from '@patternfly/react-styles';
import styles from '@patternfly/react-styles/css/components/TreeView/tree-view';
import formStyles from '@patternfly/react-styles/css/components/FormControl/form-control';
export const TreeViewSearch = (_a) => {
    var props = __rest(_a, []);
    return (React.createElement("div", { className: css(styles.treeViewSearch) },
        React.createElement("input", Object.assign({ className: css(formStyles.formControl, formStyles.modifiers.search), type: "search" }, props))));
};
TreeViewSearch.displayName = 'TreeViewSearch';
//# sourceMappingURL=TreeViewSearch.js.map