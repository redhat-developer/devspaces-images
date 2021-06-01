"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Header = void 0;
const tslib_1 = require("tslib");
/**
 * header.tsx
 *
 * Forked from reactabular-table version 8.14.0
 * https://github.com/reactabular/reactabular/tree/v8.14.0/packages/reactabular-table/src
 */
const React = tslib_1.__importStar(require("react"));
const provider_1 = require("./provider");
const header_row_1 = require("./header-row");
class BaseHeader extends React.Component {
    render() {
        const _a = this.props, { children, headerRows, onRow, renderers, columns } = _a, props = tslib_1.__rest(_a, ["children", "headerRows", "onRow", "renderers", "columns"]);
        // If headerRows aren't passed, default to bodyColumns as header rows
        return React.createElement(renderers.header.wrapper, props, [
            (headerRows || [columns]).map((rowData, rowIndex) => React.createElement(header_row_1.HeaderRow, {
                key: `${rowIndex}-header-row`,
                renderers: renderers.header,
                onRow,
                rowData,
                rowIndex
            }))
        ].concat(children));
    }
}
exports.Header = (props) => (React.createElement(provider_1.ProviderContext.Consumer, null, ({ columns, renderers }) => React.createElement(BaseHeader, Object.assign({ columns: columns, renderers: renderers }, props))));
//# sourceMappingURL=header.js.map