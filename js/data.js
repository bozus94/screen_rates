// ========== DATOS COMPARTIDOS G&SENVIOS ==========
// Este archivo se usa tanto en la pantalla como en la tarjeta

const GSENVIOS_DATA = {
    // Tasas de cambio actualizadas
    rates: {
        honduras: {
            country: "HONDURAS",
            flag: "🇭🇳",
            code: "HNL",
            name: "Lempiras",
            rate: 31.19,
            rateFormatted: "31,19",
            cities: "Tegucigalpa · San Pedro Sula",
            visual: "assets/visuals/honduras.png",
            enabled: true
        },
        colombia: {
            country: "COLOMBIA",
            flag: "🇨🇴",
            code: "COP",
            name: "Pesos",
            rate: 6545,
            rateFormatted: "6.545",
            cities: "Bogotá · Medellín · Cali",
            visual: "assets/visuals/colombia.png",
            enabled: true
        },
        republicaDominicana: {
            country: "REP. DOMINICANA",
            flag: "🇩🇴",
            code: "DOP",
            name: "Pesos",
            rate: 58.20,
            rateFormatted: "58,20",
            cities: "Santo Domingo · Punta Cana",
            visual: "assets/visuals/republica_dominicana.png",
            enabled: true
        },
        estadosUnidos: {
            country: "ESTADOS UNIDOS",
            flag: "🇺🇸",
            code: "USD",
            name: "Dólares",
            rate: 1.05,
            rateFormatted: "1,05",
            cities: "Nueva York · Miami · Los Ángeles",
            visual: "assets/visuals/estados_unidos.png",
            enabled: true
        },
        bolivia: {
            country: "BOLIVIA",
            flag: "🇧🇴",
            code: "BOB",
            name: "Bolivianos",
            rate: 0,
            rateFormatted: "No disponible",
            cities: "La Paz · Santa Cruz",
            visual: "assets/visuals/bolivia.png",
            enabled: false
        }
    },
    
    // Última actualización
    lastUpdate: null,
    
    // Función para obtener tasa formateada
    getRateFormatted: function(countryKey) {
        const data = this.rates[countryKey];
        if (!data || !data.enabled) return "Servicio no disponible";
        return `${data.rateFormatted} ${data.code}`;
    },
    
    // Función para actualizar timestamp
    updateTimestamp: function() {
        const now = new Date();
        this.lastUpdate = {
            date: now.toLocaleDateString('es-ES'),
            time: now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
        };
        return this.lastUpdate;
    }
};

// Actualizar timestamp al cargar
GSENVIOS_DATA.updateTimestamp();