/* -----
   Options page javascript
   
   @author obeattie
   -----
*/

$(document).ready(function(){
    $('#username').attr('value', (localStorage['username'] || ''));
    
    $('form').bind('submit', function(e){
        e.preventDefault();
        localStorage['username'] = $('#username').attr('value');
    });
});
