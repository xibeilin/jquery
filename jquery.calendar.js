/**
 * 签到插件封装
 * @author   jbw
 * @datetime 2014-05-20
 */

(function($){
	$.fn.calendarSign = function(options){
		//当前年月
	    var date    = new Date();
	    var year    = date.getFullYear();
	    var month   = date.getMonth()+1;
		var month0  = (month<10) ? '0'+month : month; //前导零
	    var today   = date.getDate(); //获取当前日
	    var jsArr   = [];  //配合JS加载器使用
	    var timer   = {};  //setTimeout 事件
	    
	    // 参数选项设置
	    var defaults = {    
	        year        : year,
	        month       : month,
			tableClass  : 'sign-succ-table',    //日历大table的className
			headClass   : '',    //日历thead 的className
			headTrClass : 'sign-succ-canlerdar-head',    //日历thead 中tr的className
			bodyClass   : 'sign-succ-canlerdar-days',    //日历tbody 的className
			footClass   : 'sign-canlerdar-footer',       //日历tfoot 的className
	        signClass   : 'signed-day', //签到日的className
	        weekName    : ['日','一','二','三','四','五','六'],
			reqUrl      : 'xxxx',
            initCallback: function(){}, //初始化回调    用于页面加载时判断是否签到  已签到之后会执行
	        callback    : function(){},  //签到成功之后回调
	        from        : 0    //来源，配合CMS增加参数
	    };
		
		var opts = $.extend({}, defaults, options || {});
		
		//加载JS
		var loadScript = function(url, callback){
			//if (jsArr.indexOf(url) === -1) {
				var script = document.createElement("script")
				if (script.readyState) { //IE 
					script.onreadystatechange = function(){
						if (script.readyState == "loaded" || script.readyState == "complete") {
							script.onreadystatechange = null;
							jsArr.push(url);
							callback();
						}
					};
				}
				else { //Others: Firefox, Safari, Chrome, and Opera 
					script.onload = function(){
						jsArr.push(url);
						callback();
					};
				}
				script.src = url;
				document.body.appendChild(script);
			//}else{
			//	callback();
			//}
		}
		
		//创建tbody
	    var createSignBody = function(year,month){
	        var lastDay = new Date(year,month,0).getDate(); //最后一天
	        var firWeek = new Date(year,month-1,1).getDay();//第一天是星期几
	        var trNum = Math.ceil((lastDay+firWeek)/7); //tr 行数
	        var str = '';
	        for (var i=0;i<trNum;i++){
	            str += '<tr>';
	            for (var k=0;k<7;k++){
	                var tabidx = i*7+k; //取得单元格自身序号
	                var echoDay = (tabidx<firWeek || tabidx>lastDay+firWeek-1) ? '&nbsp;' : tabidx-firWeek+1;
	                var className = (echoDay=='&nbsp;') ? 'd_0' : 'd_'+echoDay;
	                str += '<td class="'+className+'">'+echoDay+'</td>'
	            }
	            str += '</tr>';
	        }
	        return str;
	    }
		
		//生成table html 日历
		var createCalendarTableHtml = function(signKeep,signTotal){
			var str = '<table class="'+opts.tableClass+'">';
			str +=    '<thead align="center">';
			str +=    '<tr class="'+opts.headTrClass+'">';
			for (var i=0;i<7;i++){
                str += '<td>'+opts.weekName[i]+'</td>';
            }
			str +=    '</tr></thead>';
			//tbody
			str +=    '<tbody align="center" id="calendarBody" class="'+opts.bodyClass+'">';
			str +=    createSignBody(opts.year,opts.month);
			str +=    '</tbody>';
			//tfoot
			str +=    '<tfoot align="center" class="'+opts.footClass+'"><tr>';
            str +=    '<td colspan="7" class="sign-succ-info">已经连续签到：<span data-role="signKeepNum" class="sign-succ-count-span j-sign-succ-keep">'+signKeep+'</span>天&nbsp;&nbsp;';
			str +=    '累计签到：<span class="sign-succ-count-span j-sign-succ-count" data-role="signTotalNum">'+signTotal+'</span>天</td>';
			str +=    '</tr></tfoot></table>';
			return str;
		}
		
		//生成基本html
		var createHtml = function(){
			//生成DOM日历DOM
			$('#calendarSignLayer').remove();
            var signHtml = '<div id="calendarSignLayer" class="signed-info" style="display: none;"> <i class="triangle"></i>\
            <div class="signed-header clearfix">\
                <span class="signed-today-num">今日已有<b id="todaySignNum">0</b>人签到</span>';
            //判断点亮图标
            signHtml += handleLitIcon() + '</div>';
            //奖品 @todo
            handlePrizeHtml();
            
            //日历
            signHtml += '<div class="sign-succ-calendar">\
                        <div class="sign-succ-calendar-title clearfix">\
                            <div class="calendar-title-month">\
                                <div class="calendar-month-prev j-calendar-month-prev" id="calendarPrevMonth">&nbsp;</div>\
                                <div class="calendar-month-span j-calendar-month" id="calendarDate">'+year+'年'+month0+'月</div>\
                                <div class="calendar-month-next j-calendar-month-next" id="calendarNextMonth">&nbsp;</div>\
                            </div>\
                            <b>签到日记</b> </div>';
            signHtml += createCalendarTableHtml(0,0);
            signHtml += '</div></div>';
            $('[data-role=calendarSignTarget]').append(signHtml);
			
		}
		
		//处理漏签小提示
		var handleSignMissTips = function(missNum){
			//判断cookie 是否存在
			loadScript('http://icon.zol-img.com.cn/public/js/jQuery.cookie.js',function(){
				var isShowMissTips = $.cookie('zol:sign:isShowMissTips');
				if (isShowMissTips || !missNum){return ;}
				var tipStr = '<i class="sign-tip-close">关闭</i>';
				tipStr += (missNum >= 5) ? '您有漏签，快来补签吧~' : '漏签'+missNum+'天，快来补签吧>>';
				$('#signMissTips').html(tipStr).fadeIn();
				
				//关闭小按钮 cookie 缓存24小时
				$('#signMissTips i').click(function(){
					$('#signMissTips').fadeOut();
					$.cookie('zol:sign:isShowMissTips',1,{expires:24,domain:'zol.com.cn'});
					$('#calendarSignLayer').fadeIn();
				});
			});
			
		}
		
		//初始化签到信息
		var initSign = function(){
			var action = 'initSign&callback=?';
			$.getJSON(opts.reqUrl+action,{},function(json){
				//已经签到 cms 直接显示出来
				if (json.isSignIn && opts.from != 'cms'){
				    $('[data-role="calendarSign"]').text('已签到');
					//生成DOM  //hover 时更新DOM 里的内容
					createHtml();
					
					//绑定事件
					bindEvents(json.signKeep);
					
					//更新签到日的样式
                    handleSignInfo(json.signInfo);
					
					//初始化回调
					opts.initCallback();
				}
				
				$('#todaySignNum').text(json.signOrder);
				if(opts.from == 'cms'){
					//生成DOM  //hover 时更新DOM 里的内容
                    createHtml();
                    
                    //绑定事件
                    bindEvents(json.signKeep);
                    
                    //更新签到日的样式
                    handleSignInfo(json.signInfo);
                    
                    //初始化回调
					if (json.isSignIn){
	                    opts.initCallback();
					}
					var action = 'getTodaySignTotal&callback=?';
		            $.getJSON(opts.reqUrl+action,{},function(json){
		                if (json.info = 'ok'){
		                    $('#todaySignNum').text(json.todayTotal);
		                }
		            });
					$('#calendarSignLayer').show();
				}
				
				$('[data-role=signKeepNum]').text(json.signKeep);
				$('[data-role=signTotalNum]').text(json.signTotal);
				$('[data-role=nextSignScore]').text(json.nextScore);
				//漏签小提示处理  签到与否 都处理
                handleSignMissTips(json.signMiss);
			});
			//将提示层插进来
			var missHtml = '<div id="missSignTips" class="signed-supplement" style="display:none;"><i class="trangle"></i>花费50Z金豆补签</div>';
            var tipsHtml = '<div id="missSignConfirm" class="signed-supplement signed-supplement-2" style="display:none;"><i class="trangle"></i><a class="cancel" href="###">取消</a><a class="sure" href="###">确定</a></div>'
            
            $('body').append(missHtml);
            $('body').append(tipsHtml);
		}
		
		//签到引导层处理
		var handleSignGuide = function(){
			var guideHtml = '';
			loadScript('http://icon.zol-img.com.cn/public/js/jQuery.cookie.js',function(){
				var signGuide = $.cookie('zol:sign:signGuide');
				if (!signGuide){
					guideHtml += '<div class="sign-guide"><span onclick="javascript:$(this).parent().remove();$(\'#calendarSignLayer\').show();">我知道了</span></div>';

					$.cookie('zol:sign:signGuide',1,{expires:24,domain:'zol.com.cn'});
				}else{
					guideHtml += '';
					$.cookie('zol:sign:signGuide',1,{expires:24,domain:'zol.com.cn'});
				}
				
            });
			return guideHtml;
		}
		
		//点亮图标处理
		var handleLitIcon = function(){
			var iconHtml = '<div class="signed-rights" id="signKeepRights">\
	                            <span class="signed-rights-ico signed-rights-ico-1"></span>\
	                            <span class="signed-rights-ico signed-rights-ico-2"></span>\
	                            <span class="signed-rights-ico signed-rights-ico-3"></span>\
	                            <div class="signed-rights-tip signed-rights-tip-1" style="display:none;"><i></i>连续签到2天可每次免费再玩儿一次转盘！</div>\
	                            <div class="signed-rights-tip signed-rights-tip-2" style="display:none;"><i></i>连续签到5天可获得“活跃精英”勋章！</div>\
	                            <div class="signed-rights-tip signed-rights-tip-3" style="display:none;"><i></i>连续签到15天可让名字变为尊贵橙色！</div>\
	                        </div>';
		    
			return iconHtml;
			
		}
		
		//处理奖品信息
		var handlePrizeHtml = function(){
			var action = 'getPrizeInfo&callback=?';
			$.getJSON(opts.reqUrl+action,{},function(json){
				if (json.info == 'ok'){
					var prizeHtml = '<div class="pro-to-change" id="calendarPrize">\
				                        <div class="pro-to-change-head">\
				                            <a href="http://jindou.zol.com/about.html" target="_blank" class="help-link">帮助</a>\
				                            <h4>积分兑换</h4>\
				                        </div>\
				                        <div class="pro-intro clearfix">';
						prizeHtml += '<a class="pic" href="'+json.goodsUrl+'" target="_blank" ><img width="97" height="60" src="'+json.goodsPic+'" alt=""></a>';
						prizeHtml += '<h4><a href="'+json.goodsUrl+'" target="_blank">'+json.goodsName+'</a></h4>';
						prizeHtml += '</div></div>';
						prizeHtml += '<a class="go-draw" href="'+json.goodsUrl+'" target="_blank">兑奖</a>';
				                
					$('#signKeepRights').parent().after(prizeHtml);
				}
			});
		}
		
		//签到
        var signIn = function(){
            var action = 'signIn&callback=?';
			$.getJSON(opts.reqUrl+action,{},function(json){
				if (json.info == 'ok') {
					//生成DOM 并把引导层插进去
					createHtml();
					var guideHtml = handleSignGuide();
					$('#calendarSignLayer').before(guideHtml);
					
					//更新信息
					$('#todaySignNum').text(json.signOrder);
					$('[data-role=calendarSign]').text('已签到');
                    $('[data-role=signKeepNum]').text(json.signKeep);
                    $('[data-role=signTotalNum]').text(json.signTotal);
                    $('[data-role=nextSignScore]').text(json.nextScore);
					
					//绑定浮层中的事件
					bindEvents(json.signKeep);
					
					//更新签到日的样式
					handleSignInfo(json.signInfo);
					
					//执行回调  把这次签到获得的金豆传过去
					opts.callback(json.signScore);
					
					//出浮层
					$('#calendarSignLayer').show();
					
					//setTimeout(function(){$('[data-role=calendarSignTarget]').find('.sign-guide').remove();},1000);
				}
			});
        }
		
		//补签
		var missSignIn = function(obj){
			var year  = parseInt($('#calendarSignLayer #calendarDate').text().substr(0,4));
			var month = parseInt($('#calendarSignLayer #calendarDate').text().substr(5,2));
			var day   = parseInt(obj.text());
			var action='missSignIn&callback=?';
			$.getJSON(opts.reqUrl+action,{y:year,m:month,d:day},function(json){
				if (json.missSign){
					//更新天数信息
					//$('[data-role=calendarSign]').text('已签到');
                    $('[data-role=signKeepNum]').text(json.signKeep);
                    $('[data-role=signTotalNum]').text(json.signTotal);
					$('[data-role=nextSignScore]').text(json.nextScore);
					obj.removeClass();
					obj.addClass(opts.signClass);
					//取消绑定事件
					obj.unbind();
				}else{
					alert('您的金豆不足~');
				}
			});
		}
		
		var bindEvents = function(signKeep){
			if (signKeep >= 2) {
                $('#signKeepRights .signed-rights-ico-1').addClass('signed-rights-get');
            }
            if (signKeep >= 5){
                $('#signKeepRights .signed-rights-ico-2').addClass('signed-rights-get');
            }
            if (signKeep >= 15){
                $('#signKeepRights .signed-rights-ico-3').addClass('signed-rights-get');
            }
            
            //绑定图标hover 事件
			var iconArr = [1,2,3];
			$.each(iconArr,function(key,val){
				var target = '#signKeepRights .signed-rights-ico-'+val;
				var tipstar = '.signed-rights-tip-'+val;
				$(target).hover(function(){
					$(this).siblings(tipstar).show();
				},function(){
					$(this).siblings(tipstar).hide();
				});
			});
			
			
			//进入日历浮层
            $('#calendarSignLayer').hover(function(){
                clearTimeout(timer.i);
                clearTimeout(timer.m);
                clearTimeout(timer.n);
                clearTimeout(timer.k);
                $('#calendarSignLayer').show();
            },function(){
				timer.j = setTimeout(function(){
					if (opts.from != 'cms'){
						$('#calendarSignLayer').hide();
					}
					$('#missSignTips').hide();
					$('#missSignConfirm').hide();
			    },200)
            });
			
			//进入补签提示
			$('#missSignConfirm ,#missSignTips').hover(function(){
				clearTimeout(timer.j);
				$('#calendarSignLayer').show();
			},function(){
				if (opts.from == 'cms'){
					return false;
				}
				timer.k = setTimeout(function(){$('#calendarSignLayer').hide();},200);
			});
			$('#missSignConfirm').hover(function(){
                clearTimeout(timer.o);
                $('#calendarSignLayer').show();
                //$(this).show();
            },function(){
                $(this).hide();
                if (opts.from == 'cms'){
					return false;
				}
                timer.n = setTimeout(function(){
                    $('#calendarSignLayer').hide();
                },200);
            });
			
			//日历翻页
			$('#calendarSignLayer #calendarPrevMonth').bind('click',function(){
				var ym = $('#calendarSignLayer #calendarDate').text();
                var cy = parseInt(ym.substring(0,4));
                var cm = parseInt(ym.substring(5,7));
                var pm = (cm ==1) ? 12 : cm-1;
                var py = (cm == 1) ? cy-1 : cy;
                if(pm < 10) pm = '0'+pm;
                if (2013 == cy && cm == 4){     //截止到4月份
                    return false;
                }
				var newCalendar = createSignBody(cy,pm);
				$('#calendarBody').empty().append(newCalendar);
                $('#calendarSignLayer #calendarDate').text(py+'年'+pm+'月');
				getSignDaysInfo(cy,pm);
			});
			$('#calendarSignLayer #calendarNextMonth').bind('click',function(){
				var ym = $('#calendarSignLayer #calendarDate').text();
                var cy = parseInt(ym.substring(0,4));
                var cm = parseInt(ym.substring(5,7));
				/*
                if(cm.charAt(0) == 0){
                    cm = parseInt(cm.charAt(1));
                }else{
                    cm = parseInt(cm);
                }
                */
                var pm = (cm ==12) ? 1 : cm+1;
                var py = (cm == 12) ? cy+1 : cy;
                if(pm < 10) pm = '0'+pm;
                if (year == cy && month == cm){        //截止本月
                    return false;
                }
				var newCalendar = createSignBody(cy,pm);
                $('#calendarBody').empty().append(newCalendar);
				$('#calendarSignLayer #calendarDate').text(py+'年'+pm+'月');
				
				getSignDaysInfo(cy,pm);
				
			});
			
		}
		
		//日历翻页重新获取当月签到信息
		var getSignDaysInfo = function(y,m){
			var action = 'getSignDaysInfo&callback=?';
			$.getJSON(opts.reqUrl+action,{y:y,m:m},function(json){
				handleSignInfo(json);
			});
		}
		
		//对生成的日历 加样式，绑定事件
		var handleSignInfo = function(signInfo){
			var dayObj = '';
			if (typeof signInfo == 'object'){
				$.each(signInfo,function(key,val){
					var dayTarget = '.d_'+val.day;
					var obj = $('#calendarBody').find(dayTarget);
					var title = '';
					obj.addClass(opts.signClass);
					if (val.resign){
						title = '于'+val.check_date.substr(0,10)+'补签';
					}else{
						title = '于'+val.time;
						if (val.order){
							title += ',第'+val.order+'个';
						}
						title += '签到';
					}
					obj.attr('title',title);
				});
				
				//为没有签到的日子绑定事件 先判断下是否是当月
				var ym = $('#calendarSignLayer #calendarDate').text();
                var cy = parseInt(ym.substring(0,4));
                var cm = parseInt(ym.substring(5,7));
				if (year == cy && month === cm){    //过滤
					var ltNum = parseInt(today+$('#calendarBody .tr').first().find('.d_0').length)+1;
					var missObj = $('#calendarBody td').slice(0,ltNum).not('.d_0').not('.'+opts.signClass);
				}else{
					var missObj = $('#calendarBody td').not('.d_0').not('.'+opts.signClass);
				}
				
				missObj.bind({
					mouseenter : function(){
						$(this).addClass('date-hover');
	                    var top  = parseInt($(this).offset().top)-35;
	                    var left = parseInt($(this).offset().left)-41;
						if ($(window).width() - parseInt($(this).offset().left) <=60){
							left = $(window).width()-117;$('#missSignTips i').css('left','65%');
						}else{
							$('#missSignTips i').css('left','50%');
						}
	                    $('#missSignTips').css({top:top,left:left});
	                    $('#missSignTips').show();
					},
					mouseleave : function(){
						$(this).removeClass('date-hover');
						
                        $('#missSignTips').hide();
						
					}
					
				});
				
				missObj.bind('click',function(){
                    $(this).removeClass('date-hover');
                    $(this).addClass('date-select');
                    $('#missSignTips').hide();
                    dayObj = $(this);
					
                    //确认、取消 弹层出现  35 34
                    var top  = parseInt($(this).offset().top)-35;
                    var left = parseInt($(this).offset().left)-34;
                    
                    $('#missSignConfirm').css({top:top,left:left});
                    $('#missSignConfirm').show();
                    
					dayObj.unbind('mouseleave');
					dayObj.mouseleave(function(){
						timer.o = setTimeout(function(){
                            dayObj.removeClass('date-select');
                            $('#missSignConfirm').hide();
                        },300);
					});
					
                    //绑定确认事件、请求补签的接口
					$('#missSignConfirm .sure').unbind();
                    $('#missSignConfirm .sure').click(function(event){
                        event.preventDefault();
                        missSignIn(dayObj);
                        $('#missSignConfirm').hide();
                    });
                    $('#missSignConfirm .cancel').click(function(){
                        dayObj.removeClass('date-select');
                        $('#missSignConfirm').hide();
                    });
                    //绑定什么都不做的
                    $('#missSignConfirm').mouseleave(function(){
                        dayObj.removeClass('date-select');
                            $('#missSignConfirm').hide();
                    });
				
					
				});
			}
		}
		
		//每次hover 已签到上时   更新今日累计签到
		var updateSignInfo = function(){
			var action = 'getTodaySignTotal&callback=?';
			$.getJSON(opts.reqUrl+action,{},function(json){
				if (json.info = 'ok'){
					$('#todaySignNum').text(json.todayTotal);
				}
			});
		}
		
		return this.each(function(){
			var self = $(this);
			//签到之前初始化        判断是否签到、签到的话 获取连续签到天数和漏签的天数
			initSign();
			
			//点击签到
			$(this).bind('click',function(){
				//签到
				signIn();
			});
			//根据来源绑定事件
			if (opts.from != 'cms'){ 
				$(this).hover(function(){
					clearTimeout(timer.j);
					//更新签到信息
					updateSignInfo();
					$('#calendarSignLayer').show();
				},function(){
	                timer.i = setTimeout(function(){
	                    $('#calendarSignLayer').hide();
	                },200);
				});
			}
			
		})
	}
})(jQuery);
