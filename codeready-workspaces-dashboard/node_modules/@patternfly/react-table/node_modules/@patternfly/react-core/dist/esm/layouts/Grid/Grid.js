import { __rest } from "tslib";
import * as React from 'react';
import styles from '@patternfly/react-styles/css/layouts/Grid/grid';
import { css } from '@patternfly/react-styles';
import { DeviceSizes } from '../../styles/sizes';
export const Grid = (_a) => {
    var { children = null, className = '', hasGutter, span = null } = _a, props = __rest(_a, ["children", "className", "hasGutter", "span"]);
    const classes = [styles.grid, span && styles.modifiers[`all_${span}Col`]];
    Object.entries(DeviceSizes).forEach(([propKey, gridSpanModifier]) => {
        const key = propKey;
        const propValue = props[key];
        if (propValue) {
            classes.push(styles.modifiers[`all_${propValue}ColOn${gridSpanModifier}`]);
        }
        delete props[key];
    });
    return (React.createElement("div", Object.assign({ className: css(...classes, hasGutter && styles.modifiers.gutter, className) }, props), children));
};
Grid.displayName = 'Grid';
//# sourceMappingURL=Grid.js.map