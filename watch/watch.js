/**
 * 名称：监听指定目录下，指定类型文件,并且执行url重定向
 * 作者：Beven
 * 日期：2016-09-05
 * 描述：当在编辑指定视图文件时，本地会根据改动的视图名称来自动刷新网页
 */

const {GAZE} = require('gaze');

const Routes = require('../middleware/routes.js');

class DevWatch {

    constructor(dev) {
        this.dev = dev;
    }

    /**
     * 开启监听服务
     */
    start(projects) {
        this.tryClose();
        let gaze = this.gaze = new GAZE(projects);
        gaze.on('changed', (...args) => this.onChanged(...args));
    }

    /**
     * 当指定文件发生改变时
     */
    onChanged(filepath) {
        let route = Routes.findByView(filepath);
        if(route){
            this.dev.serverApp.redirect(route.url);
        }
    }

    /**
     * 关闭监听
     */
    tryClose() {
        if (this.gaze) {
            this.gaze.close();
        }
    }
}

module.exports = DevWatch;