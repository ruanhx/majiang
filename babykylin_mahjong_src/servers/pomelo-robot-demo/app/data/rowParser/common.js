/**
 * Created by kilua on 2014-11-22.
 */

var _ = require('underscore');

var exp = module.exports = {};

/*
 *   解析参数对，以'#'分隔
 *   @param {Number or String} param
 *   @return {Object} {coe: ?, val: ?}
 * */
exp.parseParamPair = function(param){
    var result = {};
    param = param || '';
    if(_.isString(param)){
        var params = param.split('#');
        if(params.length > 1){
            result.coe = Number(params[0]) || 0;
            result.val = Number(params[1]) || 0;
        }else{
            result.coe = 0;
            result.val = Number(params[0]) || 0;
        }
    }else{
        result.coe = 0;
        result.val = param;
    }

    return result;
};

/*
 *   参数列表，以'#'分隔
 * */
exp.parseParams = function(paramStr){
    var params = [];
    if(paramStr){
        if(_.isString(paramStr)){
            var tmp = paramStr.split('#');
            // 转成数值
            _.each(tmp, function(elem){
                elem = Number(elem);
                if(!_.isNaN(elem)){
                    params.push(elem);
                }
            });
        }else{
            params.push(paramStr);
        }
    }
    return params;
};