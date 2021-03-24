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
	"bytes"
	"strconv"
	"strings"
	"testing"
)

func writeContentToTheRingBuffAndGetBack(content string) string {
	buff := New()
	buff.Write([]byte(content))

	backContent := buff.GetContent()

	return backContent
}

func TestRingBuffShouldCollect5lines(t *testing.T) {
	testLine := "go on\n and more \n foo \ntest"

	backContent := writeContentToTheRingBuffAndGetBack(testLine)

	if backContent != testLine {
		t.Error("Content was not restored ")
	}
}

func TestRingBuffShouldCollectOneLine(t *testing.T) {
	testLine := "go on"

	backContent := writeContentToTheRingBuffAndGetBack(testLine)

	if backContent != testLine {
		t.Error("Content was not restored ")
	}
}

func TestRingBuffShouldCollectTwoLines(t *testing.T) {
	testLine := "go on\n"

	backContent := writeContentToTheRingBuffAndGetBack(testLine)

	if backContent != testLine {
		t.Error("Content was not restored ")
	}
}

func TestRingBuffShouldCollectFirstEmptyLine(t *testing.T) {
	testLine := "\ngo"

	backContent := writeContentToTheRingBuffAndGetBack(testLine)

	if backContent != testLine {
		t.Error("Content was not restored ")
	}
}

func TestRingBuffShouldCollectTwoEmptyLines(t *testing.T) {
	testLine := "\n"

	backContent := writeContentToTheRingBuffAndGetBack(testLine)

	if backContent != testLine {
		t.Error("Content was not restored ")
	}
}

func TestRingBuffShouldCollectThreeEmptyLines(t *testing.T) {
	testLine := "\n\n"

	backContent := writeContentToTheRingBuffAndGetBack(testLine)

	if backContent != testLine {
		t.Error("Content was not restored ")
	}
}

func TestRingBuffShouldCollectEmptyLine(t *testing.T) {
	testLine := ""

	backContent := writeContentToTheRingBuffAndGetBack(testLine)

	if backContent != testLine {
		t.Error("Content was not restored ")
	}
}

func TestRingBuffShouldCollectThreeLines(t *testing.T) {
	testLine := "\ngo on\n"

	backContent := writeContentToTheRingBuffAndGetBack(testLine)

	if backContent != testLine {
		t.Error("Content was not restored ")
	}
}

func TestRingBuffShouldCollectContentWithFewEmptyLines(t *testing.T) {
	testLine := "\ngo on\n\n"

	backContent := writeContentToTheRingBuffAndGetBack(testLine)

	if backContent != testLine {
		t.Error("Content was not restored ")
	}
}

func TestRingBufferShouldCollectOnly800Lines(t *testing.T) {
	content := generateNLines(1011)

	backContent := writeContentToTheRingBuffAndGetBack(content)

	if !strings.HasPrefix(backContent, "testLine11\ntestLine12\n") {
		t.Error("Content was not restored ")
	}

	if !strings.HasSuffix(backContent, "testLine1009\ntestLine1010\n") {
		t.Error("Content was not restored ")
	}
}

func generateNLines(n int) string {
	var buffer bytes.Buffer
	for i := 0; i < n; i++ {
		buffer.WriteString("testLine" + strconv.Itoa(i) + "\n")
	}
	return buffer.String()
}

func TestRingShouldCollectContentDuringFewWriteOperations(t *testing.T) {

	buff := New()

	content := generateNLines(1000)
	buff.Write([]byte(content))

	spliteTestLine := "go on "
	buff.Write([]byte(spliteTestLine))

	spliteTestLine = "second"
	buff.Write([]byte(spliteTestLine))

	spliteTestLine = " third...\n"
	buff.Write([]byte(spliteTestLine))

	backContent := buff.GetContent()
	if !strings.HasPrefix(backContent, "testLine1\ntestLine2\n") {
		t.Error("Content was not restored ")
	}

	if !strings.HasSuffix(backContent, "go on second third...\n") {
		t.Error("Content was not restored ")
	}
}

func TestRingShouldCollectContentDuringFewWriteOperations2(t *testing.T) {

	buff := New()

	content := generateNLines(1000)
	buff.Write([]byte(content))

	spliteTestLine := "go on "
	buff.Write([]byte(spliteTestLine))

	spliteTestLine = "second\n test"
	buff.Write([]byte(spliteTestLine))

	spliteTestLine = " for test"
	buff.Write([]byte(spliteTestLine))

	backContent := buff.GetContent()
	if !strings.HasPrefix(backContent, "testLine2\ntestLine3\n") {
		t.Error("Content was not restored ")
	}

	if !strings.HasSuffix(backContent, "go on second\n test for test") {
		t.Error("Content was not restored ")
	}
}
