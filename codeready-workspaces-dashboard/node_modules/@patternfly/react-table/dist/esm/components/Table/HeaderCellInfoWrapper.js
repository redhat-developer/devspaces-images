import * as React from 'react';
import HelpIcon from "@patternfly/react-icons/dist/esm/icons/help-icon";
import { css } from '@patternfly/react-styles';
import styles from '@patternfly/react-styles/css/components/Table/table';
import { Button, Tooltip, Popover } from '@patternfly/react-core';
import { TableText } from './TableText';
export const HeaderCellInfoWrapper = ({ children, info, className, variant = 'tooltip', popoverProps, tooltipProps, ariaLabel }) => (React.createElement("div", { className: css(styles.tableColumnHelp, className) },
    typeof children === 'string' ? React.createElement(TableText, null, children) : children,
    React.createElement("span", { className: css(styles.tableColumnHelpAction) }, variant === 'tooltip' ? (React.createElement(Tooltip, Object.assign({ content: info }, tooltipProps),
        React.createElement(Button, { variant: "plain", "aria-label": ariaLabel || (typeof info === 'string' && info) || 'More info' },
            React.createElement(HelpIcon, { noVerticalAlign: true })))) : (React.createElement(Popover, Object.assign({ bodyContent: info }, popoverProps),
        React.createElement(Button, { variant: "plain", "aria-label": ariaLabel || (typeof info === 'string' && info) || 'More info' },
            React.createElement(HelpIcon, { noVerticalAlign: true })))))));
HeaderCellInfoWrapper.displayName = 'HeaderCellInfoWrapper';
//# sourceMappingURL=HeaderCellInfoWrapper.js.map