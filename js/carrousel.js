/* ============================================================
   CARRUSEL AUTOMÁTICO Y CONTINUO DE DIVISAS
   ============================================================ */

let carouselInitialized = false;
let animationSpeed = 30; // segundos para recorrer todo (más lento = más suave)

function initAutoCarousel() {
    const container = document.getElementById('currencies');
    if (!container || carouselInitialized) return;
    
    const cards = container.querySelectorAll('.currency-card');
    const totalCards = cards.length;
    
    if (totalCards <= 3) {
        // Si hay 3 o menos, mostrar como grid normal
        container.classList.add('grid-display');
        return;
    }
    
    // Crear estructura del carrusel
    const wrapper = document.createElement('div');
    wrapper.className = 'currencies-carousel';
    
    const track = document.createElement('div');
    track.className = 'currencies-track auto-scroll';
    
    // DUPLICAR tarjetas para efecto continuo (clonar)
    cards.forEach(card => {
        track.appendChild(card.cloneNode(true));
    });
    
    // Clonar nuevamente para que sea infinito
    cards.forEach(card => {
        track.appendChild(card.cloneNode(true));
    });
    
    wrapper.appendChild(track);
    
    // Añadir controles
    const controls = document.createElement('div');
    controls.className = 'carousel-controls';
    controls.innerHTML = `
        <button class="carousel-btn prev" aria-label="Anterior">❮</button>
        <button class="carousel-btn next" aria-label="Siguiente">❯</button>
    `;
    wrapper.appendChild(controls);
    
    // Añadir dots
    const dotsContainer = document.createElement('div');
    dotsContainer.className = 'carousel-dots';
    
    const visibleSlides = Math.min(3, totalCards);
    const totalDots = Math.ceil(totalCards / visibleSlides);
    
    for (let i = 0; i < totalDots; i++) {
        const dot = document.createElement('div');
        dot.className = 'dot';
        dot.dataset.index = i;
        dotsContainer.appendChild(dot);
    }
    wrapper.appendChild(dotsContainer);
    
    // Reemplazar en el DOM
    const parent = container.parentElement;
    parent.replaceChild(wrapper, container);
    wrapper.id = 'currencies-carousel';
    
    // Configurar animación
    const trackElement = wrapper.querySelector('.currencies-track');
    const cardWidth = cards[0]?.offsetWidth || 280;
    const gap = 15;
    const totalWidth = (cardWidth + gap) * totalCards;
    
    // Ajustar animación según el ancho total
    const duration = (totalWidth / 100) * 1.5; // Velocidad proporcional
    trackElement.style.animationDuration = `${Math.max(20, duration)}s`;
    
    // Controles manuales
    let currentPosition = 0;
    let isAnimating = false;
    const totalWidthCloned = totalWidth * 2;
    
    function manualScroll(direction) {
        if (isAnimating) return;
        isAnimating = true;
        
        // Pausar animación automática temporalmente
        trackElement.style.animation = 'none';
        
        const scrollAmount = cardWidth + gap;
        currentPosition += direction === 'next' ? -scrollAmount : scrollAmount;
        
        // Resetear posición cuando llega al final
        if (Math.abs(currentPosition) >= totalWidth) {
            currentPosition = 0;
        }
        if (currentPosition > 0) {
            currentPosition = -totalWidth + scrollAmount;
        }
        
        trackElement.style.transform = `translateX(${currentPosition}px)`;
        updateDots(Math.abs(Math.floor(currentPosition / scrollAmount)) % totalDots);
        
        // Reanudar animación después de 3 segundos
        setTimeout(() => {
            trackElement.style.animation = `scrollContinuous ${animationSpeed}s linear infinite`;
            isAnimating = false;
        }, 3000);
    }
    
    function updateDots(activeIndex) {
        const dots = wrapper.querySelectorAll('.dot');
        dots.forEach((dot, idx) => {
            dot.classList.toggle('active', idx === activeIndex);
        });
    }
    
    // Event listeners de botones
    const prevBtn = wrapper.querySelector('.prev');
    const nextBtn = wrapper.querySelector('.next');
    
    prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        manualScroll('prev');
    });
    
    nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        manualScroll('next');
    });
    
    // Click en dots
    wrapper.querySelectorAll('.dot').forEach((dot, idx) => {
        dot.addEventListener('click', () => {
            if (isAnimating) return;
            isAnimating = true;
            trackElement.style.animation = 'none';
            
            const scrollAmount = cardWidth + gap;
            currentPosition = -(idx * 3 * scrollAmount);
            trackElement.style.transform = `translateX(${currentPosition}px)`;
            updateDots(idx);
            
            setTimeout(() => {
                trackElement.style.animation = `scrollContinuous ${animationSpeed}s linear infinite`;
                isAnimating = false;
            }, 3000);
        });
    });
    
    // Inicializar dots
    updateDots(0);
    carouselInitialized = true;
}

// Modificar renderCurrencies para usar carrusel automático
const originalRenderCurrencies = renderCurrencies;
renderCurrencies = function(data, changes = {}) {
    originalRenderCurrencies(data, changes);
    setTimeout(() => initAutoCarousel(), 100);
};

// Re-inicializar carrusel en cada carga de datos
async function loadData() {
    if (isLoading) return;
    isLoading = true;

    try {
        const data = await getData();
        if (!data || data.length === 0) {
            console.warn("Sin datos disponibles.");
            return;
        }

        const changes = detectChanges(data);
        const { countries, currencies } = splitData(data);

        renderCountries(countries, changes);
        renderCurrencies(currencies, changes);
        updatePrevious(data);
        updateDate();
        
        // Re-inicializar carrusel después de actualizar datos
        setTimeout(() => {
            carouselInitialized = false;
            initAutoCarousel();
        }, 50);

    } catch (e) {
        console.error("Error crítico en loadData:", e);
    } finally {
        isLoading = false;
    }
}

initAutoCarousel()