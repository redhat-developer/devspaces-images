import { __rest } from "tslib";
/**
 * header.tsx
 *
 * Forked from reactabular-table version 8.14.0
 * https://github.com/reactabular/reactabular/tree/v8.14.0/packages/reactabular-table/src
 */
import * as React from 'react';
import { ProviderContext } from './provider';
import { HeaderRow } from './header-row';
class BaseHeader extends React.Component {
    render() {
        const _a = this.props, { children, headerRows, onRow, renderers, columns } = _a, props = __rest(_a, ["children", "headerRows", "onRow", "renderers", "columns"]);
        // If headerRows aren't passed, default to bodyColumns as header rows
        return React.createElement(renderers.header.wrapper, props, [
            (headerRows || [columns]).map((rowData, rowIndex) => React.createElement(HeaderRow, {
                key: `${rowIndex}-header-row`,
                renderers: renderers.header,
                onRow,
                rowData,
                rowIndex
            }))
        ].concat(children));
    }
}
export const Header = (props) => (React.createElement(ProviderContext.Consumer, null, ({ columns, renderers }) => React.createElement(BaseHeader, Object.assign({ columns: columns, renderers: renderers }, props))));
//# sourceMappingURL=header.js.map