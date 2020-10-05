/* 
 * Application : ServiceNowCodeReview
 * ClassName   : sys_script_fix
 * Created On  : 2020-10-05 15:42:21
 * Created By  : admin
 * Updated On  : 2020-10-05 15:42:21
 * Updated By  : admin
 * URL         : /sys_script_fix.do?sys_id=b673e2afdb231010c6ea1fc768961957
 */
gs.log("running fix script to determine classic app prior usage");
if (!pm.isZboot() && isClassicAppOAuthSafeToUpgrade()) {
    var classicAppUser = isClassicAppUser();
    gs.log("upgraded instance found; found glide.ui.m.allow_classic_mobile_app=" + classicAppUser);
    updateClassicApp(classicAppUser);
}

//update classic app status based on prior usage
function updateClassicApp(classicAppUser) {
    updateClassicAppProperty(classicAppUser);
    updateClassicOAuth(classicAppUser);
}

//update property value based on prior usage
function updateClassicAppProperty(classicAppUser) {
    gs.setProperty("glide.ui.m.allow_classic_mobile_app", classicAppUser);
}

//if user has beforehand disable classic app, don't enable it
function isClassicAppOAuthSafeToUpgrade() {
    var oAuthEntityGR = new GlideRecord('oauth_entity');
    oAuthEntityGR.get("be57bb02533102006b0fc91a8dc5877c");
    return sn_collision.CollisionAPI.willBeReplacedOnUpgrade(oAuthEntityGR);
}

//update OAuth glide record for ServiceNow Classic Mobile App
function updateClassicOAuth(classicAppUser) {
    var oAuthEntityGR = new GlideRecord('oauth_entity');
    oAuthEntityGR.get("be57bb02533102006b0fc91a8dc5877c");
    if (classicAppUser == true) {
        oAuthEntityGR.setValue('active', 1);
    } else {
        expireClassicAppTokens();
        expirePushRegistrations();
        oAuthEntityGR.setValue('active', 0);
    }
    oAuthEntityGR.update();
}

//expire register app tokens - to force logout users
function expireClassicAppTokens() {
    var oAuthGR = new GlideRecord('oauth_credential');
    oAuthGR.addQuery("peer", "be57bb02533102006b0fc91a8dc5877c");
    oAuthGR.query();
    var expires = new GlideDateTime();
    while (oAuthGR.next()) {
        oAuthGR.setValue('expires', expires);
        oAuthGR.update();
    }
}

//un-register push notification for classic app
function expirePushRegistrations() {
    var pushNotifGR = new GlideRecord('sys_push_notif_app_install');
    pushNotifGR.addQuery("sys_push_application_id", "ab704041ff1102009738ffffffffff33");
    pushNotifGR.addQuery("active", 1);
    pushNotifGR.query();
    while (pushNotifGR.next()) {
        pushNotifGR.setValue('active', 0);
        pushNotifGR.update();
    }
}

function isClassicAppUser() {
    var mobileDevicesExists = false;
    var mobileDevicesGR = new GlideRecord('sys_mobile_devices');
    if (mobileDevicesGR.isValid()) {
        mobileDevicesGR.addQuery('app_id', 'IN', 'com.servicenow.servicenow,com.servicenow.servicenow-internal');
        mobileDevicesGR.query();
        mobileDevicesExists = mobileDevicesGR.hasNext();
    } else {
        mobileDevicesExists = false;
    }
    return mobileDevicesExists;
}
