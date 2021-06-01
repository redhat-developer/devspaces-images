import { __rest } from "tslib";
import * as React from 'react';
import { Button } from '../Button';
import TimesIcon from "@patternfly/react-icons/dist/esm/icons/times-icon";
export const ModalBoxCloseButton = (_a) => {
    var { className = '', onClose = () => undefined } = _a, props = __rest(_a, ["className", "onClose"]);
    return (React.createElement(Button, Object.assign({ className: className, variant: "plain", onClick: onClose, "aria-label": "Close" }, props),
        React.createElement(TimesIcon, null)));
};
ModalBoxCloseButton.displayName = 'ModalBoxCloseButton';
//# sourceMappingURL=ModalBoxCloseButton.js.map