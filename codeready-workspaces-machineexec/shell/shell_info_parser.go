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

import (
	"errors"
	"regexp"
	"unicode"
	"unicode/utf8"
)

// Component to parse info exec output with information about default shell inside container.
type ExecInfoParser interface {
	// Parse default shell by user id from /etc/passwd file content.
	ParseShellFromEtcPassWd(etcPassWdContent string, userId string) (shell string, err error)
	// Parse user id inside container.
	ParseUID(content string) (uid string, err error)
}

// Implementation exec output parser.
type execInfoParser struct {
	ExecInfoParser
}

// Create new info exec parser.
func NewExecInfoParser() ExecInfoParser {
	return &execInfoParser{}
}

// We use content of the "/etc/passwd" file to parse shell by user name.
// For each user /etc/passwd file stores information in the separated line. Information split with help ":".
// Row information:
// - User name
// - Encrypted password
// - User ID number (UID)
// - User's group ID number (GID)
// - Full name of the user (GECOS)
// - User home directory
// - Login shel
// So, each line starts with username and ends by login shell path.
// Read more: https://www.ibm.com/support/knowledgecenter/en/ssw_aix_72/com.ibm.aix.security/passwords_etc_passwd_file.htm
func (*execInfoParser) ParseShellFromEtcPassWd(etcPassWdContent string, userId string) (shell string, err error) {
	rgExp, err := regexp.Compile(".*:.*:" + userId + ":.*:.*:.*:(?P<ShellPath>.*)")
	if err != nil {
		return "", err
	}

	result := rgExp.FindStringSubmatch(etcPassWdContent)
	// First group it's all expression, second on it's "?P<ShellPath>"
	if len(result) != 2 || result[1] == "" {
		return "", errors.New("unable to find default shell")
	}

	return result[1], nil
}

// Parse user id from exec info output.
func (*execInfoParser) ParseUID(content string) (uid string, err error) {
	var bts = []byte(content)
	var userIdString string
	for offset := 0; offset < len(bts); {
		cRune, size := utf8.DecodeRune(bts[offset:])
		offset += size
		if unicode.IsDigit(cRune) {
			userIdString += string(cRune)
		}
	}

	if userIdString == "" {
		return "", errors.New("unable to parse UID")
	}
	return userIdString, nil
}
