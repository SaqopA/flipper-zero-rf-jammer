const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');
const fs = require('fs');

const app = express();
const port = 3000;
const uploadsDir = path.join(__dirname, 'uploads');

// Sunucu başlamadan önce 'uploads' klasörünün var olduğundan emin ol
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
    console.log(`'${uploadsDir}' klasörü oluşturuldu.`);
}

app.use(cors());
app.use(express.json());
// Statik dosyaları ana dizinden sun
app.use(express.static(__dirname));
// Yüklenen dosyaları da web üzerinden erişilebilir yap
app.use('/uploads', express.static(uploadsDir));


// Dosya yükleme ayarları
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir)
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

    // Gelen metin verileri ile dosya yollarını birleştir
    const combinedData = {
        ...data,
        photoPath: files.front_photo ? files.front_photo[0].path : null,
        qrPath: files.back_qr ? files.back_qr[0].path : null
    };

    // Bu verileri geçici bir JSON dosyasına yaz
    const tempDataPath = path.join(__dirname, 'tmp-data.json');
    fs.writeFileSync(tempDataPath, JSON.stringify(combinedData, null, 2));

    console.log('Veriler geçici dosyaya yazıldı:', tempDataPath);

    // Illustrator scriptinin tam yolu
    const scriptPath = path.join(__dirname, 'illustrator-script.jsx');

    // İşletim sistemine göre komutu belirle
    let command;
    const platform = os.platform();

    if (platform === 'darwin') { // macOS (Hala eski yöntemle çalışabilir)
        const jsonData = JSON.stringify(combinedData).replace(/"/g, '\\"');
        command = `osascript -e 'tell application "Adobe Illustrator" to do javascript file "${scriptPath}" with arguments {"${jsonData}"}'`;
    } else if (platform === 'win32') { // Windows
        // DİKKAT: Bu yolu kendi bilgisayarınızdaki Illustrator sürümüne göre güncellemeniz gerekebilir.
        const illustratorPath = "C:\\Program Files\\Adobe\\Adobe Illustrator 2025\\Support Files\\Contents\\Windows\\Illustrator.exe";
        // Windows için script'i doğrudan çalıştır, script veriyi dosyadan okuyacak
        command = `"${illustratorPath}" -run "${scriptPath}"`;
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
        }
        console.log(`Script Çıktısı (stdout): ${stdout}`);
        res.send('Kartlar başarıyla Illustrator üzerinde güncellendi!');
    });
});

app.listen(port, () => {
    console.log(`Sunucu http://localhost:${port} adresinde çalışıyor.`);
    console.log('Arayüze erişmek için tarayıcınızda bu adresi açın.');
});
