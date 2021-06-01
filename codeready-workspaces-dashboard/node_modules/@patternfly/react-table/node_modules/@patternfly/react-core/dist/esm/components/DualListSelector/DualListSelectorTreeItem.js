import { __rest } from "tslib";
import * as React from 'react';
import styles from '@patternfly/react-styles/css/components/DualListSelector/dual-list-selector';
import { css } from '@patternfly/react-styles';
import { Badge } from '../Badge';
import AngleRightIcon from "@patternfly/react-icons/dist/esm/icons/angle-right-icon";
import { flattenTree } from './treeUtils';
export class DualListSelectorTreeItem extends React.Component {
    constructor() {
        super(...arguments);
        this.ref = React.createRef();
        this.state = {
            isExpanded: this.props.defaultExpanded || false
        };
    }
    render() {
        const _a = this.props, { onOptionCheck, 
        /* eslint-disable @typescript-eslint/no-unused-vars */
        onOptionSelect, children, className, id, text, isSelected, isChosen, defaultExpanded, hasBadge, isChecked, checkProps, badgeProps, parentItem, itemData } = _a, props = __rest(_a, ["onOptionCheck", "onOptionSelect", "children", "className", "id", "text", "isSelected", "isChosen", "defaultExpanded", "hasBadge", "isChecked", "checkProps", "badgeProps", "parentItem", "itemData"]);
        const { isExpanded } = this.state;
        return (React.createElement("li", Object.assign({ className: css(styles.dualListSelectorListItem, className, children && styles.modifiers.expandable, isExpanded && styles.modifiers.expanded), id: id }, props, { "aria-selected": isSelected, role: "treeitem" }, (isExpanded && { 'aria-expanded': 'true' })),
            React.createElement("div", { className: css(styles.dualListSelectorItem, isSelected && styles.modifiers.selected, styles.modifiers.check), ref: this.ref, tabIndex: -1, onClick: evt => {
                    onOptionCheck && onOptionCheck(evt, !isChecked, isChosen, itemData);
                } },
                React.createElement("span", { className: css(styles.dualListSelectorItemMain) },
                    children && (React.createElement("div", { className: css(styles.dualListSelectorItemToggle), onClick: e => {
                            if (children) {
                                this.setState({ isExpanded: !this.state.isExpanded });
                            }
                            e.stopPropagation();
                        } },
                        React.createElement("span", { className: css(styles.dualListSelectorItemToggleIcon) },
                            React.createElement(AngleRightIcon, { "aria-hidden": true })))),
                    React.createElement("span", { className: css(styles.dualListSelectorItemCheck) },
                        React.createElement("input", Object.assign({ type: "checkbox", onChange: (evt) => onOptionCheck && onOptionCheck(evt, !isChecked, isChosen, itemData), onClick: (evt) => evt.stopPropagation(), ref: elem => elem && (elem.indeterminate = isChecked === null), checked: isChecked || false }, checkProps))),
                    React.createElement("span", { className: css(styles.dualListSelectorItemText) }, text),
                    hasBadge && children && (React.createElement("span", { className: css(styles.dualListSelectorItemCount) },
                        React.createElement(Badge, Object.assign({}, badgeProps), flattenTree(children.props.data).length))))),
            isExpanded && children));
    }
}
DualListSelectorTreeItem.displayName = 'DualListSelectorTreeItem';
//# sourceMappingURL=DualListSelectorTreeItem.js.map