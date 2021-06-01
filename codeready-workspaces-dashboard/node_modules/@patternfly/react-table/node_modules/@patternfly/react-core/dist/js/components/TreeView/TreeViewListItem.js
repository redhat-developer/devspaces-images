"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeViewListItem = void 0;
const tslib_1 = require("tslib");
const react_1 = tslib_1.__importStar(require("react"));
const react_styles_1 = require("@patternfly/react-styles");
const tree_view_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/TreeView/tree-view"));
const angle_right_icon_1 = tslib_1.__importDefault(require("@patternfly/react-icons/dist/js/icons/angle-right-icon"));
const Badge_1 = require("../Badge");
const GenerateId_1 = require("../../helpers/GenerateId/GenerateId");
exports.TreeViewListItem = ({ name, id, isExpanded, defaultExpanded = false, children = null, onSelect, onCheck, hasCheck = false, checkProps = {
    checked: false
}, hasBadge = false, customBadgeContent, badgeProps = { isRead: true }, activeItems = [], itemData, parentItem, icon, expandedIcon, action, compareItems }) => {
    const [internalIsExpanded, setIsExpanded] = react_1.useState(defaultExpanded);
    react_1.useEffect(() => {
        if (isExpanded !== undefined && isExpanded !== null) {
            setIsExpanded(isExpanded);
        }
    }, [isExpanded]);
    const Component = hasCheck ? 'div' : 'button';
    const ToggleComponent = hasCheck ? 'button' : 'div';
    return (react_1.default.createElement("li", Object.assign({ id: id, className: react_styles_1.css(tree_view_1.default.treeViewListItem, internalIsExpanded && tree_view_1.default.modifiers.expanded) }, (internalIsExpanded && { 'aria-expanded': 'true' }), { role: children ? 'treeitem' : 'none', tabIndex: -1 }),
        react_1.default.createElement("div", { className: react_styles_1.css(tree_view_1.default.treeViewContent) },
            react_1.default.createElement(GenerateId_1.GenerateId, { prefix: "checkbox-id" }, randomId => (react_1.default.createElement(Component, Object.assign({ className: react_styles_1.css(tree_view_1.default.treeViewNode, !children &&
                    activeItems &&
                    activeItems.length > 0 &&
                    activeItems.some(item => compareItems && item && compareItems(item, itemData))
                    ? tree_view_1.default.modifiers.current
                    : ''), onClick: (evt) => {
                    if (!hasCheck) {
                        if (children) {
                            setIsExpanded(!internalIsExpanded);
                        }
                        onSelect && onSelect(evt, itemData, parentItem);
                    }
                } }, (!children && { role: 'treeitem' }), { tabIndex: -1 }),
                children && (react_1.default.createElement(ToggleComponent, Object.assign({ className: react_styles_1.css(tree_view_1.default.treeViewNodeToggle), onClick: () => {
                        if (hasCheck) {
                            setIsExpanded(!internalIsExpanded);
                        }
                    } }, (hasCheck && { 'aria-labelledby': `label-${randomId}` }), { tabIndex: -1 }),
                    react_1.default.createElement("span", { className: react_styles_1.css(tree_view_1.default.treeViewNodeToggleIcon) },
                        react_1.default.createElement(angle_right_icon_1.default, { "aria-hidden": "true" })))),
                hasCheck && (react_1.default.createElement("span", { className: react_styles_1.css(tree_view_1.default.treeViewNodeCheck) },
                    react_1.default.createElement("input", Object.assign({ type: "checkbox", onChange: (evt) => onCheck && onCheck(evt, itemData, parentItem), onClick: (evt) => evt.stopPropagation(), ref: elem => elem && (elem.indeterminate = checkProps.checked === null) }, checkProps, { id: randomId, tabIndex: -1 })))),
                icon && (react_1.default.createElement("span", { className: react_styles_1.css(tree_view_1.default.treeViewNodeIcon) },
                    !internalIsExpanded && icon,
                    internalIsExpanded && (expandedIcon || icon))),
                hasCheck ? (react_1.default.createElement("label", { className: react_styles_1.css(tree_view_1.default.treeViewNodeText), htmlFor: randomId, id: `label-${randomId}` }, name)) : (react_1.default.createElement("span", { className: react_styles_1.css(tree_view_1.default.treeViewNodeText) }, name)),
                hasBadge && children && (react_1.default.createElement("span", { className: react_styles_1.css(tree_view_1.default.treeViewNodeCount) },
                    react_1.default.createElement(Badge_1.Badge, Object.assign({}, badgeProps), customBadgeContent ? customBadgeContent : children.props.data.length)))))),
            action && react_1.default.createElement("div", { className: react_styles_1.css(tree_view_1.default.treeViewAction) }, action)),
        internalIsExpanded && children));
};
exports.TreeViewListItem.displayName = 'TreeViewListItem';
//# sourceMappingURL=TreeViewListItem.js.map