/* ============================================================
   CONSTANTES
   ============================================================ */

const CSV_URL = "AQUI_TU_URL";
const USE_MOCK = true;
const REFRESH_INTERVAL = 60_000; // ms — un solo lugar para cambiar el intervalo

const MOCK_DATA = [
    // — RATES
    { type: "country", code: "EC", name: "Ecuador", value: "1.05 USD", order: 2, active: true },
    { type: "country", code: "HN", name: "Honduras", value: "24.50 HNL", order: 1, active: true },
    { type: "country", code: "DO", name: "Rep. Dominicana", value: "58.20 DOP", order: 3, active: true },
    { type: "country", code: "EC", name: "Ecuador", value: "1.05 USD", order: 5, active: true },
    { type: "country", code: "BO", name: "Bolivia", value: "No disponible", order: 0, active: true },
    { type: "country", code: "CO", name: "Colombia", value: "6,545 COP", order: 5, active: true },
    { type: "country", code: "CO", name: "Colombia", value: "6,545 COP", order: 2, active: true },
    { type: "country", code: "BO", name: "Bolivia", value: "No disponible", order: 8 , active: true },
 
    // — DIVISES
    { type: "currency", code: "USD", name: "Dólar Americano", value: "1.05 USD", order: 1, active: true },
    { type: "currency", code: "GBP", name: "Libra Esterlina", value: "0.94 GBP", order: 2, active: true },
    { type: "currency", code: "CHF", name: "Franco Suizo", value: "1.02 CHF", order: 3, active: true },
    { type: "currency", code: "USD", name: "Dólar Americano", value: "1.05 USD", order: 1, active: true },
    { type: "currency", code: "GBP", name: "Libra Esterlina", value: "0.94 GBP", order: 2, active: true },
    { type: "currency", code: "CHF", name: "Franco Suizo", value: "1.02 CHF", order: 3, active: true },
]; 

const FLAG_MAP = {

    /* rates */
    HN:  "assets/flags/hn.png",   // Honduras
    CO:  "assets/flags/co.png",   // Colombia
    DO:  "assets/flags/do.png",   // República Dominicana
    EC:  "assets/flags/ec.png",   // Estados Unidos
    BO: "assets/flags/bo.png",   // Bolivia
    
    /* divises */
    USD: "assets/flags/us.png",
    GBP: "assets/flags/gb.png",
    CHF: "assets/flags/ch.png",
};

let previousData = {};
let isLoading = false;


/* ============================================================
   UTILIDADES
   ============================================================ */

/**
 * Clave única por item para evitar colisiones entre países y divisas
 */
function itemKey(item) {
    return `${item.type}-${item.code}`;
}

/**
 * Genera el HTML de la bandera
 */
function createFlagHTML(item) {
    const flag = FLAG_MAP[item.code];
    if (flag) {
        return `
            <img class="country-flag" src="${flag}"
                 onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
            <div class="flag-fallback" style="display:none;">${item.code}</div>`;
    }
    return `<div class="flag-fallback">${item.code}</div>`;
}


/* ============================================================
   FECHA
   ============================================================ */

function updateDate() {
    const el = document.getElementById("current-date");
    if (!el) return;
    
    const now = new Date();
    const days = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
    const months = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
    
    const dayName = days[now.getDay()];
    const day = now.getDate();
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    
    el.textContent = `${dayName} ${day} ${month} ${year}`;
}


/* ============================================================
   FETCH
   ============================================================ */

async function fetchCSV() {
    const res = await fetch(`${CSV_URL}?nocache=${Date.now()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.text();
}


/* ============================================================
   PARSE
   ============================================================ */

function parseCSVLine(line) {
    const fields = [];
    let current = "";
    let inQuotes = false;

    for (const char of line) {
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
            fields.push(current.trim());
            current = "";
        } else {
            current += char;
        }
    }
    fields.push(current.trim());
    return fields;
}

function parseCSV(csv) {
    const lines = csv.trim().split("\n");
    const headers = parseCSVLine(lines[0]);

    return lines.slice(1)
        .filter(line => line.trim())
        .map(line => {
            const values = parseCSVLine(line);
            const obj = {};
            headers.forEach((h, i) => {
                obj[h] = values[i] ?? "";
            });
            return obj;
        });
}


/* ============================================================
   NORMALIZE
   ============================================================ */

function normalize(data) {
    return data.map(item => ({
        ...item,
        order:  Number(item.order),
        active: item.active === "TRUE",
    }));
}


/* ============================================================
   SPLIT
   ============================================================ */

function splitData(data) {
    return {
        countries:  data.filter(i => i.type === "country"  && i.active),
        currencies: data.filter(i => i.type === "currency" && i.active),
    };
}


/* ============================================================
   DETECT CHANGES
   ============================================================ */

function detectChanges(data) {
    const changes = {};
    data.forEach(item => {
        const key  = itemKey(item);
        const prev = previousData[key];
        if (!prev || prev.value !== item.value) {
            changes[key] = true;
        }
    });
    return changes;
}


/* ============================================================
   RENDER PAÍSES
   ============================================================ */

function renderCountries(data, changes = {}) {
    const container = document.getElementById("rates-grid");
    if (!container) return;
    container.innerHTML = "";

    [...data]
        .sort((a, b) => a.order - b.order)
        .forEach(item => {
            const card = document.createElement("div");
            card.className = "country-card";

            if (changes[itemKey(item)]) card.classList.add("highlight");
            if (item.value === "0" || item.value === "0.00" || item.value === "No disponible") {
                card.style.opacity = "0.6";
            }

            card.innerHTML = `
                ${createFlagHTML(item)}
                <div class="country-info">
                    <div class="country-name">${item.name}</div>
                    <div class="country-value">${item.value}</div>
                </div>`;

            container.appendChild(card);
        });
}


/* ============================================================
   RENDER DIVISAS
   ============================================================ */

function renderCurrencies(data, changes = {}) {
    const container = document.getElementById("currencies");
    if (!container) return;
    container.innerHTML = "";

    [...data]
        .sort((a, b) => a.order - b.order)
        .forEach(item => {
            const card = document.createElement("div");
            card.className = "currency-card";

            if (changes[itemKey(item)]) card.classList.add("highlight");

            card.innerHTML = `
                ${createFlagHTML(item)}
                <div class="currency-info">
                    <div class="currency-name">${item.name}</div>
                    <div class="currency-value">${item.value}</div>
                </div>`;

            container.appendChild(card);
        });
}


/* ============================================================
   UPDATE STATE
   ============================================================ */

function updatePrevious(data) {
    previousData = {};
    data.forEach(item => {
        previousData[itemKey(item)] = item;
    });
}


/* ============================================================
   GET DATA
   ============================================================ */

async function getData() {
    if (USE_MOCK) return MOCK_DATA;

    try {
        const csv        = await fetchCSV();
        const parsed     = parseCSV(csv);
        const normalized = normalize(parsed);
        localStorage.setItem("rates_cache", JSON.stringify(normalized));
        return normalized;

    } catch (e) {
        console.warn("Fetch falló, usando cache:", e.message);
        const cached = localStorage.getItem("rates_cache");
        if (cached) return JSON.parse(cached);

        console.error("Sin cache disponible.");
        return [];
    }
}


/* ============================================================
   LOAD DATA
   ============================================================ */

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

    } catch (e) {
        console.error("Error crítico en loadData:", e);

    } finally {
        isLoading = false;
    }
}

/* ============================================================
   INIT
   ============================================================ */
window.renderCurrencies = renderCurrencies;
window.loadData = loadData;
updateDate();
loadData();
setInterval(loadData, REFRESH_INTERVAL);
