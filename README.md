## node-web-dev

### 一、简介

一个用于在开发时前后端分离的工具，不需要启动后端网站服务，使用nodejs服务来mock请求，

进行视图渲染，ajax接口代理等，从而实现，整站mock。

举个栗子：

  后端：java springmvc + (动态视图: freemarker） ----名称： websites

  前端：javascript

  前后端在合作时，通常有以下场景：

	前端项目单独分开，在开发时使用.html静态文件 + js开发功能，开发完毕后，将视图前端资源等丢给后端开发人员转换成动态视图

  以上场景会有以下问题：

	1.视图存在两份 一份前端.html 另一份xx.动态视图,在调试样式时有时候难免会两边都需要顾全到，有时候容易造成不一致。

	2.有些情况下，前端需要启动后端服务，来进行本地调试，这样对后端项目依赖性比较大。

	3.如果要把视图分离出来，前端需要构建自己的站点，旧的模式迁到新的模式下，工作量比较大。

  那么如果不想改变现有的框架模式，可以使用本模块进行mock,

  使用本模块的mock服务有以下优点:

	1.不需要调整现有框架，前端只需要把后端项目拉取到本地，通过配置就能实现mock方式浏览整站，并且独立开发

	2.前后端可以并行开发，前端无需等待后端接口开发完毕，才能调试。

	3.支持调用ajax接口时，代理到其他环境，例如：开发环境，测试环境等。

	4.视图交给前端维护，便于管理  (不过部分后端动态视图前端学起来会有些成本，当然仅仅是针对这些特定场景定制，而不是通用所有人群)

### 二、安装

    npm install node-web-dev --save-dev
    
### 三、环境要求

    1. nodejs v6.2+  (目前使用es6语法所写，暂时不打算转换成es5)
    
    2. jdk  (在使用freemakre 需要依赖于jdk) 安装代价不大
    
    
### 四、都支持哪些动态视图编译?

    目前仅支持freemarker的视图编译，后续部分会实现其他较为纯粹的动态视图
     
### 五、用例
	
     var DynamicViewProjectDev = require('node-web-dev').DynamicViewProjectDev;	
	
     var options = {
        server: {
            "server": "../webapp/", 
            "files": ['../webapp/**/*.css', '../webapp/**/*.js'], 
            "index": "/", 
        },
        proxy: {
            target: 'http://10.21.11.161:8010' 
        },
        local: {
            local: 'auto', 
            localDir: path.join(__dirname, '../../../mock/') 
        },
        projects: [
            path.join(grunt.projectPath, '../account/src/main/webapp/WEB-INF/views/**/*.ftl'),
            path.join(grunt.projectPath, '../search/src/main/resources/ftl/**/*.ftl'),
        ],
        route: path.join(__dirname, '../../../routes/pc.route.js')
      }
     
      var dev = new DynamicViewProjectDev(options);
      
      dev.on('dataWrap', (context) =>context.data.user={name:'ss',age:xxxx});
      
      dev.startup();
      
### 六、参数解释

  * **server** 使用的是browser-sync服务
    * **server.server** 前段静态资源网站服务器根目录 例如 "../webapp/"。
    * **server.files**  要监听的文件或者目录，文件改变时，会自动同步通常用于css或者js
                        例如:['../webapp/**/*.css', '../webapp/**/*.js']。
    * **server.index**  网站默认启动路径 例如: /
    * **server.proxy**  mock接口服务器地址，详细设置参照: [http-proxy](https://github.com/nodejitsu/node-http-proxy "http-proxy")

* **local**  
  * **local.mode**     本地mock模式 'online'-->  所有接口使用在线数据，'auto'-->优先从代理获取数据,当获取失败，使用本地路由定义的数据,'local'--> 所有接口都使用本地, 'existsLocal'--> 当在本地置有路由则使用本地的，否则使用在线的
  * **local.localDir** 本地mock数据的存放目录

* **projects**  要监听的后端项目，通常用于指定在后端项目中视图改变时，自动刷新浏览器例如:['./websites/src/main/web-inf/views/**/*.ftl']

* **route**     本地mock使用的路由装载js或者json
                例如: './routes/route.js'

        module.exports =[
	    {
	        "url":"/",
	        "view": "site/home.ftl",
	        "dir": "websites",
	        "method":"GET",
	        "viewsDir": "./websites/src/main/web-inf/views"
	    },
	    {
	    	"url":"/item/\\d+",
	        "view": "item/item-info.ftl",
	        "method":"GET",
	        "dir": "websites",
	        "viewsDir": "...."
	    },
	    {
	    	"url":"/do",
	    	"method":"POST",
	        "view": "redirect:/item/999"
	    }
	 ]          
	
	
	
                     
        
        

### 七、事件

* **onReady** 当mock服务启动后触发


* **onResponse** 当mock请求代理服务器数据返回后触发


 		content: 返回的内容string
              req: 当前http请求对象 ClientRequest
              res: 当前http请求对应的返回对象 IncomingMessage
 		(content, req, res)=>{  
                    	......
                }
                
        
        
* **match**  用于自定义匹配请求对应的路由，如果不指定，则默认根据route.js注册路由的url匹配


        		context: { route:默认匹配的路由,routeContainer: 路由容器}
               pathname: 当前请求pathname
                    req: 当前http请求对象 ClientRequest
                    res: 当前http请求对应的返回对象 IncomingMessage
                (context, pathname, req, res)=>{
                    	//通过复写context.route来重新定义当前匹配到的路由
                    	context.route  ={
                    	    view:'sss.ftl',
                    	    dir:'xxx',
                    	    ....
                    	    
                    	}
                }
                    
        
        
* **error**  当mock请求代理服务器出现异常时触发


        	    	error: 错误消息
                      req: 当前http请求对象 ClientRequest
                      res: 当前http请求对应的返回对象 IncomingMessage
                    (error, req, res)=>{
                    
                    }
                      
        
        
* **dataWrap** 用于自定义mock数据处理，当需要对mock接口返回的数据进行额外处理可以使用此事件


                context: {data:...}
        	    (context)=>{
        	    	context.data.other  ={.....};
        	    }

### 八、定制编译器

ES6:

         var Compiler = require('node-web-dev').Compiler;
         
         class JspCompiler extends Compiler{
         	
         	constructor(){
         	    super('.jsp');
         	}
         	
         	compile(file,data,callback){
         		......
         		callback(error,results);
         	}
         }
         
         //注册到编译容器
         Compiler.register(new JspCompiler());
         
     

### 九、开源许可
基于 [MIT License](http://zh.wikipedia.org/wiki/MIT_License) 开源，使用代码只需说明来源，或者引用 [license.txt](https://github.com/sofish/typo.css/blob/master/license.txt) 即可。
