import { __rest } from "tslib";
import * as React from 'react';
import LongArrowAltUpIcon from "@patternfly/react-icons/dist/esm/icons/long-arrow-alt-up-icon";
import LongArrowAltDownIcon from "@patternfly/react-icons/dist/esm/icons/long-arrow-alt-down-icon";
import ArrowsAltVIcon from "@patternfly/react-icons/dist/esm/icons/arrows-alt-v-icon";
import { css } from '@patternfly/react-styles';
import styles from '@patternfly/react-styles/css/components/Table/table';
import { TableText } from './TableText';
export var SortByDirection;
(function (SortByDirection) {
    SortByDirection["asc"] = "asc";
    SortByDirection["desc"] = "desc";
})(SortByDirection || (SortByDirection = {}));
export const SortColumn = (_a) => {
    var { children = null, className = '', isSortedBy = false, onSort = null, sortDirection = '', type = 'button' } = _a, props = __rest(_a, ["children", "className", "isSortedBy", "onSort", "sortDirection", "type"]);
    let SortedByIcon;
    if (isSortedBy) {
        SortedByIcon = sortDirection === SortByDirection.asc ? LongArrowAltUpIcon : LongArrowAltDownIcon;
    }
    else {
        SortedByIcon = ArrowsAltVIcon;
    }
    return (React.createElement("button", Object.assign({}, props, { type: type, className: css(className, styles.tableButton), onClick: event => onSort && onSort(event) }),
        React.createElement("div", { className: css(className, styles.tableButtonContent) },
            React.createElement(TableText, null, children),
            React.createElement("span", { className: css(styles.tableSortIndicator) },
                React.createElement(SortedByIcon, null)))));
};
SortColumn.displayName = 'SortColumn';
//# sourceMappingURL=SortColumn.js.map