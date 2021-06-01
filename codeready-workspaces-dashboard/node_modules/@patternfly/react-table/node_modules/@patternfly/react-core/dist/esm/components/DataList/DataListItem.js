import { __rest } from "tslib";
import * as React from 'react';
import { css } from '@patternfly/react-styles';
import styles from '@patternfly/react-styles/css/components/DataList/data-list';
import { DataListContext } from './DataList';
import { KeyTypes } from '../Select';
import { DataListDragButton } from './DataListDragButton';
function findDataListDragButton(node) {
    if (!React.isValidElement(node)) {
        return null;
    }
    if (node.type === DataListDragButton) {
        return node;
    }
    if (node.props.children) {
        for (const child of React.Children.toArray(node.props.children)) {
            const button = findDataListDragButton(child);
            if (button) {
                return button;
            }
        }
    }
    return null;
}
export class DataListItem extends React.Component {
    render() {
        const _a = this.props, { children, isExpanded, className, id, 'aria-labelledby': ariaLabelledBy } = _a, props = __rest(_a, ["children", "isExpanded", "className", "id", 'aria-labelledby']);
        return (React.createElement(DataListContext.Consumer, null, ({ isSelectable, selectedDataListItemId, updateSelectedDataListItem, isDraggable, dragStart, dragEnd, drop }) => {
            const selectDataListItem = (event) => {
                let target = event.target;
                while (event.currentTarget !== target) {
                    if (('onclick' in target && target.onclick) ||
                        target.parentNode.classList.contains(styles.dataListItemAction) ||
                        target.parentNode.classList.contains(styles.dataListItemControl)) {
                        // check other event handlers are not present.
                        return;
                    }
                    else {
                        target = target.parentNode;
                    }
                }
                updateSelectedDataListItem(id);
            };
            const onKeyDown = (event) => {
                if (event.key === KeyTypes.Enter) {
                    updateSelectedDataListItem(id);
                }
            };
            // We made the DataListDragButton determine if the entire item is draggable instead of
            // DataListItem like we should have.
            // Recursively search children for the DataListDragButton and see if it's disabled...
            const dragButton = findDataListDragButton(children);
            const dragProps = isDraggable && {
                draggable: dragButton ? !dragButton.props.isDisabled : true,
                onDrop: drop,
                onDragEnd: dragEnd,
                onDragStart: dragStart
            };
            return (React.createElement("li", Object.assign({ id: id, className: css(styles.dataListItem, isExpanded && styles.modifiers.expanded, isSelectable && styles.modifiers.selectable, selectedDataListItemId && selectedDataListItemId === id && styles.modifiers.selected, className), "aria-labelledby": ariaLabelledBy }, (isSelectable && { tabIndex: 0, onClick: selectDataListItem, onKeyDown }), (isSelectable && selectedDataListItemId === id && { 'aria-selected': true }), props, dragProps), React.Children.map(children, child => React.isValidElement(child) &&
                React.cloneElement(child, {
                    rowid: ariaLabelledBy
                }))));
        }));
    }
}
DataListItem.displayName = 'DataListItem';
DataListItem.defaultProps = {
    isExpanded: false,
    className: '',
    id: '',
    children: null,
    'aria-labelledby': ''
};
//# sourceMappingURL=DataListItem.js.map