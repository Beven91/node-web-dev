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
     */
    match(url) {
        let k = Object.keys(this.routes).find((k) => (new RegExp(`^${k}$`).test(url)));
        return this.routes[k];
    }

    /**
     * 根据视图查找对应的route
     */
    findByView(view) {
        let routes = this.routes;
        let keys = Object.keys(routes);
        let k = keys.find((k) => view.indexOf(routes[k].view.replace(/\//g, '\\')) > -1);
        let route = routes[k];
        if (route) {
            route.url = k;
        }
        return route;
    }
}


module.exports = RouteContainer;