"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuItem = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const menu_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/Menu/menu"));
const react_styles_1 = require("@patternfly/react-styles");
const external_link_alt_icon_1 = tslib_1.__importDefault(require("@patternfly/react-icons/dist/js/icons/external-link-alt-icon"));
const angle_right_icon_1 = tslib_1.__importDefault(require("@patternfly/react-icons/dist/js/icons/angle-right-icon"));
const angle_left_icon_1 = tslib_1.__importDefault(require("@patternfly/react-icons/dist/js/icons/angle-left-icon"));
const check_icon_1 = tslib_1.__importDefault(require("@patternfly/react-icons/dist/js/icons/check-icon"));
const MenuContext_1 = require("./MenuContext");
const MenuItemAction_1 = require("./MenuItemAction");
const MenuItemBase = (_a) => {
    var { children, className, itemId = null, to, isActive = null, isFavorited = null, flyoutMenu, direction, description = null, onClick = () => { }, component, isDisabled = false, isExternalLink = false, isSelected = null, icon, actions, onShowFlyout, innerRef, drilldownMenu, isOnPath } = _a, props = tslib_1.__rest(_a, ["children", "className", "itemId", "to", "isActive", "isFavorited", "flyoutMenu", "direction", "description", "onClick", "component", "isDisabled", "isExternalLink", "isSelected", "icon", "actions", "onShowFlyout", "innerRef", "drilldownMenu", "isOnPath"]);
    const Component = component || to ? 'a' : 'button';
    const [flyoutVisible, setFlyoutVisible] = React.useState(false);
    const [flyoutTarget, setFlyoutTarget] = React.useState(null);
    const showFlyout = (displayFlyout) => {
        setFlyoutVisible(displayFlyout);
        onShowFlyout && displayFlyout && onShowFlyout();
    };
    React.useEffect(() => {
        if (flyoutTarget) {
            if (flyoutVisible) {
                const flyoutMenu = flyoutTarget.nextElementSibling;
                const flyoutItems = Array.from(flyoutMenu.getElementsByTagName('UL')[0].children).filter(el => !(el.classList.contains('pf-m-disabled') || el.classList.contains('pf-c-divider')));
                flyoutItems[0].firstChild.focus();
            }
            else {
                flyoutTarget.focus();
            }
        }
    }, [flyoutVisible, flyoutTarget]);
    const handleFlyout = (event) => {
        const key = event.key;
        const target = event.target;
        if (key === ' ' || key === 'Enter' || key === 'ArrowRight') {
            event.stopPropagation();
            if (!flyoutVisible) {
                showFlyout(true);
                setFlyoutTarget(target);
            }
        }
        if (key === 'Escape' || key === 'ArrowLeft') {
            event.stopPropagation();
            showFlyout(false);
        }
    };
    const onItemSelect = (event, onSelect) => {
        // Trigger callback for Menu onSelect
        onSelect && onSelect(event, itemId);
        // Trigger callback for item onClick
        onClick && onClick(event);
    };
    const renderItem = (onSelect, activeItemId, selected, isOnPath, drill) => {
        let additionalProps = {};
        if (Component === 'a') {
            additionalProps = {
                href: to,
                'aria-disabled': isDisabled ? true : null
            };
        }
        else if (Component === 'button') {
            additionalProps = {
                type: 'button'
            };
        }
        if (isOnPath) {
            additionalProps['aria-expanded'] = true;
        }
        const getAriaCurrent = () => {
            if (isActive !== null) {
                if (isActive) {
                    return 'page';
                }
                else {
                    return null;
                }
            }
            else if (itemId !== null && activeItemId !== null) {
                return itemId === activeItemId;
            }
            return null;
        };
        const getIsSelected = () => {
            if (isSelected !== null) {
                return isSelected;
            }
            else if (selected !== null && itemId !== null) {
                return (Array.isArray(selected) && selected.includes(itemId)) || itemId === selected;
            }
            return false;
        };
        return (React.createElement(React.Fragment, null,
            React.createElement(Component, Object.assign({ onClick: (event) => {
                    onItemSelect(event, onSelect);
                    drill && drill();
                }, className: react_styles_1.css(menu_1.default.menuItem, getIsSelected() && menu_1.default.modifiers.selected, className), "aria-current": getAriaCurrent(), tabIndex: -1 }, (isDisabled && { disabled: true }), additionalProps),
                React.createElement("span", { className: react_styles_1.css(menu_1.default.menuItemMain) },
                    direction === 'up' && (React.createElement("span", { className: react_styles_1.css(menu_1.default.menuItemToggleIcon) },
                        React.createElement(angle_left_icon_1.default, { "aria-hidden": true }))),
                    icon && React.createElement("span", { className: react_styles_1.css(menu_1.default.menuItemIcon) }, icon),
                    React.createElement("span", { className: react_styles_1.css(menu_1.default.menuItemText) }, children),
                    isExternalLink && (React.createElement("span", { className: react_styles_1.css(menu_1.default.menuItemExternalIcon) },
                        React.createElement(external_link_alt_icon_1.default, { "aria-hidden": true }))),
                    (flyoutMenu || direction === 'down') && (React.createElement("span", { className: react_styles_1.css(menu_1.default.menuItemToggleIcon) },
                        React.createElement(angle_right_icon_1.default, { "aria-hidden": true }))),
                    getIsSelected() && (React.createElement("span", { className: react_styles_1.css(menu_1.default.menuItemSelectIcon) },
                        React.createElement(check_icon_1.default, { "aria-hidden": true })))),
                description && direction !== 'up' && (React.createElement("span", { className: react_styles_1.css(menu_1.default.menuItemDescription) },
                    React.createElement("span", null, description)))),
            flyoutVisible && flyoutMenu,
            drilldownMenu));
    };
    return (React.createElement(MenuContext_1.MenuContext.Consumer, null, ({ menuId, parentMenu, onSelect, onActionClick, activeItemId, selected, drilldownItemPath, onDrillIn, onDrillOut }) => {
        const _isOnPath = (isOnPath && isOnPath) || (drilldownItemPath && drilldownItemPath.includes(itemId)) || false;
        let _drill;
        if (direction) {
            if (direction === 'down') {
                _drill = () => onDrillIn && onDrillIn(menuId, drilldownMenu.props.id, itemId);
            }
            else {
                _drill = () => onDrillOut && onDrillOut(parentMenu, itemId);
            }
        }
        return (React.createElement("li", Object.assign({ className: react_styles_1.css(menu_1.default.menuListItem, isDisabled && menu_1.default.modifiers.disabled, _isOnPath && menu_1.default.modifiers.currentPath, className), onMouseOver: flyoutMenu !== undefined ? () => showFlyout(true) : undefined, onMouseLeave: flyoutMenu !== undefined ? () => showFlyout(false) : undefined }, (flyoutMenu && { onKeyDown: handleFlyout }), { tabIndex: -1, ref: innerRef }, props),
            renderItem(onSelect, activeItemId, selected, _isOnPath, _drill),
            React.createElement(MenuContext_1.MenuItemContext.Provider, { value: { itemId, isDisabled } },
                actions,
                isFavorited !== null && (React.createElement(MenuItemAction_1.MenuItemAction, { icon: "favorites", isFavorited: isFavorited, "aria-label": isFavorited ? 'starred' : 'not starred', onClick: event => onActionClick(event, itemId), tabIndex: -1, actionId: "fav" })))));
    }));
};
exports.MenuItem = React.forwardRef((props, ref) => (React.createElement(MenuItemBase, Object.assign({}, props, { innerRef: ref }))));
exports.MenuItem.displayName = 'MenuItem';
//# sourceMappingURL=MenuItem.js.map