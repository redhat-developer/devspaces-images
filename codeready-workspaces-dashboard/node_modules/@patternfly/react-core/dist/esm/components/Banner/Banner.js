import * as React from 'react';
import styles from '@patternfly/react-styles/css/components/Banner/banner';
import { css } from '@patternfly/react-styles';
export const Banner = ({ children, className, variant = 'default', isSticky = false }) => (React.createElement("div", { className: css(styles.banner, styles.modifiers[variant], isSticky && styles.modifiers.sticky, className) }, children));
Banner.displayName = 'Banner';
//# sourceMappingURL=Banner.js.map