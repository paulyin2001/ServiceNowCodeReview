/* 
 * Application : ServiceNowCodeReview
 * ClassName   : sys_script
 * Created On  : 2020-10-05 18:26:07
 * Created By  : admin
 * Updated On  : 2020-10-05 18:26:07
 * Updated By  : admin
 * URL         : /sys_script.do?sys_id=e1f8c763dbe31010c6ea1fc7689619c4
 */
(function executeRule(current, previous /*null when async*/) {

	SNC.ImportTableUtils.deleteImportTable(current.sys_id);

})(current, previous);
