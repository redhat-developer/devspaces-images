import { __rest } from "tslib";
import * as React from 'react';
import styles from '@patternfly/react-styles/css/components/CodeBlock/code-block';
import { css } from '@patternfly/react-styles';
export const CodeBlockCode = (_a) => {
    var { children = null } = _a, props = __rest(_a, ["children"]);
    return (React.createElement("pre", Object.assign({ className: css(styles.codeBlockPre) }, props),
        React.createElement("code", { className: css(styles.codeBlockCode) }, children)));
};
CodeBlockCode.displayName = 'CodeBlockCode';
//# sourceMappingURL=CodeBlockCode.js.map