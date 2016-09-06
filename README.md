## node-web-dev

### 一、简介

一个用于在开发时前后端分离的工具，启动服务后可以不需要启动后端网站服务，使用nodejs服务来mock请求，

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


### 三、开源许可
基于 [MIT License](http://zh.wikipedia.org/wiki/MIT_License) 开源，使用代码只需说明来源，或者引用 [license.txt](https://github.com/sofish/typo.css/blob/master/license.txt) 即可。
