"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SortColumn = exports.SortByDirection = void 0;
const tslib_1 = require("tslib");
const React = tslib_1.__importStar(require("react"));
const long_arrow_alt_up_icon_1 = tslib_1.__importDefault(require("@patternfly/react-icons/dist/js/icons/long-arrow-alt-up-icon"));
const long_arrow_alt_down_icon_1 = tslib_1.__importDefault(require("@patternfly/react-icons/dist/js/icons/long-arrow-alt-down-icon"));
const arrows_alt_v_icon_1 = tslib_1.__importDefault(require("@patternfly/react-icons/dist/js/icons/arrows-alt-v-icon"));
const react_styles_1 = require("@patternfly/react-styles");
const table_1 = tslib_1.__importDefault(require("@patternfly/react-styles/css/components/Table/table"));
const TableText_1 = require("./TableText");
var SortByDirection;
(function (SortByDirection) {
    SortByDirection["asc"] = "asc";
    SortByDirection["desc"] = "desc";
})(SortByDirection = exports.SortByDirection || (exports.SortByDirection = {}));
exports.SortColumn = (_a) => {
    var { children = null, className = '', isSortedBy = false, onSort = null, sortDirection = '', type = 'button' } = _a, props = tslib_1.__rest(_a, ["children", "className", "isSortedBy", "onSort", "sortDirection", "type"]);
    let SortedByIcon;
    if (isSortedBy) {
        SortedByIcon = sortDirection === SortByDirection.asc ? long_arrow_alt_up_icon_1.default : long_arrow_alt_down_icon_1.default;
    }
    else {
        SortedByIcon = arrows_alt_v_icon_1.default;
    }
    return (React.createElement("button", Object.assign({}, props, { type: type, className: react_styles_1.css(className, table_1.default.tableButton), onClick: event => onSort && onSort(event) }),
        React.createElement("div", { className: react_styles_1.css(className, table_1.default.tableButtonContent) },
            React.createElement(TableText_1.TableText, null, children),
            React.createElement("span", { className: react_styles_1.css(table_1.default.tableSortIndicator) },
                React.createElement(SortedByIcon, null)))));
};
exports.SortColumn.displayName = 'SortColumn';
//# sourceMappingURL=SortColumn.js.map