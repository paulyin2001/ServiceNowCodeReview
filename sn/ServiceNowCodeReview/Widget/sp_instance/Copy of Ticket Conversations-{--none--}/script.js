/* 
 * Application : ServiceNowCodeReview
 * ClassName   : sp_widget
 * Created On  : 2020-10-05 18:17:08
 * Created By  : admin
 * Updated On  : 2020-10-05 18:17:08
 * Updated By  : admin
 * URL         : /sp_widget.do?sys_id=cee68fafdba31010c6ea1fc768961951
 */
(function() {
	data.currentUserID = gs.getUserID();
	data.maxAttachmentSize = parseInt(gs.getProperty("com.glide.attachment.max_size", 1024));
	if (isNaN(data.maxAttachmentSize))
		data.maxAttachmentSize = 24;
	data.uploadingAttachmentMsg = gs.getMessage("Uploading attachment...");
	data.sharingLocMsg = gs.getMessage("Sharing location...");
	data.scanBarcodeMsg = gs.getMessage("Scan barcode");
	data.checkInLocMsg = gs.getMessage("Check in location");
	data.messagePostedMsg = gs.getMessage("Message has been sent");
	data.viewMsg = gs.getMessage("View");
	data.attachAddedMsg = gs.getMessage("Attachment added");
	data.attachFailMsg = gs.getMessage("Failed to add attachment");
	data.scanFailedMsg = gs.getMessage("File failed security scan");
	data.sys_id = (input && input.sys_id) || options.sys_id || $sp.getParameter("sys_id");
	data.table = (input && input.table) || options.table || $sp.getParameter("table");
	// don't use options.title unless sys_id and table also come from options
	if (options && options.sys_id && options.table)
		data.ticketTitle = options.title;
	data.placeholder = options.placeholder || gs.getMessage("Type your message here...");
	data.placeholderNoEntries = options.placeholderNoEntries || gs.getMessage("Type your message here...");
	data.btnLabel = options.btnLabel || gs.getMessage("Send");
	data.includeExtended = options.includeExtended || false;
	data.use_dynamic_placeholder = options.use_dynamic_placeholder;
	data.hideAttachmentBtn = options.hideAttachmentBtn;
	data.viewAttachmentMsg = gs.getMessage("View attachment");
	data.downloadAttachmentMsg = gs.getMessage("Download attachment");

	var translationLuaParameters = {
		'event': {
			'eventName': 'Activity Stream - Portal'
			}
		};
	var isDynamicTranslationInstalled = GlidePluginManager.isActive("com.glide.dynamic_translation");
	if (isDynamicTranslationInstalled) {
		var isDynamicTranslationEnabled	= sn_dt_api.DynamicTranslation.isEnabled(translationLuaParameters);
		data.isTranslationEnabled = isDynamicTranslationEnabled && isDynamicTranslationEnabled.translation;
		if(data.isTranslationEnabled)
			initDynamicTranslation();
	}

	function initDynamicTranslation() {
	    var translation = {};
	    translation.translateLinkMsg = gs.getMessage("Translate");
	    translation.sameLanguageErrorMsg = gs.getMessage("This content is written in your preferred language. No need to translate.");
	    translation.genericErrorMsg = gs.getMessage("Unable to translate.");
	    translation.credentialsErrorMsg = gs.getMessage("Credentials are missing or invalid. Contact your administrator.");
	    translation.maxLengthErrorMsg = gs.getMessage("Text has exceeded the maximum length.");
	    translation.langNotSupportedErrorMsg = gs.getMessage("Text cannot be translated to your preferred language.");
	    translation.creditsMsg = gs.getMessage("Translated by {0}");
	    translation.translationProgressMsg = gs.getMessage("Translating...");
	    translation.hideMsg = gs.getMessage("Hide");
	    translation.showMsg = gs.getMessage("Show");
	    translation.tryAgainMsg = gs.getMessage("Try Again");
	    data.translation = translation;
	}

	data.enterKeyAddsNewLine = false;
	if (options.enter_key_behavior == "System property")
		data.enterKeyAddsNewLine = gs.getProperty("glide.service_portal.comment.enter_adds_newline") == "true";
	else if (options.enter_key_behavior == "New line")
		data.enterKeyAddsNewLine = true;

	var gr = new GlideRecord(data.table);
	if (!gr.isValid())
		return;

	gr.get(data.sys_id);
	data.isNewRecord = data.sys_id == -1 || gr.isNewRecord();
	if ((!gr.isValidRecord() && data.sys_id != -1) || !gr.canRead())
		return;

	data.table = gr.getRecordClassName(); // use actual table for the record
	options.no_readable_journal_field_message = options.no_readable_journal_field_message || gs.getMessage("No readable comment field");
	data.number = gr.getDisplayValue('number');
	data.created_on = gr.getValue('sys_created_on');

	if (input) { // if we have input then we're saving
		if (input.journalEntry && input.journalEntryField){
			if (gr.canWrite(input.journalEntryField)){
				gr[input.journalEntryField].setDisplayValue(input.journalEntry);
				gr.update();
				$sp.logStat('Comments', data.table, data.sys_id, input.journalEntry);
			}
		}
		data.ticketTitle = input.ticketTitle;
		data.placeholder = input.placeholder;
		data.btnLabel = input.btnLabel;
		data.includeExtended = input.includeExtended;
	} else {
		if (!data.ticketTitle) {
			if (gr.short_description.canRead())
				data.ticketTitle = gr.getDisplayValue("short_description");
			if (!data.ticketTitle)
				data.ticketTitle = data.number;
		}

		$sp.logStat('Task View', data.table, data.sys_id);
	}

	data.canWrite = gr.canWrite();
	data.canAttach = userCanAttach(gr);
	data.canRead = gr.canRead();
	data.hasWritableJournalField = false;
	data.hasReadableJournalField = false;
	if (data.canRead && !data.isNewRecord) {
		data.stream = $sp.getStream(data.table, data.sys_id);
		// Journal fields come in correct order already
		// so grab the first 2 writeable fields
		if ('journal_fields' in data.stream) {
			var jf = data.stream.journal_fields;
			for(var i=0; i < jf.length; i++){
				if (jf[i].can_read === true)
					data.hasReadableJournalField = true;
				if (jf[i].can_write === true){
					data.hasWritableJournalField = true;
					if (!data.primaryJournalField)
						data.primaryJournalField = jf[i];
					else if (data.includeExtended && !data.secondaryJournalField)
						data.secondaryJournalField = jf[i];
					else
						break;
				}
			}
		}

	}

	data.tableLabel = gr.getLabel();

	function userCanAttach(originalRecord) {
		if (!gs.hasRole(gs.getProperty("glide.attachment.role")))
			return false;
		
		// To check whether user can upload attachments, need to check "no_attachment" table
		// attribute of the target record (e.g., incident vs. task), so fetch it if we need to.
		// GlideRecordScriptUtil.getRealRecord is not available to scoped apps, so can't use it.
		var targetRecordForAttributes = originalRecord;
		if (originalRecord.getRecordClassName() != originalRecord.getTableName()) {
			targetRecordForAttributes = new GlideRecord(originalRecord.getRecordClassName());
			targetRecordForAttributes.get(originalRecord.getUniqueValue());
		}
		return targetRecordForAttributes.getAttribute("no_attachment") != "true";
	}

})()
