/* 
 * Application : ServiceNowCodeReview
 * ClassName   : sys_script_include
 * Created On  : 2020-09-16 19:46:59
 * Created By  : admin
 * Updated On  : 2020-09-21 16:53:50
 * Updated By  : admin
 * URL         : /sys_script_include.do?sys_id=ef25e12ddb131010c6ea1fc7689619dc
 */
var TestScriptInclude = Class.create();
TestScriptInclude.prototype = {
    initialize: function() {
		gs.info('hello world');
    },
	newFunc: function(){
		gs.info('here is a new function!');
	},
    type: 'TestScriptInclude'
};
