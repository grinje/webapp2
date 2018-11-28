/*
   Map browser based on OpenLayers 5. 
   Copyright (C) 2018 Øyvind Hanssen, LA7ECA, ohanssen@acm.org
   
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


/*
 * Class: FeatureInfo
 * Display info about features. 
 * We may register handlers for layers that generates content to be displayed. 
 */

pol.core.FeatureInfo = class {

    constructor(browser) {
        this.layers = [];
        const t = this;
        
       /*
        * Click handler
        */  
        browser.map.on("click", e => {
            forAllFeatures(e.pixel, 
                f => infoWidget.popup(e, f),
                list => {
                    listWidget.popup(e, list);
                    return -1;
                })
        });
        
        
        /*
         * Show a list of feature names to select from 
         */
        const listWidget = {
            /* Model */
            list: null, ev:null,
            /* View */
            view: ()=> {
                let i=0;
                return m("div", [
                    m("table.items", this.list.map( x => { 
                        const info = x.handler(x);
                        return m("tr", m("td", { 
                            onclick: e=> {
                                CONFIG.mb.gui.removePopup();
                                infoWidget.popup(this.ev, this.list[i++]);
                            }
                        }, info[0].val))}))
                ])
            },
            /* Controller */
            popup: (e, x)=> {
                this.list = x;
                this.ev = e;
                browser.gui.showPopup( {vnode: listWidget, geoPos: browser.pix2LonLat(e.pixel)} );
            }
        }
        
 
        /* 
         * Show info about a feature in a popup 
         */ 
        const infoWidget = {
            /* Model */
            info: null,
            /* View */
            view: ()=> {
                return m("div", [ this.info.map( x=> {    
                    return [ (x.lbl? m("span.sleftlab", x.lbl+": "):null), 
                             (x.val == 'undefined' ? null : [x.val, br]) ];
                })])
            },
            /* Controller */
            popup: (e, x)=> {
                this.info = x.handler(x);
                browser.gui.showPopup( {vnode: infoWidget, geoPos: browser.pix2LonLat(e.pixel)} );
            }
        }
        
        
        
        
        function forAllFeatures(pix, func, select) {
            let features = []; 
            for (const lr of t.layers) {
                const feats = CONFIG.mb.map.getFeaturesAtPixel( pix, 
                    {hitTolerance: 3, layerFilter: x => {return (x == lr.layer)} }
                );
                if (feats == null)
                    continue;
                for (const f of feats) {
                    f.handler = lr.handler;
                    features.push(f)
                }
            }
            if (features.length == 0)
                return;
            else if (features.length > 1) {
                const index = select(features);
                if (index >= 0)
                    func(features[index]);
            }
            else
                func(features[0]);
        }
    }

    
    
    
   /*
    * A registered handler-function should return an array of
    * objects. With a field val and optionally a field lbl to be used 
    * as a label.
    * 
    * registerRecursive assumes that a layer has an attribute displayInfo
    * which is the handler function. It also goes recursively traverses
    * Group layers. 
    */
    registerRecursive(layer) {
        if (layer instanceof ol.layer.Group) 
            layer.getLayers().forEach( x=> {
                this.registerRecursive(x);
            });
        else if (layer.displayInfo)
            this.layers.push({layer: layer, handler: layer.displayInfo});
    }
    
    
    register(layer, func) {
        this.layers.push({layer: layer, handler: func});
    }
    
    
    unregister(layer) {
        if (layer instanceof ol.layer.Group)
            layer.getLayers().forEach( x=> {
                this.unregister(x);
            });
        else
            for (i in this.layers)
                if (this.layers[i] == layer)
                    this.layers.splice(i, 1);
    }
    
    
}




