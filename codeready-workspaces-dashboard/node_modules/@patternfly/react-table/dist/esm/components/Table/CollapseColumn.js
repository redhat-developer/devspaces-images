import { __rest } from "tslib";
import * as React from 'react';
import AngleDownIcon from "@patternfly/react-icons/dist/esm/icons/angle-down-icon";
import { css } from '@patternfly/react-styles';
import { Button } from "@patternfly/react-core/dist/esm/components/Button/Button";
import styles from '@patternfly/react-styles/css/components/Table/table';
export const CollapseColumn = (_a) => {
    var { className = '', children = null, isOpen, onToggle } = _a, props = __rest(_a, ["className", "children", "isOpen", "onToggle"]);
    return (React.createElement(React.Fragment, null,
        isOpen !== undefined && (React.createElement(Button, Object.assign({ className: css(className, isOpen && styles.modifiers.expanded) }, props, { variant: "plain", "aria-label": "Details", onClick: onToggle, "aria-expanded": isOpen }),
            React.createElement("div", { className: css(styles.tableToggleIcon) },
                React.createElement(AngleDownIcon, null)))),
        children));
};
CollapseColumn.displayName = 'CollapseColumn';
//# sourceMappingURL=CollapseColumn.js.map