/* -----
   Facebook login interception (content script)
   
   @author obeattie
   -----
*/

var fragment = window.location.hash;

if (fragment.match(/#access_token=(.*?)[&$]/)){
    var token = decodeURIComponent(RegExp.$1);
    chrome.extension.sendRequest({
        method: 'setFBToken',
        token: token
    }, function(){
        window.close();
    });
}
