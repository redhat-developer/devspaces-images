import { css } from '@patternfly/react-styles';
import styles from '@patternfly/react-styles/css/components/Table/table';
const visibilityModifiers = [
    'hidden',
    'hiddenOnSm',
    'hiddenOnMd',
    'hiddenOnLg',
    'hiddenOnXl',
    'hiddenOn_2xl',
    'visibleOnSm',
    'visibleOnMd',
    'visibleOnLg',
    'visibleOnXl',
    'visibleOn_2xl'
];
export const Visibility = visibilityModifiers
    .filter(key => styles.modifiers[key])
    .reduce((acc, curr) => {
    const key2 = curr.replace('_2xl', '2Xl');
    acc[key2] = styles.modifiers[curr];
    return acc;
}, {});
export const classNames = (...classes) => () => ({
    className: css(...classes)
});
//# sourceMappingURL=classNames.js.map