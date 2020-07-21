const { nanoid } = require("nanoid");
const { promisify } = require("util");
const yup = require("yup");
const redis = require("redis");

const schema = yup.object().shape({
    code: yup.string().trim().matches(/[\w\-]/i),
    url: yup.string().trim().url().required(),
    userId: yup.string()
});

module.exports = (app, db, code_cache, recent_cache) => {
    const oidc = app.locals.oidc;
    const urls = db.get("urls");
    const codes = db.get("codes");
    const pushCode = promisify(code_cache.rpush).bind(code_cache);
    const popCode = promisify(code_cache.lpop).bind(code_cache);
    const setRecent = promisify(recent_cache.hmset).bind(recent_cache);
    const getRecent = promisify(recent_cache.hgetall).bind(recent_cache);
    const deleteRecent = promisify(recent_cache.del).bind(recent_cache);
    
    urls.createIndex({code: 1}, {unique: true});

    app.get("/go/:code", async (req, res, next) => {
        const { code } = req.params;
    
        try {
            const recent = await getRecent(code);
            console.log(recent);
            if (recent){
                return res.redirect(recent.url);
            } else {
                const url = await urls.findOne({ code });
                if (url) {
                    await setRecent(code, {
                        "url": url.url
                    });
                    return res.redirect(url.url);
                }
                return res.redirect("/?error=Not found");
            }
        } catch(error) {
            next(error);
        }
    });
    
    app.post("/newurl", oidc.ensureAuthenticated(), async (req, res, next) => {
        let { code, url } = req.body;
        const userId = req.userContext.userinfo.sub;

        try {
            if (!code){
                const cached = await popCode("codes");
                if (cached) {
                    code = cached;
                } else {
                    code = nanoid(7);
                }
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
            await deleteRecent(code);
            await pushCode("codes", code);
            res.json(deleted);
        } catch (error) {
            next(error);
        }
    });
}