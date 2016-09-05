const path = require('path');
const routes ={
    "/":{
        "view":"site/home.ftl",
        "dir":"websites"
    }
}

function routeRender(routes){
    let keys  =Object.keys(routes);
    let route  =null;
    for(let key of keys){
        route  =routes[key];
        //初始化视图根目录
        route.viewsDir =path.join(__dirname,'projects','websites','views');
    }
    return routes;
}

module.exports = routeRender(routes);