/**
 * 名称：自定义异常处理
 * 作者：Beven
 * 日期：2016-09-05
 * 描述：无
 */


class ArgumentsNullError extends Error{
    constructor(message){
        super(message);
    }
}

class ArgumentsTypeIllegal extends Error{
    constructor(message){
        super(message);
    }
}

module.exports = {
    argsNull(name){
        throw new ArgumentsNullError(`参数${name}不能为null`);
    },
    argsType(name,parameter,targetType){
        if(!(parameter instanceof targetType)){
            throw new ArgumentsTypeIllegal("参数${name}必须为类型{targetType.name}");
        }
    }
}