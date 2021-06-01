import { __rest } from "tslib";
import * as React from 'react';
import styles from '@patternfly/react-styles/css/components/Toolbar/toolbar';
import { css } from '@patternfly/react-styles';
import { canUseDOM } from '../../helpers/util';
import { ToolbarItem } from './ToolbarItem';
import { Button } from '../Button';
import { ToolbarGroup } from './ToolbarGroup';
import { globalBreakpoints } from './ToolbarUtils';
export class ToolbarChipGroupContent extends React.Component {
    render() {
        const _a = this.props, { className, isExpanded, chipGroupContentRef, clearAllFilters, showClearFiltersButton, clearFiltersButtonText, collapseListedFiltersBreakpoint, numberOfFilters } = _a, props = __rest(_a, ["className", "isExpanded", "chipGroupContentRef", "clearAllFilters", "showClearFiltersButton", "clearFiltersButtonText", "collapseListedFiltersBreakpoint", "numberOfFilters"]);
        const clearChipGroups = () => {
            clearAllFilters();
        };
        let collapseListedFilters = false;
        if (collapseListedFiltersBreakpoint === 'all') {
            collapseListedFilters = true;
        }
        else if (canUseDOM) {
            collapseListedFilters =
                (canUseDOM ? window.innerWidth : 1200) < globalBreakpoints[collapseListedFiltersBreakpoint];
        }
        return (React.createElement("div", Object.assign({ className: css(styles.toolbarContent, (numberOfFilters === 0 || isExpanded) && styles.modifiers.hidden, className) }, ((numberOfFilters === 0 || isExpanded) && { hidden: true }), { ref: chipGroupContentRef }, props),
            React.createElement(ToolbarGroup, Object.assign({ className: css(collapseListedFilters && styles.modifiers.hidden) }, (collapseListedFilters && { hidden: true }), (collapseListedFilters && { 'aria-hidden': true }))),
            collapseListedFilters && numberOfFilters > 0 && !isExpanded && (React.createElement(ToolbarGroup, null,
                React.createElement(ToolbarItem, null,
                    numberOfFilters,
                    " filters applied"))),
            showClearFiltersButton && !isExpanded && (React.createElement(ToolbarItem, null,
                React.createElement(Button, { variant: "link", onClick: clearChipGroups, isInline: true }, clearFiltersButtonText)))));
    }
}
ToolbarChipGroupContent.displayName = 'ToolbarChipGroupContent';
ToolbarChipGroupContent.defaultProps = {
    clearFiltersButtonText: 'Clear all filters',
    collapseListedFiltersBreakpoint: 'lg'
};
//# sourceMappingURL=ToolbarChipGroupContent.js.map