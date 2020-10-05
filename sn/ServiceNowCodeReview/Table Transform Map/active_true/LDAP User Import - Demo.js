/* 
 * Application : ServiceNowCodeReview
 * ClassName   : sys_transform_map
 * Created On  : 2020-10-05 16:29:53
 * Created By  : admin
 * Updated On  : 2020-10-05 16:30:13
 * Updated By  : admin
 * URL         : /sys_transform_map.do?sys_id=4b5ee26bdb631010c6ea1fc76896195b
 */
//
// The manager coming in from LDAP is the DN value for the manager.  
// The line of code below will locate the manager that matches the
// DN value and set it into the target record. To ignore the manager 
// from LDAP, remove or comment out the line: ldapUtils.setManager(source, target);
//
// NOTE: The 'manager' field SHOULD NOT be mapped in the 'Field Maps' related list
// if the manager is brought in through an LDAP import.  The 'ldapUtils' scripts
// here and in the 'onComplete' Transform Map will map this value automatically.
ldapUtils.setManager(source, target);

// Set the source LDAP server into the target record
target.ldap_server = source.sys_import_set.data_source.ldap_target.server;
