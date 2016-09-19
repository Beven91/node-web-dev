const path = require('path');
const {
    DynamicViewProjectDev
} = require('../../index.js');

let commonData = {
    user: {
        userName: 'beven',
        age: 9999
    }
}

let dev = new DynamicViewProjectDev({
    server: {
        "server": "./projects/f2e/", //服务器根目录
        "files": ["./projects/f2e/**/*.js", "./projects/f2e/**/*.css"] //要监听的文件或者目录，当该目录下文件改动，会自动同步通常用于css或者js
    },
    proxy: {
        target: 'localhost:4000' //mock api的url地址 其他参见 http-proxy
    },
    local: {
        local: true, //如果在使用在线接口获取数据出现异常，或者 当在线接口返回无效数据，时，使用本地Mock数据 默认 true
        localDir: path.join(__dirname, 'mock/') //如果local:true时，本地mock数据的存放目录
    },
    projects: [
        "./projects/websites/**/*.ftl"
    ],
    'route': path.join(__dirname, './route.js')
});

dev.on('dataWrap', (context) => {
    context.data = Object.assign({}, commonData, context.data);
});

dev.on('onProxy', (host, req) => {
    console.log(`代理: ${host}${req.url} 谓词:${req.method}`)
})


/**
 * 这里使用project /server 模拟java或者asp.net的后台
 * 在查看demo时可以启动project/server  cd projects node server
 *  
 */
//shell('node projects/server');
//启动服务
dev.startup();