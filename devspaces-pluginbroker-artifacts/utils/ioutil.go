//
// Copyright (c) 2018-2020 Red Hat, Inc.
// This program and the accompanying materials are made
// available under the terms of the Eclipse Public License 2.0
// which is available at https://www.eclipse.org/legal/epl-2.0/
//
// SPDX-License-Identifier: EPL-2.0
//
// Contributors:
//   Red Hat, Inc. - initial API and implementation
//

package utils

import (
	"archive/tar"
	"archive/zip"
	"bufio"
	"compress/gzip"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"mime"
	"net/http"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"strings"
)

type IoUtil interface {
	Download(URL string, destPath string, useContentDisposition bool) (string, error)
	CopyResource(src string, dest string) error
	CopyFile(src string, dest string) error
	ResolveDestPath(filePath string, destDir string) string
	ResolveDestPathFromURL(url string, destDir string) string
	TempDir(string, string) (string, error)
	MkDir(string) error
	Unzip(arch string, dest string) error
	Untar(tarPath string, dest string) error
	CreateFile(file string, tr io.Reader) error
	Fetch(url string) ([]byte, error)
	GetFilesByGlob(glob string) ([]string, error)
	RemoveAll(path string) error
	ReadFile(path string) ([]byte, error)
	WriteFile(path string, data []byte) error
	RemoveFile(path string) error
	FileExists(path string) bool
}

type impl struct {
	httpClient *http.Client
}

// New creates an instance of IoUtil using the default http client.
func New() IoUtil {
	return &impl{
		httpClient: http.DefaultClient,
	}
}

// Download downloads file by provided URL and places its content to provided destPath.
// Returns error in a case of any problems.
// Returns HTTPError if downloading is caused by non 2xx response from a service accessed by URL
func (util *impl) Download(URL string, destPath string, useContentDisposition bool) (string, error) {
	resp, err := util.httpClient.Get(URL)
	if err != nil {
		return "", err
	}
	defer Close(resp.Body)

	if resp.StatusCode != http.StatusOK {
		return "", NewHTTPError(resp, fmt.Sprintf("Downloading %s failed. Status code %v", URL, resp.StatusCode))
	}

	filePath, filename := filepath.Split(destPath)

	if useContentDisposition {
		fromHeader := func() (found bool, filename string) {
			dispo := resp.Header.Get("Content-Disposition")
			if dispo == "" {
				return
			}

			_, params, err := mime.ParseMediaType(dispo)
			if err != nil {
				return
			}

			contentDispoFilename := params["filename"]
			if strings.HasSuffix(contentDispoFilename, "/") || strings.Contains(contentDispoFilename, "\x00") {
				return
			}
			contentDispoFilename = path.Base(path.Clean("/" + contentDispoFilename))
			if contentDispoFilename == "." || contentDispoFilename == "/" {
				return
			}
			return true, contentDispoFilename
		}

		if found, contentDispoFilename := fromHeader(); found {
			filename = contentDispoFilename
		}
	}

	destPath = filepath.Join(filePath, filename)

	out, err := os.Create(destPath)
	if err != nil {
		return "", err
	}
	defer Close(out)

	_, err = io.Copy(out, resp.Body)
	if err != nil {
		return "", err
	}

	return destPath, out.Sync()
}

// Fetch downloads data from URL and returns the bytes in the response.
func (util *impl) Fetch(URL string) ([]byte, error) {
	resp, err := util.httpClient.Get(URL)
	if err != nil {
		return nil, fmt.Errorf("failed to get data from %s: %s", URL, err)
	}
	defer Close(resp.Body)

	if resp.StatusCode != http.StatusOK {
		return nil, NewHTTPError(resp, fmt.Sprintf("Downloading %s failed. Status code %v", URL, resp.StatusCode))
	}

	data, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, NewHTTPError(resp, fmt.Sprintf("failed to read response body: %s", err))
	}
	return data, nil
}

func (util *impl) TempDir(baseDir string, prefix string) (dirPath string, err error) {
	return ioutil.TempDir(baseDir, prefix)
}

func (util *impl) MkDir(dir string) error {
	return os.MkdirAll(dir, 0755)
}

func (util *impl) CopyResource(src string, dest string) error {
	cmd := exec.Command("cp", "-r", src, dest)
	return cmd.Run()
}

func (util *impl) CopyFile(src string, dest string) error {
	to, err := os.Create(dest)
	if err != nil {
		return err
	}
	defer Close(to)

	from, err := os.Open(src)
	if err != nil {
		return err
	}
	defer Close(from)

	_, err = io.Copy(to, from)
	if err != nil {
		return err
	}

	return to.Sync()
}

func (util *impl) ResolveDestPath(filePath string, destDir string) string {
	destName := filepath.Base(filePath)
	destPath := filepath.Join(destDir, destName)
	return destPath
}

func (util *impl) ResolveDestPathFromURL(url string, destDir string) string {
	tokens := strings.Split(url, "/")
	fileName := tokens[len(tokens)-1]
	destPath := filepath.Join(destDir, fileName)
	return destPath
}

func (util *impl) Unzip(arch string, dest string) error {
	r, err := zip.OpenReader(arch)
	if err != nil {
		return err
	}
	defer Close(r)

	if err := os.MkdirAll(dest, 0755); err != nil {
		return err
	}

	// Closure to address file descriptors issue with all the deferred .Close() methods
	extractAndWriteFile := func(f *zip.File) error {
		rc, err := f.Open()
		if err != nil {
			return err
		}
		defer func() {
			if err := rc.Close(); err != nil {
				panic(err)
			}
		}()

		path := filepath.Join(dest, f.Name)

		if f.FileInfo().IsDir() {
			return os.MkdirAll(path, 0755)
		} else {
			if err := os.MkdirAll(filepath.Dir(path), 0775); err != nil {
				return err
			}
			f, err := os.OpenFile(path, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, f.Mode())
			if err != nil {
				return err
			}
			defer func() {
				if err := f.Close(); err != nil {
					panic(err)
				}
			}()

			_, err = io.Copy(f, rc)
			if err != nil {
				return err
			}

			return f.Sync()
		}
	}

	for _, f := range r.File {
		err := extractAndWriteFile(f)
		if err != nil {
			return err
		}
	}

	return nil
}

func (util *impl) Untar(tarPath string, dest string) error {
	file, err := os.Open(tarPath)
	if err != nil {
		return err
	}
	gzr, err := gzip.NewReader(bufio.NewReader(file))
	if err != nil {
		return err
	}
	defer Close(gzr)

	tr := tar.NewReader(gzr)

	for {
		header, err := tr.Next()

		switch {
		// no more files, unpacking is finished
		case err == io.EOF:
			return nil

		case err != nil:
			return err

			// skip empty header
		case header == nil:
			continue
		}

		tarEntry := filepath.Join(dest, header.Name)

		switch header.Typeflag {
		case tar.TypeDir:
			if err := os.MkdirAll(tarEntry, 0755); err != nil {
				return err
			}
		case tar.TypeReg:
			if err := util.createContainingDir(tarEntry); err != nil {
				return err
			}
			if err := util.CreateFile(tarEntry, tr); err != nil {
				return err
			}
		default:
			log.Printf("Unexpected entry in tar archive is skipped. Type: %x Path: %s", header.Typeflag, tarEntry)
		}
	}
}

func (util *impl) createContainingDir(filePath string) error {
	dirPath := filepath.Dir(filePath)
	return os.MkdirAll(dirPath, 0755)
}

func (util *impl) CreateFile(file string, tr io.Reader) error {
	f, err := os.Create(file)
	if err != nil {
		return err
	}
	defer Close(f)
	if _, err := io.Copy(f, tr); err != nil {
		return err
	}
	return f.Sync()
}

// GetFilesByGlob is a wrapper around filepath.Glob() to allow mocking in tests
func (util *impl) GetFilesByGlob(glob string) ([]string, error) {
	return filepath.Glob(glob)
}

// RemoveAll is a wrapper around os.RemoveAll() to allow mocking in tests
func (util *impl) RemoveAll(path string) error {
	return os.RemoveAll(path)
}

func Close(c io.Closer) {
	err := c.Close()
	if err != nil {
		log.Println(err)
	}
}

// ReadFile is a wrapper around ioutil.ReadFile() to allow mocking in tests
func (util *impl) ReadFile(path string) ([]byte, error) {
	return ioutil.ReadFile(path)
}

// DumpFile is a wrapper around ioutil.WriteFile() to allow mocking in tests.
// Writes files with 0666 permissions.
func (util *impl) WriteFile(path string, data []byte) error {
	return ioutil.WriteFile(path, data, 0666)
}

// RemoveFile is a wrapper around os.Remove to allow mocking in tests.
func (util *impl) RemoveFile(path string) error {
	return os.Remove(path)
}

// FileExists checks if a file exists using os.Stat. If os.Stat returns any error,
// false is returned.
func (util *impl) FileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}
