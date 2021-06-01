import React, { useState, useEffect } from 'react';
import { css } from '@patternfly/react-styles';
import styles from '@patternfly/react-styles/css/components/TreeView/tree-view';
import AngleRightIcon from "@patternfly/react-icons/dist/esm/icons/angle-right-icon";
import { Badge } from '../Badge';
import { GenerateId } from '../../helpers/GenerateId/GenerateId';
export const TreeViewListItem = ({ name, id, isExpanded, defaultExpanded = false, children = null, onSelect, onCheck, hasCheck = false, checkProps = {
    checked: false
}, hasBadge = false, customBadgeContent, badgeProps = { isRead: true }, activeItems = [], itemData, parentItem, icon, expandedIcon, action, compareItems }) => {
    const [internalIsExpanded, setIsExpanded] = useState(defaultExpanded);
    useEffect(() => {
        if (isExpanded !== undefined && isExpanded !== null) {
            setIsExpanded(isExpanded);
        }
    }, [isExpanded]);
    const Component = hasCheck ? 'div' : 'button';
    const ToggleComponent = hasCheck ? 'button' : 'div';
    return (React.createElement("li", Object.assign({ id: id, className: css(styles.treeViewListItem, internalIsExpanded && styles.modifiers.expanded) }, (internalIsExpanded && { 'aria-expanded': 'true' }), { role: children ? 'treeitem' : 'none', tabIndex: -1 }),
        React.createElement("div", { className: css(styles.treeViewContent) },
            React.createElement(GenerateId, { prefix: "checkbox-id" }, randomId => (React.createElement(Component, Object.assign({ className: css(styles.treeViewNode, !children &&
                    activeItems &&
                    activeItems.length > 0 &&
                    activeItems.some(item => compareItems && item && compareItems(item, itemData))
                    ? styles.modifiers.current
                    : ''), onClick: (evt) => {
                    if (!hasCheck) {
                        if (children) {
                            setIsExpanded(!internalIsExpanded);
                        }
                        onSelect && onSelect(evt, itemData, parentItem);
                    }
                } }, (!children && { role: 'treeitem' }), { tabIndex: -1 }),
                children && (React.createElement(ToggleComponent, Object.assign({ className: css(styles.treeViewNodeToggle), onClick: () => {
                        if (hasCheck) {
                            setIsExpanded(!internalIsExpanded);
                        }
                    } }, (hasCheck && { 'aria-labelledby': `label-${randomId}` }), { tabIndex: -1 }),
                    React.createElement("span", { className: css(styles.treeViewNodeToggleIcon) },
                        React.createElement(AngleRightIcon, { "aria-hidden": "true" })))),
                hasCheck && (React.createElement("span", { className: css(styles.treeViewNodeCheck) },
                    React.createElement("input", Object.assign({ type: "checkbox", onChange: (evt) => onCheck && onCheck(evt, itemData, parentItem), onClick: (evt) => evt.stopPropagation(), ref: elem => elem && (elem.indeterminate = checkProps.checked === null) }, checkProps, { id: randomId, tabIndex: -1 })))),
                icon && (React.createElement("span", { className: css(styles.treeViewNodeIcon) },
                    !internalIsExpanded && icon,
                    internalIsExpanded && (expandedIcon || icon))),
                hasCheck ? (React.createElement("label", { className: css(styles.treeViewNodeText), htmlFor: randomId, id: `label-${randomId}` }, name)) : (React.createElement("span", { className: css(styles.treeViewNodeText) }, name)),
                hasBadge && children && (React.createElement("span", { className: css(styles.treeViewNodeCount) },
                    React.createElement(Badge, Object.assign({}, badgeProps), customBadgeContent ? customBadgeContent : children.props.data.length)))))),
            action && React.createElement("div", { className: css(styles.treeViewAction) }, action)),
        internalIsExpanded && children));
};
TreeViewListItem.displayName = 'TreeViewListItem';
//# sourceMappingURL=TreeViewListItem.js.map