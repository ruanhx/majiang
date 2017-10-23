/**
 * Created by kilua on 2015-10-13.
 */

$(document).ready(function(){
    $('#loginBox').dialog({
        title: 'GM登录',
        dialogClass: 'no-close',
        closeOnEscape: false,
        modal: true,
        width: 265,
        height: 220,
        buttons: [
            {
                text: '登录',
                click: function(){
                    $('#loginForm').submit();
                }
            },
            {
                text: '重置',
                click: function(){

                }
            }
        ]
    });

    jQuery.validator.addMethod("username", function( value, element){
        return this.optional(element) || value.length >=6 && !/[^a-zA-Z0-9]/.test(value);
    }, "账号只能包含数字和字母，并且不得小于6位");

    jQuery.validator.addMethod("password", function( value, element ) {
        return this.optional(element) || value.length >= 6 && !/[^a-zA-Z0-9]/.test(value);
    }, "密码只能包含数字和字母，并且不得小于6位");

    $('#loginForm').validate();
});