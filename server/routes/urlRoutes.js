const { nanoid } = require("nanoid");
const yup = require("yup");

const schema = yup.object().shape({
    code: yup.string().trim().matches(/[\w\-]/i),
    url: yup.string().trim().url().required(),
    userId: yup.string()
});

module.exports = (app, db) => {
    const oidc = app.locals.oidc;
    const urls = db.get("urls");
    urls.createIndex({code: 1}, {unique: true});

    app.get("/go/:code", async (req, res) => {
        const { code } = req.params;
        console.log(code);
    
        try {
            const url = await urls.findOne({ code });
            if (url) {
                res.redirect(url.url);
            }
            res.redirect("/?error=Not found");
        } catch(error) {
            res.redirect("/?error=Not found");
        }
    });
    
    app.post("/newurl", oidc.ensureAuthenticated(), async (req, res, next) => {
        let { code, url } = req.body;
        const userId = req.userContext.userinfo.sub;

        try {
            if (!code){
                code = nanoid(7);
            }

            await schema.validate({
                code,
                url, 
                userId
            });
            
            const created = await urls.insert({ code, url, userId });
            res.render("partials/urlCard", { url: {url, code}}, (err, html) => {
                if (err) {
                    console.log(err);
                } else {
                    res.set('Content-Type', 'text/html');
                    return res.send(html);
                }
            });
        } catch(error) {
            next(error);
        }
    });

    app.post("/deleteurl", oidc.ensureAuthenticated(), async (req, res, next) => {
        const { code } = req.body;
        const userId = req.userContext.userinfo.sub;

        try {
            const deleted = await urls.remove({ code, userId });
            res.json(deleted);
        } catch (error) {
            next(error);
        }
    });
}