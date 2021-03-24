/*
 * Copyright (c) 2019 Red Hat, Inc.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

export const EXIT_METHOD: string = 'onExecExit';
export const ERROR_METHOD: string = 'onExecError';

export interface MachineIdentifier {
    machineName: string,
    workspaceId: string
}

export interface MachineExec {
    identifier?: MachineIdentifier,
    cmd?: string[],
    tty: boolean,
    cols: number,
    rows: number,
    id?: number
}

export interface ExecExitEvent {
    id: number;
    code: number;
}

export interface ExecErrorEvent {
    id: number;
    stack: string;
}

export interface IdParam {
    id: number
}

export interface ResizeParam extends IdParam {
    rows: number,
    cols: number
}
