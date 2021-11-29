//
// Copyright (c) 2019-2020 Red Hat, Inc.
// This program and the accompanying materials are made
// available under the terms of the Eclipse Public License 2.0
// which is available at https://www.eclipse.org/legal/epl-2.0/
//
// SPDX-License-Identifier: EPL-2.0
//
// Contributors:
//   Red Hat, Inc. - initial API and implementation
//

package progress

import (
	"bufio"
	"fmt"
	"log"
	"os/exec"
	"strconv"
	"strings"
	"time"
)

type Watcher struct {
	progressPercents int
	exitCode         int
	buf              *bufio.Reader
	subscribers      []func(ProgressState)
	done             chan bool
	cmd              *exec.Cmd
}

// CmdWithProgressWatching starts cmd and returns watchers that allows to track the progress
func CmdWithProgressWatching(name string, arg ...string) (*Watcher, error) {
	cmd := exec.Command(name, arg...)

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return nil, err
	}

	err = cmd.Start()
	if err != nil {
		return nil, err
	}

	return &Watcher{
		progressPercents: 0,
		buf:              bufio.NewReader(stdout),
		subscribers:      []func(ProgressState){},
		done:             make(chan bool),
		cmd:              cmd,
	}, nil
}

func (p *Watcher) Watch() {
	// track also if exec is not finished to stop automatically
	go func() {
		err := p.cmd.Wait()

		exitCode := p.cmd.ProcessState.ExitCode()
		p.stop(exitCode)

		if err != nil {
			log.Fatal(err) //fatal will call os.Exit(1)
		}
	}()

	ticker := time.NewTicker(500 * time.Millisecond)

	for {
		select {
		case <-ticker.C:
			{
				line, err := p.buf.ReadSlice('\r')
				if err != nil {
					fmt.Printf("Failed to read the next line. Cause: %s", err)
					//Let's continue restore process. Probably not critical error for process itself
					continue
				}
				var upd bool
				p.progressPercents, upd = parse(line, p.progressPercents)
				if upd {
					newState := ProgressState{
						State: "IN_PROGRESS",
						Info:  strconv.Itoa(p.progressPercents) + "%",
					}
					for _, s := range p.subscribers {
						s(newState)
					}
				}
			}
		case <-p.done:
			return
		}
	}
}

func (p *Watcher) stop(code int) {
	p.done <- false
	var state ProgressState
	if code == 0 {
		state = ProgressState{
			State: "DONE",
			Info:  "100%",
		}
	} else if code > 0 {
		state = ProgressState{
			State: "ERROR",
			Info:  fmt.Sprintf("Process exited with non-zero exit code: %s", code),
		}
	}

	for _, s := range p.subscribers {
		s(state)
	}
}

func (p *Watcher) Notify(receiver func(progress ProgressState)) {
	p.subscribers = append(p.subscribers, receiver)
}

// parse parses percents in the specified output line
// returns new value and boolean that indicated that it's changed from previous state
func parse(line []byte, prev int) (int, bool) {
	fields := strings.Fields(string(line))
	fmt.Println(fields)
	if len(fields) > 1 && strings.Contains(fields[1], "%") {
		nowStr := strings.Split(fields[1], "%")[0]
		prog, _ := strconv.Atoi(nowStr)
		if prog > prev {
			return prog, true
		}
	}
	return prev, false
}
