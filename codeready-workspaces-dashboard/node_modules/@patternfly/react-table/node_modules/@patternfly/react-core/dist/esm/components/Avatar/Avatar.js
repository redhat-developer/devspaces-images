import { __rest } from "tslib";
import * as React from 'react';
import styles from '@patternfly/react-styles/css/components/Avatar/avatar';
import { css } from '@patternfly/react-styles';
export const Avatar = (_a) => {
    var { className = '', src = '', alt } = _a, props = __rest(_a, ["className", "src", "alt"]);
    return React.createElement("img", Object.assign({}, props, { src: src, alt: alt, className: css(styles.avatar, className) }));
};
Avatar.displayName = 'Avatar';
//# sourceMappingURL=Avatar.js.map