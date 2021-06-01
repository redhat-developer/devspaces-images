"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Th = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const react_styles_1 = require("@patternfly/react-styles");
const table_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/Table/table"));
const info_1 = require("../Table/utils/decorators/info");
const sortable_1 = require("../Table/utils/decorators/sortable");
const selectable_1 = require("../Table/utils/decorators/selectable");
const cellWidth_1 = require("./../Table/utils/decorators/cellWidth");
const classNames_1 = require("./../Table/utils/decorators/classNames");
const merge_props_1 = require("../Table/base/merge-props");
const Tooltip_1 = require("@patternfly/react-core/dist/js/components/Tooltip/Tooltip");
const ThBase = (_a) => {
    var { children, className, component = 'th', dataLabel, scope = 'col', textCenter = false, sort = null, modifier, select = null, tooltip = '', onMouseEnter: onMouseEnterProp = () => { }, width, visibility, innerRef, info: infoProps } = _a, props = tslib_1.__rest(_a, ["children", "className", "component", "dataLabel", "scope", "textCenter", "sort", "modifier", "select", "tooltip", "onMouseEnter", "width", "visibility", "innerRef", "info"]);
    const [showTooltip, setShowTooltip] = React.useState(false);
    const onMouseEnter = (event) => {
        if (event.target.offsetWidth < event.target.scrollWidth) {
            !showTooltip && setShowTooltip(true);
        }
        else {
            showTooltip && setShowTooltip(false);
        }
        onMouseEnterProp(event);
    };
    let sortParams = null;
    if (sort) {
        if (sort.isFavorites) {
            sortParams = sortable_1.sortableFavorites({
                onSort: sort === null || sort === void 0 ? void 0 : sort.onSort,
                columnIndex: sort.columnIndex,
                sortBy: sort.sortBy
            })();
        }
        else {
            sortParams = sortable_1.sortable(children, {
                columnIndex: sort.columnIndex,
                column: {
                    extraParams: {
                        sortBy: sort.sortBy,
                        onSort: sort === null || sort === void 0 ? void 0 : sort.onSort
                    }
                }
            });
        }
    }
    const selectParams = select
        ? selectable_1.selectable(children, {
            column: {
                extraParams: {
                    onSelect: select === null || select === void 0 ? void 0 : select.onSelect,
                    selectVariant: 'checkbox',
                    allRowsSelected: select.isSelected
                }
            }
        })
        : null;
    const widthParams = width ? cellWidth_1.cellWidth(width)() : null;
    const visibilityParams = visibility
        ? classNames_1.classNames(...visibility.map((vis) => classNames_1.Visibility[vis]))()
        : null;
    let transformedChildren = (sortParams === null || sortParams === void 0 ? void 0 : sortParams.children) || (selectParams === null || selectParams === void 0 ? void 0 : selectParams.children) || children;
    // info can wrap other transformedChildren
    let infoParams = null;
    if (infoProps) {
        infoParams = info_1.info(infoProps)(transformedChildren);
        transformedChildren = infoParams.children;
    }
    const merged = merge_props_1.mergeProps(sortParams, selectParams, widthParams, visibilityParams, infoParams);
    const { 
    // ignore the merged children since we transform them ourselves so we can wrap it with info
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    children: mergedChildren = null, 
    // selectable adds this but we don't want it
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isVisible = null, className: mergedClassName = '', component: MergedComponent = component } = merged, mergedProps = tslib_1.__rest(merged, ["children", "isVisible", "className", "component"]);
    const cell = (React.createElement(MergedComponent, Object.assign({ "data-label": dataLabel, onMouseEnter: tooltip !== null ? onMouseEnter : onMouseEnterProp, scope: component === 'th' && children ? scope : null, ref: innerRef, className: react_styles_1.css(className, textCenter && table_1.default.modifiers.center, modifier && table_1.default.modifiers[modifier], mergedClassName) }, mergedProps, props), transformedChildren));
    const canDefault = tooltip === '' ? typeof children === 'string' : true;
    return tooltip !== null && canDefault && showTooltip ? (React.createElement(Tooltip_1.Tooltip, { content: tooltip || (tooltip === '' && children), isVisible: true }, cell)) : (cell);
};
exports.Th = React.forwardRef((props, ref) => (React.createElement(ThBase, Object.assign({}, props, { innerRef: ref }))));
exports.Th.displayName = 'Th';
//# sourceMappingURL=Th.js.map