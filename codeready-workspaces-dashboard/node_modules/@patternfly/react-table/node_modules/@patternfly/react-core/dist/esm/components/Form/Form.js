import { __rest } from "tslib";
import * as React from 'react';
import styles from '@patternfly/react-styles/css/components/Form/form';
import { css } from '@patternfly/react-styles';
export const Form = (_a) => {
    var { children = null, className = '', isHorizontal = false, isWidthLimited = false } = _a, props = __rest(_a, ["children", "className", "isHorizontal", "isWidthLimited"]);
    return (React.createElement("form", Object.assign({ noValidate: true }, props, { className: css(styles.form, isHorizontal && styles.modifiers.horizontal, isWidthLimited && styles.modifiers.limitWidth, className) }), children));
};
Form.displayName = 'Form';
//# sourceMappingURL=Form.js.map