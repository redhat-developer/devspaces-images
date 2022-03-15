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

package jwt

import (
	"errors"
	"math/rand"
	"net/http"
	"net/url"
	"strings"
	"time"

	log "github.com/Sirupsen/logrus"
	"github.com/coreos/go-oidc/jose"
	"github.com/coreos/go-oidc/key"
	"github.com/coreos/go-oidc/oidc"

	"github.com/eclipse/che-jwtproxy/config"
	"github.com/eclipse/che-jwtproxy/jwt/keyserver"
	"github.com/eclipse/che-jwtproxy/jwt/noncestorage"
)

const (
	nonceBytes   = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/"
	nonceIdxBits = 6                   // 6 bits to represent a nonce index
	nonceIdxMask = 1<<nonceIdxBits - 1 // All 1-bits, as many as nonceIdxBits
	nonceIdxMax  = 63 / nonceIdxBits   // # of nonce indices fitting in 63 bits
)

var randSource rand.Source

func init() {
	randSource = rand.NewSource(time.Now().UnixNano())
}

func Sign(req *http.Request, key *key.PrivateKey, params config.SignerParams) error {
	// Create Claims.
	claims := jose.Claims{
		"iss": params.Issuer,
		"aud": req.URL.Scheme + "://" + req.URL.Host,
		"iat": time.Now().Unix(),
		"nbf": time.Now().Add(-params.MaxSkew).Unix(),
		"exp": time.Now().Add(params.ExpirationTime).Unix(),
		"jti": generateNonce(params.NonceLength),
	}

	// Create JWT.
	jwt, err := jose.NewSignedJWT(claims, key.Signer())
	if err != nil {
		return err
	}

	// Add it as a header in the request.
	req.Header.Add("Authorization", "Bearer "+jwt.Encode())

	return nil
}

func Verify(req *http.Request, keyServer keyserver.Reader, nonceVerifier noncestorage.NonceStorage, cookiesEnabled bool, expectedAudience string, maxSkew time.Duration, maxTTL time.Duration, publicBasePath string) (jose.Claims, error) {
	protocol := "http"
	if req.Header.Get("X-Forwarded-Proto") == "https" {
		protocol = "https"
	}

	// First, try to find the token in the query params
	var token = req.URL.Query().Get("token")

	// Try to extract the token from the header
	if token == "" {
		headerToken, err := oidc.ExtractBearerToken(req)
		if err == nil {
			token = headerToken
		}
	}

	// Try to extract token from cookie if enabled.
	if token == "" && cookiesEnabled {
		cookieExtractor := oidc.CookieTokenExtractor("access_token")
		cookieToken, err := cookieExtractor(req)
		if err == nil {
			token = cookieToken
		}
	}

	if token == "" {
		// Not found anywhere
		return nil, constructVerificationError("No JWT found", protocol, publicBasePath, req)
	}

	// Parse token.
	jwt, err := jose.ParseJWT(token)
	if err != nil {
		return nil, errors.New("Could not parse JWT")
	}

	claims, err := jwt.Claims()
	if err != nil {
		return nil, errors.New("Could not parse JWT claims")
	}

	// Verify claims.
	now := time.Now().UTC()
	kid, exists := jwt.Header["kid"]
	if !exists {
		return nil, constructVerificationError("Missing 'kid' claim", protocol, publicBasePath, req)
	}
	iss, exists, err := claims.StringClaim("iss")
	if !exists || err != nil {
		return nil, constructVerificationError("Missing or invalid 'iss' claim", protocol, publicBasePath, req)
	}
	if expectedAudience != "" {
		aud, _, err := claims.StringClaim("aud")
		if err != nil {
			return nil, constructVerificationError("Invalid 'aud' claim", protocol, publicBasePath, req)
		}
		if !verifyAudience(aud, expectedAudience) {
			return nil, constructVerificationError("Error - 'aud' claim mismatch", protocol, publicBasePath, req)
		}
	}

	exp, exists, err := claims.TimeClaim("exp")
	if !exists || err != nil {
		return nil, constructVerificationError("Missing or invalid 'exp' claim", protocol, publicBasePath, req)
	}
	if exp.Before(now) {
		return nil, constructVerificationError("Token is expired", protocol, publicBasePath, req)
	}
	nbf, exists, err := claims.TimeClaim("nbf")
	if !exists || err != nil || nbf.After(now) {
		return nil, constructVerificationError("Missing or invalid 'nbf' claim", protocol, publicBasePath, req)
	}
	iat, exists, err := claims.TimeClaim("iat")
	if !exists || err != nil || iat.Add(-maxSkew).After(now) {
		return nil, constructVerificationError("Missing or invalid 'iat' claim", protocol, publicBasePath, req)
	}
	if exp.Sub(iat) > maxTTL {
		return nil, constructVerificationError("Invalid 'exp' claim (too long)", protocol, publicBasePath, req)
	}
	jti, exists, err := claims.StringClaim("jti")
	if !exists || err != nil || !nonceVerifier.Verify(jti, exp) {
		return nil, constructVerificationError("Missing or invalid 'jti' claim", protocol, publicBasePath, req)
	}

	// Verify signature.
	publicKey, err := keyServer.GetPublicKey(iss, kid)
	if err == keyserver.ErrPublicKeyNotFound {
		return nil, err
	} else if err != nil {
		log.Errorf("Could not get public key from key server: %s", err)
		return nil, constructVerificationError("Unexpected key server error", protocol, publicBasePath, req)
	}

	verifier, err := publicKey.Verifier()
	if err != nil {
		log.Errorf("Could not create JWT verifier for public key '%s': %s", publicKey.ID(), err)
		return nil, constructVerificationError("Unexpected verifier initialization failure", protocol, publicBasePath, req)
	}

	if verifier.Verify(jwt.Signature, []byte(jwt.Data())) != nil {
		return nil, constructVerificationError("Invalid JWT signature", protocol, publicBasePath, req)
	}

	return claims, nil
}

func constructVerificationError(message string, protocol string, pathPrefix string, req *http.Request) error {
	url := composeRedirectURL(protocol, req, pathPrefix)
	return &authRequiredError{message, url}
}

func composeRedirectURL(protocol string, req *http.Request, pathPrefix string) string {
	u := *req.URL

	u.Path = singleJoiningSlash(singleJoiningSlash("/", pathPrefix), u.Path)
	u.Host = req.Host
	u.Scheme = protocol

	return u.String()
}

func verifyAudience(actual string, expected string) bool {
	actualURL, actualErr := url.ParseRequestURI(actual)
	expectedURL, expectedErr := url.ParseRequestURI(expected)
	if actualErr == nil && expectedErr == nil {
		// both are URL's
		ret := strings.EqualFold(actualURL.Scheme+"://"+actualURL.Host, expectedURL.Scheme+"://"+expectedURL.Host)
		if !ret {
			log.Errorf("aud verification failed. actual: %s, expected: %s", actual, expected)
		}

		return ret
	} else if actualErr != nil && expectedErr != nil {
		// both are simple strings
		ret := actual == expected
		if !ret {
			log.Errorf("aud verification failed. actual: %s, expected: %s", actual, expected)
		}

		return ret
	} else {
		// One is URL and another is not, which is not valid
		return false
	}
}

// https://stackoverflow.com/questions/22892120/how-to-generate-a-random-string-of-a-fixed-length-in-golang
func generateNonce(n int) string {
	b := make([]byte, n)
	for i, cache, remain := n-1, randSource.Int63(), nonceIdxMax; i >= 0; {
		if remain == 0 {
			cache, remain = randSource.Int63(), nonceIdxMax
		}
		if idx := int(cache & nonceIdxMask); idx < len(nonceBytes) {
			b[i] = nonceBytes[idx]
			i--
		}
		cache >>= nonceIdxBits
		remain--
	}
	return string(b)
}

type authRequiredError struct {
	err        string
	requestUri string
}

func (e *authRequiredError) Error() string {
	return e.err
}
