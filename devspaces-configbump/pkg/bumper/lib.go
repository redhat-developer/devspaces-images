package bumper

import "regexp"

// Detection abstracts a process detection. Use the DetectPid or DetectCommand factory
// methods to create individual instances.
type Detection interface {
	matches(*process) bool
}

// DetectCommand function returns a new detection instance from the given string. The
// string must be a valid regular expression otherwise error is returned.
func DetectCommand(command string) (Detection, error) {
	r, err := regexp.Compile(command)
	if err != nil {
		return nil, err
	}

	d := regexDetection{Regex: r}

	return &d, nil
}

// DetectPid returns a detection of a process with the provided PID.
func DetectPid(pid int32) Detection {
	return &pidDetection{Pid: pid}
}

type process struct {
	Commandline string
	Pid         int32
}

type regexDetection struct {
	Regex *regexp.Regexp
}

type pidDetection struct {
	Pid int32
}

func (d *regexDetection) matches(p *process) bool {
	return d.Regex.MatchString(p.Commandline)
}

func (d *pidDetection) matches(p *process) bool {
	return d.Pid == p.Pid
}

// Bumper is responsible for sending a signal to a process it tries to find using criteria given in the New function.
type Bumper struct {
	processHierarchy []Detection
	currentProcess   *process
	signal           string
}

// New constructs a new Bumper instance. The provided detections represent the desired process hierarchy.
// The first element is the process to detect, the second element is its parent process, etc.
func New(signal string, ds []Detection) Bumper {
	return Bumper{processHierarchy: ds, signal: signal}
}

// Bump tries to find the process matching the criteria of the Bumper and will send a configured signal to it.
func (b *Bumper) Bump() error {
	process, err := b.detectProcess()
	if err != nil {
		return err
	}

	if process == nil {
		return nil
	}

	for _, d := range b.processHierarchy {
		if d.matches(process) {
			// TODO signal the process using "kill -signal PID"
		}
	}

	return nil
}

func (b *Bumper) detectProcess() (*process, error) {
	if b.currentProcess == nil {
		// TODO implement
	} else {
		b.checkProcessExists()
	}

	return b.currentProcess, nil
}

func (b *Bumper) checkProcessExists() {
	// TODO check the process still exists and corresponds to the currentProcess struct
}
