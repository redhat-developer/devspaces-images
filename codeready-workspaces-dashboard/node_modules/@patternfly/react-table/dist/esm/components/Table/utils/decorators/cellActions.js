import * as React from 'react';
import { css } from '@patternfly/react-styles';
import styles from '@patternfly/react-styles/css/components/Table/table';
import { ActionsColumn } from '../../ActionsColumn';
const resolveOrDefault = (resolver, defaultValue, rowData, extraData) => (typeof resolver === 'function' ? resolver(rowData, extraData) : defaultValue);
export const cellActions = (actions, actionResolver, areActionsDisabled) => (label, { rowData, column, rowIndex, columnIndex, column: { extraParams: { dropdownPosition, dropdownDirection, actionsToggle } }, property }) => {
    const extraData = {
        rowIndex,
        columnIndex,
        column,
        property
    };
    const resolvedActions = resolveOrDefault(actionResolver, actions, rowData, extraData);
    const resolvedIsDisabled = resolveOrDefault(areActionsDisabled, rowData && rowData.disableActions, rowData, extraData);
    const renderProps = resolvedActions && resolvedActions.length > 0
        ? {
            children: (React.createElement(ActionsColumn, { items: resolvedActions, dropdownPosition: dropdownPosition, dropdownDirection: dropdownDirection, isDisabled: resolvedIsDisabled, rowData: rowData, extraData: extraData, actionsToggle: actionsToggle }, label))
        }
        : {};
    return Object.assign({ className: css(styles.tableAction), style: { width: 'auto', paddingRight: 0 }, isVisible: true }, renderProps);
};
//# sourceMappingURL=cellActions.js.map