// ========== LÓGICA TARJETA WHATSAPP ==========

let currentCountry = "honduras";

function updateCard(countryKey) {
    const data = GSENVIOS_DATA.rates[countryKey];
    if (!data) return;
    
    // Actualizar título y tasa
    const countryTitle = document.querySelector('.country-title');
    const countryRate = document.querySelector('.country-rate');
    
    if (countryTitle) countryTitle.textContent = data.country;
    
    if (countryRate) {
        if (data.enabled && data.rate > 0) {
            countryRate.textContent = `${data.rateFormatted} ${data.code}`;
            countryRate.classList.remove('disabled');
        } else {
            countryRate.textContent = "SERVICIO NO DISPONIBLE";
            countryRate.classList.add('disabled');
        }
    }
    
    // Actualizar imagen
    const visualImg = document.getElementById('card-visual');
    if (visualImg && data.visual) {
        visualImg.src = data.visual;
        visualImg.alt = `Visual ${data.country}`;
    }
    
    // Actualizar fecha y hora
    updateDateTime();
}

function updateDateTime() {
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    
    const dateElement = document.querySelector('.footer-date');
    const timeElement = document.querySelector('.footer-time');
    
    if (dateElement) dateElement.textContent = `${day}/${month}/${year}`;
    if (timeElement) timeElement.textContent = `Hora de Actualización ${hours}:${minutes}`;
}

async function exportAsImage() {
    const card = document.querySelector('.exchange-card');
    const btn = document.getElementById('download-btn');
    
    if (!card) return;
    
    if (btn) {
        btn.classList.add('loading');
        btn.textContent = '⏳ GENERANDO...';
    }
    
    try {
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const canvas = await html2canvas(card, {
            scale: 2.5,
            backgroundColor: '#FFFFFF',
            logging: false,
            useCORS: true
        });
        
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        link.download = `G&SENVIOS_${currentCountry}_${timestamp}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error al generar la imagen');
    } finally {
        if (btn) {
            btn.classList.remove('loading');
            btn.textContent = '📸 EXPORTAR COMO IMAGEN';
        }
    }
}

function getCountryFromURL() {
    const params = new URLSearchParams(window.location.search);
    const pais = params.get('pais');
    if (pais && GSENVIOS_DATA.rates[pais]) return pais;
    return 'honduras';
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    currentCountry = getCountryFromURL();
    
    const selector = document.getElementById('country-selector');
    if (selector) {
        selector.value = currentCountry;
        selector.addEventListener('change', (e) => {
            currentCountry = e.target.value;
            updateCard(currentCountry);
            
            const url = new URL(window.location);
            url.searchParams.set('pais', currentCountry);
            window.history.pushState({}, '', url);
        });
    }
    
    updateCard(currentCountry);
    
    const downloadBtn = document.getElementById('download-btn');
    if (downloadBtn) downloadBtn.addEventListener('click', exportAsImage);
});

setInterval(updateDateTime, 60000);