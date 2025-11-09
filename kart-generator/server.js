const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
// 'public' klasörünü statik dosyalar için sun
app.use(express.static(path.join(__dirname, 'public')));
// Yüklenen dosyaları da web üzerinden erişilebilir yap (isteğe bağlı, test için yararlı)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Dosya yükleme ayarları
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, 'uploads/'))
    },
    filename: function (req, file, cb) {
        // Dosya adını daha temiz bir hale getiriyoruz
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
});

const upload = multer({ storage: storage });

// Illustrator scriptini çalıştıracak endpoint
app.post('/generate-card', upload.fields([
    { name: 'front_photo', maxCount: 1 },
    { name: 'back_qr', maxCount: 1 }
]), (req, res) => {
    const data = req.body;
    const files = req.files;

    console.log('Gelen Veriler:', data);
    console.log('Yüklenen Dosyalar:', files);

    // Dosyaların tam yollarını al
    const photoPath = files.front_photo ? files.front_photo[0].path : null;
    const qrPath = files.back_qr ? files.back_qr[0].path : null;

    // JSON verisini string'e çevir ve tırnak işaretlerinden kaç
    const jsonData = JSON.stringify(data).replace(/"/g, '\\"');

    // Illustrator scriptinin tam yolu
    const scriptPath = path.join(__dirname, 'illustrator-script.jsx');

    // İşletim sistemine göre komutu belirle
    let command;
    const platform = os.platform();

    if (platform === 'darwin') { // macOS
        // AppleScript kullanarak Illustrator'a JavaScript dosyasını argümanlarla çalıştırmasını söyle
        command = `osascript -e 'tell application "Adobe Illustrator" to do javascript file "${scriptPath}" with arguments {"${jsonData}", "${photoPath || ''}", "${qrPath || ''}"}'`;
    } else if (platform === 'win32') { // Windows
        // Windows'ta Illustrator'ın kurulu olduğu varsayılan yolu kullanarak komutu oluştur
        // DİKKAT: Bu yolu kendi bilgisayarınızdaki Illustrator sürümüne göre güncellemeniz gerekebilir.
        const illustratorPath = "C:\\Program Files\\Adobe\\Adobe Illustrator 2025\\Support Files\\Contents\\Windows\\Illustrator.exe";
        // Windows'ta doğrudan .jsx çalıştırmak karmaşık olduğu için genellikle bir .vbs veya .bat sarmalayıcı kullanılır.
        // Ancak burada doğrudan deneme yapacağız, çalışmazsa alternatif bir yöntem gerekir.
        // Bu yöntem genellikle desteklenmez, en sağlıklısı bir VBScript sarmalayıcı kullanmaktır.
        // Şimdilik konsepti göstermek için basitleştirilmiş bir komut ekliyorum.
        // GERÇEK KULLANIM İÇİN BU KOMUTUN DEĞİŞTİRİLMESİ GEREKEBİLİR.
        command = `"${illustratorPath}" -run "${scriptPath}"`;
        // Windows'ta argüman geçirmek bu şekilde doğrudan çalışmayabilir.
        // Bu yüzden verileri geçici bir dosyaya yazıp scriptin oradan okuması daha güvenilir bir yöntemdir.
        console.warn("Windows komutu deneyseldir ve doğrudan çalışmayabilir.");
    } else {
        return res.status(500).send('Desteklenmeyen işletim sistemi.');
    }

    console.log('Çalıştırılacak Komut:', command);

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Script Çalıştırma Hatası: ${error.message}`);
            return res.status(500).send(`Script çalıştırılırken bir hata oluştu: ${error.message}`);
        }
        if (stderr) {
            console.error(`Script Hatası (stderr): ${stderr}`);
            // Bazı Illustrator hataları stderr'e yazılabilir.
        }
        console.log(`Script Çıktısı (stdout): ${stdout}`);
        res.send('Kartlar başarıyla Illustrator üzerinde güncellendi!');
    });
});

app.listen(port, () => {
    console.log(`Sunucu http://localhost:${port} adresinde çalışıyor.`);
    console.log('Arayüze erişmek için tarayıcınızda bu adresi açın.');
});
