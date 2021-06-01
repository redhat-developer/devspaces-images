import { __rest } from "tslib";
import * as React from 'react';
import { css } from '@patternfly/react-styles';
import styles from '@patternfly/react-styles/css/components/DescriptionList/description-list';
import { formatBreakpointMods } from '../../helpers';
const setAutoFitMinModifiers = (autoFitMinModifier) => {
    const prefix = '--pf-c-description-list--GridTemplateColumns--min';
    const mods = autoFitMinModifier;
    return Object.keys(mods || {}).reduce((acc, curr) => curr === 'default' ? Object.assign(Object.assign({}, acc), { [prefix]: mods[curr] }) : Object.assign(Object.assign({}, acc), { [`${prefix}-on-${curr}`]: mods[curr] }), {});
};
export const DescriptionList = (_a) => {
    var { className = '', children = null, isHorizontal = false, isAutoColumnWidths, isAutoFit, isInlineGrid, columnModifier, autoFitMinModifier, style } = _a, props = __rest(_a, ["className", "children", "isHorizontal", "isAutoColumnWidths", "isAutoFit", "isInlineGrid", "columnModifier", "autoFitMinModifier", "style"]);
    return (React.createElement("dl", Object.assign({ className: css(styles.descriptionList, isHorizontal && styles.modifiers.horizontal, isAutoColumnWidths && styles.modifiers.autoColumnWidths, isAutoFit && styles.modifiers.autoFit, formatBreakpointMods(columnModifier, styles), isInlineGrid && styles.modifiers.inlineGrid, className), style: autoFitMinModifier || style
            ? Object.assign(Object.assign({}, (isAutoFit ? setAutoFitMinModifiers(autoFitMinModifier) : {})), style) : undefined }, props), children));
};
DescriptionList.displayName = 'DescriptionList';
//# sourceMappingURL=DescriptionList.js.map