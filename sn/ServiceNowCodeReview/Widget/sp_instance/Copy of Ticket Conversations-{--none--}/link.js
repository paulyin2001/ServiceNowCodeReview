/* 
 * Application : ServiceNowCodeReview
 * ClassName   : sp_widget
 * Created On  : 2020-10-05 18:17:08
 * Created By  : admin
 * Updated On  : 2020-10-05 18:17:08
 * Updated By  : admin
 * URL         : /sp_widget.do?sys_id=cee68fafdba31010c6ea1fc768961951
 */
function(scope, elm) {
	// Set the focus back on the input for IE11
	scope.setFocus = function() {
		var input = $(elm[0]).find('textarea#post-input');
		if (input[0])
			input[0].focus();
	}
}
