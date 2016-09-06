/**
 * 名称：视图编译器基础类
 * 作者：Beven
 * 日期：2016-09-05
 * 描述：用于派生视图编译器子类
 */

//异常列表
const {
    argsNull,
    argsType
} = require('../utils/error.js');

//路径
const path = require('path');

//已注册编译器
const compilers = new Set();

class Compiler {

    /**
     * 根据传入视图文件，获取对应的编译器
     * @param file 视图路径
     * @param options 设置该编译器对应的options
     */
    static getCompiler(file, options) {
        let compiler = [...compilers].find((compiler) => compiler.compilable(file));
        if(compiler){
            compiler.setCompileOption(options);
        }
        return compiler;
    }

    /**
     * 添加一个编译到编译容器
     * @param compiler 继承于Compiler的编译器
     */
    static register(compiler = argsNull('compiler')) {
        argsType("compiler", compiler, Compiler);
        compilers.add(compiler);
    }

    /**
     * 编译器构造函数
     * @param ext 编译器能能编译的文件类型，例如: .ftl,.jsp  理论上只需要写一种类型 多种类型使用','号隔开
     */
    constructor(ext = argsNull('ext')) {
        Object.defineProperty(this, 'ext', {
            value: (ext || '').toLowerCase().split(','),
            writable: false,
            enumerable: true,
            configurable: false
        });
    }

    /**
     * 编译指定视图
     * @param viewFile 视图绝对路径
     * @param data 视图上下文数据
     * @param callback 编译完毕回调函数 callback(error,html);
     */
    compile(viewFile, data, callback) {
        throw new Error("请实现compiler.compile函数");
    }

    /**
     * 设置编译配置
     * @param options
     */
    setCompileOption(options) {
        this.compileOptions = options;
    }

    /**
     * 是否能指定指定文件
     */
    compilable(file) {
        let ext = path.extname(file).toLowerCase();
        return this.ext.find((e) => e == ext) != null;
    }
}

module.exports = Compiler;