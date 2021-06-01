import * as React from 'react';
import { HeaderCellInfoWrapper } from '../../HeaderCellInfoWrapper';
import styles from '@patternfly/react-styles/css/components/Table/table';
export const info = ({ tooltip, tooltipProps, popover, popoverProps, className, ariaLabel }) => {
    const infoObj = (value) => ({
        className: styles.modifiers.help,
        children: tooltip ? (React.createElement(HeaderCellInfoWrapper, { variant: "tooltip", info: tooltip, tooltipProps: tooltipProps, ariaLabel: ariaLabel, className: className }, value)) : (React.createElement(HeaderCellInfoWrapper, { variant: "popover", info: popover, popoverProps: popoverProps, ariaLabel: ariaLabel, className: className }, value))
    });
    return infoObj;
};
//# sourceMappingURL=info.js.map