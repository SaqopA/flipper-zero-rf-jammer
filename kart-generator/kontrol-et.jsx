#target illustrator

(function() {
    if (app.documents.length === 0) {
        alert("Lütfen önce kontrol edilecek Illustrator dosyasını açın.");
        return;
    }

    var doc = app.activeDocument;
    var report = "Katman Kontrol Raporu:\\n------------------------------------\\n";
    var photoLayerFound = false;
    var idLayerFound = false;

    // Tüm katmanları gez
    for (var i = 0; i < doc.layers.length; i++) {
        var currentLayer = doc.layers[i];

        // Fotoğraf katmanını kontrol et
        if (currentLayer.name === "front_photo_layer") {
            photoLayerFound = true;
            report += "-> 'front_photo_layer' bulundu.\\n";
            if (currentLayer.placedItems.length > 0) {
                // Adobe Illustrator'da 'placedItems' her zaman bağlantılıdır.
                // Eğer bir resim gömülüyse (embedded), o bir 'rasterItem' veya 'pluginItem' olur.
                report += "   - DURUM: BAŞARILI! İçinde 'Yerleştirilmiş' (Placed) bir resim nesnesi var.\\n";
            } else if (currentLayer.rasterItems.length > 0) {
                report += "   - HATA: İçindeki resim 'Gömülü' (Embedded). Lütfen resmi silip 'Dosya > Yerleştir' menüsünden 'Bağlantı' (Link) seçeneğini işaretleyerek tekrar ekleyin.\\n";
            } else {
                report += "   - HATA: Katman boş. İçinde yerleştirilmiş bir resim nesnesi yok.\\n";
            }
        }

        // Beyaz Kart sicil no katmanını kontrol et
        if (currentLayer.name === "white_card_id_layer") {
            idLayerFound = true;
            report += "-> 'white_card_id_layer' bulundu.\\n";
            if (currentLayer.textFrames.length > 0) {
                report += "   - DURUM: BAŞARILI! İçinde bir metin kutusu var.\\n";
            } else {
                report += "   - HATA: Katman boş. İçinde bir metin kutusu yok.\\n";
            }
        }
    }

    if (!photoLayerFound) {
        report += "-> 'front_photo_layer' adında bir katman BULUNAMADI!\\n";
    }
    if (!idLayerFound) {
        report += "-> 'white_card_id_layer' adında bir katman BULUNAMADI!\\n";
    }

    alert(report);
})();
