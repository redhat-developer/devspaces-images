"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenIDConnectAuth = void 0;
const tslib_1 = require("tslib");
const openid_client_1 = require("openid-client");
const rfc4648_1 = require("rfc4648");
const util_1 = require("util");
class OpenIDConnectAuth {
    constructor() {
        // public for testing purposes.
        this.currentTokenExpiration = 0;
    }
    static decodeJWT(token) {
        const parts = token.split('.');
        if (parts.length !== 3) {
            return null;
        }
        const header = JSON.parse(new util_1.TextDecoder().decode(rfc4648_1.base64url.parse(parts[0], { loose: true })));
        const payload = JSON.parse(new util_1.TextDecoder().decode(rfc4648_1.base64url.parse(parts[1], { loose: true })));
        const signature = parts[2];
        return {
            header,
            payload,
            signature,
        };
    }
    static expirationFromToken(token) {
        const jwt = OpenIDConnectAuth.decodeJWT(token);
        if (!jwt) {
            return 0;
        }
        return jwt.payload.exp;
    }
    isAuthProvider(user) {
        if (!user.authProvider) {
            return false;
        }
        return user.authProvider.name === 'oidc';
    }
    /**
     * Setup the authentication header for oidc authed clients
     * @param user user info
     * @param opts request options
     * @param overrideClient for testing, a preconfigured oidc client
     */
    applyAuthentication(user, opts, overrideClient) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const token = yield this.getToken(user, overrideClient);
            if (token) {
                opts.headers.Authorization = `Bearer ${token}`;
            }
        });
    }
    getToken(user, overrideClient) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!user.authProvider.config) {
                return null;
            }
            if (!user.authProvider.config['client-secret']) {
                user.authProvider.config['client-secret'] = '';
            }
            if (!user.authProvider.config || !user.authProvider.config['id-token']) {
                return null;
            }
            return this.refresh(user, overrideClient);
        });
    }
    refresh(user, overrideClient) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (this.currentTokenExpiration === 0) {
                this.currentTokenExpiration = OpenIDConnectAuth.expirationFromToken(user.authProvider.config['id-token']);
            }
            if (Date.now() / 1000 > this.currentTokenExpiration) {
                if (!user.authProvider.config['client-id'] ||
                    !user.authProvider.config['refresh-token'] ||
                    !user.authProvider.config['idp-issuer-url']) {
                    return null;
                }
                const client = overrideClient ? overrideClient : yield this.getClient(user);
                const newToken = yield client.refresh(user.authProvider.config['refresh-token']);
                user.authProvider.config['id-token'] = newToken.id_token;
                user.authProvider.config['refresh-token'] = newToken.refresh_token;
                this.currentTokenExpiration = newToken.expires_at || 0;
            }
            return user.authProvider.config['id-token'];
        });
    }
    getClient(user) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const oidcIssuer = yield openid_client_1.Issuer.discover(user.authProvider.config['idp-issuer-url']);
            return new oidcIssuer.Client({
                client_id: user.authProvider.config['client-id'],
                client_secret: user.authProvider.config['client-secret'],
            });
        });
    }
}
exports.OpenIDConnectAuth = OpenIDConnectAuth;
//# sourceMappingURL=oidc_auth.js.map