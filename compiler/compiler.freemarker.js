/**
 * 名称：freemarker 视图编译器
 * 作者：Beven
 * 日期：2016-09-05
 * 描述：编译.ftl文件
 */

const Compiler = require('./compiler.js');
const FreemarkerCompiler = require('grunt-ls-freemarker');

class FtlCompiler extends Compiler {

    constructor() {
        super('.ftl');
    }

    /**
     * 编译指定视图
     * @param viewFile 视图绝对路径
     * @param data 视图上下文数据
     * @param callback 编译完毕回调函数 callback(error,html);
     */
    compile(viewFile, data, callback) {
        let compiler = new FreemarkerCompiler(this.compileOptions);
        compiler.compile(viewFile, data, callback);
    }
}

//公布ftl compiler
module.exports = FtlCompiler;