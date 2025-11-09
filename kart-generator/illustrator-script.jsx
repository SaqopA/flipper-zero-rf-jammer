#target illustrator

// Bu script, Adobe Illustrator'da açık olan aktif belgeyi
// dışarıdan gelen verilerle (metin ve resim yolları) günceller.

(function() {
    // Ana fonksiyon
    function updateDocument() {
        // Illustrator'da açık bir belge olup olmadığını kontrol et
        if (app.documents.length === 0) {
            alert("Lütfen önce güncellenecek Illustrator dosyasını açın.");
            return;
        }

        // Script'e gönderilen argümanları kontrol et
        if (typeof arguments === 'undefined' || arguments.length < 1) {
            alert("Gerekli veriler scripte gönderilmedi. Sunucu tarafını kontrol edin.");
            return;
        }

        // Argümanları işle: JSON verisi ve dosya yolları
        var data = JSON.parse(arguments[0]);
        var photoPath = arguments.length > 1 && arguments[1] ? arguments[1] : null;
        var qrPath = arguments.length > 2 && arguments[2] ? arguments[2] : null;

        var doc = app.activeDocument;

        // --- Yardımcı Fonksiyonlar ---

        /**
         * Belirtilen katmandaki ilk metin alanının içeriğini günceller.
         * @param {string} layerName - Güncellenecek katmanın adı.
         * @param {string} text - Yazılacak yeni metin.
         */
        function updateText(layerName, text) {
            if (typeof text === 'undefined' || text === null) return; // Metin boşsa işlem yapma
            try {
                var layer = doc.layers.getByName(layerName);
                // Katmanın kilitli olmadığından ve görünür olduğundan emin ol
                layer.locked = false;
                layer.visible = true;
                if (layer.textFrames.length > 0) {
                    layer.textFrames[0].contents = text;
                }
            } catch (e) {
                // Katman bulunamazsa hata vermemesi için boş bırakıldı.
                // İsteğe bağlı olarak buraya bir loglama eklenebilir.
                // $.writeln("Katman bulunamadı: " + layerName);
            }
        }

        /**
         * Belirtilen katmandaki ilk yerleştirilmiş görseli (placed item) günceller.
         * @param {string} layerName - Güncellenecek katmanın adı.
         * @param {string} imagePath - Yeni resmin dosya yolu.
         */
        function updateImage(layerName, imagePath) {
            if (!imagePath) return; // Resim yolu yoksa işlem yapma
            try {
                var layer = doc.layers.getByName(layerName);
                layer.locked = false;
                layer.visible = true;
                if (layer.placedItems.length > 0) {
                    // Var olan görseli yeni dosya ile değiştir
                    layer.placedItems[0].file = new File(imagePath);
                }
            } catch (e) {
                // $.writeln("Görsel katmanı bulunamadı: " + layerName);
            }
        }

        // --- Veri Güncelleme İşlemleri ---

        // Mavi Kart / Beyaz Kart / Yaka Kartı için ortak alanlar
        updateText('front_name_layer', data.name);
        updateText('front_surname_layer', data.surname);
        updateText('front_tc_layer', data.tc_no);
        updateText('front_id_layer', data.id_no);
        updateText('back_mother_layer', data.mother_name);
        updateText('back_father_layer', data.father_name);
        updateText('back_start_date_layer', data.start_date);
        updateText('back_end_date_layer', data.end_date);

        // Görev Otosu ve diğer birleşik isim alanları
        var fullName = (data.name || '') + ' ' + (data.surname || '');
        updateText('front_fullname_layer', fullName.toUpperCase()); // Örnek olarak büyük harf yapıldı

        // Görev Otosu'na özel alanlar
        updateText('front_phone_layer', data.phone);
        updateText('front_plate_layer', data.plate);
        updateText('front_end_date_layer', data.end_date); // Görev otosundaki bitiş tarihi

        // Görsel alanları güncelleme
        updateImage('front_photo_layer', photoPath);
        updateImage('driver_photo_layer', photoPath); // Görev otosu sürücü resmi (aynı resim varsayıldı)
        updateImage('back_qr_layer', qrPath);

        // Yaka kartındaki QR kod alanı (varsayımsal katman adı)
        updateImage('qr_code_layer', qrPath);
    }

    // Scripti çalıştır
    updateDocument.apply(this, arguments);

})();
