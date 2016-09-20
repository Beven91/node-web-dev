/**
 * 名称：监听指定目录下，指定类型文件,并且执行url重定向
 * 作者：Beven
 * 日期：2016-09-05
 * 描述：当在编辑指定视图文件时，本地会根据改动的视图名称来自动刷新网页
 */

const {
    Gaze
} = require('gaze');

class DevWatch {

    constructor(dev) {
        this.dev = dev;
    }

    /**
     * 开启监听服务
     */
    start(projects) {
        this.tryClose();
        projects = projects || [];
        let localMockDir = this.dev.options.local.localDir;
        if (localMockDir != null && localMockDir != "") {
            projects.push(localMockDir + "/**/*.js");
            projects.push(localMockDir + "/**/*.json");
        }
        let gaze = this.gaze = new Gaze(projects);
        gaze.on('changed', (...args) => this.onChanged(...args));
    }

    /**
     * 当指定文件发生改变时
     */
    onChanged(filepath) {
        if (this.dev.recordList.indexOf(filepath) < 0) {
            require('path').relative(this.dev.options.server.server,filepath)
            let routes = this.dev.routes;
            let route = routes.findByChangeFile(filepath);
            console.log(`文件:${filepath} 已改变`);
            if (route && route.view) {
                console.log(`找到对应路由${route.url},开始重定向到对应路由`);
                let url = route.staticUrl || route.url.replace("\\d+","1");
                this.dev.serverApp.redirect(url);
            } else {
                this.dev.serverApp.locationReload();
            }
        } else {
            this.dev.recordList = this.dev.recordList.filter((x) => x != filepath);
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