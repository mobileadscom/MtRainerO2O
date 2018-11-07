import axios from 'axios';
import * as firebase from 'firebase/app';
import 'firebase/auth';
import firebaseConfig from './firebaseConfig';

firebase.initializeApp(firebaseConfig);

var domain = 'https://www.mobileads.com';
var apiDomain = 'https://api.mobileads.com';

// var functionsDomain = 'https://us-central1-mtrainier-78bc8.cloudfunctions.net/twitter';
var functionsDomain = 'https://us-central1-mt-rainier.cloudfunctions.net/twitter';

var localStorageName = 'MtRainier';

var campaignId = '95953d6d8279e4a0be1ee8ba34d3cbe7';
var adUserId = '4831';
var rmaId = '4';
var generalUrl = 'https://track.richmediaads.com/a/analytic.htm?rmaId={{rmaId}}&domainId=0&pageLoadId={{cb}}&userId={{adUserId}}&pubUserId=0&campaignId={{campaignId}}&callback=trackSuccess&type={{type}}&value={{value}}&uniqueId={{userId}}&customId={{source}}';

var trackingUrl = generalUrl.replace('{{rmaId}}', rmaId).replace('{{campaignId}}', campaignId).replace('{{adUserId}}', adUserId).replace('{{cb}}', window.pgId || Date.now().toString());

var user = {
	isWanderer: false,
	twitter: {
		token: '',
		secret: ''
	},
	info: {
		answers: [],
		couponCode: '',
		id: '',
		noQuestionAnswered: 0,
		state: '-',
		source: '',
	},
	get: function(userId, source) {
    return axios.get(apiDomain + '/coupons/mtRainier/user_info', {
      params: {
        id: userId,
        source: source,
        cb: window.pgId || Date.now().toString()
      }
    });
	},
	register: function(userId, source, method) {
		return axios.post(apiDomain + '/coupons/mtRainier/user_register?id=' + userId + '&source=' + source + '&fingerprint=' + userId + '&type=' + method);
	},
	sendEmail: function(email, subjectTitle, content) {
	  	var formData = new FormData();
	    formData.append('sender', 'couponcampaign@ienomistyle.com');
	    formData.append('subject', subjectTitle);
	    formData.append('recipient', email);
	    formData.append('content', content);
	    axios.post(domain + '/mail/send', formData, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }).then(function(resp) {
	      console.log(resp);
	    }).catch(function(error) {
	      console.log(error);
	    });
	},
	registerTwitter: function() {
		console.log('registerTwitter');
		firebase.auth().languageCode = 'ja';
		var provider = new firebase.auth.TwitterAuthProvider();
	  // return firebase.auth().signInWithPopup(provider);
		firebase.auth().signInWithRedirect(provider);
	},
	getRedirectResult: function() {
		return new Promise(function(resolve, reject) {
			console.log('redirect result');
			firebase.auth().getRedirectResult().then(function(result) {
			  resolve(result);
			}).catch(function(error) {
			  reject(error);
			});	
		});
	},
	isFollowingTwitter: function() {
		return axios.post(functionsDomain + '/checkFriendship', {
      token: this.twitter.token,
      tokenSecret: this.twitter.secret,
      id: this.info.id
	  });
	},
	followTwitter: function() {
		return axios.post(functionsDomain + '/followUs', {
      token: this.twitter.token,
      tokenSecret: this.twitter.secret
    });
	},
	messageTwitter: function(message) {
		return axios.post(functionsDomain + '/sendMessage', {
      token: this.twitter.token,
      tokenSecret: this.twitter.secret,
      recipientId: this.info.id,
      text: message
     });
	},
	mark: function(userId, state, groups, source) {
		// var groupJSON = JSON.stringify(groups);
		var groupJSON = groups[0];
		return axios.post(apiDomain + '/coupons/mtRainier/mark_user?id=' + userId + '&state=' + state + '&group=' + groupJSON + '&source=' + source);
	},
	trackPageView: function(type, source) {
		if (window.location.hostname.indexOf('localhost') < 0) {
			var localObj = this.getLocal(source);
			var url = trackingUrl.replace('{{type}}', type).replace('{{value}}', '').replace('{{source}}', source);
			if (localObj.status == true) {
				url = url.replace('{{userId}}', localObj.data.id);
			}
			else {
				url = url.replace('{{userId}}', '');
			}
			// console.log(url);
			return axios.get(url);
		}
	},
	trackClick: function(type, source) {
		if (window.location.hostname.indexOf('localhost') < 0) {
			var localObj = this.getLocal(source);
			var url = trackingUrl.replace('{{type}}', type).replace('{{value}}', '').replace('{{source}}', source);
			if (localObj.status == true) {
				url = url.replace('{{userId}}', localObj.data.id);
			}
			else {
				url = url.replace('{{userId}}', '');
			}
			// console.log(url);
			return axios.get(url);
		}
	},
	trackTwitterAlreadyFollow: function(source) {
		if (window.location.hostname.indexOf('localhost') < 0) {
			var localObj = this.getLocal(source);
			var type = 'twitter_followed_new';
			var url = trackingUrl.replace('{{type}}', type).replace('{{value}}', '').replace('{{source}}', source);
			if (localObj.status == true) {
				url = url.replace('{{userId}}', localObj.data.id);
			}
			else {
				url = url.replace('{{userId}}', '');
			}
			// console.log(url);
			return axios.get(url);
		}
	},
	trackEmailLogin: function(userId, source) {
		if (window.location.hostname.indexOf('localhost') < 0) {
			var type = 'email_link';
			var url = trackingUrl.replace('{{type}}', type).replace('{{value}}', '').replace('{{userId}}', userId).replace('{{source}}', source);
			// console.log(url);
			return axios.get(url);
		}
	},
	trackExist: function(userId, source, retrievedFingerprint) {
		if (window.location.hostname.indexOf('localhost') < 0) {
			var type = 'exist';
			var url = trackingUrl.replace('{{type}}', type).replace('{{value}}', retrievedFingerprint + '_' + userId).replace('{{userId}}', userId).replace('{{source}}', source);
			// console.log(url);
			return axios.get(url);
		}
	},
	trackRegister: function(userId, source, method) {
	    if (window.location.hostname.indexOf('localhost') < 0) {
	    	var type = 'register';
	    	if (method == 'twitter') {
	    		type = 'register_tw';
	    	}
	    	else if (method == 'email') {
	    		type = 'register_email';
	    	}
			var url = trackingUrl.replace('{{type}}', type).replace('{{value}}', '').replace('{{userId}}', userId).replace('{{source}}', source);
			// console.log(url);
			return axios.get(url);
	    }
	},
	trackAnswer: function(userId, questionNo, answer, source) {
		if (window.location.hostname.indexOf('localhost') < 0) {
			var type = 'q_a';
			var value = 'q' + questionNo.toString() + '_' + encodeURIComponent(answer);
			var url = trackingUrl.replace('{{type}}', type).replace('{{value}}', value).replace('{{userId}}', userId).replace('{{source}}', source);
			// console.log(url);
			return axios.get(url);
		}
	},
	trackWin: function(userId, couponCode, source) {
		if (window.location.hostname.indexOf('localhost') < 0) {
			try {
				if (window.q[1]) {
					if (window.q[1].selectedAnswer == 'a1') {
						source = 'male';
					}
					else if (window.q[1].selectedAnswer == 'a2') {
						source = 'female';
					}
				}
			}
			catch(err){}
			var type = 'win';
			var url = trackingUrl.replace('{{type}}', type).replace('{{value}}', couponCode).replace('{{userId}}', userId).replace('{{source}}', source);
			url += '&tt=E&ty=E';
			if (userId.indexOf('@') > -1) {
				url += '&userType=email';
			}
			else {
				url += '&userType=twitter';
			}
			// console.log(url);
			return axios.get(url);
		}
	},
	trackLose: function(userId, source) {
		if (window.location.hostname.indexOf('localhost') < 0) {
			try {
				if (window.q[1]) {
					if (window.q[1].selectedAnswer == 'a1') {
						source = 'male';
					}
					else if (window.q[1].selectedAnswer == 'a2') {
						source = 'female';
					}
				}
			}
			catch(err){}
			var type = 'lose';
			var url = trackingUrl.replace('{{type}}', type).replace('{{value}}', '').replace('{{userId}}', userId).replace('{{source}}', source);
			url += '&tt=E&ty=E';
			if (userId.indexOf('@') > -1) {
				url += '&userType=email';
			}
			else {
				url += '&userType=twitter';
			}
			// console.log(url);
			return axios.get(url);
		}
	},
	trackError: function(source) {
		if (window.location.hostname.indexOf('localhost') < 0) {
			var url = trackingUrl.replace('{{type}}', 'no_support').replace('{{value}}', '').replace('{{userId}}', '').replace('{{source}}', 'MtRainier');
			url += '&tt=E&ty=E';
			// console.log(url);
			return axios.get(url);
		}
	},
	passResult: function(userId, flag, source, couponLink) { // flag: 1 = win, 0 = lose
		var psForm = new FormData();
		psForm.append('user_id', userId);
		psForm.append('flag', flag);
	    psForm.append('campaign_id', 'ca8ca8c34a363fa07b2d38d007ca55c6');
		psForm.append('source', source);
		if (couponLink) {
			psForm.append('coupon_url', encodeURIComponent(couponLink));
		}
		return axios.post(domain + '/api/coupon/softbank/api_call', psForm, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
	},
	saveLocal: function(userObj, source) {
		if (window.localStorage.getItem(localStorageName)) {
			try {
				var dataObj = JSON.parse(window.localStorage.getItem(localStorageName));
				if (dataObj[source]) {
					dataObj[source] = Object.assign(userObj, {source: source, answers: dataObj[source].answers});
					window.localStorage.setItem(localStorageName, JSON.stringify(dataObj));
				}
				else {
					dataObj[source] = Object.assign(userObj, {source: source, answers: []});
					window.localStorage.setItem(localStorageName, JSON.stringify(dataObj));
				}
			}
			catch(err) {
				console.error(err);
			}
		}
		else {
			var dataObj = {};
			dataObj[source] = Object.assign(userObj, {source: source, answers: []});
			window.localStorage.setItem(localStorageName, JSON.stringify(dataObj));
		}
	},
	saveLocalAnswers:function(answers, source) {
		if (window.localStorage.getItem(localStorageName)) {
			try {
				var dataObj = JSON.parse(window.localStorage.getItem(localStorageName));
				if (dataObj[source]) {
					dataObj[source].answers = answers;
					window.localStorage.setItem(localStorageName, JSON.stringify(dataObj));
				}
			}
			catch(err) {
				console.error('error getting local user info');
			}
		}
	},
	getLocal: function(source) {
		if (window.localStorage.getItem(localStorageName)) {
			try {
				var dataObj = JSON.parse(window.localStorage.getItem(localStorageName));
				if (dataObj[source] && dataObj[source].id) {
					return {
						data: dataObj[source],
						status: true
					}
				}
				else {
					return {
						status: false
					}
				}
			}
			catch(err) {
				console.error(err);
				return {
					status: false
				}
			}
		}
		else {
			return {
				status: false
			}
		}
	},
	loadLocal: function(source) {
		if (window.localStorage.getItem(localStorageName)) {
			try {
				var dataObj = JSON.parse(window.localStorage.getItem(localStorageName));
				if (dataObj[source] && dataObj[source].id) {
					user.info.id = dataObj[source].id;
					user.info.couponCode = dataObj[source].couponCode;
					user.info.state = dataObj[source].state;
					user.info.answers = dataObj[source].answers;
					user.info.source = dataObj[source].source;
					console.log(user);
				}
			}
			catch(err) {
				console.error(err);
			}
		}
	},
	clearLocal: function(source) {
		if (window.localStorage.getItem(localStorageName)) {
			try {
				var dataObj = JSON.parse(window.localStorage.getItem(localStorageName));
				if (dataObj[source]) {
					delete dataObj[source];
					window.localStorage.setItem(localStorageName, JSON.stringify(dataObj));
				}
			}
			catch(err) {
				console.error(err);
			}
		}
	},
	clearLocalClean: function() {
		window.localStorage.removeItem(localStorageName);
	}
};

export default user;