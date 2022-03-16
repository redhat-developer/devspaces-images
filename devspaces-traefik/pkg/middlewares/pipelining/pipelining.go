package pipelining

import (
	"bufio"
	"context"
	"net"
	"net/http"

	"github.com/traefik/traefik/v2/pkg/log"
	"github.com/traefik/traefik/v2/pkg/middlewares"
)

const (
	typeName = "Pipelining"
)

// pipelining returns a middleware.
type pipelining struct {
	next http.Handler
}

// New returns a new pipelining instance.
func New(ctx context.Context, next http.Handler, name string) http.Handler {
	log.FromContext(middlewares.GetLoggerCtx(ctx, name, typeName)).Debug("Creating middleware")

	return &pipelining{
		next: next,
	}
}

func (p *pipelining) ServeHTTP(rw http.ResponseWriter, r *http.Request) {
	// https://github.com/golang/go/blob/3d59583836630cf13ec4bfbed977d27b1b7adbdc/src/net/http/server.go#L201-L218
	if r.Method == http.MethodPut || r.Method == http.MethodPost {
		p.next.ServeHTTP(rw, r)
	} else {
		p.next.ServeHTTP(&writerWithoutCloseNotify{rw}, r)
	}
}

// writerWithoutCloseNotify helps to disable closeNotify.
type writerWithoutCloseNotify struct {
	W http.ResponseWriter
}

// Header returns the response headers.
func (w *writerWithoutCloseNotify) Header() http.Header {
	return w.W.Header()
}

// Write writes the data to the connection as part of an HTTP reply.
func (w *writerWithoutCloseNotify) Write(buf []byte) (int, error) {
	return w.W.Write(buf)
}

// WriteHeader sends an HTTP response header with the provided status code.
func (w *writerWithoutCloseNotify) WriteHeader(code int) {
	w.W.WriteHeader(code)
}

// Flush sends any buffered data to the client.
func (w *writerWithoutCloseNotify) Flush() {
	if f, ok := w.W.(http.Flusher); ok {
		f.Flush()
	}
}

// Hijack hijacks the connection.
func (w *writerWithoutCloseNotify) Hijack() (net.Conn, *bufio.ReadWriter, error) {
	return w.W.(http.Hijacker).Hijack()
}
