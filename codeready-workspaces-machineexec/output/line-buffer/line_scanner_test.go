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

package line_buffer

import (
	"testing"
)

func TestShouldScanTwoLines1(t *testing.T) {
	input := "\ngo"
	lineBuff := CreateLineScanner([]byte(input))

	lineBuff.Scan()
	if lineBuff.Text() != "\n" {
		t.Error("Failed to parse first line")
	}

	lineBuff.Scan()
	if lineBuff.Text() != "go" {
		t.Error("Failed to parse second line")
	}
}

func TestShouldScanTextWithoutCR(t *testing.T) {
	input := "to be or not to be"
	lineBuff := CreateLineScanner([]byte(input))

	lineBuff.Scan()
	if lineBuff.Text() != "to be or not to be" {
		t.Error("Failed to parse first line")
	}
}

func TestShouldScanEmptyContent(t *testing.T) {
	input := ""
	lineBuff := CreateLineScanner([]byte(input))

	lineBuff.Scan()
	if lineBuff.Text() != "" {
		t.Error("Failed to parse first line")
	}
}

func TestShouldScanTwoLines2(t *testing.T) {
	input := "foo   bar      baz\n"
	lineBuff := CreateLineScanner([]byte(input))

	lineBuff.Scan()
	if lineBuff.Text() != "foo   bar      baz\n" {
		t.Error("Failed to parse first line")
	}

	lineBuff.Scan()
	if lineBuff.Text() != "" {
		t.Error("Failed to parse second line")
	}
}

func TestShouldScanTwoEmptyLines1(t *testing.T) {
	input := "foo   bar      baz\n\n"
	lineBuff := CreateLineScanner([]byte(input))

	lineBuff.Scan()
	if lineBuff.Text() != "foo   bar      baz\n" {
		t.Error("Failed to parse first line")
	}

	lineBuff.Scan()
	if lineBuff.Text() != "\n" {
		t.Error("Failed to parse second line")
	}

	lineBuff.Scan()
	if lineBuff.Text() != "" {
		t.Error("Failed to parse third line")
	}
}

func TestShouldScanTwoEmptyLines2(t *testing.T) {
	input := "\n\ngo"
	lineBuff := CreateLineScanner([]byte(input))

	lineBuff.Scan()
	if lineBuff.Text() != "\n" {
		t.Error("Failed to parse first line")
	}

	lineBuff.Scan()
	if lineBuff.Text() != "\n" {
		t.Error("Failed to parse second line")
	}

	lineBuff.Scan()
	if lineBuff.Text() != "go" {
		t.Error("Failed to parse third line")
	}
}

func TestShouldScanMultiLineText(t *testing.T) {
	input := "(I´m writing a letter to someone)\n" +
		"Qué piensas de español?\n" +
		"Pues...En realidad,\n" +
		"Бути?\n\n Чи не бути?"

	lineBuff := CreateLineScanner([]byte(input))

	lineBuff.Scan()
	if lineBuff.Text() != "(I´m writing a letter to someone)\n" {
		t.Error("Failed to parse first line")
	}

	lineBuff.Scan()
	if lineBuff.Text() != "Qué piensas de español?\n" {
		t.Error("Failed to parse second line")
	}

	lineBuff.Scan()
	if lineBuff.Text() != "Pues...En realidad,\n" {
		t.Error("Failed to parse third line")
	}

	lineBuff.Scan()
	if lineBuff.Text() != "Бути?\n" {
		t.Error("Failed to parse fourth line")
	}

	lineBuff.Scan()
	if lineBuff.Text() != "\n" {
		t.Error("Failed to parse sixth line")
	}

	lineBuff.Scan()
	if lineBuff.Text() != " Чи не бути?" {
		t.Error("Failed to parse third line")
	}
}
