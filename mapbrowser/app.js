/*
 Map browser based on OpenLayers 4. 
 Misc. generic application stuff. 
 
 Copyright (C) 2017 Øyvind Hanssen, LA7ECA, ohanssen@acm.org
 
 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU Affero General Public License as published 
 by the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this program. If not, see <http://www.gnu.org/licenses/>.
*/



/**
 * Autojump between two fields.
 * @param {string} fieldId - Id of DOM field elelent to jump from.
 * @param {string} nextFieldId - Id of DOM field element to jump to.
 */
polaric.autojump = function(fieldId, nextFieldId)
{
   if (fieldId==null || nextFieldId==null) {
       console.error("Field id is null");
       return;
   }
   var downStrokeField;
   var myField=document.getElementById(fieldId);             
   myField.nextField=document.getElementById(nextFieldId); 
   myField.onkeydown=autojump_keyDown;
   myField.onkeyup=autojump_keyUp;


   function autojump_keyDown()
   {
      this.beforeLength=this.value.length;
      downStrokeField=this;
   }


   function autojump_keyUp()
   {
      if (
       (this == downStrokeField) && 
       (this.value.length > this.beforeLength) && 
       (this.value.length >= this.maxLength)
      )
         this.nextField.focus();
      downStrokeField=null;
   }
}

/* End of autojump stuff */



/**
 * Reference search in a popup window. 
 */
polaric.refSearch = function()
{
    var center = browser.getCenter();
    var cref = new LatLng(center[1], center[0]);
    uref = cref.toUTMRef(); 

   var x = browser.gui.showPopup( {
      html:
     '<h1>'+'Show reference on map'+'</h1>' +
     '<form class="mapref">'+
          
     '<span title="MGRS 100x100m square" class="sleftlab">MGRS ref: </span>' +
     
     '<div>' +
     '<input id="mgrsprefix" type="text" size="5" maxlength="5" value="' + polaric.MGRSprefix(center) +'">'+
     '<input id="locx" type="text" size="3" maxlength="3">'+
     '<input id="locy" type="text" size="3" maxlength="3">&nbsp;'+
     '<input type="button" id="butt_mgrs"'+
     '   value="'+'Find'+'">&nbsp;</div>'+
     
     '<hr><span class="sleftlab">UTM ref: </span>'+
     '<nobr><div><input id="utmz" type="text" size="2" maxlength="2" value="' +uref.lngZone+ '">' +
     '<input id="utmnz" type="text" size="1" maxlength="1" value="' +uref.latZone+ '">' +
     '&nbsp;&nbsp<input id="utmx" type="text" size="6" maxlength="6">'+
     '<input id="utmy" type="text" size="7" maxlength="7">&nbsp;'+
     '<input type="button" id="butt_utm"'+
     '   value="'+'Find'+'" style="margin-right:3.5em">&nbsp;</div></nobr>' +
     
     '<hr><span class="sleftlab">LatLong: </span>' +
     '<nobr><div><input id="ll_Nd" type="text" size="2" maxlength="2">°&nbsp;'+
     '<input id="ll_Nm" type="text" size="6" maxlength="6">\'&nbsp;<span id="ll_NS">N</span>&nbsp;&nbsp;'+
     '<input id="ll_Ed" type="text" size="2" maxlength="2">°&nbsp;' +
     '<input id="ll_Em" type="text" size="6" maxlength="6">\'&nbsp;<span id="ll_EW">E</span>&nbsp;' +
     '<input type="button" id="butt_ll"'+
     '   value="'+'Find'+'">&nbsp;</div></nobr>'+
     '</form>', 
     pixPos: [50,70],
     draggable: true,
     id: "refsearch"
   });  
   
   setTimeout(function() {
      polaric.autojump('utmz', 'utmnz');
      polaric.autojump('utmnz', 'utmx');
      polaric.autojump('utmx', 'utmy');
      polaric.autojump('locx', 'locy');
      polaric.autojump('ll_Nd', 'll_Nm');
      polaric.autojump('ll_Nm', 'll_Ed');
      polaric.autojump('ll_Ed', 'll_Em'); 
 
       
      $('#ll_NS').click( click_NS );
      
      $('#ll_EW').click( click_EW );
      
      $('#butt_mgrs').click( function() {
              var pos = polaric.parseMGRS(browser, $('#mgrsprefix').val(), $('#locx').val(), $('#locy').val());
              browser.goto_Pos(pos, true);
           });
      
      $('#butt_utm').click( function() {
              var pos = polaric.parseUTM( $('#utmx').val(), $('#utmy').val(), $('#utmnz').val(), $('#utmz').val());
              browser.goto_Pos(pos, true);
           });
      
      $('#butt_ll').click( function() {
              var lat_sign = ( $("ll_NS").html=="N" ? "" : "-");
              var lng_sign = ( $("ll_EW").html=="E" ? "" : "-");
              var pos = polaric.parseDM(
                  lat_sign+$('#ll_Nd').val(), $('#ll_Nm').val(), 
                  lng_sign+$('#ll_Ed').val(), $('#ll_Em').val());
              browser.goto_Pos(pos, true );
           });
   }, 1000);
   
   
   function click_NS() {
       var val = $("#ll_NS").html();
       $("#ll_NS").html( (val=="N" ? "S" : "N"));
   }
   
   function click_EW() {
       var val = $("#ll_EW").html();
       $("#ll_EW").html( (val=="E" ? "W" : "E"));
   }
   
}
