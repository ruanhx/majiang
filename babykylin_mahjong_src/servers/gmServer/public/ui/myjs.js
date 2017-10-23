//导航的逻辑判断
$(function(e) {
		
		var userName;
		var px;//权限级别
		/*$("li#li_1").click(function(){$("div#content").load('account.html');			console.log("1");	 $("li#li_1").unbind("click");});
		$("li#li_2").click(function(){$("div#content").load('allServerStatistics.html');console.log("2");	 $("li#li_2").unbind("click");});
		$("li#li_3").click(function(){$("div#content").load('payStatistics.html');		console.log("3");	 $("li#li_3").unbind("click");});
		$("li#li_4").click(function(){$("div#content").load('consumeStatistics.html');	console.log("4");	 $("li#li_4").unbind("click");});
		$("li#li_5").click(function(){$("div#content").load('onlineAndLogin.html');		console.log("5");	 $("li#li_5").unbind("click");});
		$("li#li_6").click(function(){$("div#content").load('annonceManage.html');		console.log("6");	 $("li#li_6").unbind("click");});
		$("li#li_7").click(function(){$("div#content").load('mailManage.html');		 	console.log("7");	 $("li#li_7").unbind("click");});
		$("li#li_8").click(function(){$("div#content").load('activityManage.html');		console.log("8"); 	 $("li#li_8").unbind("click");});
		$("li#li_9").click(function(){$("div#content").load('shopManage.html');			console.log("9");	 $("li#li_9").unbind("click");});
		$("li#li_10").click(function(){$("div#content").load('backstageManage.html');	console.log("10");	 $("li#li_10").unbind("click");});
		$("li#li_11").click(function(){$("div#content").load('index.html');				console.log("11");	 $("li#li_11").unbind("click");});
		$("li#li_12").click(function(){$("div#content").load('index.html');				console.log("12");	 $("li#li_12").unbind("click");});
		$("li#li_13").click(function(){$("div#content").load('index.html');				console.log("13");	 $("li#li_13").unbind("click");});
		$("li#li_14").click(function(){$("div#content").load('index.html');				console.log("14");	 $("li#li_14").unbind("click");});
		$("li#li_15").click(function(){$("div#content").load('index.html');				console.log("15");	 $("li#li_15").unbind("click");});
		
		$("#li_1").unbind('click').bind('click',function(){$("div#content").load('account.html');			console.log("1");	 	 });
		$("#li_2").unbind('click').bind('click',function(){$("div#content").load('allServerStatistics.html');console.log("2");	 });
		$("#li_3").unbind('click').bind('click',function(){$("div#content").load('payStatistics.html');		console.log("3");	 });
		$("#li_4").unbind('click').bind('click',function(){$("div#content").load('consumeStatistics.html');	console.log("4");	 });
		$("#li_5").unbind('click').bind('click',function(){$("div#content").load('onlineAndLogin.html');		console.log("5");	 });
		$("#li_6").unbind('click').bind('click',function(){$("div#content").load('annonceManage.html');		console.log("6");	 });
		$("#li_7").unbind('click').bind('click',function(){$("div#content").load('mailManage.html');		 	console.log("7");	 });
		$("#li_8").unbind('click').bind('click',function(){$("div#content").load('activityManage.html');		console.log("8"); 	 });
		$("#li_9").unbind('click').bind('click',function(){$("div#content").load('shopManage.html');			console.log("9");	 });
		$("#li_10").unbind('click').bind('click',function(){$("div#content").load('backstageManage.html');	console.log("10");	 });
		$("#li_11").unbind('click').bind('click',function(){$("div#content").load('index.html');				console.log("11");	 });
		$("#li_12").unbind('click').bind('click',function(){$("div#content").load('index.html');				console.log("12");	 });
		$("#li_13").unbind('click').bind('click',function(){$("div#content").load('index.html');				console.log("13");	 });
		$("#li_14").unbind('click').bind('click',function(){$("div#content").load('index.html');				console.log("14");	 });
		$("#li_15").unbind('click').bind('click',function(){$("div#content").load('index.html');				console.log("15");	 });*/
					
		var count = 0;
        $('#tab-menu > li').click(function(){
			return;
			$('#tab-menu > li').removeClass('selected');
			$(this).addClass('selected');
			console.log(count);
			count += 1;
			//if(userName != null)
			{
				switch (this.id)
				{
				  case "li_1": 
					 $("div#content").load('account.html');
					break;
				  case "li_2": 
					 $("div#content").load('allServerStatistics.html');
					break;
				  case "li_3": 
					 $("div#content").load('payStatistics.html');
					break;
				  case "li_4": 
					 $("div#content").load('consumeStatistics.html');
					break;
				  case "li_5": 
					 $("div#content").load('onlineAndLogin.html');
					break;
				  case "li_6": 
					 $("div#content").load('annonceManage.html');
					 break;
				  case "li_7": 
					 $("div#content").load('mailManage.html');
					break;
				  case "li_8": 
					 $("div#content").load('activityManage.html');
					break;
				  case "li_9": 
					 $("div#content").load('shopManage.html');
					break;
				  case "li_10": 
					 $("div#content").load('backstageManage.html');
					break;
				  case "li_11": 
					 $("div#content").load('paySearch.html');
					break;
				  case "li_12": 
					 $("div#content").load('presentSearch.html');
					break;
				  case "li_13": 
					 $("div#content").load('messageSearch.html');
					break;
				  case "li_14": 
					 $("div#content").load('itemCardSearch.html');
					break;
				  case "li_15": 
					 $("div#content").load('unusualFightSearch.html');
					break;
				  case "li_16": 
					 $("div#content").load('unusualAccountSearch.html');
					break;
				}
			}
			//else
			{
				//makeDialog();
			}
		})
		.mouseover(function() {
			$(this).addClass('mouseover');
			$(this).removeClass('mouseout');   
		})
		.mouseout(function() {
			$(this).addClass('mouseout');
			$(this).removeClass('mouseover');    
		});
		
		
});

function makeDialog()
{
	$("#loginDialog").dialog({
		autoOpen: true,// 初始化之后，是否立即显示对话框，默认为 true
		width: 400,
		modal: true,//是否模式对话框，默认为 false
		draggable: true,//是否允许拖动，默认为 true
		resizable: false,//是否可以调整对话框的大小，默认为 true
		title: "亲，请登录",
		//position: "center",//用来设置对话框的位置，有三种设置方法 1.  一个字符串，允许的值为  'center', 'left', 'right', 'top', 'bottom'.  此属性的默认值即为 'center'，表示对话框居中。 2.  一个数组，包含两个以像素为单位的位置，例如， var dialogOpts = { position: [100, 100] }; 3. 一个字符串组成的数组，例如， ['right','top']，表示对话框将会位于窗口的右上角。var dialogOpts = {  position: ["left", "bottom"]    };
		buttons: [//一个对象，属性名将会被作为按钮的提示文字，属性值为一个函数，即按钮的处理函数。
			{
				text: "登录",
				click: function () {
					$.post("/login",JSON.parse('{"username":"'+$("#username").val()+'","password":"'+$("#password").val()+'"}'),
					function(data,status){
						console.log(data);
						if(status == "success")
						{
							if(data.code == CODE.OK)
							{
								userName = data.username;
								px = data.px;
								$("#loginDialog").dialog("close");
								$("div#content").load('account.html');
								
								$('#tab-menu > li').removeClass('selected');
								$('#li_1').addClass('selected');
							 }
							 else 
							{
								alert("登录失败"+data.code);
							}									 
						}
						else 
						{
							console.log("加载数据失败。");
						}								
					});
				}
			}
		]

	});
}

function getDateStr(createTime)
{
	if(createTime == 0)
		return "";
	var date = new Date(createTime);
	return date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate();
}
function getDateTimeStr(createTime)
{
	//var date = new Date(createTime);
	//return date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate() + " " + date.getHours()+ ":" + date.getMinutes()+ ":" + date.getSeconds();
	return new Date(parseInt(createTime)*1000).toLocaleString().replace(/:\d{1,2}$/,' ');
}
function getTimeString(time)//毫秒
{
	time = time*0.001;
	var hour = time / 3600;//小时
	var min = (time % 3600) / 60;//分钟
	var sec = (time % 3600) % 60;//秒
	return (hour - hour%1)+"时"+(min - min%1)+"钟"+(sec - sec%1)+"秒";
}

var contentHtml = "";
function setContentHtml(content)
{
	contentHtml = content;
}
function getContentHtml()
{
	return contentHtml;
}

function encodeUTF8(str)
{
	var temp="",rs="";
	for(var i = 0,len = str.length ; i < len ; i ++)
	{
		temp=str.charCodeAt(i).toString(16);
		rs += "\\u" + new Array(5 - temp.length).join("0") + temp;
	}
	return rs;
}