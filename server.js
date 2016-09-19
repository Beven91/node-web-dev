/**
 * 名称：browser-sync构建本地网站服务
 * 作者：Beven
 * 日期：2016-09-05
 * 描述：无
 */

//broser-sync
const BrowserSync = require("browser-sync");

//分离编译器中间件
const middleware = require('./middleware/browsersync.middleware.js').middleware;

//默认配置参数
const defaultsOptions = {
    "server": "", //服务器根目录
    "files": ["**/*.js", "**/*.css"], //要监听的文件或者目录，当该目录下文件改动，会自动同步通常用于css或者js
    "indexReplace":"/"  //当代理数据时，默认访问/目录转向到indexReplace对应的url
}


class ServerApp {

    constructor(options) {
        this.options = Object.assign({}, defaultsOptions, options);
    }

    /**
     * 启动网站服务
     * @param dev  DynamicViewProjectDev实例
     */
    start(dev) {
        //配置参数
        let options = this.options;
        //browsersync
        this.browserSync = BrowserSync.create();
        dev.indexReplace = options.indexReplace;
        // .init 启动服务器
        this.server = this.browserSync.init({
            server: options.server,
            files: options.files,
            index:options.index,
            port:options.port || 3000,
            middleware: (req, res, next) => middleware(req, res, next, dev)
        }, () =>{
             dev.externalUrl = this.server.getOption('urls').get('external');
             dev.indexUrl = dev.externalUrl+"/"+options.index;
             dev.emit('onReady');
        });
    }

    /**
     * 执行一段客户端脚本
     */
    executeScript(content) {
        let instance = this.server;
        let scripts = `(function(){ (new top.Function('${content}')).apply(top); }());this.frameElement.remove()`;
        instance.ui.addElement(instance.ui.clients, {
            type: 'dom',
            tagName: 'iframe',
            attrs: {
                "style": "display:none",
                "src": `javascript:${scripts}`
            }
        });
    }

    /**
     * 刷新所有客户端
     */
    locationReload() {
        this.executeScript('location.reload(true)');
    }

    /**
     * 所有客户端重定向到指定url
     * @param url 新的url地址
     */
    redirect(url) {
        this.executeScript(`location.href="${url}"`);
    }
}

//公布引用
module.exports = ServerApp;