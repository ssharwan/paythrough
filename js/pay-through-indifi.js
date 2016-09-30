(function() {

	var server_domain = Environment.apiEndpoint;
	var indifi_token;
	var payment_request_id;

	function init(){
		jQuery.ajax({
			url: server_domain + '/auth/token', 
			contentType: "application/json; charset=utf-8",
			type:  'POST', 
			data: JSON.stringify({
				'grant_type': 'client_credentials',
				'client_id': 'ESFDSGHREW4DF1B2C',
				'client_secret': 'KRf42gdyaxvTqHlHP6Vk1rewvKSHkd3d'
			}),
			success: function(data) {
				if(data.data.token) {
				  indifi_token = data.data.token;
				  attachEvents();
				  showStep('capture_amount');
				} else {
					showServerError("Request failed. Please try again later.")
				}
			}, 
			error: function(xhr, status, error) {
				showServerError("Request failed. Please try again later.")
			}
		})
  	}
  	function attachEvents(){
  		jQuery('.capture-payment-amount-section-button').on('click', function(){
  			capturePayment();
  		})
  		jQuery('.capture-payment-otp-section-button').on('click', function(){
  			authorizePayment();
  		})
  	}
  	function showStep(step){
  		var capture_payment_amount_section = jQuery('.capture-payment-amount'),
			capture_payment_otp_section = jQuery('.capture-payment-otp'),
			capture_payment_success_section = jQuery('.capture-payment-success');
	
  		switch(step){
  			case 'capture_amount':
  				capture_payment_amount_section.show();
  				capture_payment_otp_section.hide();
  				capture_payment_success_section.hide();
  				break;
  			case 'capture_otp':
  				capture_payment_amount_section.hide();
  				capture_payment_otp_section.show();
  				capture_payment_success_section.hide();
  				break;
  			case 'success_screen':
  				capture_payment_amount_section.hide();
  				capture_payment_otp_section.hide();
  				capture_payment_success_section.show();
  				break;
  		}
  	}
  	function showServerError(errorObjOrString){
  		if (errorObjOrString.message){
  			jQuery('.error-section').html(errorObjOrString.message);
  		} else {
  			jQuery('.error-section').html(errorObjOrString);
  		}
  	}
  	function capturePayment(){
		var amount = jQuery('.payment-amount-input').val();
		var agent_id = getParameterByName('agent_id');
		jQuery.ajax({
			url: server_domain + '/payments', 
			contentType: "application/json; charset=utf-8",
			headers: { 'Authorization' : 'Bearer ' + indifi_token },
			type:  'POST', 
			data: JSON.stringify({
				'amount': amount,
				'anchor_unique_id': agent_id
			}),
			success: function(result) {
				if(result.success && result.data && result.data.id) {
					payment_request_id = result.data.id;
					showStep('capture_otp')
				} else {
					showServerError("Request failed. Please try again later.")
				}
			}, 
			error: function(xhr, status, error) {
				showServerError(xhr.responseJSON);
			}
		})
  	}
  	function authorizePayment(){
		var otp = jQuery('.payment-otp-input').val();
		jQuery.ajax({
			url: server_domain + '/payments/'+payment_request_id+'/authorize', 
			contentType: "application/json; charset=utf-8",
			headers: { 'Authorization' : 'Bearer ' + indifi_token },
			type:  'POST', 
			data: JSON.stringify({
				'otp': otp
			}),
			success: function(result) {
				if(result.success) {
					showStep('success_screen')
				} else {
					showServerError("Request failed. Please try again later.")
				}
			}, 
			error: function(xhr, status, error) {
				showServerError(xhr.responseJSON);
			}
		})
  	}
  	function getParameterByName( name ){
		var regexS = "[\\?&]"+name+"=([^&#]*)", 
			regex = new RegExp( regexS ),
			results = regex.exec( window.location.search );
		if( results == null ){
			return "";
		} else{
			return decodeURIComponent(results[1].replace(/\+/g, " "));
		}
	}
	jQuery(document).ready(function(){
		init();	    
	});
  	

})();