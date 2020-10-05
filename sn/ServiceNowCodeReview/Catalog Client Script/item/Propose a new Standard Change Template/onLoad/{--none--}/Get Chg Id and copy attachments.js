/* 
 * Application : ServiceNowCodeReview
 * ClassName   : catalog_script_client
 * Created On  : 2020-10-05 15:53:16
 * Created By  : admin
 * Updated On  : 2020-10-05 15:53:16
 * Updated By  : admin
 * URL         : /catalog_script_client.do?sys_id=6af52663db631010c6ea1fc76896199b
 */
function onLoad() {
	//Type appropriate comment here, and begin script below
	var chgReqId = getParmVal('sysparm_chgReqId');
	if(chgReqId){
		g_form.setValue("variables.created_from_change", chgReqId);
		
		var itemGUID = gel('sysparm_item_guid');

		// Noticed that during the RP flow, a unique id is generated for the record ('std_change_proposal' in our case) which will be generated
		// by the record producer. Copying all the attachments from change_request to this record.
		var copyAttAj = new GlideAjax('StdChangeUtils');
		copyAttAj.addParam('sysparm_name', 'copyAttachments');
		copyAttAj.addParam('sysparm_srcTable', 'change_request');
		copyAttAj.addParam('sysparm_srcSysId', chgReqId);
		copyAttAj.addParam('sysparm_targetTable', 'std_change_proposal');
		copyAttAj.addParam('sysparm_targetSysId', itemGUID.value);
		copyAttAj.getXML(processAttachments);
	}
}

function getParmVal(name){
	var url = document.URL.parseQuery();
	if(url[name]){
		return decodeURI(url[name]);
	}
	else{
		return;
	}
}

function processAttachments(response) {
	// get attachmentInfo elements
	var attachments = response.responseXML.getElementsByTagName("attachmentInfo");
	for ( var i = 0; i < attachments.length; i++) {
		var id = attachments[i].getAttribute("id");
		var name = attachments[i].getAttribute("name");
		var imgSrc = attachments[i].getAttribute("imgSrc");
		addAttachmentNameToForm(id, name, "New", imgSrc, "true", "true");
	}
}
