// pantalla.js  -  Compatible con MagicInfo (Chromium 56 / ES5)

(function () {
	// ========== CONSTANTES ==========
	var CSV_URL = "AQUI_TU_URL";
	var USE_MOCK = true;
	var REFRESH_INTERVAL = 60000;
	var isLoading = false;
	var previousData = {};

	// Datos de ejemplo mock (con los valores de tu imagen)
	var MOCK_DATA = [
		{ type: "country", code: "HN", name: "Honduras", value: "24.50 HNL", order: 1, active: true },
		{ type: "country", code: "CO", name: "Colombia", value: "6,545 COP", order: 2, active: true },
		{ type: "country", code: "DO", name: "Rep. Dominicana", value: "58.20 DOP", order: 3, active: true },
		{ type: "country", code: "US", name: "Estados Unidos", value: "1.05 USD", order: 4, active: true },
		{ type: "country", code: "BO", name: "Bolivia", value: "No disponible", order: 5, active: true },
		{ type: "currency", code: "USD", name: "Dólar Americano", value: "1.05 USD", order: 1, active: true },
		{ type: "currency", code: "GBP", name: "Libra Esterlina", value: "0.94 GBP", order: 2, active: true },
		{ type: "currency", code: "CHF", name: "Franco Suizo", value: "1.02 CHF", order: 3, active: true },
	];

	var FLAG_MAP = {
		HN: "assets/flags/hn.png",
		CO: "assets/flags/co.png",
		DO: "assets/flags/do.png",
		US: "assets/flags/us.png",
		BO: "assets/flags/bo.png",
		USD: "assets/flags/us.png",
		GBP: "assets/flags/gb.png",
		CHF: "assets/flags/ch.png",
	};

	// ========== FUNCIONES AUXILIARES ==========
	function itemKey(item) {
		return item.type + "-" + item.code;
	}

	function createFlagHTML(item) {
		var flag = FLAG_MAP[item.code];
		if (flag) {
			return (
				'<img class="country-flag" src="' +
				flag +
				"\" onerror=\"this.style.display='none';this.nextElementSibling.style.display='flex';\">" +
				'<div class="flag-fallback" style="display:none;">' +
				item.code +
				"</div>"
			);
		}
		return '<div class="flag-fallback">' + item.code + "</div>";
	}

	function updateDate() {
		var el = document.getElementById("current-date");
		if (!el) return;
		var now = new Date();
		var days = ["DOMINGO", "LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO"];
		var months = [
			"ENERO",
			"FEBRERO",
			"MARZO",
			"ABRIL",
			"MAYO",
			"JUNIO",
			"JULIO",
			"AGOSTO",
			"SEPTIEMBRE",
			"OCTUBRE",
			"NOVIEMBRE",
			"DICIEMBRE",
		];
		var dateString = days[now.getDay()] + " " + now.getDate() + " " + months[now.getMonth()] + " " + now.getFullYear();
		var timeString = now.getHours().toString().padStart(2, "0") + ":" + now.getMinutes().toString().padStart(2, "0");
		el.textContent = dateString + " · " + timeString;
	}

	// ========== RENDERIZADO ==========
	function renderCountries(data, changes) {
		var container = document.getElementById("rates-grid");
		if (!container) return;
		container.innerHTML = "";
		data.sort(function (a, b) {
			return a.order - b.order;
		});
		for (var i = 0; i < data.length; i++) {
			var item = data[i];
			var card = document.createElement("div");
			card.className = "country-card";
			if (changes && changes[itemKey(item)]) card.classList.add("highlight");
			var isDisabled = item.value === "0" || item.value === "0.00" || item.value === "No disponible";
			var displayValue = isDisabled ? "No disponible" : item.value;
			var valueClass = "country-value" + (isDisabled ? " disabled" : "");
			card.innerHTML =
				createFlagHTML(item) +
				'<div class="country-info">' +
				'<div class="country-name">' +
				item.name +
				"</div>" +
				'<div class="' +
				valueClass +
				'">' +
				displayValue +
				"</div>" +
				"</div>";
			container.appendChild(card);
		}
	}

	function renderCurrencies(data, changes) {
		var container = document.getElementById("currencies");
		if (!container) return;
		container.innerHTML = "";
		data.sort(function (a, b) {
			return a.order - b.order;
		});
		for (var i = 0; i < data.length; i++) {
			var item = data[i];
			var card = document.createElement("div");
			card.className = "currency-card";
			if (changes && changes[itemKey(item)]) card.classList.add("highlight");
			card.innerHTML =
				createFlagHTML(item) +
				'<div class="currency-info">' +
				'<div class="currency-name">' +
				item.name +
				"</div>" +
				'<div class="currency-value">' +
				item.value +
				"</div>" +
				"</div>";
			container.appendChild(card);
		}
	}

	// ========== LÓGICA DE DATOS (ES5 COMPATIBLE) ==========
	function getData(callback) {
		if (USE_MOCK) {
			callback(null, MOCK_DATA);
			return;
		}
		var xhr = new XMLHttpRequest();
		xhr.open("GET", CSV_URL + "?nocache=" + Date.now(), true);
		xhr.onreadystatechange = function () {
			if (xhr.readyState === 4) {
				if (xhr.status === 200) {
					// Parseo CSV SIMPLE
					var lines = xhr.responseText.trim().split("\n");
					var result = [];
					for (var i = 1; i < lines.length; i++) {
						var parts = lines[i].split(",");
						if (parts.length >= 6) {
							result.push({
								type: parts[0],
								code: parts[1],
								name: parts[2],
								value: parts[3],
								order: parseInt(parts[4]) || 0,
								active: parts[5] === "TRUE",
							});
						}
					}
					callback(null, result);
				} else {
					var cached = localStorage.getItem("rates_cache");
					if (cached) callback(null, JSON.parse(cached));
					else callback(new Error("No data"), null);
				}
			}
		};
		xhr.send();
	}

	function loadData() {
		if (isLoading) return;
		isLoading = true;
		getData(function (err, data) {
			if (err || !data || data.length === 0) {
				isLoading = false;
				return;
			}
			var changes = {};
			for (var i = 0; i < data.length; i++) {
				var item = data[i];
				var key = itemKey(item);
				var prev = previousData[key];
				if (!prev || prev.value !== item.value) changes[key] = true;
				previousData[key] = { value: item.value };
			}
			var countries = [],
				currencies = [];
			for (var j = 0; j < data.length; j++) {
				if (data[j].type === "country" && data[j].active) countries.push(data[j]);
				if (data[j].type === "currency" && data[j].active) currencies.push(data[j]);
			}
			renderCountries(countries, changes);
			renderCurrencies(currencies, changes);
			updateDate();
			isLoading = false;
		});
	}

	// ========== INICIALIZACIÓN ==========
	window.addEventListener("load", function () {
		updateDate();
		loadData();
		setInterval(loadData, REFRESH_INTERVAL);
	});
})();
