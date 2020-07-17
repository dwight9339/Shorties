module.exports = (app, db) => {
    const oidc = app.locals.oidc;
    const urls = db.get("urls");

    app.get("/", async (req, res, next) => {
        console.log("Authenticated?: " + req.isAuthenticated());
        if (req.isAuthenticated()) {
            try {
                let userUrls = await urls.find({ userId: req.userContext.userinfo.sub });
                console.log(userUrls);
                return res.render("pages/dashboard", {userAuthenticated: true, urls: userUrls});
            } catch (error) {
                console.log("Could not fetch urls");
                res.send({message: "Unable to get user data"});
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