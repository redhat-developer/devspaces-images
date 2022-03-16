// Copyright 2016 CoreOS, Inc
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package memory

import (
	log "github.com/Sirupsen/logrus"
	"github.com/gregjones/httpcache"

	"github.com/eclipse/che-jwtproxy/config"
	"github.com/eclipse/che-jwtproxy/jwt/keyserver/keyregistry/keycache"
	"github.com/eclipse/che-jwtproxy/stop"
)

func init() {
	keycache.RegisterCache("memory", constructor)
}

type cache struct {
	*httpcache.MemoryCache
}

func constructor(registrableComponentConfig config.RegistrableComponentConfig) (keycache.Cache, error) {
	log.Debug("Initializing in-memory key cache.")

	return &cache{
		MemoryCache: httpcache.NewMemoryCache(),
	}, nil
}

func (c *cache) Stop() <-chan struct{} {
	return stop.AlreadyDone
}
