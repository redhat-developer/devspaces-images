import { TextDocument } from 'vscode-languageserver';
export declare class TextBuffer {
    private doc;
    constructor(doc: TextDocument);
    getLineCount(): number;
    getLineLength(lineNumber: number): number;
    getLineContent(lineNumber: number): string;
    getLineCharCode(lineNumber: number, index: number): number;
}
