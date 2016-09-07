/**
 * 名称：链尚网PC主站路由列表
 * 作者：Beven
 * 日期：2016-09-02
 * 描述：无
 */

const path = require('path');

class RouteContainer {

    constructor(file) {
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
     * 根据视图查找对应的route
     * @param view 视图路径 例如： site/home.ftl
     */
    findByView(view) {
        return this.routes.find((r) => view.indexOf(r.view.replace(/\//g, '\\')) > -1);
    }
}


module.exports = RouteContainer;