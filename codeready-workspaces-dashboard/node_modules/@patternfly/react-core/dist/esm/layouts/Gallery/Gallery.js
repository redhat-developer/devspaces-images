import { __rest } from "tslib";
import * as React from 'react';
import { css } from '@patternfly/react-styles';
import styles from '@patternfly/react-styles/css/layouts/Gallery/gallery';
export const Gallery = (_a) => {
    var { children = null, className = '', hasGutter = false } = _a, props = __rest(_a, ["children", "className", "hasGutter"]);
    return (React.createElement("div", Object.assign({ className: css(styles.gallery, hasGutter && styles.modifiers.gutter, className) }, props), children));
};
Gallery.displayName = 'Gallery';
//# sourceMappingURL=Gallery.js.map