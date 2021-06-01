"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NavItem = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const nav_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/Nav/nav"));
const react_styles_1 = require("@patternfly/react-styles");
const Nav_1 = require("./Nav");
const PageSidebar_1 = require("../Page/PageSidebar");
const helpers_1 = require("../../helpers");
exports.NavItem = (_a) => {
    var { children, styleChildren = true, className, to, isActive = false, groupId = null, itemId = null, preventDefault = false, onClick = null, component = 'a', ouiaId, ouiaSafe } = _a, props = tslib_1.__rest(_a, ["children", "styleChildren", "className", "to", "isActive", "groupId", "itemId", "preventDefault", "onClick", "component", "ouiaId", "ouiaSafe"]);
    const Component = component;
    const { isNavOpen } = React.useContext(PageSidebar_1.PageSidebarContext);
    const renderDefaultLink = (context) => {
        const preventLinkDefault = preventDefault || !to;
        return (React.createElement(Component, Object.assign({ href: to, onClick: (e) => context.onSelect(e, groupId, itemId, to, preventLinkDefault, onClick), className: react_styles_1.css(nav_1.default.navLink, isActive && nav_1.default.modifiers.current, className), "aria-current": isActive ? 'page' : null, tabIndex: isNavOpen ? null : '-1' }, props), children));
    };
    const renderClonedChild = (context, child) => React.cloneElement(child, Object.assign(Object.assign({ onClick: (e) => context.onSelect(e, groupId, itemId, to, preventDefault, onClick), 'aria-current': isActive ? 'page' : null }, (styleChildren && {
        className: react_styles_1.css(nav_1.default.navLink, isActive && nav_1.default.modifiers.current, child.props && child.props.className)
    })), { tabIndex: child.props.tabIndex || isNavOpen ? null : -1 }));
    const ouiaProps = helpers_1.useOUIAProps(exports.NavItem.displayName, ouiaId, ouiaSafe);
    return (React.createElement("li", Object.assign({ className: react_styles_1.css(nav_1.default.navItem, className) }, ouiaProps),
        React.createElement(Nav_1.NavContext.Consumer, null, context => React.isValidElement(children)
            ? renderClonedChild(context, children)
            : renderDefaultLink(context))));
};
exports.NavItem.displayName = 'NavItem';
//# sourceMappingURL=NavItem.js.map