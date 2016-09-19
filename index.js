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
        "port":3000,//默认端口
        "server": "",//服务器根目录
        "files": [".js", ".css"],//要监听的文件或者目录，当该目录下文件改动，会自动同步通常用于css或者js
        "index": "/",//网站默认启动路径 默认为 /
    },
    proxy: {
        enable:true,//是否启用代理
        viewTarget:'',//视图接口数据代理地址 可以不设置，不设置情况下以target为准
        target: '' //mock api的url地址 其他参见 http-proxy
    },
    local: {
        mode: 'auto', //本地mock模式，online:所有接口使用在线数据，auto:当在线获取失败，使用本地,local:所有接口都使用本地,existsLocal:当在本地配置有路由则使用本地的，否则使用在线的
        localDir: path.join(__dirname, '../../mock/') //如果local:true时，本地mock数据的存放目录
    },
    projects: [
        
    ]
}
*/

const DevServerApp = require('./app/app.js');
const ServerApp = require('./server.js');
const Compiler = require('./compiler/compiler.js');
const FtlCompiler = require('./compiler/compiler.freemarker.js');
const DevWatch = require('./watch/watch.js');
//路由管理对象
const RouteContainer = require('./routes/route.js');

const EventEmitter = require('eventemitter3');


//默认配置
const defaultsOptions = {
    server: {}, //服务器配置
    proxy: {}, //代理mock 配置
    local: {}, //本地mock配置
    projects: [], //哪些包含视图的后端项目的绝对路径
    route: '' //路由配置文件，可以是.json或者.js 并且expors必须为对象
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
        //record的list
        this.recordList = [];
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
    DevServerApp: DevServerApp,
    DynamicViewProjectDev: DynamicViewProjectDev,
    Compiler: Compiler
}