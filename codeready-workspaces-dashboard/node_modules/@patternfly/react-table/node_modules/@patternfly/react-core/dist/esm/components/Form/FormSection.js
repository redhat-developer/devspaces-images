import { __rest } from "tslib";
import * as React from 'react';
import styles from '@patternfly/react-styles/css/components/Form/form';
import { css } from '@patternfly/react-styles';
export const FormSection = (_a) => {
    var { className = '', children, title = '', titleElement: TitleElement = 'div' } = _a, props = __rest(_a, ["className", "children", "title", "titleElement"]);
    return (React.createElement("section", Object.assign({}, props, { className: css(styles.formSection, className) }),
        title && React.createElement(TitleElement, { className: css(styles.formSectionTitle, className) }, title),
        children));
};
FormSection.displayName = 'FormSection';
//# sourceMappingURL=FormSection.js.map