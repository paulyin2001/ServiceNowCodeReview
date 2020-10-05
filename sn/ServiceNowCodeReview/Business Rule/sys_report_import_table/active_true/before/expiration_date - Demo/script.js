/* 
 * Application : ServiceNowCodeReview
 * ClassName   : sys_script
 * Created On  : 2020-10-05 18:26:46
 * Created By  : admin
 * Updated On  : 2020-10-05 18:26:46
 * Updated By  : admin
 * URL         : /sys_script.do?sys_id=cf19cf63dbe31010c6ea1fc768961994
 */
(function executeRule(current, previous /*null when async*/) {
	var daysToExpire = current.expiration_days;
	
	var gd = new GlideDate(); 
    gd.addDays(daysToExpire);
	
	//set the expire on date 
	current.expire_on_date = gd;

})(current, previous);
