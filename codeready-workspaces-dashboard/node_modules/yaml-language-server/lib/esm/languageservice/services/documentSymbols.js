/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
import { parse as parseYAML } from '../parser/yamlParser07';
import { JSONDocumentSymbols } from 'vscode-json-languageservice/lib/umd/services/jsonDocumentSymbols';
export class YAMLDocumentSymbols {
    constructor(schemaService) {
        this.jsonDocumentSymbols = new JSONDocumentSymbols(schemaService);
        const origKeyLabel = this.jsonDocumentSymbols.getKeyLabel;
        // override 'getKeyLabel' to handle complex mapping
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.jsonDocumentSymbols.getKeyLabel = (property) => {
            if (typeof property.keyNode.value === 'object') {
                return property.keyNode.value.value;
            }
            else {
                return origKeyLabel.call(this.jsonDocumentSymbols, property);
            }
        };
    }
    findDocumentSymbols(document) {
        const doc = parseYAML(document.getText());
        if (!doc || doc['documents'].length === 0) {
            return null;
        }
        let results = [];
        for (const yamlDoc of doc['documents']) {
            if (yamlDoc.root) {
                results = results.concat(this.jsonDocumentSymbols.findDocumentSymbols(document, yamlDoc));
            }
        }
        return results;
    }
    findHierarchicalDocumentSymbols(document) {
        const doc = parseYAML(document.getText());
        if (!doc || doc['documents'].length === 0) {
            return null;
        }
        let results = [];
        for (const yamlDoc of doc['documents']) {
            if (yamlDoc.root) {
                results = results.concat(this.jsonDocumentSymbols.findDocumentSymbols2(document, yamlDoc));
            }
        }
        return results;
    }
}
//# sourceMappingURL=documentSymbols.js.map