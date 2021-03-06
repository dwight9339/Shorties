const { ExpressOIDC } = require("@okta/oidc-middleware");
const session = require("cookie-session");

module.exports = app => {
    const oidc = new ExpressOIDC({
        client_id: process.env.OKTA_CLIENT_ID,
        client_secret: process.env.OKTA_CLIENT_SECRET,
        issuer: `${process.env.OKTA_ORG_URL}/oauth2/default`,
        redirect_uri: `${process.env.HOST_URL}/authorization-code/callback`,
        scope: "openid profile"
    });

    app.use(session({
        secret: process.env.SESSION_SECRET,
        maxAge: 1000*60*60*24
    }));
    app.use(oidc.router);
    app.locals.oidc = oidc;
}