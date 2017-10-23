/**
 * Created by kilua on 2015-10-13.
 */

module.exports = {
    OK: 200,
    FAIL: 500,
    NO_LOGIN: 501,
    // 权限不足
    LACK_PRIVILEGE: 1001,
    // 帐号长度限制
    USERNAME_LENGTH_LIMIT: 1002,
    // 密码长度限制
    PASSWORD_LENGTH_LIMIT: 1003,
    // 账号含非法字符
    USERNAME_UNEXPECTED_CHAR: 1004,
    // 密码含非法字符
    PASSWORD_UNEXPECTED_CHAR: 1005
};