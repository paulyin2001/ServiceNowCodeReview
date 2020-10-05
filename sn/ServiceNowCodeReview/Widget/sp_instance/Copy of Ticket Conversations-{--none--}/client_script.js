/* 
 * Application : ServiceNowCodeReview
 * ClassName   : sp_widget
 * Created On  : 2020-10-05 18:17:08
 * Created By  : admin
 * Updated On  : 2020-10-05 18:17:08
 * Updated By  : admin
 * URL         : /sp_widget.do?sys_id=cee68fafdba31010c6ea1fc768961951
 */
function spTicketConversation($scope, nowAttachmentHandler, $animate, $rootScope, cabrillo, $timeout, snRecordWatcher, spUtil, spAriaUtil, $http, $window, $sce, snAttachmentHandler, i18n, dynamicTranslation) {
	$scope.showLocationIcon = false;
	$scope.msg = "";
	$scope.isNative = cabrillo.isNative();
	$scope.errorMessages = [];
	var existingEntries = {};
	var c = this;
	var skipNextRecordWatchUpdate = false;
	$scope.typing = [];
	if (!$scope.data.hasReadableJournalField && !$scope.data.isNewRecord)
		console.warn("No readable journal field (comments, work notes, etc.) available in the stream for this record");
	if ($scope.page && $scope.page.g_form)
		hideParentJournalFields();

	function hideParentJournalFields() {
		if (!$scope.data.stream)
			return;

		var fields = $scope.data.stream.journal_fields;
		var g_form = $scope.page.g_form;
		for (var f in fields)
			g_form.setDisplay(fields[f].name, false);
	}
	var liveProfiles = {};
	liveProfiles[$scope.user.sys_id] = {
		userID: $scope.user.sys_id,
		name: $scope.user.name,
		initials: $window.NOW.user_initials
	};
	if ($window.NOW.user_avatar) {
		liveProfiles[$scope.user.sys_id].userImage = $window.NOW.user_avatar;
	}

	$scope.getLiveProfileByUserId = function (userId){
		return liveProfiles[userId];
	}

	var pending = {};

	//Little caching implementation to make sure we only get a given user's profile once.
	$scope.hasLiveProfile = function hasLiveProfile(userId){
		if (!userId)
			return false;

		if (liveProfiles[userId])
			return true;
		
		if (pending[userId])
			return false;
		
		pending[userId] = $http.get('/api/now/live/profiles/sys_user.' + userId).then(function (response) {
			liveProfiles[userId] = {
				userID: userId,
				name: response.data.result.name,
				initials: buildInitials(response.data.result.name),
				avatar: response.data.result.avatar
			};
		});
		return false;
	}

	function buildInitials(name) {
		if (!name)
			return "--";
		
		var initialMatchRegex = /^[A-ZÀ-Ÿ]|^[\u3040-\u309f]|^[\u30a0-\u30ff]|^[\uff66-\uff9f]|^[\u4e00-\u9faf]/;
		// Included Hiragana, Katakana, CJK Unified Ideographs and Halfwidth and Fullwidth Forms Blocks 
		// Hiragana -> Japanese words, Katakana -> foreign words
		// CJK Unified Ideographs -> modern Chinese, Japanese, Korean and Vietnamese characters 
		
		var initials = name.split(" ").map(function(word) {
			return word.toUpperCase();
		}).filter(function(word) {
			return word.match(initialMatchRegex);
		}).map(function(word) {
			return word.substring(0,1);
		}).join("");

		return (initials.length > 3) ? initials.substr(0, 3) : initials;
	}


	function setupAttachmentHandler(){
		$scope.attachmentHandler = new nowAttachmentHandler(attachSuccess, appendError);

		function attachSuccess() {
			$rootScope.$broadcast("sp.attachments.update", $scope.data.sys_id);
			spAriaUtil.sendLiveMessage($scope.data.attachAddedMsg);
		}

		function appendError(error) {
			spUtil.addErrorMessage(error.msg + error.fileName);
			$scope.errorMessages.push(error);
			spAriaUtil.sendLiveMessage($scope.data.attachFailMsg);
		}

		$timeout(function() {
			$scope.attachmentHandler.setParams($scope.data.table, $scope.data.sys_id, 1024 * 1024 * $scope.data.maxAttachmentSize);
		})
	}
	setupAttachmentHandler();

	var recordWatcherTimer;
	$scope.$on('record.updated', function(name, data) {
		// Use record watcher update if:
		//	This record was updated AND This widget didn't trigger the update.
		if (data.table_name == $scope.data.table && data.sys_id == $scope.data.sys_id){
			$timeout.cancel(recordWatcherTimer);
			recordWatcherTimer = $timeout(function(){
				if (skipNextRecordWatchUpdate)
					skipNextRecordWatchUpdate = false;
				else
					spUtil.update($scope).then(function(r){
						$scope.data.stream = r.stream;
					});
			}, 250);
		}
	});

	$scope.$on('sp.show_location_icon', function(evt) {
		$scope.data.showLocationIcon = true;
	});
	
	$scope.$on('attachment.updated', function(evt,options) {
		if ($scope.data.sys_id != -1 && options.sys_id == $scope.data.sys_id)
			updateAttachmentState($scope.data.table, $scope.data.sys_id);
	});
	

	function updateAttachmentState(table, sys_id) {
			c.server.update().then(function (data) {
					if (!data.stream || !data.stream.entries)
						return;
					var newEntries = data.stream.entries;
					var currEntries = $scope.data.mergedEntries;
					var oldSize = currEntries ? currEntries.length : 0;
					var newSize = newEntries.length;
					for (var i = 0; i < oldSize; i++) {
							if (!currEntries[i].attachment)
									continue;
							for (var j = 0; j < newSize; j++) {
									if (currEntries[i].sys_id == newEntries[j].sys_id && newEntries[j].attachment) {
											currEntries[i].attachment.state = newEntries[j].attachment.state;
											break;
									}
							}
					}
			});
	}
	
	$scope.scanAttachment = function(attachment){
		snAttachmentHandler.scanAttachment(attachment);
	}
	
	$rootScope.$on('sp.sessions', function(evt, sessions) {
		$scope.typing = [];
		Object.keys(sessions).forEach(function (session) {
			var journalFields = scope.data.stream.journal_fields;
			var canUserReadJournalField = false;
			session = sessions[session];
			
			for (var j = 0; j < journalFields.length; j++) {
				if (journalFields[j].name === session.field_type) {
					canUserReadJournalField = journalFields[j].can_read;
					break;
				}									
			}
			
			if (session.status === 'typing' && canUserReadJournalField)
				$scope.typing.push(session);
			else
				return;
	
		})
	})

	$scope.$on('sp.conversation_title.changed', function(evt, text) {
		$scope.data.ticketTitle = text;
	})

	$scope.$watch("data.canWrite", function() {
		$rootScope.$broadcast("sp.record.can_write", $scope.data.canWrite);
	});

	var streamUpdateTimer;
	$scope.$watch("data.stream", function() {
		$timeout.cancel(streamUpdateTimer);
		streamUpdateTimer = $timeout(function() {
			mergeStreamEntries();
		}, 50);
	});

	function mergeStreamEntries() {
		$scope.placeholder = $scope.data.placeholderNoEntries;
		if (!$scope.data.stream || !$scope.data.stream.entries)
			return;

		$scope.placeholder = $scope.data.placeholder;
		var entries = $scope.data.stream.entries;
		for (var i = 0; i < entries.length; i++) {
		    if (entries[i].attachment)
		        entries[i].attachment = $scope.attachmentHandler.canViewImage([entries[i].attachment])[0];
		}
		if (!$scope.data.mergedEntries) {
			$scope.data.mergedEntries = $scope.data.stream.entries.slice();
			for (var i = 0; i < entries.length; i++) {
				existingEntries[entries[i].sys_id] = true;
			}

			return;
		}

		var mergedEntries = $scope.data.mergedEntries;
		for (var i = entries.length-1; i >= 0; i--) {
			var curEntry = entries[i];
			if (isNewEntry(mergedEntries, curEntry)){
				mergedEntries.unshift(curEntry);
				existingEntries[curEntry.sys_id] = true;
			}
		}
	}

	function isNewEntry(mergedEntries, item) {
		for (var i=0; i < mergedEntries.length; i++) {
			if (mergedEntries[i].sys_id === item.sys_id) {
				return false;
			}
		}
		return true;
	}

	$scope.getPlaceholder = function() {
		if ($scope.data.use_dynamic_placeholder && $scope.data.useSecondaryJournalField)
			return $scope.data.secondaryJournalField.label;
		return $scope.placeholder;
	};

	var colorCache;
	$scope.getFieldColor = function(fieldName) {
		var defaultColor = "transparent";
		if (colorCache) {
			if (fieldName in colorCache)
				return colorCache[fieldName];
			else
				return defaultColor;
		}

		colorCache = {};
		var jf = $scope.data.stream.journal_fields;
		for (var i=0; i<jf.length;i++) {
			colorCache[jf[i].name] = jf[i].color || defaultColor;
		}
		return $scope.getFieldColor(fieldName);
	}

	$scope.checkInLocation = function() {
		$rootScope.$broadcast("check_in_location");
		$rootScope.$broadcast("location.sharing.start");
	}

	$scope.$on("location.sharing.end", function() {
		$timeout(function() {$scope.msg = ""}, 500);
	})

	$scope.$on("location.sharing.start", function() {
		$scope.msg = $scope.data.sharingLocMsg;
	})

	$scope.scanBarcode = function() {
		$rootScope.$broadcast("scan_barcode");
	}

	$scope.$on("attachment.upload.start", function() {
		$scope.data.isPosting = true;
		$scope.msg = $scope.data.uploadingAttachmentMsg;
	})

	$scope.$on("attachment.upload.stop", function() {
		$scope.data.isPosting = false;
		$scope.msg = "";
		//update the stream so we get the new attachment
		spUtil.update($scope).then(function(r) {
			$scope.data.stream = r.stream;
		});
	});

	$scope.trustAsHtml = function(text) {
		return $sce.trustAsHtml(text);
	}
	
	$scope.data.isPosting = false;

	$scope.postEntry = function(input) {
		post(input);
	};

	function post(input) {
		if ($scope.data.isPosting)
			return;

		if (!input)
			return;

		input = input.trim();
		$scope.data.journalEntry = input;

		if ($scope.data.useSecondaryJournalField)
			$scope.data.journalEntryField = $scope.data.secondaryJournalField.name;
		else
			$scope.data.journalEntryField = $scope.data.primaryJournalField.name;
		$scope.data.isPosting = true;
		spUtil.update($scope).then(function(){
			$scope.data.isPosting = false;
			reset();
			spAriaUtil.sendLiveMessage($scope.data.messagePostedMsg);
			$timeout(function() {
				$scope.setFocus(); // sets focus back on input, defined in "link"
			});
		});
		skipNextRecordWatchUpdate = true;
		$scope.setFocus(); // sets focus back on input, defined in "link"
	}

	var reset = function(){
		$scope.userTyping("");
		$scope.data.journalEntry = "";
		$scope.updateFormWithJournalFields();
		$scope.data.useSecondaryJournalField = false;
		$scope.data.journalEntryField = "";
	}

	$scope.keyPress = function(event) {
		if ($scope.data.isPosting) {
			if (event.keyCode === 13 && !event.shiftKey)
				event.preventDefault();
			return;
		}
		
		if ($scope.data.enterKeyAddsNewLine)
			return; // must click Send button to submit
		
		if (event.keyCode === 13 && !event.shiftKey) {
			event.preventDefault();
			$timeout(function() {
				if ($scope.data.journalEntry)
					$scope.postEntry($scope.data.journalEntry);
			}, 250);
		}
	}

	$scope.userTyping = function(input) {
		var status = "viewing";
		if (input.length)
			status = "typing";

		var field = $scope.data.useSecondaryJournalField ? $scope.data.secondaryJournalField.name : $scope.data.primaryJournalField.name;
		$scope.$emit("record.typing", {status: status, value: input, table: $scope.data.table, sys_id: $scope.data.sys_id, field_type: field});
		$scope.updateFormWithJournalFields();
	}
	$scope.updateFormWithJournalFields = function () {
		var fieldName, fieldToClear = "";
		if ($scope.data.useSecondaryJournalField) {
			fieldName = $scope.data.secondaryJournalField.name;
			fieldToClear = $scope.data.primaryJournalField.name;
		} else {
			fieldName = $scope.data.primaryJournalField.name;
			fieldToClear = "";
		}
		$scope.$emit("activity_stream_is_changed", {"fieldName": fieldName, "fieldToClear": fieldToClear, "input": $scope.data.journalEntry});
	}

	$scope.toggleTranslation = function(e) {
	    e.showDetails = !e.showDetails;
		var translationObject = c.data.translation;
	    e.toggleMsg = e.showDetails ? translationObject.hideMsg : translationObject.showMsg;
	};

	$scope.getTranslatedText = function(translations) {
	    if (!(Array.isArray(translations)))
	        return;
	    var translatedText;
	    var translationsLength = translations.length;
	    for (var index = 0; index < translationsLength; index++) {
	        if (translations[index].targetLanguage === g_lang) {
	            translatedText = translations[index].translatedText;
	            break;
	        }
	    }
	    return translatedText;
	};

	$scope.getAdditionalParameters = function(e, isRetry) {
	    return {
	        'event': {
	            'eventName': 'Activity Stream - Portal',
	            'fieldType': e.element,
	            'retry': isRetry
	        },
	        'additionalParameters': [{
	            'parameterName': 'textType',
	            'parameterValue': 'html'
	        }, {
	            'parameterName': 'escapeHtml',
	            'parameterValue': e.contains_code
	        }]
	    };
	}

	$scope.showTranslationInProgress = function(e) {
	    e.showTranslation = true;
	    e.isTranslationInProgress = true;
	    e.isTranslationSuccess = false;
	    e.isTranslationError = false;
	}

	$scope.showTranslationSuccess = function(e, translatedText, credits) {
	    e.translatedText = translatedText;
	    e.credits = credits;
	    e.toggleMsg = c.data.translation.hideMsg;
	    e.isTranslationInProgress = false;
	    e.isTranslationSuccess = true;
	    e.isTranslationError = false;
	    e.showDetails = true;
	}

	$scope.showTranslationError = function(e, errorMessage, tryAgain) {
	    e.isTranslationInProgress = false;
	    e.isTranslationSuccess = false;
	    e.isTranslationError = true;
	    e.translatedText = errorMessage;
	    e.tryAgain = tryAgain;
	}

	$scope.translateText = function(e, isRetry) {
	    $scope.showTranslationInProgress(e);
	    var translationObject = c.data.translation;
	    dynamicTranslation.getTranslation(e.value, $scope.getAdditionalParameters(e, isRetry)).then(
	        function(successResponse) {
	            if (successResponse.detectedLanguage.code === g_lang) {
	                $scope.showTranslationError(e, translationObject.sameLanguageErrorMsg, false);
	                return;
	            }
	            var translatedText = $scope.getTranslatedText(successResponse.translations);
	            if (translatedText) {
	                var credits = i18n.format(translationObject.creditsMsg, successResponse.translator);
	                $scope.showTranslationSuccess(e, translatedText, credits);
	            } else {
	                translatedText = translationObject.genericErrorMsg;
	                $scope.showTranslationError(e, translatedText, true);
	            }
	        },
	        function(errorResponse) {
	            var errorCode = errorResponse.code;
	            var errorMessage;
	            var showRetry = false;
	            switch (errorCode) {
	                case '40052':
	                    errorMessage = translationObject.maxLengthErrorMsg;
	                    break;
	                case '40055':
	                    errorMessage = translationObject.credentialsErrorMsg;
	                    break;
	                case '40053':
	                case '40054':
	                case '40056':
	                    errorMessage = translationObject.langNotSupportedErrorMsg;
	                    break;
	                default:
	                    errorMessage = translationObject.genericErrorMsg;
	                    showRetry = true;
	            }
	            $scope.showTranslationError(e, errorMessage, showRetry);
	        }
	    );
	}
}
