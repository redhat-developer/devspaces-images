"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DescriptionListTerm = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const description_list_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/DescriptionList/description-list"));
const react_styles_1 = require("@patternfly/react-styles");
exports.DescriptionListTerm = (_a) => {
    var { children, className } = _a, props = tslib_1.__rest(_a, ["children", "className"]);
    return (React.createElement("dt", Object.assign({ className: react_styles_1.css(description_list_1.default.descriptionListTerm, className) }, props),
        React.createElement("span", { className: 'pf-c-description-list__text' }, children)));
};
exports.DescriptionListTerm.displayName = 'DescriptionListTerm';
//# sourceMappingURL=DescriptionListTerm.js.map