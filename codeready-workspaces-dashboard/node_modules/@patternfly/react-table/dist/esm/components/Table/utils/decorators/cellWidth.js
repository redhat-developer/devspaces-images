import { css } from '@patternfly/react-styles';
import styles from '@patternfly/react-styles/css/components/Table/table';
import { capitalize } from '../utils';
export const cellWidth = (width) => () => ({
    className: css(styles.modifiers[typeof width === 'number' ? `width_${width}` : `width${capitalize(width)}`])
});
//# sourceMappingURL=cellWidth.js.map