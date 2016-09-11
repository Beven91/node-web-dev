/**
 * 名称:可视化配置中心
 * 作者：Beven
 * 日期：2016-09-10
 * 描述：用于在线配置node-web-dev
 */

//path
const path = require('path');
//broser-sync
const BrowserSync = require("browser-sync");

class DevAppServer {

    constructor() {

    }

    /**
     * 启动配置站点
     */
    start() {
        //browsersync
        this.browserSync = BrowserSync.create();
        //启动服务器
        this.server = this.browserSync.init({
            server: path.join(__dirname, './front/'),
            files: ['**/*.css', '**/*.js', '**/*.html'],
            index: '/',
            port: 9909,
            middleware: (...args) => this.controller(...args),
        });
    }

    /**
     * 路由请求处理
     */
    controller(req, res, next) {
        next();
    }
}

module.exports = DevAppServer;