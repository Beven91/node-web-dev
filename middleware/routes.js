/**
 * 名称：链尚网PC主站路由列表
 * 作者：Beven
 * 日期：2016-09-02
 * 描述：无
 */

const path = require('path');

class RouteContainer {

    constructor(file) {
        this.routeMap = require(file);
    }

    /**
     * 根据url查找对应的route
     */
    match(url) {
        return this.routeMap[(url || "").toLowerCase()];
    }

    /**
     * 根据视图查找对应的route
     */
    findByView(view) {
        let routes = this.routeMap;
        let keys = Object.keys(routes);
        let k = keys.find((k) => view.indexOf(routes[k].view) > -1);
        let route = routes[k];
        if (route) {
            route.url = k;
        }
        return route;
    }
}


module.exports = RouteContainer;
