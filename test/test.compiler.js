/**
 * 测试对象:compiler/compiler.js
 * 测试人：Beven
 */

const Compiler = require('../compiler/compiler.js');

const assert = require('chai').assert;

describe('compiler', () => {

    const catchOf = (name, fn) => {
        let catchEx = {};
        try {
            fn();
        } catch (ex) {
            catchEx = ex;
        }
        return name == catchEx.constructor.name;
    }

    class FtlCompiler extends Compiler {
        constructor() {
            super('.ftl');
        }
    }


    //测试 compiler
    describe('consturctor', () => {
        it('new Compiler() 应该抛出ArgumentsNullError异常', () => {
            assert.equal(true, catchOf("ArgumentsNullError", () => new Compiler()));
        })
    });

    //测试 compilable
    describe('compilable', () => {
        it('编译器编译类型判断', () => {
            let compiler = new Compiler('.ftl');
            let compiler2 = new Compiler('.jsp');
            let compiler3 = new Compiler('.ftl,.JSP');

            let r = [
                compiler.compilable('a/b/home.ftl'),
                compiler.compilable('a/b/home.jsp'),
                compiler2.compilable('a/b/home.jsp'),
                compiler2.compilable('a/b/home.ftl'),
                compiler3.compilable('a/b/home.jsp'),
                compiler3.compilable('a/b/home.ftl'),
                compiler3.compilable('a/b/home.asp')
            ].join('-');

            assert.equal('true-false-true-false-true-true-false', r);

        });
    });

    //测试 register
    describe('static register', () => {
        it('注册编译器', () => {
            let compiler = {};
            let r = catchOf("ArgumentsTypeIllegal", () => Compiler.register(compiler));
            let ftlCompiler = new FtlCompiler();
            Compiler.register(ftlCompiler);
            let m = Compiler.getCompiler('a/b/c.ftl') == ftlCompiler;

            assert.equal(true, r && m)

        });
    });
})