import * as React from 'react';
import styles from '@patternfly/react-styles/css/components/OptionsMenu/options-menu';
import { css } from '@patternfly/react-styles';
import { fillTemplate } from '../../helpers';
import { DropdownToggle } from '../Dropdown';
let toggleId = 0;
export const OptionsToggle = ({ itemsTitle = 'items', optionsToggle = 'Select', 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
itemsPerPageTitle = 'Items per page', firstIndex = 0, lastIndex = 0, itemCount = 0, widgetId = '', showToggle = true, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
onToggle = (_isOpen) => undefined, isOpen = false, isDisabled = false, parentRef = null, toggleTemplate: ToggleTemplate = '', onEnter = null }) => (React.createElement("div", { className: css(styles.optionsMenuToggle, isDisabled && styles.modifiers.disabled, styles.modifiers.plain, styles.modifiers.text) }, showToggle && (React.createElement(React.Fragment, null,
    React.createElement("span", { className: css(styles.optionsMenuToggleText) }, typeof ToggleTemplate === 'string' ? (fillTemplate(ToggleTemplate, { firstIndex, lastIndex, itemCount, itemsTitle })) : (React.createElement(ToggleTemplate, { firstIndex: firstIndex, lastIndex: lastIndex, itemCount: itemCount, itemsTitle: itemsTitle }))),
    React.createElement(DropdownToggle, { onEnter: onEnter, "aria-label": optionsToggle, onToggle: onToggle, isDisabled: isDisabled || itemCount <= 0, isOpen: isOpen, id: `${widgetId}-toggle-${toggleId++}`, className: styles.optionsMenuToggleButton, parentRef: parentRef })))));
OptionsToggle.displayName = 'OptionsToggle';
//# sourceMappingURL=OptionsToggle.js.map