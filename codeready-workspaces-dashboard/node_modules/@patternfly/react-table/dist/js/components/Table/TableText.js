"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableText = exports.WrapModifier = exports.TableTextVariant = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const table_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/Table/table"));
const react_styles_1 = require("@patternfly/react-styles");
const Tooltip_1 = require("@patternfly/react-core/dist/js/components/Tooltip/Tooltip");
var TableTextVariant;
(function (TableTextVariant) {
    TableTextVariant["div"] = "div";
    TableTextVariant["nav"] = "nav";
})(TableTextVariant = exports.TableTextVariant || (exports.TableTextVariant = {}));
var WrapModifier;
(function (WrapModifier) {
    WrapModifier["wrap"] = "wrap";
    WrapModifier["nowrap"] = "nowrap";
    WrapModifier["truncate"] = "truncate";
    WrapModifier["breakWord"] = "breakWord";
    WrapModifier["fitContent"] = "fitContent";
})(WrapModifier = exports.WrapModifier || (exports.WrapModifier = {}));
exports.TableText = (_a) => {
    var { children = null, className = '', variant = 'span', wrapModifier = null, tooltip: tooltipProp = '', tooltipProps = { entryDelay: 1000 }, onMouseEnter: onMouseEnterProp = () => { } } = _a, props = tslib_1.__rest(_a, ["children", "className", "variant", "wrapModifier", "tooltip", "tooltipProps", "onMouseEnter"]);
    const Component = variant;
    const [tooltip, setTooltip] = React.useState('');
    const onMouseEnter = (event) => {
        if (event.target.offsetWidth < event.target.scrollWidth) {
            setTooltip(tooltipProp || event.target.innerText);
        }
        else {
            setTooltip('');
        }
        onMouseEnterProp(event);
    };
    const text = (React.createElement(Component, Object.assign({ onMouseEnter: onMouseEnter, className: react_styles_1.css(className, wrapModifier && table_1.default.modifiers[wrapModifier], table_1.default.tableText) }, props), children));
    return tooltip !== '' ? (React.createElement(Tooltip_1.Tooltip, Object.assign({ content: tooltip, isVisible: true }, tooltipProps), text)) : (text);
};
exports.TableText.displayName = 'TableText';
//# sourceMappingURL=TableText.js.map