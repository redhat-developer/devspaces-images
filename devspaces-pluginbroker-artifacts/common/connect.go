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

package common

import (
	"log"
	"net/http"
	"path/filepath"

	"crypto/tls"
	"crypto/x509"
	"io/ioutil"

	jsonrpc "github.com/eclipse/che-go-jsonrpc"
	"github.com/eclipse/che-go-jsonrpc/event"
	"github.com/eclipse/che-go-jsonrpc/jsonrpcws"
)

type tunnelBroadcaster struct {
	tunnel *jsonrpc.Tunnel
}

func (tb *tunnelBroadcaster) Close() { tb.tunnel.Close() }

func (tb *tunnelBroadcaster) Accept(e event.E) {
	if err := tb.tunnel.Notify(e.Type(), e); err != nil {
		log.Fatalf("Trying to send event of type '%s' to closed tunnel '%s'", e.Type(), tb.tunnel.ID())
	}
}

// ConfigureCertPool trusts given certificates
// CAFilePath is a path to file which contains CA certificates.
//   Usually it contains Che server self-signed certificate.
// CADirPath is a path to directory with CA certificates files.
//   Usually they contain all the trusted CA in the cluster.
func ConfigureCertPool(CAFilePath string, CADirPath string) {
	if CAFilePath == "" && CADirPath == "" {
		// Do nothing
		return
	}

	rootCAs, _ := x509.SystemCertPool()
	if rootCAs == nil {
		rootCAs = x509.NewCertPool()
	}

	if CAFilePath != "" {
		certs, err := ioutil.ReadFile(CAFilePath)
		if err != nil {
			log.Fatalf("Failed to read custom certificate %q. Error: %v", CAFilePath, err)
		}

		// Append our cert to the system pool
		if ok := rootCAs.AppendCertsFromPEM(certs); !ok {
			log.Fatalf("Failed to append %q to RootCAs: %v", CAFilePath, err)
		}
	}

	if CADirPath != "" {
		// Add all certificates from the given directory
		files, err := ioutil.ReadDir(CADirPath)
		if err != nil {
			log.Fatalf("Failed to read certificates from directory %q. Error: %v", CADirPath, err)
		}
		// Iterate over all files in the given directory
		for _, file := range files {
			if file.IsDir() {
				continue
			}
			fileExt := filepath.Ext(file.Name())
			// Look up only for certificate files
			if fileExt == ".crt" || fileExt == ".pem" {
				certsFilePath := filepath.Join(CADirPath, file.Name())
				certs, err := ioutil.ReadFile(certsFilePath)
				if err != nil {
					// Log error and continue
					log.Printf("Failed to read certificate from file %q. Error: %v", certsFilePath, err)
					continue
				}
				// Append certs from the file to the system pool
				if ok := rootCAs.AppendCertsFromPEM(certs); !ok {
					// Log error and continue
					log.Printf("Failed to append %q to RootCAs.", file)
					continue
				}
			}
		}
	}

	// Trust the augmented cert pool in our client
	jsonrpcws.DefaultDialer.TLSClientConfig = &tls.Config{
		RootCAs: rootCAs,
	}

	http.DefaultTransport.(*http.Transport).TLSClientConfig = &tls.Config{
		RootCAs: rootCAs,
	}
}

func ConnectOrFail(endpoint string, token string) *jsonrpc.Tunnel {
	tunnel, err := Connect(endpoint, token)
	if err != nil {
		log.Fatalf("Couldn't connect to endpoint '%s', due to error '%s'", endpoint, err)
	}
	return tunnel
}

func Connect(endpoint string, token string) (*jsonrpc.Tunnel, error) {
	conn, err := jsonrpcws.Dial(endpoint, token)
	if err != nil {
		return nil, err
	}
	return jsonrpc.NewManagedTunnel(conn), nil
}
