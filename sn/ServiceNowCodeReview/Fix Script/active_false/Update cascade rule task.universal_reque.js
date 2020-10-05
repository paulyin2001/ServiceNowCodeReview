/* 
 * Application : ServiceNowCodeReview
 * ClassName   : sys_script_fix
 * Created On  : 2020-10-05 15:43:29
 * Created By  : admin
 * Updated On  : 2020-10-05 15:43:29
 * Updated By  : admin
 * URL         : /sys_script_fix.do?sys_id=cfb32aafdb231010c6ea1fc768961990
 */
fixCascadeRuleForUniversalRequest();

function fixCascadeRuleForUniversalRequest() {
	if (pm.isZboot())
		return;

	var dictionaryGr = new GlideRecord('sys_dictionary');
	dictionaryGr.addQuery('name', 'task');
	dictionaryGr.addQuery('element', 'universal_request');
	dictionaryGr.query();
	if (dictionaryGr.next() && dictionaryGr.getValue('reference_cascade_rule') != 'none') {
		dictionaryGr.setValue('reference_cascade_rule', 'none');
		dictionaryGr.update();
	}
}
