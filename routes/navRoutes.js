module.exports = (app, db) => {
    const oidc = app.locals.oidc;
    const urls = db.get("urls");

    app.get("/", async (req, res, next) => {
        console.log("Authenticated?: " + req.isAuthenticated());
        if (req.isAuthenticated()) {
            try {
                let userUrls = await urls.find({ userId: req.userContext.userinfo.sub });
                return res.render("pages/dashboard", {userAuthenticated: true, urls: userUrls});
            } catch (error) {
                next(error);
            }
        }

        res.render("pages/index", {userAuthenticated: false});
    });

    app.get("/login", oidc.ensureAuthenticated(), (req, res) => {
        res.redirect("/");
    });

    app.get("/logout", (req, res) => {
        req.logout();
        res.redirect("/");
    });
}