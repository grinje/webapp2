/*
 Map browser based on OpenLayers 4. 
 Misc. common functions and mithril modules for UI via DOM. 
 
 
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



/* Some simple DOM elements */
var br = m("br");
var hr = m("hr");
var nbsp = m.trust("&nbsp;");


/**
 * Input field with default values and syntax checking. 
 * @param {string} id - DOM element identifier. 
 * @param {number} size - size of field. 
 * @param {number} maxlength - max length of field.
 * @param {boolean} contentEditable - true if field can be edited by user. 
 * @param {regex} regex - Regular expression that defines what input is valid. 
 */
var textInput = {
 
    view: function(vn) {
       return m("input#"+vn.attrs.id, 
        { type: "text", size: vn.attrs.size, maxlength: vn.attrs.maxlength, 
          contentEditable: (vn.attrs.contentEditable ? vn.attrs.contentEditable : true),
            oninput: function() {
                if (!vn.attrs.regex) 
                    return;                
                vn.state.data=vn.dom.value;
                if (vn.attrs.regex.test(vn.dom.value)) {
                    vn.state.cssclass = "valid";
                    vn.dom.title = "Input OK";
                }
                else {
                    vn.state.cssclass = "invalid";
                    vn.dom.title = "Invalid input!";
                }    
            },
            onchange: function() {
                if (!vn.attrs.regex.test(vn.dom.value) && vn.attrs.value) 
                    setTimeout(function() {
                        vn.state.cssclass = "";
                        vn.dom.title = "Default from center of map";
                        vn.state.data = NaN;
                        m.redraw();
                    }, 4000);
            },
            
            value: (vn.state.data || vn.state.data == "" ? vn.state.data : vn.attrs.value),
            className: (vn.state.cssclass ? vn.state.cssclass : "")
        });
   }
}


/** 
 * MGRS input fields. 
 */
var mgrsInput = {
    view: function() {
        var center = CONFIG.mb.getCenter();
        return m("span", 
               {onclick: function() { polaric.autojump("locx", "locy"); }},
            m(textInput, {id:"mgrsprefix", size: 5, maxlength: 5, 
                regex: /^[0-9]{2}[C-X][A-Z][A-V]$/i, value: polaric.MGRSprefix(center)}), nbsp,
            m(textInput, {id:"locx", size: 3, maxlength: 3, regex: /^[0-9]{3}$/ }),
            m(textInput, {id:"locy", size: "3", maxlength: "3", regex: /^[0-9]{3}$/ }), nbsp )
    }
 }
 
 
/**
 * UTM input fields.
 */ 
var utmInput = {
    view: function() {
        var uref = CONFIG.mb.getCenterUTM();
        return m("span", 
                 { onclick: function() {     
                     polaric.autojump('utmz', 'utmnz');
                     polaric.autojump('utmnz', 'utmx');
                     polaric.autojump('utmx', 'utmy');
                 }},
            m(textInput, {id:"utmz", size: "2", maxlength: "2", value: uref.lngZone, regex:/^[0-9]{2}$/}), 
            m(textInput, {id:"utmnz", size: "1", maxlength: "1", value: uref.latZone, 
                 contentEditable: false}), nbsp, nbsp,
            m(textInput, {id:"utmx", size: "6", maxlength: "6", regex:/^[0-9]{6}$/}),
            m(textInput, {id:"utmy", size: "7", maxlength: "7", regex:/^[0-9]{7}$/}), nbsp)
    }
 }
 

 /**
  * Lat long input fields.
  */
var reg_MIN =  /^(([0-5]?[0-9])|60)(\.([0-9]{1,4}))?$/;
 
var latLngInput = {
    view: function() {
        var center = CONFIG.mb.getCenter();
        return m("span",                 
                 { onclick: function() {     
                     polaric.autojump('ll_Nd', 'll_Nm');
                     polaric.autojump('ll_Nm', 'll_Ed');
                     polaric.autojump('ll_Ed', 'll_Em'); 
                 }},
            m(textInput, {id:"ll_Nd", size: "2", maxlength: "2", regex:/^(([0-8]?[0-9])|90)$/}), "°", nbsp,nbsp,
            m(textInput, {id:"ll_Nm", size: "6", maxlength: "6", regex: reg_MIN }), "\'", nbsp, 
            m("span#ll_NS",   {onclick:this.clickNS}, (center[1] < 0 ? "S":"N")), nbsp, nbsp,
            m(textInput, {id:"ll_Ed", size: "3", maxlength: "3", regex:/^[0-9]{1,3}$/}), "°", nbsp,nbsp,
            m(textInput, {id:"ll_Em", size: "6", maxlength: "6", regex: reg_MIN }), "\'", nbsp,  
            m("span#ll_EW",   {onclick:this.clickEW}, (center[0] < 0 ? "W":"E")), nbsp, nbsp)
    },
    
    /* Change betwen E and W by clicking on the letter */
    clickNS: function() {    
       var val = $("#ll_NS").html();
          $("#ll_NS").html( (val=="N" ? "S" : "N"));
    },
    
    /* Change between N and S by clicking on the letter */
    clickEW: function() {
       var val = $("#ll_EW").html();
          $("#ll_EW").html( (val=="E" ? "W" : "E"));
    }
 }
 
