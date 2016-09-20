/**
 * 名称：browser-sync的middleware扩展，用于构造node代理站点
 * 作者：Beven
 * 日期：2016-09-02
 * 描述：主要用于处理本地websites,paycenter等项目请求，从而使不用启动java项目便能真实模拟项目运行
 */

//fs
const fs = require('fs');
//path
const path = require('path');
//http
const http = require('http');
//http代理
const httpProxy = require('http-proxy');
//编译器工厂
const CompilerFactory = require('../compiler/compiler.js');

//客户端监听js
const clientJs = "node-web-dev-listener.js";
const clientdir = path.join(__dirname, '../client/');

//mime
const MIME = {
    ".js": "application/javascript",
    ".html": "text/html",
    ".css": "text/css"
}

//中间件默认配置数据
const defaultOptions = {
    mode: 'auto', //本地mock模式，online:所有接口使用在线数据，auto:当在线获取失败，使用本地,local:所有接口都使用本地,existsLocal:当在本地配置有路由则使用本地的，否则使用在线的
    record: false, //是否记录在线数据到本地
    overrides: [], //如果使用的是online模式，则可以 使用此参数将代理页面中的指定域名下的资源以本地资源优先 例如:css,js等资源
    localDir: '' //如果local:true时，本地mock数据的存放目录
}

class BrowserSyncMiddleware {

    /**
     * 构造函数
     * @param dev {DynamicViewProjectDev}
     */
    constructor(dev) {
        this.dev = dev;
        this.indexReplace = dev.indexReplace;
        this.clientUrlDir = this.md5('node-web-dev-client');
        this.options = Object.assign({}, defaultOptions, dev.options.local);
        let proxyOptions = dev.options.proxy;
        this.proxy = this.createProxy(proxyOptions);
        if (proxyOptions.viewTarget) {
            //是否存在视图代理配置
            let viewProxyOptions = Object.assign({}, proxyOptions);
            viewProxyOptions.target = viewProxyOptions.viewTarget;
            this.viewProxy = this.createProxy(viewProxyOptions);
        } else {
            //设置视图代理对象为this.proxy
            this.viewProxy = this.proxy;
        }
    }

    /**
     * 当接收到browser-sync服务请求时
     * @param req {ClientRequest}对象
     * @param res {IncomingMessage}对象
     * @param next 后续调用链 
     */
    onReceieveRequest(req, res, next) {
        let pathname1 = req.url.split('/')[1];
        if (pathname1 == this.clientUrlDir) {
            this.doFileResponse(url, res);
        } else if (!this.isLocalResource(req)) {
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
        this.doIndexReplace(req, true);
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
        proxyRes.on('data', (result) => (content = content + result)).on('end', (r) => this.onProxyRespnoseEnd(content, proxyRes, req, res));
    }

    /**
     * 当代理response返回数据完毕 这里会进行mock数据组装，并且返回对应数据或者视图
     * @param content 返回正文数据
     * @param proxyRes 代理response
     * @param req {ClientRequest}对象
     * @param res {IncomingMessage}对象
     */
    onProxyRespnoseEnd(content, proxyRes, req, res) {
        let next = req.originMiddlewareChain;
        let pathname = req.originalUrl.split('?')[0];
        let route = this.dev.routes.matchByRequest(req);
        let context = {
            route: route,
            routeContainer: this.dev.routes
        };
        this.dev.emit('onResponse', content, proxyRes, req, res);
        this.dev.emit('match', context, pathname, req, res);
        route = context.route;
        let mode = this.getRouteMode(route)
        switch (mode) {
            case 'view':
                this.doViewResponse(content, req, res, route);
                break;
            case 'redirect':
                this.dev.serverApp.redirect(route.view.split('redirect:')[1]);
                break;
            case "mockjs":
                this.doMockResponse(content, req, res, route);
                break;
            default:
                this.doResponse(content, res);
                break;
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
     * 返回mode为mock时返回数据
     * @param content 在线接口返回正文数据
     * @param req {ClientRequest}对象
     * @param res {IncomingMessage}对象
     * @param route 路由对象
     */
    doMockResponse(content, req, res, route) {
        let data = null;
        let mockjs = path.join(this.options.localDir, route.dir, route.mock);
        try {
            data = JSON.parse(content);
            if (this.options.record && data) {
                this.saveLocalMock(mockjs, data);
            }
        } catch (ex) {

        }
        if (data == null) {
            data = this.getLocal(mockjs);
        }

        this.doResponse(JSON.stringify(data), res, 'application/json');
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
            if (!data && this.options.mode == 'online') {
                this.doResponse(this.doOverride(content), res, 'text/html');
            } else {
                this.doCompileViewResponse(route, data, res);
            }

        } catch (ex) {
            this.doErrorResponse(ex.stack, res, 'text/html');
        }
    }

    /**
     * 处理编译本地视图后返回
     * @param route 路由 对象
     * @param data 视图数据
     * @param res {IncomingMessage}对象
     */
    doCompileViewResponse(route, data, res) {
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
        compiler.compile(view, context.data, (err, html) => err ? this.doErrorResponse(html, res) : this.doResponse(this.wrap(html), res, 'text/html'));
    }

    /**
     * 返回指定文件内容
     * @param url
     * @param res
     * @param contentType
     */
    doFileResponse(url, res, next) {
        let pathname = url.split('?')[0];
        let file = path.join(clientdir, pathname)
        let ext = path.extname(file);
        let mine = MIME[ext];
        this.doResponse(this.readfile(file), res, mine);
    }

    /**
     * 返回数据
     * @param data 返回给客户端的数据
     * @param res {IncomingMessage}对象
     */
    doResponse(data, res, contentType) {
        if (!data) {
            contentType = "text/html";
            data = `
            <html>
               <head>
                   <meta charset="UTF-8">
                   <title>没有返回任何内容</title>
               </head>
               <body style="background:#f7f7f7">
                    <div class="" style="width: 500px;margin: 80px auto;
                                border: 1px solid #f9b4b4;
                                padding: 40px 20px 20px 20px;
                                text-align: center;
                                background: #fcc;
                                font-size: 13px;
                                color: #b13030;
                                box-shadow: 1px 1px 3px #ecadad;"
                    >
                    抱歉，没有返回任何内容，请确认代理是否访问了该地址
                    response:
                    ${(res._header || "").replace(/\n/g, '<p style="padding:0px;margin:3px;"></p>')}
                    </div>
               </body>
            </html>
            `;
        }
        if (contentType) {
            if (!res._header) {
                res.setHeader("content-type", contentType);
            } else {
                res._header = res._header.replace(/content-type\: .+/, 'content-type: ' + contentType);
            }
        }
        res.write(data, "utf8");
        res.end();
    }

    /**
     * 执行error返回
     */
    doErrorResponse(data, res) {
        let content = data || "返回空内容？";
        let htmls = content;
        if (htmls && htmls.indexOf("<html") < 0) {
            htmls = `
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>compile error</title>
                </head>
                <body style="background:#f7f7f7">
                    <div style="olor: #b13030;
                        width: 800px;
                        margin: 80px auto;
                        border: 1px solid #f9b4b4;
                        padding: 40px 20px 20px 20px;
                        text-align: left;
                        background: #fcc;
                        font-size: 13px;
                        box-shadow: 1px 1px 3px #ecadad;"
                        >
                        ${content.replace(/\n/g, '<p style="padding:0px;margin:2px;"></p>')},
                    </div>
                </body>
                </html>
            `
        }
        if (!res._header) {
            res.setHeader("content-type", "text/html");
            res.writeHead(500);
        } else {
            res._header = res._header.replace(/content-type\: .+/, 'content-type: text/html');
            res._header = 'HTTP/1.1 500 ERROR\r\n' + res._header.split('\r\n').slice(1).join('\r\n');
        }
        res.write(htmls, "utf8");
        res.end();
    }

    /**
     * 发起一个代理请求
     */
    doProxyHttpRequest(req, res) {
        if (this.isRemotable(req)) {
            let route = this.dev.routes.matchByRequest(req);
            let mode = this.getRouteMode(route);
            let proxy = null;
            switch (mode) {
                case 'view':
                    proxy = this.viewProxy;
                    break;
                default:
                    proxy = this.proxy;
                    break;
            }
            this.dev.emit('onProxy', proxy.options.target, req, res);
            this.doIndexReplace(req);
            proxy.web(req, res, {}, (ex) => this.onProxyResponseError(ex, req, res));
        } else {
            this.onProxyRespnoseEnd(null, req, res);
        }
    }

    /**
     * 静态资源重定向到本地处理
     */
    doOverride(content) {
        content = content || "";
        let overrides = this.options.overrides || [];
        if (overrides.length > 0) {
            let reg = new RegExp(overrides.join('|'), "gi");
            content = content.replace(reg, "/");
        }
        return this.wrap(content);
    }

    /**
     * 处理 / Replace
     * @param revert 是否为还原
     */
    doIndexReplace(req, revert) {
        if (req.originalUrl == '/' || req.doReplace) {
            req.doReplace = true;
            req.originalUrl = revert ? '/' : this.indexReplace;
            req.url = revert ? '/' : this.indexReplace;
        }
    }

    /**
     * 创建一个数据代理
     */
    createProxy(options) {
        let proxy = httpProxy.createProxyServer(options);
        proxy.on("proxyRes", (...args) => this.onProxyResponse(...args));
        proxy.on("error", (...args) => this.onProxyResponseError(...args));
        return proxy;
    }

    /**
     * 视图尾部追加toolbar工具栏
     */
    wrap(content) {
        return `${content}<script type="text/javascript" src="/${this.clientUrlDir}/${clientJs}“></script>`;
    }

    /**
     * 获取返回的数据
     */
    getJson(content, route) {
        let data = null;
        let {
            dir,
            view
        } = route;
        let ext = path.extname(view);
        let file = path.join(this.options.localDir, dir, view.replace(ext, ".js").replace(/\/|\\\\/g, "-"));
        try {
            data = JSON.parse(content);
            if (this.options.record && data) {
                this.saveLocalMock(file, data);
            }
        } catch (ex) {

        }
        if (data == null && this.options.mode != 'online') {
            data = this.getLocal(file);
        }
        return data;
    }

    /**
     * 保存本地文件
     */
    saveLocalMock(file, data) {
        let ext = path.extname(file);
        if (ext == ".json") {
            fs.writeFileSync(file, JSON.stringify(data, null, 4));
        } else {
            fs.writeFileSync(file, `module.exports =${JSON.stringify(data, null, 4)}`);
        }
        this.dev.recordList.push(file);
    }

    /**
     * 判断当前请求是否需要进入托管处理
     */
    isRemotable(req) {
        let route = this.dev.routes.matchByRequest(req);
        let mode = this.options.mode;
        if (mode == "local" || mode == 'existsLocal' && route) {
            return false;
        } else {
            return true;
        }
    }

    /**
     * 获取本地mock数据
     */
    getLocal(file) {
        delete require.cache[require.resolve(file)];
        return require(file);
    }

    /**
     * 获取路由处理方式
     */
    getRouteMode(route) {
        if (!route) {
            return "none";
        }
        let view = route.view || "";
        if (view.indexOf("redirect:") > -1) {
            return "redirect";
        } else if (route.mock) {
            return "mockjs";
        } else {
            return "view";
        }
    }

    /**
     * 判断是否为本地静态资源
     * @param req {ClientRequest}对象
     */
    isLocalResource(req) {
        let serverRoot = this.dev.options.server.server;
        let pathname = req.url.split('?')[0];
        let file = path.resolve(path.join(serverRoot, pathname));
        return fs.existsSync(file) && fs.statSync(file).isFile();
    }

    /**
     * 读取指定文件
     */
    readfile(file) {
        return fs.readFileSync(file, {
            encoding: 'utf8'
        });
    }

    /**
     * MD5加密
     */
    md5(str) {
        let crypto = require('crypto');
        let md5sum = crypto.createHash('md5');
        md5sum.update(str);
        str = md5sum.digest('hex');
        return str;
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