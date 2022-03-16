package api

import (
	"net/http"
	"net/url"

	assetfs "github.com/elazarl/go-bindata-assetfs"
	"github.com/gorilla/mux"
	"github.com/traefik/traefik/v2/pkg/log"
)

// DashboardHandler expose dashboard routes.
type DashboardHandler struct {
	Assets *assetfs.AssetFS
}

// Append add dashboard routes on a router.
func (g DashboardHandler) Append(router *mux.Router) {
	if g.Assets == nil {
		log.WithoutContext().Error("No assets for dashboard")
		return
	}

	// Expose dashboard
	router.Methods(http.MethodGet).
		Path("/").
		HandlerFunc(func(resp http.ResponseWriter, req *http.Request) {
			http.Redirect(resp, req, safePrefix(req)+"/dashboard/", http.StatusFound)
		})

	router.Methods(http.MethodGet).
		PathPrefix("/dashboard/").
		Handler(http.StripPrefix("/dashboard/", http.FileServer(g.Assets)))
}

func (g DashboardHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// allow iframes from our domains only
	// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/frame-src
	w.Header().Set("Content-Security-Policy", "frame-src 'self' https://traefik.io https://*.traefik.io;")
	http.FileServer(g.Assets).ServeHTTP(w, r)
}

func safePrefix(req *http.Request) string {
	prefix := req.Header.Get("X-Forwarded-Prefix")
	if prefix == "" {
		return ""
	}

	parse, err := url.Parse(prefix)
	if err != nil {
		return ""
	}

	if parse.Host != "" {
		return ""
	}

	return parse.Path
}
