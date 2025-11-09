# Polis Gazetesi Kart Oluşturucu

Bu proje, bir web arayüzü kullanarak Adobe Illustrator'da personel kimlik kartlarını toplu olarak ve otomatik bir şekilde oluşturmayı sağlar.

## Kurulum

1.  **Node.js Yüklemesi:**
    *   Eğer bilgisayarınızda [Node.js](https://nodejs.org/) yüklü değilse, resmi web sitesinden LTS sürümünü indirip kurun.

2.  **Proje Dosyalarını İndirme:**
    *   Bu projenin dosyalarını bilgisayarınıza indirin ve bir klasöre çıkartın.

3.  **Gerekli Paketleri Yükleme:**
    *   Terminali (macOS'ta Terminal, Windows'ta Komut İstemi veya PowerShell) açın.
    *   `cd` komutu ile proje klasörünün içine girin. Örnek: `cd C:\Users\KullaniciAdiniz\Downloads\kart-generator`
    *   Aşağıdaki komutu çalıştırarak gerekli olan tüm paketleri yükleyin:
        ```bash
        npm install
        ```

## Çalıştırma

1.  **Illustrator Dosyasını Hazırlama:**
    *   Kart tasarımlarınızı içeren `.ai` dosyasını Adobe Illustrator'da açın.
    *   **ÖNEMLİ:** Katmanlarınızın adlarının `illustrator-script.jsx` dosyasında belirtilen adlarla (örneğin, `front_name_layer`, `front_photo_layer` vb.) birebir aynı olduğundan emin olun. Aksi takdirde script doğru alanları güncelleyemez.

2.  **Sunucuyu Başlatma:**
    *   Proje klasörünün içindeyken terminalde aşağıdaki komutu çalıştırın:
        ```bash
        node server.js
        ```
    *   Terminalde `Sunucu http://localhost:3000 adresinde çalışıyor.` mesajını görmelisiniz.

3.  **Web Arayüzünü Kullanma:**
    *   Web tarayıcınızı (Chrome, Firefox vb.) açın ve adres çubuğuna `http://localhost:3000` yazıp Enter'a basın.
    *   Karşınıza çıkan forma personel bilgilerini girin, fotoğraf ve QR kod dosyalarını seçin.
    *   "Kartları Oluştur" düğmesine tıklayın.
    *   Bu işlem, açık olan Illustrator dosyanızdaki ilgili alanları girdiğiniz bilgilerle otomatik olarak güncelleyecektir.

## Windows Kullanıcıları İçin Not

`server.js` dosyasındaki `illustratorPath` değişkenini, kendi bilgisayarınızdaki Adobe Illustrator uygulamasının `.exe` dosyasının yoluyla değiştirmeniz gerekebilir. Örneğin, Illustrator 2024 kullanıyorsanız yol farklı olabilir.

```javascript
// server.js dosyasındaki ilgili satır
const illustratorPath = "C:\\Program Files\\Adobe\\Adobe Illustrator 2025\\Support Files\\Contents\\Windows\\Illustrator.exe";
```

Projenin keyfini çıkarın!
