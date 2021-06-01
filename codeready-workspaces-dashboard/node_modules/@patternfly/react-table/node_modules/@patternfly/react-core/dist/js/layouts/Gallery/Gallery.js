"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Gallery = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const react_styles_1 = require("@patternfly/react-styles");
const gallery_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/layouts/Gallery/gallery"));
exports.Gallery = (_a) => {
    var { children = null, className = '', hasGutter = false, minWidths, maxWidths } = _a, props = tslib_1.__rest(_a, ["children", "className", "hasGutter", "minWidths", "maxWidths"]);
    const minWidthStyles = {};
    if (minWidths) {
        Object.entries(minWidths || {}).map(([breakpoint, value]) => (minWidthStyles[`--pf-l-gallery--GridTemplateColumns--min${breakpoint !== 'default' ? `-on-${breakpoint}` : ''}`] = value));
    }
    const maxWidthStyles = {};
    if (maxWidths) {
        Object.entries(maxWidths || {}).map(([breakpoint, value]) => (maxWidthStyles[`--pf-l-gallery--GridTemplateColumns--max${breakpoint !== 'default' ? `-on-${breakpoint}` : ''}`] = value));
    }
    const widthStyles = Object.assign(Object.assign({}, minWidthStyles), maxWidthStyles);
    return (React.createElement("div", Object.assign({ className: react_styles_1.css(gallery_1.default.gallery, hasGutter && gallery_1.default.modifiers.gutter, className) }, props, ((minWidths || maxWidths) && { style: Object.assign(Object.assign({}, widthStyles), props.style) })), children));
};
exports.Gallery.displayName = 'Gallery';
//# sourceMappingURL=Gallery.js.map