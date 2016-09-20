/**
 * 名称：链尚网PC主站路由列表
 * 作者：Beven
 * 日期：2016-09-02
 * 描述：无
 */

const path = require('path');
const fs = require('fs');

class RouteContainer {

    constructor(file) {
        this.file = file;
        this.routes = require(file);
        if (this.routes == null) {
            throw new Error(`没有的取到路由${file}`);
        }
    }

    /**
     * 根据url查找对应的route
     * @param pathname 请求url的pathname 不包含？号参数
     */
    match(pathname) {
        return this.routes.find((r) => (new RegExp(`^${r.url}$`).test(pathname)));
    }

    /**
     * 根据request对象匹配对应的路由 注意此函数会匹配method是否一致
     * @param req {ClientRequest}
     */
    matchByRequest(req) {
        if (req) {
            let pathname = req.originalUrl.split('?')[0];
            let route = this.match(pathname);
            if (route) {
                let method1 = (route.method || "").toLowerCase();
                let method2 = req.method.toLowerCase();
                route = (method1 == method2) ? route : null;
            }
            return route;
        } else {
            return null;
        }
    }

    /**
     * 根据本地mock查找对应的route
     */
    findByChangeFile(file) {
        file = file || "";
        let ext = (v) => v && path.extname(v);
        let normalize = (v) => (v || "").replace(/\//g, '\\');
        let normalize2 = (v) => (v || "").replace(ext(v), ".js").replace(/\/|\\\\/g, "-");
        let containsView = (v) => file.indexOf(normalize(v.view || "______")) > -1;
        let containsMock = (v) => file.indexOf(normalize2(v.mock || "______")) > -1;
        let sortView = (a,b)=>(a.view||"").length<(b.view||"").length?1:-1;
        let sortMock = (a,b)=>(a.mock||"").length<(b.mock||"").length?1:-1;
        let containsHandler = ext(file) != ".js" ? containsView : containsMock;
        let sortHandler = containsHandler==containsView?sortView:sortMock;
        let filters = this.routes.filter((r) => containsHandler(r));
        filters = filters.sort(sortHandler);
        return filters[0];
    }

    /**
     * 保存路由
     */
    save() {
        fs.writeFileSync(this.file, JSON.stringify(this.routes, null, 4));
    }
}


module.exports = RouteContainer;