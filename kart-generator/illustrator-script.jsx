// json2.js (https://github.com/douglascrockford/JSON-js)
if(typeof JSON!=='object'){JSON={};}
(function(){'use strict';var rx_one=/^[\],:{}\s]*$/;var rx_two=/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g;var rx_three=/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;var rx_four=/(?:^|:|,)(?:\s*\[)+/g;var rx_escapable=/[\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;var rx_dangerous=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;function f(n){return n<10?'0'+n:n;}
function this_value(){return this.valueOf();}
if(typeof Date.prototype.toJSON!=='function'){Date.prototype.toJSON=function(){return isFinite(this.valueOf())?this.getUTCFullYear()+'-'+f(this.getUTCMonth()+1)+'-'+f(this.getUTCDate())+'T'+f(this.getUTCHours())+':'+f(this.getUTCMinutes())+':'+f(this.getUTCSeconds())+'Z':null;};Boolean.prototype.toJSON=this_value;Number.prototype.toJSON=this_value;String.prototype.toJSON=this_value;}
var gap;var indent;var meta;var rep;function quote(string){rx_escapable.lastIndex=0;return rx_escapable.test(string)?'"'+string.replace(rx_escapable,function(a){var c=meta[a];return typeof c==='string'?c:'\\u'+('0000'+a.charCodeAt(0).toString(16)).slice(-4);})+'"':'"'+string+'"';}
function str(key,holder){var i;var k;var v;var length;var mind=gap;var partial;var value=holder[key];if(value&&typeof value==='object'&&typeof value.toJSON==='function'){value=value.toJSON(key);}
if(typeof rep==='function'){value=rep.call(holder,key,value);}
switch(typeof value){case'string':return quote(value);case'number':return isFinite(value)?String(value):'null';case'boolean':case'null':return String(value);case'object':if(!value){return'null';}
gap+=indent;partial=[];if(Object.prototype.toString.apply(value)==='[object Array]'){length=value.length;for(i=0;i<length;i+=1){partial[i]=str(i,value)||'null';}
v=partial.length===0?'[]':gap?'[\n'+gap+partial.join(',\n'+gap)+'\n'+mind+']':'['+partial.join(',')+']';gap=mind;return v;}
if(rep&&typeof rep==='object'){length=rep.length;for(i=0;i<length;i+=1){if(typeof rep[i]==='string'){k=rep[i];v=str(k,value);if(v){partial.push(quote(k)+(gap?': ':':')+v);}}}}else{for(k in value){if(Object.prototype.hasOwnProperty.call(value,k)){v=str(k,value);if(v){partial.push(quote(k)+(gap?': ':':')+v);}}}}
v=partial.length===0?'{}':gap?'{\n'+gap+partial.join(',\n'+gap)+'\n'+mind+'}':'{'+partial.join(',')+'}';gap=mind;return v;}}
if(typeof JSON.stringify!=='function'){meta={'\b':'\\b','\t':'\\t','\n':'\\n','\f':'\\f','\r':'\\r','"':'\\"','\\':'\\\\'};JSON.stringify=function(value,replacer,space){var i;gap='';indent='';if(typeof space==='number'){for(i=0;i<space;i+=1){indent+=' ';}}else if(typeof space==='string'){indent=space;}
rep=replacer;if(replacer&&typeof replacer!=='function'&&(typeof replacer!=='object'||typeof replacer.length!=='number')){throw new Error('JSON.stringify');}
return str('',{'':value});};}
if(typeof JSON.parse!=='function'){JSON.parse=function(text,reviver){var j;function walk(holder,key){var k;var v;var value=holder[key];if(value&&typeof value==='object'){for(k in value){if(Object.prototype.hasOwnProperty.call(value,k)){v=walk(value,k);if(v!==undefined){value[k]=v;}else{delete value[k];}}}}
return reviver.call(holder,key,value);}
text=String(text);rx_dangerous.lastIndex=0;if(rx_dangerous.test(text)){text=text.replace(rx_dangerous,function(a){return'\\u'+('0000'+a.charCodeAt(0).toString(16)).slice(-4);});}
if(rx_one.test(text.replace(rx_two,'@').replace(rx_three,']').replace(rx_four,''))){j=eval('('+text+')');return typeof reviver==='function'?walk({'':j},''):j;}
throw new SyntaxError('JSON.parse');};}}());

#target illustrator

(function() {

    function readDataFromFile() {
        var scriptFile = new File($.fileName);
        var scriptFolder = scriptFile.parent;
        var dataFile = new File(scriptFolder.fsName + '/tmp-data.json');
        if (dataFile.exists) {
            try {
                dataFile.open('r');
                var content = dataFile.read();
                dataFile.close();
                return JSON.parse(content);
            } catch (e) {
                alert("Geçici veri dosyası ('tmp-data.json') okunamadı veya bozuk.\nHata: " + e);
                return null;
            }
        }
        return null;
    }

    function updateDocument() {
        if (app.documents.length === 0) {
            alert("Lütfen önce güncellenecek Illustrator dosyasını açın.");
            return;
        }

        var data = readDataFromFile();
        if (!data) {
             alert("Gerekli veriler scripte gönderilemedi. Sunucu tarafını veya 'tmp-data.json' dosyasını kontrol edin.");
            return;
        }

        var doc = app.activeDocument;

        /**
         * Belirtilen isimdeki TÜM katmanları bulur ve içlerindeki metin alanlarını günceller.
         * @param {string} layerName - Güncellenecek katmanların adı.
         * @param {string} text - Yazılacak yeni metin.
         */
        function updateText(layerName, text) {
            if (typeof text === 'undefined' || text === null) return;
            for (var i = 0; i < doc.layers.length; i++) {
                var currentLayer = doc.layers[i];
                if (currentLayer.name === layerName) {
                    try {
                        currentLayer.locked = false;
                        currentLayer.visible = true;
                        if (currentLayer.textFrames.length > 0) {
                            currentLayer.textFrames[0].contents = text;
                        }
                    } catch (e) { /* Hata olursa bu katmanı atla */ }
                }
            }
        }

        /**
         * Belirtilen isimdeki TÜM katmanları bulur ve içlerindeki görselleri günceller.
         * @param {string} layerName - Güncellenecek katmanların adı.
         * @param {string} imagePath - Yeni resmin dosya yolu.
         */
        function updateImage(layerName, imagePath) {
            if (!imagePath) return;
            for (var i = 0; i < doc.layers.length; i++) {
                var currentLayer = doc.layers[i];
                if (currentLayer.name === layerName) {
                    try {
                        currentLayer.locked = false;
                        currentLayer.visible = true;
                        if (currentLayer.placedItems.length > 0) {
                            currentLayer.placedItems[0].file = new File(imagePath);
                        }
                    } catch (e) { /* Hata olursa bu katmanı atla */ }
                }
            }
        }

        // --- Veri Güncelleme İşlemleri ---
        updateText('front_name_layer', data.name);
        updateText('front_surname_layer', data.surname);
        updateText('front_tc_layer', data.tc_no);
        updateText('front_id_layer', data.id_no);
        updateText('white_card_id_layer', data.white_card_id); // Beyaz Kart sicil nosu için eklendi
        updateText('back_mother_layer', data.mother_name);
        updateText('back_father_layer', data.father_name);
        updateText('back_start_date_layer', data.start_date);
        updateText('back_end_date_layer', data.end_date);

        var fullName = (data.name || '') + ' ' + (data.surname || '');
        updateText('front_fullname_layer', fullName.toUpperCase());
        updateText('doc_fullname_layer', fullName.toUpperCase()); // Görev Belgesi için eklendi

        updateText('front_phone_layer', data.phone);
        updateText('front_plate_layer', data.plate);
        updateText('front_end_date_layer', data.end_date);

        updateImage('front_photo_layer', data.photoPath);
        updateImage('driver_photo_layer', data.photoPath);
        updateImage('back_qr_layer', data.qrPath);
        updateImage('qr_code_layer', data.qrPath);
    }

    updateDocument();

})();
