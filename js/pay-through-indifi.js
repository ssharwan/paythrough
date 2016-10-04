(function() {

	var server_domain = Environment.apiEndpoint;
	var indifi_token;
	var payment_request_id;
	var credit_line = null;

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
				  getCreditLine();
				} else {
					showServerError("Request failed. Please try again later.")
				}
			}, 
			error: function(xhr, status, error) {
				showServerError("Request failed. Please try again later.")
			}
		})
		jQuery('.pay-through-indifi-close').on('click', function(){
  			exit();
  		});
  	}
  	function attachEvents(){
  		jQuery('.capture-payment-amount-section-button').on('click', function(){
  			capturePayment();
  		})
  		jQuery('.capture-payment-otp-section-button').on('click', function(){
  			authorizePayment();
  		})
  		jQuery('.resend-otp-button').on('click', function(){
  			resendOTP();
  		})		
  	}
  	function exit(){
  		window.parent.postMessage( {'close_widget': true}, '*' );
  		var redirect_url = getParameterByName('redirect_url');
  		if(redirect_url){
  			window.location.assign(redirect_url);
  		} else {
	  		window.close();
	  	}
  	}
  	function showHidePaymentOrApplySection(section){
  		jQuery('#payment_flow').hide();
  		jQuery('#apply_flow').hide();
  		switch(section){
  			case 'payment':
	  			jQuery('#payment_flow').show();
	  			break;
	  		case 'apply':
	  			jQuery('#apply_flow').show();
	  			break;
  		}
  	}
  	function showStep(step, msg){

  		var capture_payment_amount_section = jQuery('.capture-payment-amount'),
			capture_payment_otp_section = jQuery('.capture-payment-otp'),
			capture_payment_success_section = jQuery('.capture-payment-success');
			jQuery('.success-message-section').html('');
  			jQuery('.error-section').html('');
	
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
  				capture_payment_success_section.find('.success-message').html(msg)
  				break;
  		}
  	}
  	function showServerError(errorObjOrString){
  		jQuery('.success-message-section').html('');
  		jQuery('.error-section').html('');
  		if (errorObjOrString.message){
  			jQuery('.error-section').html(errorObjOrString.message);
  		} else {
  			jQuery('.error-section').html(errorObjOrString);
  		}
  	}
  	function showSuccessMessage(msg){
  		jQuery('.success-message-section').html('');
  		jQuery('.error-section').html('');
  		jQuery('.success-message-section').html(msg);
  	}
  	function getCreditLine(){
  		var merchant_id = getParameterByName('merchant_id');
		var partner_id = getParameterByName('partner_id');
  		jQuery.ajax({
			url: server_domain + '/creditlines/'+partner_id+'/'+merchant_id, 
			contentType: "application/json; charset=utf-8",
			headers: { 'Authorization' : 'Bearer ' + indifi_token },
			type:  'GET',
			success: function(result) {
				if(result.success && result.data && result.data.application_request_id) {
					credit_line = result.data;
					if(credit_line.loan_id){
						showHidePaymentOrApplySection('payment');
						jQuery('.merchant-name').html(credit_line.borrower_name);
						jQuery('.total-credit').html(numeral(credit_line.loan_amount).format('0,0.00'));
						jQuery('.remaining-credit').html(numeral(credit_line.credit_left).format('0,0.00'));
				  		attachEvents();
						showStep('capture_amount');
					} else {
						showServerError("Application is not ready for disbursal.")
					}
				} else {
					showHidePaymentOrApplySection('apply');
				}
			}, 
			error: function(xhr, status, error) {
				if(xhr.responseJSON.data && xhr.responseJSON.data.name === "InvalidMerchant"){
					showHidePaymentOrApplySection('apply');
					return;
				}
				showServerError(xhr.responseJSON);
			}
		})
  	}
  	function validateAmount(amount) {
	    var re = /^(0|[1-9][0-9]*)$/;
	    return re.test(amount);
	}
  	function capturePayment(){
		var amount = jQuery('.payment-amount-input').val();
		jQuery('.payment-amount-input-error').html("");
		if(!amount.trim()){
			jQuery('.payment-amount-input-error').html("Enter amount");
			return;
		} else if(!validateAmount(amount.trim())){
			jQuery('.payment-amount-input-error').html("Invalid amount");
			return;
		}
		var merchant_id = getParameterByName('merchant_id');
		var partner_id = getParameterByName('partner_id');
		
		jQuery('.capture-payment-amount-section-button').attr('disabled','disabled').find('.spin').show();
		jQuery.ajax({
			url: server_domain + '/payments', 
			contentType: "application/json; charset=utf-8",
			headers: { 'Authorization' : 'Bearer ' + indifi_token },
			type:  'POST', 
			data: JSON.stringify({
				'amount': amount,
				'partner_id': partner_id,
				'merchant_id': merchant_id
			}),
			success: function(result) {
				jQuery('.capture-payment-amount-section-button').removeAttr('disabled').find('.spin').hide();
				if(result.success && result.data && result.data.id) {
					payment_request_id = result.data.id;
					jQuery('.requested-amount').html(amount);
					showStep('capture_otp')
				} else {
					showServerError("Request failed. Please try again later.")
				}
			}, 
			error: function(xhr, status, error) {
				jQuery('.capture-payment-amount-section-button').removeAttr('disabled').find('.spin').hide();
				showServerError(xhr.responseJSON);
			}
		})
  	}
  	function authorizePayment(){
		var otp = jQuery('.payment-otp-input').val();
		jQuery('.capture-payment-otp-section-button').attr('disabled','disabled').find('.spin').show();
		jQuery.ajax({
			url: server_domain + '/payments/'+payment_request_id+'/authorize', 
			contentType: "application/json; charset=utf-8",
			headers: { 'Authorization' : 'Bearer ' + indifi_token },
			type:  'POST', 
			data: JSON.stringify({
				'otp': otp
			}),
			success: function(result) {
				jQuery('.capture-payment-otp-section-button').removeAttr('disabled').find('.spin').hide();
				if(result.success) {
					var redirect_url = getParameterByName('redirect_url');
  					if(redirect_url){
  						window.location.assign(redirect_url);
  						return;
  					}
					var org_credit_left = numeral(credit_line.credit_left).value();
					credit_line.credit_left = org_credit_left - numeral(result.data[0].amount).value();
					jQuery('.capture-payment-success').find('.total-credit').html(numeral(credit_line.loan_amount).format('0,0.00'));
					jQuery('.capture-payment-success').find('.remaining-credit').html(numeral(credit_line.credit_left).format('0,0.00'));
					showStep('success_screen', "Payment request has been initiated successfully.")
				} else {
					showServerError("Request failed. Please try again later.")
				}
			}, 
			error: function(xhr, status, error) {
				jQuery('.capture-payment-otp-section-button').removeAttr('disabled').find('.spin').hide();
				showServerError(xhr.responseJSON);
			}
		})
  	}
  	function resendOTP(){
  		jQuery('.resend-otp-button').attr('disabled','disabled').find('.spin').show();
  		jQuery.ajax({
			url: server_domain + '/payments/'+payment_request_id+'/resend_otp', 
			contentType: "application/json; charset=utf-8",
			headers: { 'Authorization' : 'Bearer ' + indifi_token },
			type:  'POST',
			success: function(result) {
				jQuery('.resend-otp-button').removeAttr('disabled').find('.spin').hide();
				if(result.success) {
					showSuccessMessage("OTP sent successfully.")
				} else {
					showServerError("Request failed. Please try again later.")
				}
			}, 
			error: function(xhr, status, error) {
				jQuery('.resend-otp-button').removeAttr('disabled').find('.spin').hide();
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