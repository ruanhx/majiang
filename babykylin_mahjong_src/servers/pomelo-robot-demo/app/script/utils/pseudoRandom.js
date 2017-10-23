/**
 * Created by kilua on 13-11-4.
 */

var Random = function(seed){
    this.initSeed = seed;
    this.seed = seed || 0;
    this.next = this.seed;
    this.generateCnt = 0;
};

var pro = Random.prototype;

pro.nextInt = function(low, high){
    this.generateCnt++;
    low = low || 0;
    high = high || 0xFFFFFFFE;
    var result = (7 * this.next + 11 * this.seed) % (high - low + 1) + low;
    //console.log('###nextInt initSeed = %s, generateCnt = %s', this.initSeed, this.generateCnt);
    this.seed = this.next;
    this.next = result;
    return result;
};

pro.nextFloat = function(low, high){
    var tmp = this.nextInt(low, high);
    tmp = tmp / ((high || 0xFFFFFFFE) - (low || 0));
    return tmp;
};

/*
*   创建一个伪随机数生成器
*   @param {Number} seed optional.
* */
module.exports.create = function(seed){
    return new Random(seed);
};