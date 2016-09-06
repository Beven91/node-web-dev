/**
 * 名称：browser-sync的middleware扩展，用于构造node代理站点
 * 作者：Beven
 * 日期：2016-09-02
 * 描述：主要用于处理本地websites,paycenter等项目请求，从而使不用启动java项目便能真实模拟项目运行
 */


//path
const path = require('path');
//http
const http = require('http');
//http代理
const httpProxy = require('http-proxy');
//编译器工厂
const CompilerFactory = require('../compiler/compiler.js');

//中间件默认配置数据
const defaultOptions = {
    local: true, //如果在使用在线接口获取数据出现异常，或者 当在线接口返回无效数据，时，使用本地Mock数据 默认 true
    localDir: '' //如果local:true时，本地mock数据的存放目录
}

class BrowserSyncMiddleware {

    /**
     * 构造函数
     * @param dev {DynamicViewProjectDev}
     */
    constructor(dev) {
        this.dev = dev;
        this.proxyable = (dev.options.proxy || {}).enable;
        if (this.proxyable) {
            let proxy = this.proxy = httpProxy.createProxyServer(dev.options.proxy);
            this.options = Object.assign({}, defaultOptions, dev.options.local);
            proxy.on("proxyRes", (...args) => this.onProxyResponse(...args));
            proxy.on("error", (...args) => this.onProxyResponseError(...args));
        }
    }

    /**
     * 当接收到browser-sync服务请求时
     * @param req {ClientRequest}对象
     * @param res {IncomingMessage}对象
     * @param next 后续调用链 
     */
    onReceieveRequest(req, res, next) {
        if (this.isCustomRequest()) {
            let content = "";
            //设置next函数引用
            req.originMiddlewareChain = next;
            //请求mock数据
            this.doProxyHttpRequest(req, res);
        } else {
            next();
        }
    }

    /**
     * 当调用代理接口返回response时
     * @param proxyRes 代理response
     * @param req {ClientRequest}对象
     * @param res {IncomingMessage}对象
     */
    onProxyResponse(proxyRes, req, res) {
        //修改pipe
        proxyRes.pipe = this.modifyProxyResponsePipe.bind(this, proxyRes, req, res);
    }

    /**
     * 重写proxyRes pipe输出数据，从而实现自定义数据提取，略过直接从res返回
     * @param proxyRes 代理response
     * @param req {ClientRequest}对象
     * @param res {IncomingMessage}对象
     */
    modifyProxyResponsePipe(proxyRes, req, res) {
        let content = "";
        proxyRes.on('data', (result) => (content = content + result)).on('end', (r) => this.onProxyRespnoseEnd(content, req, res));
    }

    /**
     * 当代理response返回数据完毕 这里会进行mock数据组装，并且返回对应数据或者视图
     * @param content 返回正文数据
     * @param req {ClientRequest}对象
     * @param res {IncomingMessage}对象
     */
    onProxyRespnoseEnd(content, req, res) {
        let next = req.originMiddlewareChain;
        let url = req.originalUrl;
        let route = this.dev.routes.match(url);
        let context = {
            route: route
        };
        this.dev.emit('onResponse', content, req, res);
        this.dev.emit('match', context, url, req, res);
        route = context.route;
        if (route) {
            this.doViewResponse(content, req, res, route);
        } else {
            this.doResponse(content, res);
        }
    }

    /**
     * 当获取mock数据异常
     */
    onProxyResponseError(error, req, res) {
        this.dev.emit('error', error, req, res);
        if (this.options.local) {
            this.onProxyRespnoseEnd(null, req, res);
        } else {
            this.doErrorResponse(error.stack, res);
        }
    }

    /**
     * 处理视图路由
     * @param content 返回正文数据
     * @param req {ClientRequest}对象
     * @param res {IncomingMessage}对象
     * @param route 路由对象
     */
    doViewResponse(content, req, res, route) {
        try {
            let data = this.getJson(content, route);
            let {
                view
            } = route;
            let options = {
                views: route.viewsDir
            }
            let context = {
                data: data
            };
            let compiler = CompilerFactory.getCompiler(view, options);
            if (null == compiler) {
                throw new Error("无法编译文件${view} 没有对应类型(${path.extname(view)})的编译器")
            }
            this.dev.emit('dataWrap', context);
            compiler.compile(view, context.data, (err, html) => err ? this.doErrorResponse(err, res) : this.doResponse(html, res));
        } catch (ex) {
            this.doErrorResponse(ex.stack, res);
        }
    }

    /**
     * 返回数据
     * @param data 返回给客户端的数据
     * @param res {IncomingMessage}对象
     */
    doResponse(data, res) {
        res.write(data || "返回空内容？");
        res.end();
    }

    /**
     * 执行error返回
     */
    doErrorResponse(data, res) {
        let content = data || "返回空内容？";
        let htmls = [
            '<html>',
            '   <head>',
            '       <meta charset="UTF-8">',
            '       <title>compile error</title>',
            '   </head>',
            '   <body>',
            '       <code style="white-space:pre;">',
            content.replace(/\n/g, '</br>'),
            '       </code>',
            '   </body>',
            '</html>'
        ];
        res.write(htmls.join(''));
        res.end();
    }

    /**
     * 发起一个代理请求
     */
    doProxyHttpRequest(req, res) {
        if (this.proxyable) {
            this.proxy.web(req, res, {}, (ex) => this.onProxyResponseError(ex, req, res));
        } else {
            this.onProxyRespnoseEnd(null, req, res);
        }
    }

    /**
     * 获取返回的数据
     */
    getJson(content, route) {
        let data = null;
        try {
            data = JSON.parse(content)
        } finally {

        }
        if (data == null && this.options.local) {
            data = this.getLocalMock(route);
        }
        return data;
    }

    /**
     * 获取route本地对应的mock数据
     */
    getLocalMock(route) {
        let {
            dir,
            view
        } = route;
        let ext = path.extname(view);
        let file = path.join(this.options.localDir, dir, view.replace(ext, ".js").replace(/\/|\\\\/g, "-"));
        return require(file);
    }

    /**
     * 判断当前请求是否需要进入托管处理
     */
    isCustomRequest(req) {
        return true;
    }
}

/**
 * 中间件
 * @param req {ClientRequest}
 * @param res {IncomingMessage}  
 * @param next next middlewar e 
 * @param dev {DynamicViewProjectDev}
 */
function middleware(req, res, next, dev) {
    (new BrowserSyncMiddleware(dev)).onReceieveRequest(req, res, next);
}

//公布middleware
module.exports.middleware = middleware;