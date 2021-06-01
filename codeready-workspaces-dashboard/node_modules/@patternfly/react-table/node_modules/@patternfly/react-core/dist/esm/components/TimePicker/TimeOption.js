import { __rest } from "tslib";
import * as React from 'react';
import { css } from '@patternfly/react-styles';
import styles from '@patternfly/react-styles/css/components/Select/select';
export const TimeOption = (_a) => {
    var { className = '', value = '', onSelect = () => { }, children, id, isFocused } = _a, props = __rest(_a, ["className", "value", "onSelect", "children", "id", "isFocused"]);
    return (React.createElement("li", Object.assign({ role: "presentation", className: css(styles.selectMenuWrapper, isFocused && styles.modifiers.focus, className) }, props),
        React.createElement("button", { className: css(styles.selectMenuItem), onClick: event => {
                onSelect(value, event);
            }, role: "option", type: "button", id: id }, children || value.toString())));
};
TimeOption.displayName = 'TimeOption';
//# sourceMappingURL=TimeOption.js.map