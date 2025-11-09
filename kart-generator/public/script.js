document.getElementById('card-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);
    const responseMessage = document.getElementById('response-message');

    responseMessage.textContent = 'Kartlar oluşturuluyor, lütfen bekleyin...';
    responseMessage.style.color = '#333';

    try {
        const response = await fetch('http://localhost:3000/generate-card', {
            method: 'POST',
            body: formData
        });

        const result = await response.text();

        if (response.ok) {
            responseMessage.textContent = result;
            responseMessage.style.color = 'green';
            form.reset();
        } else {
            responseMessage.textContent = `Hata: ${result}`;
            responseMessage.style.color = 'red';
        }
    } catch (error) {
        console.error('Sunucuyla iletişim kurulamadı:', error);
        responseMessage.textContent = 'Sunucuya bağlanırken bir hata oluştu. Lütfen sunucunun çalıştığından emin olun.';
        responseMessage.style.color = 'red';
    }
});
