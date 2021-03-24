/*
 * Copyright (c) 2019 Red Hat, Inc.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit';
import '../styles.css';
import 'xterm/css/xterm.css';

export interface TerminalHandler {
    onData(data: string): void;
    onResize(cols: number, rows: number): void;
}

export class CloudShellTerminal {

    private xterm: Terminal;

    private fitAddon: FitAddon;
    private resizeTimeout: any;

    constructor() {
        this.xterm = new Terminal();

        // todo remove after debug;
        (window as any).xterm = this.xterm;

        // load xterm addons.
        this.fitAddon = new FitAddon();
        this.xterm.loadAddon(this.fitAddon);

        window.addEventListener("resize", () => {
            this.fitAddon.fit();
        }, false);
    }

    addHandler(terminalHandler: TerminalHandler) {
        this.xterm.onData((data) => {
            terminalHandler.onData(data);
        });
        this.xterm.onResize((resizeEvent) => {
            terminalHandler.onResize(resizeEvent.cols, resizeEvent.rows);
        });
    }

    get cols(): number {
        return this.xterm.cols;
    }

    get rows(): number {
        return this.xterm.rows;
    }

    open(parent: HTMLElement) {
        this.xterm.open(parent);
        this.fitAddon.fit();
    }

    sendText(text: string) {
        this.xterm.write(text);
    }

    sendLine(text: string) {
        this.xterm.writeln(text);
    }

    dispose() {
        this.xterm.dispose();
    }
}
