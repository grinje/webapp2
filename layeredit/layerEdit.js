/*
 Map browser based on OpenLayers 5. Layer editor.
 
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

pol.layers = pol.layers || {};


/**
 * Base class for layer editors
 */

pol.layers.Edit = class {
    
    constructor(list) {
        const t = this;
        t.list = list;
        t.filt = {ext: null, zoom: null, proj: null};
   
   
        this.widget = {
            view: function() {
                let i=0;
                return m("form", [    
                    m("span.sleftlab", "Name: "),   
                    m(textInput, {id:"editLayer", size: 16, maxLength:25, regex: /^[^\<\>\'\"]+$/i }), br,  
                    m("span.sleftlab", "Visibility: "),
                    m(checkBox, {id:"vis.extent", onclick: filterExtent, checked: (t.filt.ext != null), 
                        title: "Check to make layer visible only if if overlaps this extent" }, 
                        "Map extent", nbsp, nbsp),
                    m(checkBox, {id:"vis.zoom", onclick: filterZoom, checked: (t.filt.zoom != null),
                        title: "Check to make layer visible only from this zoom level" },
                        "Zoom level+", nbsp, nbsp),
                    m(checkBox, {id:"vis.proj", onclick: filterProj, checked: (t.filt.proj != null), 
                        title: "Check to make layer visible only with this base map projection" },
                        "Base projection", br),
                    m(t.fields),
                    m("div.buttons", [
                        m("button#addButton", 
                          { disabled: !t.enabled(), type: "button", onclick: add, 
                            title: "Add layer to list"}, "Add" ),
                        m("button", { type: "reset", onclick: reset, title: "Clear input fields"}, "Reset" )
                    ])
                ]);
            }
        };
   
        
   
        /* To be redefined in subclass */
        this.fields = {
            view: function() { return null; }
        }
   

        /* Handler for checkbox. Extent filter on/off */
        function filterExtent() {
            t.filt.ext = (t.filt.ext == null ? 
                CONFIG.mb.getExtent().map(function(x) {return Math.round(x*1000)/1000;}) : null);
            console.log("Set extent filter: "+t.filt.ext);
        }
   
   
        /* Handler for checkbox. Zoom level filter on/off */
        function filterZoom() {
            t.filt.zoom = (t.filt.zoom == null ? CONFIG.mb.getResolution() : null);
            console.log("Set zoom filter: "+t.filt.zoom);
        }
   
   
        /* Handler for checkbox. Projection filter on/off */
        function filterProj() {
            t.filt.proj = (t.filt.proj == null ? CONFIG.mb.view.getProjection() : null);
            console.log("Set projection filter: " + (t.filt.proj==null ? "null" : t.filt.proj.getCode()));
        }
   
   
        /* To be redefined in subclass */
        function reset() { }
        
   
        /** 
         * Add a map layer to list 
         */
        function add() 
        {  
            const name = $("#editLayer").val(); 
            const layer = t.createLayer(name);

            if (layer==null)
                return false; 
            
            layer.predicate = t.createFilter(t.filt);
            layer.filt = {ext:t.filt.ext, zoom:t.filt.zoom, proj:t.filt.proj}; 
            
            /* IF server available and logged in, store on server as well */
            const srv = CONFIG.server; 
            if (srv && srv != null && srv.loggedIn) {
                const obj = {type: t.typeid, name: name, data: t.layer2obj(layer)}; 
                srv.putObj("layer", obj, i => { 
                    layer.index = JSON.parse(i);
                    layer.server = true;
                    m.redraw();
                    _add();
                });
            }
            else
                _add(); 
            return false; 
            
            function _add() {
                CONFIG.mb.addConfiguredLayer(layer, name, true);
                list.myLayerNames.push( {name: name, type: t.typeid, server: layer.server, index: layer.index} );
                list.myLayers.push( layer );

                // Save the layer name list. 
                CONFIG.store("layers.list", list.myLayerNames, true);
                // Save the layer using the concrete subclass
                CONFIG.store("layers.layer."+name.replace(/\s/g, "_"), t.layer2json(layer), true);       
            }
        }
   
    } /* constructor */

    
    onclose() {}
    
    
    /* To be defined in subclass */
    allowed() 
        { return true; }
    enabled()
        { return false; }


        
    /**
     * Create a filter function (a predicate) with the parameters 
     * (extent, zoom-level, projection) set by user
     */
    createFilter(f) {
        const filt = f;
    
        if (!filt)
            return null;

        /* Returns a closure with the chosen parameter values */
        return function() {
            return ( 
                (filt.ext == null  || ol.extent.intersects(filt.ext, CONFIG.mb.getExtent())) &&
                (filt.zoom == null || filt.zoom >= CONFIG.mb.getResolution()) &&
                (filt.proj == null || filt.proj === CONFIG.mb.view.getProjection())  
            );
        }
    }



    /**
     * Move settings to web-form. 
     * To be extended in subclass. 
     */
    edit(layer) {
        $("#editLayer").val(layer.get("name")).trigger("change").attr("ok", true);
        this.filt = layer.filt;
        if (this.filt == null) 
            this.filt = {ext:null, zoom:null, proj:null};
        $("#vis.extent").prop("checked", (this.filt.ext != null)).trigger("change");
        $("#vis.zoom").prop("checked", (this.filt.zoom != null)).trigger("change");
        $("#vis.proj").prop("checked", (this.filt.proj != null)).trigger("change");
    }



    /**
     * Create a layer. 
     * To be defined in subclass 
     */
    createLayer(n) {
        return null; 
    }
    
    
    
    /* 
     * Remove info specific to layer-type. 
     * To be redefined in subclass 
     */
    removeLayer(layer) { }
        
        
    /**
     * Stringify settings for a layer to JSON format. 
     * layer2obj is to be defined in subclass. 
     */
    layer2obj(layer) { 
        return null;
    }
    layer2json(layer) {
        return JSON.stringify(this.layer2obj(layer));
    }
    


    /**
     * Restore a layer from JSON format (see layer2json). 
     * obj2layer is to be defined in subclass. 
     */
    obj2layer(obj) {
        return null; 
    }
    json2layer(js) {
        return this.obj2layer(JSON.parse(js));
    }
    

    
} /* class */



pol.layers.Dummy = class extends pol.layers.Edit {
    constructor(list) {
        super(list);
    }
}





