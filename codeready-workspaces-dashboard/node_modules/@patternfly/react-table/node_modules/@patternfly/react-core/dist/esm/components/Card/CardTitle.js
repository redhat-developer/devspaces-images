import { __rest } from "tslib";
import * as React from 'react';
import { css } from '@patternfly/react-styles';
import styles from '@patternfly/react-styles/css/components/Card/card';
export const CardTitle = (_a) => {
    var { children = null, className = '', component = 'div' } = _a, props = __rest(_a, ["children", "className", "component"]);
    const Component = component;
    return (React.createElement(Component, Object.assign({ className: css(styles.cardTitle, className) }, props), children));
};
CardTitle.displayName = 'CardTitle';
//# sourceMappingURL=CardTitle.js.map