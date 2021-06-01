import * as React from 'react';
import styles from '@patternfly/react-styles/css/components/Wizard/wizard';
import { css } from '@patternfly/react-styles';
export const WizardBody = ({ children, hasNoBodyPadding = false, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy, mainComponent = 'div' }) => {
    const MainComponent = mainComponent;
    return (React.createElement(MainComponent, { "aria-label": ariaLabel, "aria-labelledby": ariaLabelledBy, className: css(styles.wizardMain) },
        React.createElement("div", { className: css(styles.wizardMainBody, hasNoBodyPadding && styles.modifiers.noPadding) }, children)));
};
WizardBody.displayName = 'WizardBody';
//# sourceMappingURL=WizardBody.js.map