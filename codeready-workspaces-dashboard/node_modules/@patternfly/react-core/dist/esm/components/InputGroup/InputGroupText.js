import { __rest } from "tslib";
import * as React from 'react';
import styles from '@patternfly/react-styles/css/components/InputGroup/input-group';
import { css } from '@patternfly/react-styles';
export const InputGroupText = (_a) => {
    var { className = '', component = 'span', children } = _a, props = __rest(_a, ["className", "component", "children"]);
    const Component = component;
    return (React.createElement(Component, Object.assign({ className: css(styles.inputGroupText, className) }, props), children));
};
InputGroupText.displayName = 'InputGroupText';
//# sourceMappingURL=InputGroupText.js.map