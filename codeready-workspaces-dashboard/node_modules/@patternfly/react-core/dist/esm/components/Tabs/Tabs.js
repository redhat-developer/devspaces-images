import { __rest } from "tslib";
import * as React from 'react';
import styles from '@patternfly/react-styles/css/components/Tabs/tabs';
import buttonStyles from '@patternfly/react-styles/css/components/Button/button';
import { css } from '@patternfly/react-styles';
import AngleLeftIcon from "@patternfly/react-icons/dist/esm/icons/angle-left-icon";
import AngleRightIcon from "@patternfly/react-icons/dist/esm/icons/angle-right-icon";
import { getUniqueId, isElementInView, formatBreakpointMods } from '../../helpers/util';
import { TabButton } from './TabButton';
import { TabContent } from './TabContent';
import { TabsContextProvider } from './TabsContext';
import { getOUIAProps, getDefaultOUIAId } from '../../helpers';
export var TabsComponent;
(function (TabsComponent) {
    TabsComponent["div"] = "div";
    TabsComponent["nav"] = "nav";
})(TabsComponent || (TabsComponent = {}));
const variantStyle = {
    default: '',
    light300: styles.modifiers.colorSchemeLight_300
};
export class Tabs extends React.Component {
    constructor(props) {
        super(props);
        this.tabList = React.createRef();
        this.handleScrollButtons = () => {
            if (this.tabList.current && !this.props.isVertical) {
                const container = this.tabList.current;
                // get first element and check if it is in view
                const overflowOnLeft = !isElementInView(container, container.firstChild, false);
                // get last element and check if it is in view
                const overflowOnRight = !isElementInView(container, container.lastChild, false);
                const showScrollButtons = overflowOnLeft || overflowOnRight;
                const disableLeftScrollButton = !overflowOnLeft;
                const disableRightScrollButton = !overflowOnRight;
                this.setState({
                    showScrollButtons,
                    disableLeftScrollButton,
                    disableRightScrollButton
                });
            }
        };
        this.scrollLeft = () => {
            // find first Element that is fully in view on the left, then scroll to the element before it
            if (this.tabList.current) {
                const container = this.tabList.current;
                const childrenArr = Array.from(container.children);
                let firstElementInView;
                let lastElementOutOfView;
                let i;
                for (i = 0; i < childrenArr.length && !firstElementInView; i++) {
                    if (isElementInView(container, childrenArr[i], false)) {
                        firstElementInView = childrenArr[i];
                        lastElementOutOfView = childrenArr[i - 1];
                    }
                }
                if (lastElementOutOfView) {
                    container.scrollLeft -= lastElementOutOfView.scrollWidth;
                }
            }
        };
        this.scrollRight = () => {
            // find last Element that is fully in view on the right, then scroll to the element after it
            if (this.tabList.current) {
                const container = this.tabList.current;
                const childrenArr = Array.from(container.children);
                let lastElementInView;
                let firstElementOutOfView;
                for (let i = childrenArr.length - 1; i >= 0 && !lastElementInView; i--) {
                    if (isElementInView(container, childrenArr[i], false)) {
                        lastElementInView = childrenArr[i];
                        firstElementOutOfView = childrenArr[i + 1];
                    }
                }
                if (firstElementOutOfView) {
                    container.scrollLeft += firstElementOutOfView.scrollWidth;
                }
            }
        };
        this.state = {
            showScrollButtons: false,
            disableLeftScrollButton: false,
            disableRightScrollButton: false,
            shownKeys: [this.props.activeKey],
            ouiaStateId: getDefaultOUIAId(Tabs.displayName)
        };
    }
    handleTabClick(event, eventKey, tabContentRef, mountOnEnter) {
        const { shownKeys } = this.state;
        this.props.onSelect(event, eventKey);
        // process any tab content sections outside of the component
        if (tabContentRef) {
            React.Children.toArray(this.props.children)
                .map(child => child)
                .filter(child => child.props && child.props.tabContentRef && child.props.tabContentRef.current)
                .forEach(child => (child.props.tabContentRef.current.hidden = true));
            // most recently selected tabContent
            if (tabContentRef.current) {
                tabContentRef.current.hidden = false;
            }
        }
        if (mountOnEnter) {
            this.setState({
                shownKeys: shownKeys.concat(eventKey)
            });
        }
    }
    componentDidMount() {
        if (!this.props.isVertical) {
            window.addEventListener('resize', this.handleScrollButtons, false);
            // call the handle resize function to check if scroll buttons should be shown
            this.handleScrollButtons();
        }
    }
    componentWillUnmount() {
        if (!this.props.isVertical) {
            window.removeEventListener('resize', this.handleScrollButtons, false);
        }
    }
    componentDidUpdate(prevProps) {
        const { activeKey, mountOnEnter } = this.props;
        const { shownKeys } = this.state;
        if (prevProps.activeKey !== activeKey && mountOnEnter && shownKeys.indexOf(activeKey) < 0) {
            this.setState({
                shownKeys: shownKeys.concat(activeKey)
            });
        }
    }
    render() {
        const _a = this.props, { className, children, activeKey, id, isFilled, isSecondary, isVertical, isBox, leftScrollAriaLabel, rightScrollAriaLabel, 'aria-label': ariaLabel, component, ouiaId, ouiaSafe, mountOnEnter, unmountOnExit, inset, variant } = _a, props = __rest(_a, ["className", "children", "activeKey", "id", "isFilled", "isSecondary", "isVertical", "isBox", "leftScrollAriaLabel", "rightScrollAriaLabel", 'aria-label', "component", "ouiaId", "ouiaSafe", "mountOnEnter", "unmountOnExit", "inset", "variant"]);
        const { showScrollButtons, disableLeftScrollButton, disableRightScrollButton, shownKeys } = this.state;
        const filteredChildren = React.Children.toArray(children)
            .filter(Boolean)
            .filter(child => !child.props.isHidden);
        const uniqueId = id || getUniqueId();
        const Component = component === TabsComponent.nav ? 'nav' : 'div';
        return (React.createElement(TabsContextProvider, { value: { variant } },
            React.createElement(Component, Object.assign({ "aria-label": ariaLabel, className: css(styles.tabs, isFilled && styles.modifiers.fill, isSecondary && styles.modifiers.secondary, isVertical && styles.modifiers.vertical, isBox && styles.modifiers.box, showScrollButtons && !isVertical && styles.modifiers.scrollable, formatBreakpointMods(inset, styles), variantStyle[variant], className) }, getOUIAProps(Tabs.displayName, ouiaId !== undefined ? ouiaId : this.state.ouiaStateId, ouiaSafe), { id: id && id }, props),
                React.createElement("button", { className: css(styles.tabsScrollButton, isSecondary && buttonStyles.modifiers.secondary), "aria-label": leftScrollAriaLabel, onClick: this.scrollLeft, disabled: disableLeftScrollButton, "aria-hidden": disableLeftScrollButton },
                    React.createElement(AngleLeftIcon, null)),
                React.createElement("ul", { className: css(styles.tabsList), ref: this.tabList, onScroll: this.handleScrollButtons }, filteredChildren.map((child, index) => {
                    const _a = child.props, { title, eventKey, tabContentRef, id: childId, tabContentId, className: childClassName = '', ouiaId: childOuiaId, 
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    isHidden } = _a, rest = __rest(_a, ["title", "eventKey", "tabContentRef", "id", "tabContentId", "className", "ouiaId", "isHidden"]);
                    let ariaControls = tabContentId ? `${tabContentId}` : `pf-tab-section-${eventKey}-${childId || uniqueId}`;
                    if ((mountOnEnter || unmountOnExit) && eventKey !== activeKey) {
                        ariaControls = undefined;
                    }
                    return (React.createElement("li", { key: index, className: css(styles.tabsItem, eventKey === activeKey && styles.modifiers.current, childClassName) },
                        React.createElement(TabButton, Object.assign({ className: css(styles.tabsLink), onClick: (event) => this.handleTabClick(event, eventKey, tabContentRef, mountOnEnter), id: `pf-tab-${eventKey}-${childId || uniqueId}`, "aria-controls": ariaControls, tabContentRef: tabContentRef, ouiaId: childOuiaId }, rest), title)));
                })),
                React.createElement("button", { className: css(styles.tabsScrollButton, isSecondary && buttonStyles.modifiers.secondary), "aria-label": rightScrollAriaLabel, onClick: this.scrollRight, disabled: disableRightScrollButton, "aria-hidden": disableRightScrollButton },
                    React.createElement(AngleRightIcon, null))),
            filteredChildren
                .filter(child => child.props.children &&
                !(unmountOnExit && child.props.eventKey !== activeKey) &&
                !(mountOnEnter && shownKeys.indexOf(child.props.eventKey) === -1))
                .map((child, index) => (React.createElement(TabContent, { key: index, activeKey: activeKey, child: child, id: child.props.id || uniqueId, ouiaId: child.props.ouiaId })))));
    }
}
Tabs.displayName = 'Tabs';
Tabs.defaultProps = {
    activeKey: 0,
    onSelect: () => undefined,
    isFilled: false,
    isSecondary: false,
    isVertical: false,
    isBox: false,
    leftScrollAriaLabel: 'Scroll left',
    rightScrollAriaLabel: 'Scroll right',
    component: TabsComponent.div,
    mountOnEnter: false,
    unmountOnExit: false,
    ouiaSafe: true,
    variant: 'default'
};
//# sourceMappingURL=Tabs.js.map