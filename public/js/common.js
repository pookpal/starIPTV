/**
 * Created by lijie on 15/6/10.
 * 待解决问题
 */

$(function () {

    //频道导航切换效果
    $('ul.tabChannle li').click(function () {
        var channleItemWidth = $('ul.channleItem').width();
        var chatBoxDisplay = getStyle('display',$('.chatBox .chatContent')[0]);
        var index = $('ul.tabChannle li').index(this);
        if(chatBoxDisplay =="block"){
            $('.chatBox .chatContent').slideToggle('slow');
        }
        $(this).addClass('current');
        $(this).siblings('li').removeClass('current');

        slide(index, channleItemWidth);
    });

    //频道菜单点击切换效果
    $('ul.channleItem').on('click','li a',function () {
        var stream = $(this).attr('stream');
        console.error(stream);
        changeVod(stream);
        $(this).parents('div.channleMenu').find('ul li a').removeClass('current');
        $(this).addClass('current');
    });


    //点击meta打开聊天框
    $('.chatBox .meta').not('.lamp').click(function(){

        //聊天窗口打开
        $('.chatBox .chatContent').slideToggle('slow');

        //chatBox 滚动条
        var chatBoxScroll = function(){
            var ulHeight = $('.chatLists ul').offset().top;
            $('.chatLists').scrollTop(ulHeight);
        }();
        chatBoxScroll=null;
    });


    //点击lamp切换背景灯
    $('.lamp').click(function(){
        var wrapDisplay = getStyle('display',$('.mask')[0]);
        if(wrapDisplay == "none"){
            $('.mask').css({"display":"block"});
            $('.leftSide').css({"zIndex":"4"});
            $('.chatBox .lamp').css({"zIndex":"4"});

        }else{
            $('.mask').css({"display":"none"});
            $('.leftSide').css({"zIndex":"0"});
            $('.chatBox .lamp').css({"zIndex":"0"});
        }

    });
    //滑动函数
    function slide(index, channleItemWidth){
        $('div.channleMenu').animate(
            {marginLeft:- index * channleItemWidth+"px"},300);
    }

    //自定义函数获取对象的样式
    function getStyle(attr,obj){
        return obj.currentStyle? obj.currentStyle[attr]:getComputedStyle(obj,null)[attr];
    }


// 获取tv json
    var tvData ;
    $.ajax({
        method:'GET',
        url:'tv.json',
        async: false,
        success:function(data){
            tvData = data;
        },
        error:function(){
            console.log('get tv json error');
        }
    });

    bindDom();


// 根据数据增加频道点击按钮
    function bindDom(){

        var liHtml= '';

        for(var i = 0 ; i < tvData.length; i ++) {

            if(i==0){
                liHtml +='<li><a class="current" stream="'+tvData[i]['stream']+'">'+tvData[i]['name']+'</a></li>';
            }else{
                liHtml += '<li><a stream="'+tvData[i]['stream']+'">'+tvData[i]['name']+'</a></li>';

            }

        }

        $('ul.channle0').empty().append($(liHtml));
    }

    var flashvars = {
        f: 'ckplayer/m3u8.swf',
        a: tvData[0]['stream'],
        c: 0,
        p: 1,
        s: 4,
        lv: 1,
        loaded: 'loadedHandler'
    };
    var video2=[tvData[0]['stream']];

    CKobject.embed('ckplayer/ckplayer.swf','a_video','ckplayer_a1','860','524',false,flashvars,video2);








    function changeVod(stream){
        CKobject.getObjectById('ckplayer_a1').newAddress('{a->'+stream+'}{html5->'+stream+'}')
    }


// 获取昵称

    var userData ;
    $.ajax({
        method:'GET',
        url:'user.json',
        async: false,
        success:function(data){
            userData = data;
        },
        error:function(){
            console.log('get tv json error');
        }
    });

    randomNickName();

    function randomNickName(){

        var len = userData.length+1;

        var tempFlag =Math.floor(Math.random()*len);


        $('input#nickName').val(userData[tempFlag]);


    }




    // 实时聊天

    var socket = io();


    // 提交按钮
    $('.subBtn').click(function(e){
        e.preventDefault();
        var textDom  = $('textarea.message');
        var nickDom = $('input.nickName');

        if(textDom.val().trim()!='' && nickDom.val()!=''){

            var msg = {
                text: textDom.val(),
                user: nickDom.val(),
                time: Date.now()
            };


            socket.emit('chat message',msg);

            textDom.val('');
        }else{
            alert('不能发表空留言!');
        }


        return false;
    });

    // 监听键盘 control+enter
    $(document).unbind('keypress.up').bind('keypress.up',function(e){

        if(e.ctrlKey && e.which == 13 || e.which == 10) {

            $('.subBtn').trigger("click");
        }


    });



    function formatTime(time){
        var timeD = new Date(time);

        var str = [
            timeD.getFullYear(),
            timeD.getMonth()+1 < 10 ? ('0'+(timeD.getMonth()+1)): (timeD.getMonth()+1),
            timeD.getDate() < 10 ? ('0'+ timeD.getDate()) : (timeD.getDate()),
            timeD.getHours() < 10 ? ('0'+ timeD.getHours()) : (timeD.getHours()),
            timeD.getMinutes() < 10 ? ('0'+ timeD.getMinutes()) : (timeD.getMinutes()),
            timeD.getSeconds() < 10 ? ('0'+ timeD.getSeconds()) : (timeD.getSeconds()),
        ];

        return str[3]+':'+str[4]+':'+str[5];
    }

    socket.on('chat message', function(msg){
        playAudio();
        var nickName = $('input.nickName').val();

        var userType = (nickName == msg.user) ? "self": "other";
        var lihtml =
            '<li class="'+userType+'"> ' +
                '<p class="writer">' +
                    '<span class="nickName">'+ msg.user +
                   '</span>' +
                    '<span class="time">[' +
                        formatTime(msg.time) +
                    ']</span>' +
                '</p>'+
                '<p class="message">'+msg.text+'</p>' +
            '</li>';

        $('.chatLists ul').append($(lihtml));

        //chatBox 滚动条
        var chatBoxScroll = function(){
            var ulHeight = $('.chatLists ul').offset().top;
            $('.chatLists').scrollTop(ulHeight);
        }();
        chatBoxScroll=null;

    });






    // 控制消息音效的

    function playAudio(){
        var audio = document.getElementById('messageBg');
        if(audio!==null){
            //检测播放是否已暂停.audio.paused 在播放器播放时返回false.
            if(audio.paused)                     {
                audio.play();//audio.play();// 这个就是播放
            }else{
                audio.pause();// 这个就是暂停
            }
        }
    }

});