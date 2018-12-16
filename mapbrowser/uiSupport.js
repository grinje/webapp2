/*
 Map browser based on OpenLayers 5. 
 Misc. common functions and mithril modules for UI via DOM. 
 
 
 Copyright (C) 2017-2018 Øyvind Hanssen, LA7ECA, ohanssen@acm.org
 
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
pol.ui.autojump = function(fieldId, nextFieldId)
{
    if (fieldId==null || nextFieldId==null) {
        console.error("Field id is null");
        return;
    }
   
    let beforeLength = 0;
    let downStrokeField = null;
    const myField = document.getElementById(fieldId);             
    myField.nextField=document.getElementById(nextFieldId); 
    myField.onkeydown=autojump_keyDown;
    myField.onkeyup=autojump_keyUp;


    function autojump_keyDown()
    {
        beforeLength=myField.value.length;
        downStrokeField=myField;
    }


    function autojump_keyUp()
    {     
        if (
            (myField == downStrokeField) && 
            (myField.value.length > beforeLength) && 
            (myField.value.length >= myField.maxLength)
        ) 
            myField.nextField.focus();
        downStrokeField=null;
   }
}
/* End of autojump stuff */



/* Some simple DOM elements */
const br = m("br");
const hr = m("hr");
const nbsp = m.trust("&nbsp;");



/**
 * Input field with default values and syntax checking. 
 * @param {string} id - DOM element identifier. 
 * @param {number} size - size of field. 
 * @param {number} maxlength - max length of field.
 * @param {boolean} contentEditable - true if field can be edited by user. 
 * @param {regex} regex - Regular expression that defines what input is valid. 
 */
const textInput = {
 
    view: function(vn) {
       return m("input#"+vn.attrs.id, 
        { type: "text", config: vn.attrs.config, size: vn.attrs.size, maxLength: vn.attrs.maxLength, 
          contentEditable: (vn.attrs.contentEditable ? vn.attrs.contentEditable : true),
            oninput: function() {
                vn.state.data=vn.dom.value;
                if (!vn.attrs.regex) 
                    return;                
                if (vn.attrs.regex.test(vn.dom.value)) {
                    vn.state.cssclass = "valid";
                    vn.dom.title = "Input OK";
                    $(vn.dom).attr("ok", true);
                }
                else {
                    vn.state.cssclass = "invalid";
                    vn.dom.title = "Invalid input!";
                    $(vn.dom).attr("ok", false);
                }    
            },
            onchange: function() {
                vn.state.data=vn.dom.value;
                vn.state.cssclass = "";
                if (!vn.attrs.regex.test(vn.dom.value) && vn.attrs.value) 
                    setTimeout(function() {
                        vn.state.cssclass = "";
                        vn.state.data = NaN;
                        m.redraw();
                    }, 4000);
            },
            
            value:
               ((vn.state.data || vn.state.data == "") ? vn.state.data : 
                  (vn.attrs.value ? vn.attrs.value: "")),
                
            className: (vn.state.cssclass ? vn.state.cssclass : "")
        });
   }
}



/**
 *  Checkbox: 
 *  Parameters: id, onclick, name, checked
 */
const checkBox = {
    view: function(vn) {
        return m("span", {title: vn.attrs.title}, 
            m("input#" + vn.attrs.id, 
         {
            onclick: vn.attrs.onclick,
            type:"checkbox", name: vn.attrs.name, value: vn.attrs.id, 
            checked: (vn.attrs.checked ? "checked" : null),
            onchange: (vn.attrs.onchange)
         }), nbsp, vn.children);
    }
}


const select = {
    view: function(vn) {
        return m("select#"+vn.attrs.id, {onchange: vn.attrs.onchange}, vn.attrs.list.map(
            x => m("option", {value: x.val}, x.label) ));
    }
}



/*
 * Attributes: 
 *  - id - id for div element (optional)
 *  - icons - array of image file names.
 *  - default - index (in icons array) of icon to be selected by default. (optional) 
 */
const iconPick = {
    oncreate: function(vn) {
        const inp = vn.state;
        inp.id=vn.attrs.id;     
    },    
    
    doSelect: function(vn, x) {
        vn.state.selected = x;
        $("div#iconlist").css("visibility", "hidden");
        $("div#iconlist").css("max-height", "1px");
        $("#iconpick").get(0).value = x;                 
    },
    
    showIcons: function() {
        $("div#iconlist").css("visibility", "visible");
        $("div#iconlist").css("max-height", "");
    },
    
    view: function(vn) {
        const icons = vn.attrs.icons; 
        const dfl = (vn.attrs.default ? vn.attrs.default : 0); 
        const xx = (vn.attrs.value && vn.attrs.value!=null ? vn.attrs.value : icons[dfl]);
        const yy = (vn.state.selected ? vn.state.selected : xx);
        
        setTimeout( ()=> {
            if (yy && $("#iconpick").get(0))
                $("#iconpick").get(0).value = yy
        }, 600);
        
        return m("span", [ 
            m("span#iconpick", { onclick:() => this.showIcons(), 
                onchange: ()=> { vn.state.selected = $("#iconpick>img").val()} }, 
                m("img", {src: yy} )), 
                 
            m("div#iconlist", {style: "max-height: 1px"}, icons.map( x=> {
                return m("img", { src: x, onclick: ()=> this.doSelect(vn, x) })
            }) 
        )])
    }
    
}


const Datepick = {
    oncreate: function(vn) {
        const input = document.createElement( 'input' );
        input.readOnly = true; 
        input.id=vn.attrs.id;
        input.value = vn.attrs.value; 
        vn.dom.appendChild( input );
        new Pikaday( {
            field: input,
            format: "YYYY-MM-DD"
        });
	},
    
    onchange: function(vn) {
        vn.attrs.value = input.value; 
    },
    
    view: function(vn) {
        return m("span.datepick")
  }
}




const dateTimeInput = {
    view: function(vn) {
        return m("span", 
            m(Datepick, {value: vn.attrs.dvalue, id:vn.attrs.id+"_date"}),
            m(textInput, {id:vn.attrs.id+"_time", size: "5", maxLength: "5", 
                value: vn.attrs.tvalue, regex: /^(([0-1][0-9])|(2[0-3]))\:[0-5][0-9]$/ }));
    }
}


/** 
 * MGRS input fields. 
 * FIXME: Only one at a time because of use if id attribute. OK? 
 */
const mgrsInput = {
    view: function() {
        const center = CONFIG.mb.getCenter();
        return m("span", 
               {onclick: function() { pol.ui.autojump("locx", "locy"); }},
            m(textInput, {id:"mgrsprefix", size: 5, maxlength: 5, 
               regex: /^[0-9]{2}[C-X][A-Z][A-V]$/i, value: pol.mapref.MGRSprefix(center) }), nbsp,
            m(textInput, {id:"locx", size: "3", maxLength: "3", regex: /^[0-9]{3}$/ }),
            m(textInput, {id:"locy", size: "3", maxLength: "3", regex: /^[0-9]{3}$/ }), nbsp );
    }
 }
 
 
/**
 * UTM input fields.
 * FIXME: Only one at a time because of use if id attribute. OK? 
 */ 
const utmInput = {
    view: function() {
        const uref = CONFIG.mb.getCenterUTM();
        return m("span", 
                 { onclick: function() {     
                     pol.ui.autojump('utmz', 'utmnz');
                     pol.ui.autojump('utmnz', 'utmx');
                     pol.ui.autojump('utmx', 'utmy');
                 }},
            m(textInput, {id:"utmz", size: "2", maxLength: "2", value: uref.lngZone, regex:/^[0-9]{2}$/}), 
            m(textInput, {id:"utmnz", size: "1", maxLength: "1", value: uref.latZone, 
                 contentEditable: false}), nbsp, nbsp,
            m(textInput, {id:"utmx", size: "6", maxLength: "6", regex:/^[0-9]{6}$/}),
            m(textInput, {id:"utmy", size: "7", maxLength: "7", regex:/^[0-9]{7}$/}), nbsp)
    }
 }
 

 /**
  * Lat long input fields.
  * FIXME: Only one at a time because of use if id attribute. OK? 
  */
const reg_MIN =  /^(([0-5]?[0-9])|60)(\.([0-9]{1,4}))?$/;
 
const latLngInput = {
    view: function() {
        const center = CONFIG.mb.getCenter();
        return m("span",                 
                 { onclick: function() {     
                     pol.ui.autojump('ll_Nd', 'll_Nm');
                     pol.ui.autojump('ll_Nm', 'll_Ed');
                     pol.ui.autojump('ll_Ed', 'll_Em'); 
                 }},
            m(textInput, {id:"ll_Nd", size: "2", maxLength: "2", regex:/^(([0-8]?[0-9])|90)$/}), "°", nbsp,nbsp,
            m(textInput, {id:"ll_Nm", size: "6", maxLength: "6", regex: reg_MIN }), "\'", nbsp, 
            m("span#ll_NS",   {onclick:this.clickNS}, (center[1] < 0 ? "S":"N")), nbsp, nbsp,
            m(textInput, {id:"ll_Ed", size: "3", maxLength: "3", regex:/^[0-9]{1,3}$/}), "°", nbsp,nbsp,
            m(textInput, {id:"ll_Em", size: "6", maxLength: "6", regex: reg_MIN }), "\'", nbsp,  
            m("span#ll_EW",   {onclick:this.clickEW}, (center[0] < 0 ? "W":"E")), nbsp, nbsp)
    },
    
    /* Change betwen E and W by clicking on the letter */
    clickNS: function() {    
       const val = $("#ll_NS").html();
          $("#ll_NS").html( (val=="N" ? "S" : "N"));
    },
    
    /* Change between N and S by clicking on the letter */
    clickEW: function() {
       const val = $("#ll_EW").html();
          $("#ll_EW").html( (val=="E" ? "W" : "E"));
    }
 }
 

 
const removeEdit = {
    view: vn => {
        return m("span.removeEdit", [ 
            m("img", {src:"images/edit-delete.png", onclick: vn.attrs.remove }), 
            m("img", {src:"images/edit.png", onclick: vn.attrs.edit }),
        ]);    
    }
}
 

/**
 * Use an element as a drag-drop zone for files.
 */

function dragdrop(element, onchange) {
	
	element.addEventListener("dragover", activate)
	element.addEventListener("dragleave", deactivate)
	element.addEventListener("dragend", deactivate)
	element.addEventListener("drop", deactivate)
	element.addEventListener("drop", update)
	window.addEventListener("blur", deactivate)

	function activate(e) {
		e.preventDefault();
        $(element).addClass("dragover");
	}

	function deactivate() {
        $(element).removeClass("dragover");
    }
	
	
    /* This is called when item is dropped on the element 
     * options.onchange is called using the dropped items as argument.. 
     */
	function update(e) {
		e.preventDefault()
		if (typeof onchange == "function") {
			onchange((e.dataTransfer || e.target))
		}
	}
}




 
 
