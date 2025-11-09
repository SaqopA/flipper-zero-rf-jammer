#target illustrator

// Bu script, Adobe Illustrator'da açık olan aktif belgeyi
// dışarıdan gelen verilerle (metin ve resim yolları) günceller.

(function() {

    /**
     * Geçici JSON veri dosyasını okur ve içeriğini bir nesne olarak döndürür.
     * Bu yöntem, özellikle Windows'ta script'e doğrudan argüman geçirmenin
     * güvenilir olmadığı durumlar için kullanılır.
     * @returns {Object|null} Veri nesnesi veya hata durumunda null.
     */
    function readDataFromFile() {
        // Bu script'in bulunduğu dizini al
        var scriptFile = new File($.fileName);
        var scriptFolder = scriptFile.parent;

        // Geçici veri dosyasının yolunu oluştur
        var dataFile = new File(scriptFolder.fsName + '/tmp-data.json');

        if (dataFile.exists) {
            try {
                dataFile.open('r');
                var content = dataFile.read();
                dataFile.close();
                // JSON içeriğini ayrıştır
                return JSON.parse(content);
            } catch (e) {
                alert("Geçici veri dosyası ('tmp-data.json') okunamadı veya bozuk.\nHata: " + e);
                return null;
            }
        } else {
             // Dosya yoksa, muhtemelen macOS'ta argüman yöntemi kullanılıyordur.
            return null;
        }
    }

    // Ana fonksiyon
    function updateDocument() {
        if (app.documents.length === 0) {
            alert("Lütfen önce güncellenecek Illustrator dosyasını açın.");
            return;
        }

        var data = null;

        // Veriyi önce dosyadan okumayı dene (Windows için öncelikli)
        data = readDataFromFile();

        // Eğer dosyadan veri alınamazsa ve argümanlar varsa, eski yöntemi kullan (macOS uyumluluğu için)
        if (!data && typeof arguments !== 'undefined' && arguments.length > 0) {
           try {
                data = JSON.parse(arguments[0]);
           } catch(e) {
               alert("Script'e gönderilen veri (argüman) JSON formatında değil.");
               return;
           }
        }

        if (!data) {
            alert("Gerekli veriler scripte gönderilemedi. Sunucu tarafını veya 'tmp-data.json' dosyasını kontrol edin.");
            return;
        }

        var doc = app.activeDocument;

        function updateText(layerName, text) {
            if (typeof text === 'undefined' || text === null) return;
            try {
                var layer = doc.layers.getByName(layerName);
                layer.locked = false;
                layer.visible = true;
                if (layer.textFrames.length > 0) {
                    layer.textFrames[0].contents = text;
                }
            } catch (e) { /* Katman bulunamazsa atla */ }
        }

        function updateImage(layerName, imagePath) {
            if (!imagePath) return;
            try {
                var layer = doc.layers.getByName(layerName);
                layer.locked = false;
                layer.visible = true;
                if (layer.placedItems.length > 0) {
                    layer.placedItems[0].file = new File(imagePath);
                }
            } catch (e) { /* Katman bulunamazsa atla */ }
        }

        // --- Veri Güncelleme İşlemleri ---
        updateText('front_name_layer', data.name);
        updateText('front_surname_layer', data.surname);
        updateText('front_tc_layer', data.tc_no);
        updateText('front_id_layer', data.id_no);
        updateText('back_mother_layer', data.mother_name);
        updateText('back_father_layer', data.father_name);
        updateText('back_start_date_layer', data.start_date);
        updateText('back_end_date_layer', data.end_date);

        var fullName = (data.name || '') + ' ' + (data.surname || '');
        updateText('front_fullname_layer', fullName.toUpperCase());

        updateText('front_phone_layer', data.phone);
        updateText('front_plate_layer', data.plate);
        updateText('front_end_date_layer', data.end_date);

        // Görsel yollarını 'data' nesnesinden al
        updateImage('front_photo_layer', data.photoPath);
        updateImage('driver_photo_layer', data.photoPath);
        updateImage('back_qr_layer', data.qrPath);
        updateImage('qr_code_layer', data.qrPath);
    }

    // Scripti çalıştır
    updateDocument.apply(this, arguments);

})();
