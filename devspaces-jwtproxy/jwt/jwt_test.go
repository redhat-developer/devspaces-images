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

package jwt_test

import (
	"crypto/x509"
	"encoding/pem"
	"errors"
	"net/http"
	"testing"
	"time"

	"github.com/coreos/go-oidc/jose"
	"github.com/coreos/go-oidc/key"
	"github.com/coreos/go-oidc/oidc"
	"github.com/eclipse/che-jwtproxy/config"
	"github.com/eclipse/che-jwtproxy/jwt"
	"github.com/eclipse/che-jwtproxy/stop"
	"github.com/stretchr/testify/assert"
)

const privateKey = `
-----BEGIN RSA PRIVATE KEY-----
MIIBOAIBAAJAZ8S1IuX54K3bLtLuf47+etBSCcutD0GzUbog92BDmJwHlEiIPsdC
VEoHN0FnV3EXSuaBpoV2mQkwDcoyq9xWkwIDAQABAkBY47x25KIkwUlc1vvO8WM1
OXbNRVg+FX3SqKrMvf2poAfGIPM9tRwrvzs8vSTcXQus9EnUnem1LWIDUkFOSXKB
AiEAqLwPnbLlly8LP+vHt6FaYcAlEAHBAE7iT22qQAVjIHECIQCdb1H0IOt9y/HB
T+yXf/F/x37RfcVvujR8/ql+YqTpQwIgf+8m//CWN0zKAMsqgEZsmtTuxPYveaZV
3NdPUH9FK2ECID7TUqgSjwdHYLVdGLQoiY4NZW1iPGzmqNWMpsTZxqeTAiBjSNOD
im92fadzPg+oTXIQIjlHhGgf7CKb5VwFuH9+gA==
-----END RSA PRIVATE KEY-----
`

type testService struct {
	// privatekey
	privkey *key.PrivateKey

	// keyserver
	issuer        string
	sendBadPubKey bool

	// noncestorage
	refuseNonce bool
}

func (ts *testService) GetPrivateKey() (*key.PrivateKey, error) {
	p := *ts.privkey
	return &p, nil
}

func (ts *testService) GetPublicKey(issuer string, keyID string) (*key.PublicKey, error) {
	if ts.issuer != issuer || ts.privkey.KeyID != keyID {
		return nil, errors.New("unknown public key")
	}

	jwk := ts.privkey.JWK()
	if ts.sendBadPubKey {
		jwk.Exponent = jwk.Exponent + 1
	}

	return key.NewPublicKey(jwk), nil
}

func (ts *testService) Verify(nonce string, expiration time.Time) bool {
	return !ts.refuseNonce
}

func (ts *testService) Stop() <-chan struct{} {
	return stop.AlreadyDone
}

func testData() (*http.Request, *signAndVerifyParams) {
	// Create a request to sign.
	req, _ := http.NewRequest("GET", "http://foo.bar:6666/ez", nil)

	// Create a public/private key pair used to sign/verify.
	pkb, _ := pem.Decode([]byte(privateKey))
	pkr, _ := x509.ParsePKCS1PrivateKey(pkb.Bytes)
	pk := &key.PrivateKey{
		KeyID:      "foo",
		PrivateKey: pkr,
	}

	// Create a test service to act as a keyserver and as a privatekey provider.
	services := &testService{
		privkey:       pk,
		issuer:        "issuer",
		sendBadPubKey: false,
		refuseNonce:   false,
	}

	// Create a default (and valid) configuration to sign and verify requests.
	aud := "http://foo.bar:6666/ez"
	defaultConfig := &signAndVerifyParams{
		services: services,
		signerParams: config.SignerParams{
			Issuer:         services.issuer,
			ExpirationTime: 1 * time.Minute,
			MaxSkew:        1 * time.Minute,
			NonceLength:    8,
		},
		aud:            aud,
		maxSkew:        time.Minute,
		maxTTL:         5 * time.Minute,
		cookiesEnabled: true,
	}

	return req, defaultConfig
}

func TestBasicSignJWT(t *testing.T) {
	req, defaultConfig := testData()
	// Basic sign / verify.
	signAndModify(t, req, *defaultConfig, nil)
	assert.Nil(t, Verify(req, *defaultConfig))
}

func TestCookiesSign(t *testing.T) {
	// Sign / verify with cookie
	req, defaultConfig := testData()
	cookieModifier := func(req *http.Request) {
		token, err := oidc.ExtractBearerToken(req)
		assert.Nil(t, err)
		req.Header.Set("Authorization", "")
		cookie := http.Cookie{Name: "access_token", Value: token}
		req.AddCookie(&cookie)
	}
	signAndModify(t, req, *defaultConfig, cookieModifier)
	assert.Nil(t, Verify(req, *defaultConfig))
}

func TestQuerySign(t *testing.T) {
	// Sign / verify with query
	req, defaultConfig := testData()
	signAndModify(t, req, *defaultConfig, nil)
	token, err := oidc.ExtractBearerToken(req)
	assert.Nil(t, err)
	queryReq, _ := http.NewRequest("GET", "http://foo.bar:6666/ez?token="+token, nil)
	queryReq.Header.Set("Authorization", "")
	assert.Nil(t, Verify(queryReq, *defaultConfig))
}

func TestWrongJTIClaim(t *testing.T) {
	// Alter a claim.
	claimModifier := func(req *http.Request) {
		token, err := oidc.ExtractBearerToken(req)
		assert.Nil(t, err)

		jwtParsed, err := jose.ParseJWT(token)
		assert.Nil(t, err)

		claims, err := jwtParsed.Claims()
		assert.Nil(t, err)

		// Alter the nonce.
		claims.Add("jti", "foo")

		// Create a new JWT having the same headers and signature but altered claims.
		// This is the only way to encode the claims with jose.
		modifiedJWT, err := jose.NewJWT(jwtParsed.Header, claims)
		assert.Nil(t, err)
		modifiedJWT.Signature = jwtParsed.Signature

		req.Header.Set("Authorization", "Bearer "+modifiedJWT.Encode())
	}
	req, defaultConfig := testData()
	signAndModify(t, req, *defaultConfig, claimModifier)
	assert.Error(t, Verify(req, *defaultConfig))
}
func TestInvalidNonce(t *testing.T) {
	req, cfg := testData()
	cfg.services.refuseNonce = true
	signAndModify(t, req, *cfg, nil)
	assert.Error(t, Verify(req, *cfg))
}

func TestInvalidAudience(t *testing.T) {
	req, cfg := testData()
	cfg.aud = "http://dummy.silly/"
	signAndModify(t, req, *cfg, nil)
	assert.Error(t, Verify(req, *cfg))
}

func TestEmptyAudience(t *testing.T) {
	req, cfg := testData()
	cfg.aud = ""
	signAndModify(t, req, *cfg, nil)
	assert.Nil(t, Verify(req, *cfg))
}

func TestWrongTTL(t *testing.T) {
	req, cfg := testData()
	cfg.maxTTL = 30 * time.Second
	signAndModify(t, req, *cfg, nil)
	assert.Error(t, Verify(req, *cfg))
}

func TestWrongExpiration(t *testing.T) {
	req, cfg := testData()
	cfg.signerParams.ExpirationTime = -time.Second
	signAndModify(t, req, *cfg, nil)
	assert.Error(t, Verify(req, *cfg))
}

func TestSignerMaxSkew(t *testing.T) {
	// Abuse the signer's MaxSkew parameter to make the JWT valid only after a minute.
	req, cfg := testData()
	cfg.signerParams.MaxSkew = -time.Minute
	signAndModify(t, req, *cfg, nil)
	assert.Error(t, Verify(req, *cfg))
}

func TestVerifierMaxSkew(t *testing.T) {
	// Abuse the verifier's MaxSkew parameter to make the JWT looks like it has been signed in the
	// future.
	req, cfg := testData()
	cfg.maxSkew = -time.Minute
	signAndModify(t, req, *cfg, nil)
	assert.Error(t, Verify(req, *cfg))
}

func TestBadPublicKey(t *testing.T) {
	// Mismatch public/private keys.
	req, cfg := testData()
	cfg.services.sendBadPubKey = true
	signAndModify(t, req, *cfg, nil)
	assert.Error(t, Verify(req, *cfg))
}

func TestBadIssuer(t *testing.T) {
	// Mismatch public/private keys.
	req, cfg := testData()
	cfg.signerParams.Issuer = "dummy"
	signAndModify(t, req, *cfg, nil)
	assert.Error(t, Verify(req, *cfg))
}

type signAndVerifyParams struct {
	services *testService

	// Sign.
	signerParams config.SignerParams

	// Verify.
	aud            string
	maxSkew        time.Duration
	maxTTL         time.Duration
	cookiesEnabled bool
}

type requestModifier func(req *http.Request)

func signAndModify(t *testing.T, req *http.Request, p signAndVerifyParams, modify requestModifier) *http.Request {
	// Sign.
	pk, _ := p.services.GetPrivateKey()
	assert.Nil(t, jwt.Sign(req, pk, p.signerParams))

	// Modify signed request.
	if modify != nil {
		modify(req)
	}
	return req
}

func Verify(req *http.Request, p signAndVerifyParams) error {
	// Verify.
	_, err := jwt.Verify(req, p.services, p.services, p.cookiesEnabled, p.aud, p.maxSkew, p.maxTTL, "")
	return err
}
