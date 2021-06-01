import { __rest } from "tslib";
import * as React from 'react';
import { css } from '@patternfly/react-styles';
import { TreeViewSearch } from './TreeViewSearch';
import { Divider } from '../Divider';
export const TreeViewList = (_a) => {
    var { isNested = false, onSearch, searchProps, children } = _a, props = __rest(_a, ["isNested", "onSearch", "searchProps", "children"]);
    return (React.createElement(React.Fragment, null,
        onSearch && (React.createElement(React.Fragment, null,
            React.createElement(TreeViewSearch, Object.assign({ onChange: onSearch }, searchProps)),
            React.createElement(Divider, null))),
        React.createElement("ul", Object.assign({ className: css('pf-c-tree-view__list'), role: isNested ? 'group' : 'tree' }, props), children)));
};
TreeViewList.displayName = 'TreeViewList';
//# sourceMappingURL=TreeViewList.js.map