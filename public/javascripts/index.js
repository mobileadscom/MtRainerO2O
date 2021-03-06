import miniPages from './miniPages';
import {singleAnswerQuestion, multipleAnswerQuestion, dropdownQuestion} from './questions';
import miniSelect from './miniSelect';
import modal from './modal';
import winningLogic from './winningLogic2';
import user from './user5';
import '../stylesheets/miniSelect.css';
import '../stylesheets/style.css';
import '../stylesheets/miniCheckbox.css';
import '../stylesheets/modal.css';
import '../stylesheets/regForm.css';

import axios from 'axios';
var app = {
	pages: null, // array of pages
	params: {}, // params in query string
	q: [], // array of questions
	player: null, //youtube player
	registering: false, // email registration process running
	getParams: function() {
		  var query_string = {};
		  var query = window.location.search.substring(1);
		  var vars = query.split("&");
		  for (var i=0;i<vars.length;i++) {
		      var pair = vars[i].split("=");
		      // If first entry with this name
		      if (typeof query_string[pair[0]] === "undefined") {
		          query_string[pair[0]] = pair[1];
		      // If second entry with this name
		      } else if (typeof query_string[pair[0]] === "string") {
		          var arr = [ query_string[pair[0]], pair[1] ];
		          query_string[pair[0]] = arr;
		      // If third or later entry with this name
		      } else {
		          query_string[pair[0]].push(pair[1]);
		      }
		  } 
		  return query_string;
	},
	generateCouponLink(userId, source) {
		return 'https://couponcampaign.ienomistyle.com/MtRainier/coupon.html?userId=' + userId + '&source=' + source;
		// return 'https://s3.amazonaws.com/rmarepo/o2o/MtRainier/coupon.html?userId=' + userId + '&source=' + source;
	},
	initResult(state, couponLink) {
		if (state == 'win') {
			document.getElementById('resultTitle').innerHTML = "おめでとうございます！";
			document.getElementById('resultTitle').style.color = '#0193DD';
			document.getElementById('resultDescription').innerHTML = "マウントレーニア　マイスターズラテが当たりました。";
			if (user.isWanderer) {
				document.getElementById('couponLink').style.display = 'none';
				document.getElementById('resultInstruction').style.display = 'none;'
				document.getElementById('couponInfo').style.display = 'none';
			}
			else {
				document.getElementById('resultInstruction').innerHTML = "シリアル番号を受け取って、ファミリーマートで引き換えてください";
			}

			if (couponLink) {
				document.getElementById('couponLoader').style.display = 'none';
				document.getElementById('couponLink').href = couponLink;
				// document.getElementById('couponLink').setAttribute('target', '_blank');
				document.getElementById('getCoupon').innerText = 'シリアル番号を受け取る';
			}
		}
		else {
			document.getElementById('resultTitle').innerHTML = "残念！";
			document.getElementById('resultTitle').style.color = 'red';
			document.getElementById('resultDescription').innerHTML = 'はずれ';
			document.getElementById('resultInstruction').innerHTML = 'ご参加頂きありがとうございました。';
			document.getElementById('resultImage').style.display = 'none';
			document.getElementById('couponLink').style.display = 'none';
			document.getElementById('couponInfo').style.display = 'none';
			document.getElementById('twitterLink').style.display = 'none';
		}
	},
	processResult() {
		winningLogic.process(this.q, !user.isWanderer).then((resultProperties) => {
			winningLogic.processed = true;
			console.log(resultProperties);
			var actualResult = resultProperties.actualResult;
			var group = resultProperties.group;
			var group = ['A'];
			if (!user.isWanderer) {
				user.mark(user.info.id, actualResult, group, this.params.source).then((response) => {
					winningLogic.processed = true;
					console.log(response)
					if (response.data.couponCode) {
						user.trackWin(user.info.id, response.data.couponCode, this.params.source);
						var couponLink = this.generateCouponLink(user.info.id, this.params.source);
						user.saveLocal({
							id: user.info.id,
							couponCode: response.data.couponCode,
							state: 'win',
							source: this.params.source
						}, this.params.source);
						this.initResult('win', couponLink);
						var message = 'マウントレーニア　マイスターズラテが当たりました!    ' + couponLink;
						/*if (user.info.id.indexOf('@') > -1) { // login via email
				        	var emailContent = '<head><meta charset="utf-8"></head><div style="text-align:center;font-weight:600;color:#FF4244;font-size:28px;">おめでとうございます</div><br><br><div style="text-align:center;font-weight:600;">マウントレーニア マイスターズラテが当たりました!</div><a href="' + couponLink + '" target="_blank" style="text-decoration:none;"><button style="display:block;margin:20px auto;margin-bottom:40px;border-radius:5px;background-color:#E54C3C;border:none;color:white;width:200px;height:50px;font-weight:600;">シリアル番号を受取る</button></a>';
				        	 user.sendEmail(user.info.id, 'Ienomistyle クーポンキャンペーン', emailContent);
						}*/
						// else {
						// 	// user.messageTwitter(message);
						// }
						// user.passResult(user.info.id, flag, user.info.source, couponInfo.couponLink);
					}
					else {
						user.trackLose(user.info.id, this.params.source);
						user.saveLocal({
							id: user.info.id,
							couponCode: '',
							state: 'lose',
							source: this.params.source
						}, this.params.source);
						
						this.initResult('lose');
					}
				}).catch((error) => {
					console.log(error);
					winningLogic.processed = true;
		  			this.initResult('lose');
				});
			}
			else {
				this.initResult('lose');
			}	
		});
	},
	continue: function() {
		this.changeHeaderImage();
		var localObj = user.getLocal(this.params.source);
		var userAnswers = localObj.status == true ? localObj.data.answers : [];
		var noQuestionAnswered = userAnswers.length - 1;

		if (localObj.status == true && localObj.data.id.indexOf('@') > -1) {
			user.trackEmailLogin(localObj.data.id, this.params.source);
		}

		/*apply answer to answered question */
		for (var w = 1; w < this.q.length; w++) {
			if (userAnswers[w]) {
			  this.q[w].setAnswer(userAnswers[w]);
			}
		}

		if (user.info.state == 'win') {
			console.log(user.info);
			this.initResult('win', this.generateCouponLink(user.info.id, this.params.source));
			this.pages.toPage('resultPage');
			user.trackPageView('imp_6', this.params.source);
		}
		else if (user.info.state == 'lose') {
			this.initResult('lose');
			this.pages.toPage('resultPage');
			user.trackPageView('imp_6', this.params.source);
		}
		else {
			if (noQuestionAnswered > 0) {
				if (noQuestionAnswered < this.q.length - 1) {
					this.pages.toPage('page' + (noQuestionAnswered + 1).toString());
				}
				else {
					this.pages.toPage('page' + (this.q.length - 1).toString());
				}
			}
			else {
				this.pages.toPage('page1');
			}
		}
		this.changeHeaderImage();
	},
	events: function() {
		/* ==== Event Listeners ==== */
	  /* enabled terms agree checkbox when scrolled tnc to bottom */
	 /* var enableAgreeCheckbox = false;
	  document.getElementById('tnc').addEventListener('scroll', function(event) {
	  	if (!enableAgreeCheckbox) {
	  		var element = event.target;
		    if (element.scrollHeight - element.scrollTop < element.clientHeight + 50) {
		    	document.getElementById('startSurvey').disabled = false;*/
		      /*document.getElementById('agreeCheck').disabled = false;
		      enableAgreeCheckbox = true;*/
		 //    }
	  // 	}
	  // });
	  
	  /* enable start survey button when terms agree checkbox is checked */
	 /* document.getElementById('agreeCheck').onchange = function() {
	    if (this.checked) {
				document.getElementById('startSurvey').disabled = false;
	    }
	    else {
	    	document.getElementById('startSurvey').disabled = true;
	    }
	  }*/

	/* email registration */
	var form = document.getElementById('regForm');

	form.onsubmit = (event) => {
		if (!this.registering) {
			this.registering = true;
			var spinner = document.getElementById('formWorking');
			var donePage = document.getElementById('doneSec');
			var regPage = document.getElementById('regSec');
			form.style.display = 'none';
			spinner.style.display = 'block';
			event.preventDefault();
			var email = document.getElementById('emailInput').value;
			user.register(email, this.params.source, 'email').then((response) => {
				this.registering = false;
				console.log(response);
				spinner.style.display = 'none';
				if (response.data.status == true) {
					user.trackRegister(email, this.params.source, 'email');
					this.formSections.toPage('doneSec');
					var emailContent = '<head><meta charset="utf-8"></head>ご登録ありがとうございました。下記にあるリンクをクリックしてください。その後キャンペーンへの参加をお願いします<br><br><a href="https://couponcampaign.ienomistyle.com/MtRainier/?userId=' + email + '" target="_blank">https://couponcampaign.ienomistyle.com/MtRainier/?userId=' + email + '</a><br><br>ienomistyle キャンペーン事務局<br><br>※このメールの送信アドレスは送信専用でございます。返信いただいても対応は致しかねますのであらかじめご了承ください。';
					user.sendEmail(email, 'Ienomistyle クーポンキャンペーン', emailContent);
				}
				else if (response.data.message == 'user exist.') {
					user.info.source = this.params.source;
					user.isWanderer = false;
					console.log('exist!');
					user.saveLocal({
						id: response.data.user.id,
						couponCode: response.data.user.couponCode,
						state: response.data.user.state,
						source: response.data.user.source,
						timestamp: Date.now()
					}, this.params.source);
					user.loadLocal(this.params.source);
					this.enableSaveAnswer();
					this.continue();
					modal.closeAll();
				}
			}).catch((error) => {
				console.log(error);
				this.registering = false;
				form.style.display = 'block';
				spinner.style.display = 'none';
			});
		}
	};

    /* twitter registration / login */
    var twitReg = document.getElementById('regTwitter');
    twitReg.onclick = () => {
      var regLoader = document.getElementById('regWorking');
      var regButtons = document.getElementById('regButtons');
      regLoader.style.display = 'block';
      regButtons.style.display = 'none';
      user.trackClick('click_twitter', this.params.source);
      setTimeout(() => {
			user.registerTwitter()
		}, 1000);
			/*.then((result) => {
        // This gives you a the Twitter OAuth 1.0 Access Token and Secret.
        // You can use these server side with your app's credentials to access the Twitter API.
        user.twitter.token = result.credential.accessToken;
        user.twitter.secret = result.credential.secret;
        var twitterId = result.additionalUserInfo.profile.id_str;
        this.initUser(twitterId, true, true);
      }).catch((error) => {
      	regLoader.style.display = 'none';
        regButtons.style.display = 'block';
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        // The email of the user's account used.
        var email = error.email;
        // The firebase.auth.AuthCredential type that was used.
        var credential = error.credential;
        alert(errorMessage);
        // ..
      });*/
    };

    var followBtn = document.getElementById('followBtn');
    followBtn.onclick = () => {
    	user.trackClick('click_follow', this.params.source);
    	followBtn.style.display = 'none';
    	user.followTwitter().then((response) => {
				console.log(response);
	        // if (response.data == 'followed!') {
	          var sMsg = document.getElementById('successFollow');
	          sMsg.style.display = 'block';
	          setTimeout(() => {
	            this.continue();
	          }, 2000);
	          if (response.data == 'followed!') {
	          	user.trackPageView('follow_success', this.params.source);
	          }
	          else {
	          	user.trackPageView('follow_failed', this.params.source);
	          }
	        // }
    	}).catch((error) => {
    		user.trackPageView('follow_failed', this.params.source);
    		var sMsg = document.getElementById('successFollow');
	          sMsg.style.display = 'block';
	          setTimeout(() => {
	            this.continue();
	          }, 2000);
				// console.log(error);
				// followBtn.style.display = 'block';
    	});
    }

    document.getElementById('toVideo').addEventListener('click', () => {
		setTimeout(() => {
			user.trackPageView('imp_5', this.params.source);
			// youtube
			this.player.playVideo();

			// html5 video
			// this.player.play();
		}, 300);
    });

    document.getElementById('toTerms2').addEventListener('click', () => {
    	this.changeHeaderImage();
    	// document.getElementById('tnc').style.display = 'none';
    	setTimeout(() => {
    		// user.trackPageView('imp_tnc', this.params.source);
    		user.trackPageView('imp_2', this.params.source);
    	}, 300);
    });

    /*document.getElementById('startSurvey').addEventListener('click', () => {
    	setTimeout(() => {
    		user.trackPageView('imp_register', this.params.source);
    	}, 300);
    })*/
    
	document.getElementById('toApply').addEventListener('click', () => {
		setTimeout(() => {
			user.trackClick('imp_4', this.params.source);
		});
	});

    document.getElementById('regEmail').addEventListener('click', () => {
		setTimeout(() => {
			user.trackClick('click_email', this.params.source);
		});
    });
	  /* ==== Event Listeners End ==== */
	},
	checkTwitter: function() { // Check if user is following official page
		user.isFollowingTwitter().then((resp) => {
			console.log(resp);
			if (resp.data == 'following') {
				user.trackTwitterAlreadyFollow(this.params.source);
				this.continue();
		    }
			else {
				this.pages.toPage('followPage');
				user.trackPageView('imp_3', this.params.source);
		    }
		    this.changeHeaderImage();
	    }).catch((error) => {
	      console.log(error);
	      document.getElementById('regWorking').style.display = 'none';
	      document.getElementById('regButtons').style.display = 'block';
	    this.pages.toPage('followPage');
			user.trackPageView('imp_3', this.params.source);
	    });
	},
	initUser: function(userId, autoRegister, isTwitter) {
		/* check if user is registered, if no, then register user, if yes, continue on where the user left off */
		user.get(userId, this.params.source).then((response) => {
			console.log(response);
	    	if (response.data.status == false) { // user is not registered
		    	if (autoRegister) {
		    		var method = isTwitter ? 'twitter' : 'email';
		    		user.register(userId, this.params.source, method).then((res) => { // auto register user
						console.log(res);
						user.isWanderer = false;
						user.info.source = this.params.source;
						if (res.data.message == 'user exist.') {
							console.log('exist!');
							user.saveLocal({
								id: res.data.user.id,
								couponCode: res.data.user.couponCode,
								state: res.data.user.state,
								source: this.params.source
							}, this.params.source);
							user.loadLocal(this.params.source);
						}
						else {
							user.trackRegister(userId, this.params.source, method);
							console.log('not exist');
							user.saveLocal({
								id: userId,
								couponCode: '',
								state: '-',
								source: this.params.source
							}, this.params.source);
							user.loadLocal(this.params.source);
						}
						if (isTwitter) {
							this.checkTwitter();
						}
						else {
							this.continue();
						}
						this.enableSaveAnswer();
		    		}).catch((err) => {
		    			user.isWanderer = true;
		    			console.log(err);
		    			this.pages.toPage('errorPage');
		    		});
		    	}
		    	else {
		    		this.pages.toPage('termsPage');
		    		this.enableSaveAnswer();
		    	}
	    	}
	    	else { // user is registered
	    		if (userId.indexOf('@') < 0) {
	    			user.trackExist(userId, this.params.source, response.data.user.fingerprint);
	    		}
	    		user.isWanderer = false;
				user.info = response.data.user;
				user.info.source = this.params.source;
				user.saveLocal({
					id: userId,
					couponCode: response.data.user.couponCode,
					state: response.data.user.state,
					source: response.data.user.source
				}, this.params.source);
				user.loadLocal(this.params.source);
				if (isTwitter) {
					this.checkTwitter();
				}
				else {
					this.continue();
				}
				this.enableSaveAnswer();
	    	}
	    }).catch((error) => {
	    	user.isWanderer = true;
			console.log(error);
    		this.pages.toPage('termsPage');
	    });
	},
	enableSaveAnswer: function() {
    /* Auto save answer for every questions*/
	  var saveBtns = document.getElementsByClassName('saveQuestion');
	  for (var s = 0; s < saveBtns.length; s++ ) {
	  	saveBtns[s].addEventListener('click', (e) => {
	  		if (typeof(Storage) !== "undefined") {
			  	var qArray = [];
			  	for (var n = 1; n < this.q.length; n++) {
						if (this.q[n].selectedAnswer) {
							qArray[n] = this.q[n].selectedAnswer;
						}
			  	}
			  	user.saveLocalAnswers(qArray, this.params.source);
	  		}
	  		var qNo = parseInt(e.target.dataset.question);
	  		user.trackAnswer(user.info.id, qNo, this.q[qNo].selectedAnswer, this.params.source);
			  // user.saveAnswer(user.info.id, qArray);
	  	})
	 }
	},
	setQuestions() {
		/* ==== Set Questions ==== */
	  this.q[1] = new singleAnswerQuestion({
	  	wrapper: document.getElementById('q1'),
	  	question: '<span class="red">QUESTION 1</span><br>性別をお選びください。',
	  	answers: [{
	    	value: 'a1',
	    	text: '男性',
	    }, {
	    	value: 'a2',
	    	text: '女性'
	    }],
	    nextBtn: document.getElementById('toQ2')
	  });
	  
	  this.q[2] = new singleAnswerQuestion({
	  	wrapper: document.getElementById('q2'),
	  	question: '<span class="red">QUESTION 2</span><br>年齢をお選びください。',
	  	answers: [{
	    	value: 'a1',
	    	text: '１０代',
	    }, {
	    	value: 'a2',
	    	text: '２０代'
	    }, {
	    	value: 'a3',
	    	text: '３０代'
	    }, {
	    	value: 'a4',
	    	text: '４０代'
	    }, {
	    	value: 'a5',
	    	text: '５０代'
	    }, {
	    	value: 'a6',
	    	text: '６０代以上'
	    }],
	    nextBtn: document.getElementById('toQ3')
	  });

	  this.q[3] = new singleAnswerQuestion({
	  	wrapper: document.getElementById('q3'),
	  	question: '<span class="red">QUESTION 3</span><br>コンビニやスーパーで売られている、市販のコーヒー飲料（ブラック・カフェラテ問わず）をどのくらいの頻度で自分で飲むために購入しますか。',
	  	answers: [{
	    	value: 'a1',
	    	text: '週４回以上',
	    }, {
	    	value: 'a2',
	    	text: '週２〜３回'
	    }, {
	    	value: 'a3',
	    	text: '週１回'
	    }, {
	    	value: 'a4',
	    	text: '月２〜３回'
	    }, {
	    	value: 'a5',
	    	text: '月１回'
	    }, {
	    	value: 'a6',
	    	text: '２〜３ヶ月に１回'
	    }, {
	    	value: 'a7',
	    	text: '半年に１回'
	    }, {
	    	value: 'a8',
	    	text: '半年に１回未満'
	    }, {
	    	value: 'a9',
	    	text: '飲まない'
	    }],
	    nextBtn: document.getElementById('toQ4')
	  });
	  
	  this.q[4] = new singleAnswerQuestion({
	  	wrapper: document.getElementById('q4'),
	  	question: '<span class="red">QUESTION 4</span><br>普段「マウントレーニア」をどのくらいの頻度で自分で飲むために購入しますか。',
	  	answers: [{
	    	value: 'a1',
	    	text: '週４回以上',
	    }, {
	    	value: 'a2',
	    	text: '週２〜３回'
	    }, {
	    	value: 'a3',
	    	text: '週１回'
	    }, {
	    	value: 'a4',
	    	text: '月２〜３回'
	    }, {
	    	value: 'a5',
	    	text: '月１回'
	    }, {
	    	value: 'a6',
	    	text: '２〜３ヶ月に１回'
	    }, {
	    	value: 'a7',
	    	text: '半年に１回'
	    }, {
	    	value: 'a8',
	    	text: '半年に１回未満'
	    }, {
	    	value: 'a9',
	    	text: '飲まない'
	    }, {
	    	value: 'a10',
	    	text: '知らない'
	    }],
	    nextBtn: document.getElementById('toQ5')
	  });

	  this.q[5] = new singleAnswerQuestion({
	  	wrapper: document.getElementById('q5'),
	  	question: '<span class="red">QUESTION 5</span><br>普段「ペットボトル入りコーヒー（500ml 前後サイズ）」をどのくらいの頻度で自分で飲むために購入しますか。',
	  	answers: [{
	    	value: 'a1',
	    	text: '週４回以上',
	    }, {
	    	value: 'a2',
	    	text: '週２〜３回'
	    }, {
	    	value: 'a3',
	    	text: '週１回'
	    }, {
	    	value: 'a4',
	    	text: '月２〜３回'
	    }, {
	    	value: 'a5',
	    	text: '月１回'
	    }, {
	    	value: 'a6',
	    	text: '２〜３ヶ月に１回'
	    }, {
	    	value: 'a7',
	    	text: '半年に１回'
	    }, {
	    	value: 'a8',
	    	text: '半年に１回未満'
	    }, {
	    	value: 'a9',
	    	text: '飲まない'
	    }, {
	    	value: 'a10',
	    	text: '知らない'
	    }],
	    nextBtn: document.getElementById('toApply')
	  });
	  /* ==== Questions End ==== */
	},
	checkRedirection() {
		user.getRedirectResult().then((result) => {
			console.log(result);
			if (result.credential) {
			 	user.twitter.token = result.credential.accessToken;
		        user.twitter.secret = result.credential.secret;
		        var twitterId = result.additionalUserInfo.profile.id_str;
		        this.initUser(twitterId, true, true);
			}
			else {
				this.start();
			}
		}).catch((error) => {
			console.error(error);
			this.start();
		})
	},
	start: function(delay) {
		var localObj = user.getLocal(this.params.source);
		if (localObj.status == true && localObj.data.source == this.params.source) { // this browser already have user
			user.trackPageView('revisit', this.params.source);
			user.isWanderer = false;
			user.loadLocal(this.params.source);
			this.enableSaveAnswer();
			this.continue();
		}
		else {
			if (this.params.source) {
				if (this.params.userId) {
					this.initUser(this.params.userId, false);
				}
				else {
					if (localObj.status == true) {
						this.initUser(localObj.data.id, false);
					}
					else {
						this.pages.toPage('termsPage');
					}
				}
			}
			else {
				user.isWanderer = true;
				this.pages.toPage('errorPage');
			}
		}
	},
	init: function() {
		var vidWidth = document.getElementById('vid').clientWidth;
	    var vidHeight = document.getElementById('vid').clientHeight;

		/* init pagination */
		this.pages = new miniPages({
		  	pageWrapperClass: document.getElementById('page-wrapper'),
		  	pageClass: 'page',
		  	initialPage: document.getElementById('loadingPage'),
		  	pageButtonClass: 'pageBtn'
		});

		this.params = this.getParams();
		this.params.source = 'mtRainier';
		/* init registration form sections */
		this.formSections = new miniPages({
		  	pageWrapperClass: document.getElementById('formSecWrapper'),
		  	pageClass: 'sec',
		  	initialPage: document.getElementById('regSec')
		});
    
	    this.setQuestions();
	    this.events();
	    
	    /* apply mini select to <select> */
		// miniSelect.init('miniSelect');

		/* User Info */
		if (this.params.reset) {
		  	user.clearLocal(this.params.source);
		}

		var localObj = user.getLocal(this.params.source);
		if (localObj.status == true) {
			if (this.params.source) {
				user.get(localObj.data.id, this.params.source).then((response) => {
					console.log(response);
				    if (response.data.status == false && response.data.message != 'error') { // user is not registered
					    user.clearLocal(this.params.source); // db has been cleared, clear local storage also
				    }
				    else {
						user.saveLocal({
							id: response.data.user.id,
							couponCode: response.data.user.couponCode,
							state: response.data.user.state,
							source: response.data.user.source,
						}, this.params.source);
				    }
					// this.start();
					this.checkRedirection();
				}).catch((error) => {
					console.error(error);
					// this.start();
					this.checkRedirection();
				});
			}
			else {
				// this.start();
				this.checkRedirection();
			}
		}
		else {
			// this.start(1000);
			this.checkRedirection();
		}
	  
		var processed = false; // check if result has been processed to avoid double result processsing

		//youtube api
	    var ytScript = document.createElement('script');
	    ytScript.src = "https://www.youtube.com/iframe_api";
	    var firstScriptTag = document.getElementsByTagName('script')[0];
	    firstScriptTag.parentNode.insertBefore(ytScript, firstScriptTag);
	    
	    window.onYouTubeIframeAPIReady = () => {
	        this.player = new YT.Player('vid', {
		        height: vidHeight.toString(),
		        width: vidWidth.toString(),	
		        playerVars: {'rel': 0,'showinfo': 0, 'controls': 0, 'playsinline': 1},
		        videoId: 'HVEYvj3Hn0c',
		        events: {
		            'onStateChange': (event) => {
			            if (event.data == YT.PlayerState.ENDED) {
							this.pages.toPage('resultPage');
							user.trackPageView('imp_6', this.params.source);
			            }
			            else if (event.data == YT.PlayerState.PLAYING) {
			            	var playtimer = setInterval(() => {
			            		if (this.player.getPlayerState() != 1) {
			            			console.log('videoEnded!');
			            			clearInterval(playtimer);
			            		}
			            		else {
			            			if (this.player.getCurrentTime() / this.player.getDuration() > 0.86) { //80% played
									 	if (!winningLogic.processed) {
									  		winningLogic.processed = true;
									  		console.log('process result');
									  		this.processResult();
									  	}
									  	else {
									  		console.log('already processed');
									  	}
			            			}
			            		}
			            	}, 500);
			            	
			            }
		            }
		        }
		    });
	    }

	    //HTML5 Video
	    /*this.player = document.getElementById('vid');
	    this.player.addEventListener('click', () => {
			if (this.player.paused) {
				this.player.play();
			}
			else {
				this.player.pause()
				var vidBtn = document.getElementById('vidBtn');;
				vidBtn.classList.add('paused');
				vidBtn.style.opacity = '1';
				setTimeout(() => {
					vidBtn.style.opacity = '0';
				}, 310);
			}
	    });

		this.player.addEventListener('playing', (e) => {
			var vidBtn = document.getElementById('vidBtn');
			vidBtn.classList.remove('paused');
			vidBtn.style.opacity = '1';
			setTimeout(() => {
				vidBtn.style.opacity = '0';
			}, 310);
			var playtimer = setInterval(() => {
	    		if (this.player.paused) {
	    			clearInterval(playtimer);
	    		}
	    		else {
	    			if (this.player.currentTime / this.player.duration > 0.86) { //80% played
					 	 if (!winningLogic.processed) {
					  		winningLogic.processed = true;
					  		this.processResult();
					  	}
	    			}
	    		}
	    	}, 500);
		});

		this.player.addEventListener('ended', () => {
			this.pages.toPage('resultPage');
			user.trackPageView('imp_7', this.params.source);
		});*/
	},
	changeHeaderImage() {
    	document.getElementById('mainHeader').style.display = 'none';
    	document.getElementById('banner').style.display = 'block';
	}
}

document.addEventListener('DOMContentLoaded', function() {
	setTimeout(() => {
		try {
			app.init();
			modal.init();
		}
		catch(error) {
			alert('本キャンペーンは、下記ブラウザーのみ参加可能です。\n下記ブラウザーにて、ご参加ください。\n(参加可能なブラウザーバージョン)\n\nIE Version 11\nChrome Version 51以上\nFirefox  Version 50以上\nSafari Version 9.1以上\nOpera Version 37以上');
			user.trackError();
		}
		window.q = app.q;
		window.params = app.params;
	}, 500);

});

export {
	app,
	user
}