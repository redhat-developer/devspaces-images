import { __rest } from "tslib";
/**
 * body.tsx
 *
 * Forked from reactabular-table version 8.14.0
 * https://github.com/reactabular/reactabular/tree/v8.14.0/packages/reactabular-table/src
 */
import * as React from 'react';
import isEqual from 'lodash/isEqual';
import { resolveRowKey } from './resolve-row-key';
import { BodyRow } from './body-row';
import { ProviderContext } from './provider';
class BaseBody extends React.Component {
    constructor() {
        super(...arguments);
        this.omitOnRow = (props) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { onRow } = props, ret = __rest(props, ["onRow"]);
            return ret;
        };
    }
    shouldComponentUpdate(nextProps) {
        // Skip checking props against `onRow` since that can be bound at render().
        // That's not particularly good practice but you never know how the users
        // prefer to define the handler.
        // Check for wrapper based override.
        const { renderers } = nextProps;
        if (renderers &&
            renderers.body &&
            renderers.body.wrapper &&
            renderers.body.wrapper.shouldComponentUpdate) {
            if (typeof renderers.body.wrapper.shouldComponentUpdate === 'function') {
                return renderers.body.wrapper.shouldComponentUpdate.call(this, nextProps, {}, {});
            }
            return true;
        }
        return !isEqual(this.omitOnRow(this.props), this.omitOnRow(nextProps));
    }
    render() {
        const _a = this.props, { onRow, rows, rowKey, columns, renderers } = _a, props = __rest(_a, ["onRow", "rows", "rowKey", "columns", "renderers"]);
        const children = rows.map((rowData, index) => {
            const key = resolveRowKey({ rowData, rowIndex: index, rowKey });
            return React.createElement(BodyRow, {
                key,
                renderers: renderers.body,
                onRow,
                rowKey: key,
                rowIndex: index,
                rowData,
                columns
            });
        });
        return React.createElement(renderers.body.wrapper, props, children);
    }
}
BaseBody.defaultProps = {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onRow: (...args) => Object
};
export const Body = (props) => (React.createElement(ProviderContext.Consumer, null, ({ columns, renderers }) => React.createElement(BaseBody, Object.assign({ columns: columns, renderers: renderers }, props))));
//# sourceMappingURL=body.js.map