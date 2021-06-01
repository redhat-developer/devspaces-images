"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataListItem = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const react_styles_1 = require("@patternfly/react-styles");
const data_list_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/DataList/data-list"));
const DataList_1 = require("./DataList");
const Select_1 = require("../Select");
const DataListDragButton_1 = require("./DataListDragButton");
function findDataListDragButton(node) {
    if (!React.isValidElement(node)) {
        return null;
    }
    if (node.type === DataListDragButton_1.DataListDragButton) {
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
class DataListItem extends React.Component {
    render() {
        const _a = this.props, { children, isExpanded, className, id, 'aria-labelledby': ariaLabelledBy } = _a, props = tslib_1.__rest(_a, ["children", "isExpanded", "className", "id", 'aria-labelledby']);
        return (React.createElement(DataList_1.DataListContext.Consumer, null, ({ isSelectable, selectedDataListItemId, updateSelectedDataListItem, isDraggable, dragStart, dragEnd, drop }) => {
            const selectDataListItem = (event) => {
                let target = event.target;
                while (event.currentTarget !== target) {
                    if (('onclick' in target && target.onclick) ||
                        target.parentNode.classList.contains(data_list_1.default.dataListItemAction) ||
                        target.parentNode.classList.contains(data_list_1.default.dataListItemControl)) {
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
                if (event.key === Select_1.KeyTypes.Enter) {
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
            return (React.createElement("li", Object.assign({ id: id, className: react_styles_1.css(data_list_1.default.dataListItem, isExpanded && data_list_1.default.modifiers.expanded, isSelectable && data_list_1.default.modifiers.selectable, selectedDataListItemId && selectedDataListItemId === id && data_list_1.default.modifiers.selected, className), "aria-labelledby": ariaLabelledBy }, (isSelectable && { tabIndex: 0, onClick: selectDataListItem, onKeyDown }), (isSelectable && selectedDataListItemId === id && { 'aria-selected': true }), props, dragProps), React.Children.map(children, child => React.isValidElement(child) &&
                React.cloneElement(child, {
                    rowid: ariaLabelledBy
                }))));
        }));
    }
}
exports.DataListItem = DataListItem;
DataListItem.displayName = 'DataListItem';
DataListItem.defaultProps = {
    isExpanded: false,
    className: '',
    id: '',
    children: null,
    'aria-labelledby': ''
};
//# sourceMappingURL=DataListItem.js.map