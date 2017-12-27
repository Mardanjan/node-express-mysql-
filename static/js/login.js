$(document).ready(function () {
    //设置一屏的宽高
    $('body').css({
        'height': $(window).height() + 'px',
        'width': $(window).width() + 'px'
    });
    // 点击登录
    $('.login_button').click(function () {
        var username = $('.username_div input').val();
            password = $('.password_div input').val();
        if (username && password) {
            $.ajax({
                type:'post',
                url:'/admin/login',
                data:{
                    username:username,
                    password:password
                },
                success:function (res) {
                    window.location.replace('/admin')
                },
                error:function (res) {
                    var code = JSON.parse(res.responseText).code;
                    if (code == 500) {
                        window.alert('服务器请求失败！')
                    }else{
                        window.alert('用户名或密码错误！')
                    }
                }
            })
        }else{
            window.alert('用户名或密码不能为空！')
        }
    })
});