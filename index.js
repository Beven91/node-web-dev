/**
 * 名称：用于前后端开发式分离
 * 作者：Beven
 * 日期：2016-09-05
 * 描述：
 *      例如：在后端使用java或者asp.net情况下
 *      我们可能会吧css和js以及images等静态资源抽出来独立为一个项目，
 *      但是有时候我们并不想吧后端的视图也抽离出来，这时候我们往往需要启动后端项目来开发，
 *      如果在不需要启动后端项目的情况下，也想单独使用node项目来mock后端项目，那么当前的工具就是用于解决
 *      这个问题，当前工具目前仅支持freemarker后端视图模板编译
 */


/*
 {
    server: {
        "server": "",//服务器根目录
        "files": [".js", ".css"],//要监听的文件或者目录，当该目录下文件改动，会自动同步通常用于css或者js
        "index": "/",//网站默认启动路径 默认为 /
    },
    proxy: {
        target: '' //mock api的url地址 其他参见 http-proxy
    },
    local: {
        local: true,//如果在使用在线接口获取数据出现异常，或者 当在线接口返回无效数据，时，使用本地Mock数据 默认 true
        localDir: path.join(__dirname, '../../mock/') //如果local:true时，本地mock数据的存放目录
    },
    projects: [
        
    ]
}
*/

const ServerApp = require('./server.js');
const Compiler = require('./compiler/compiler.js');
const FtlCompiler = require('./compiler/compiler.freemarker.js');
const DevWatch = require('./watch/watch.js');
//路由管理对象
const RouteContainer = require('./middleware/routes.js');

const EventEmitter = require('eventemitter3');


//默认配置
const defaultsOptions = {
    server: {},//服务器配置
    proxy: {},//代理mock 配置
    local: {},//本地mock配置
    projects: [], //哪些包含视图的后端项目的绝对路径
    route: ''//路由配置文件，可以是.json或者.js 并且expors必须为对象
}

class DynamicViewProjectDev {

    constructor(options) {
        //初始化参数
        let myOptions = this.options = Object.assign({}, defaultsOptions, options);
        //创建事件容器
        this.emitter = new EventEmitter();
        //创建路由容器
        this.routes = new RouteContainer(myOptions.route);
        //创建网站服务
        this.serverApp = new ServerApp(myOptions.server);
        //创建文件监视器
        this.watcher = new DevWatch(this);
        //注册ftl compiler
        Compiler.register(new FtlCompiler());

    }

    /**
     * 名称：绑定事件
     * @param name 事件类型名称
     * @param handler 事件函数
     */
    on(name, handler) {
        this.emitter.on(name, handler);
    }

    /**
     * 名称：执行指定类型事件
     * @param name 事件类型名称
     * @param parameter1 参数1
     * @param parameterN ... 参数N
     */
    emit(name, ...args) {
        return this.emitter.emit(name, ...args);
    }


    /**
     * 启动服务
     */
    startup() {
        this.watcher.start(this.options.projects);
        this.serverApp.start(this);
    }
}

//公布引用
module.exports = {
    DynamicViewProjectDev: DynamicViewProjectDev,
    Compiler: Compiler
}