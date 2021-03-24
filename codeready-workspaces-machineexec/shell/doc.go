//
// Copyright (c) 2012-2019 Red Hat, Inc.
// This program and the accompanying materials are made
// available under the terms of the Eclipse Public License 2.0
// which is available at https://www.eclipse.org/legal/epl-2.0/
//
// SPDX-License-Identifier: EPL-2.0
//
// Contributors:
//   Red Hat, Inc. - initial API and implementation
//

package shell

// Functionality to get default shell interpreter path inside container.
// Default shell located in the /etc/passwd file.
// This information stored per user(in the separated column).
// So we create two information execs:
// - first one to get user id(UID) inside container;
// - second one to get content of the /etc/passwd file.
// Than with help regexp we parse /etc/passwd file to get default shell
// for current user by UID. In case error we setup default shell: "/bin/sh".
