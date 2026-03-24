// APIs Config
const API_KEY = "8c7a70641fdd48259a6efbc15b664378";
const DEFAULT_CITY = "Lahore";

// Elements
const temp = document.getElementById("temp");
const humidity = document.getElementById("humidity");
const wind = document.getElementById("wind");
const city = document.getElementById("city");
const country = document.getElementById("country");

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const suggestions = document.getElementById("suggestions");

const forecastTableBody = document.getElementById("forecastTableBody");

const footerContainer = document.querySelector(".card-footer .row");
const seeMoreBtn = document.getElementById("seeMoreBtn");
const newCountryInput = document.getElementById("newCountryInput");
const saveBtn = document.querySelector("#exampleModal .btn-primary");

// Footer state
let footerCitiesAll = ["USA", "London", "Dubai"];
let footerVisibleCount = 3;
let showAll = false;

// ------------------------
// Helper Functions
// ------------------------
const average = arr => arr.reduce((a,b)=>a+b,0)/arr.length;

// Update forecast table
const updateForecastTable = (dailyData) => {
    forecastTableBody.innerHTML = "";

    if (!dailyData || dailyData.length === 0) {
        forecastTableBody.innerHTML = `<tr><td colspan="4" class="text-center">No forecast data available</td></tr>`;
        return;
    }

    dailyData.slice(0, 7).forEach((day) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <th scope="row">${day.day}</th>
            <td>${day.temp.toFixed(1)} °C</td>
            <td>${day.humidity.toFixed(1)} %</td>
            <td>${day.wind_speed.toFixed(1)} km/h</td>
        `;
        forecastTableBody.appendChild(tr);
    });
};

// Update current weather UI
const updateUI = (data) => {
    temp.innerHTML = `${data.main.temp} °C`;
    humidity.innerHTML = `${data.main.humidity} %`;
    wind.innerHTML = `${data.wind.speed} km/h`;
    city.innerHTML = `<i class="bi bi-geo-alt-fill"></i> ${data.name}`;
    country.innerHTML = data.sys.country;
};

// ------------------------
// Current Weather
// ------------------------
const fetchWeather = async (cityName) => {
    try {
        const res = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityName)}&appid=${API_KEY}&units=metric`
        );
        const data = await res.json();

        if (data.cod !== 200) {
            alert("City not found!");
            return;
        }

        updateUI(data);
        fetchWeeklyForecast(cityName);

    } catch (err) {
        console.error(err);
        alert("Error fetching weather data!");
    }
};

// ------------------------
// Weekly Forecast (5-day API)
// ------------------------
const fetchWeeklyForecast = async (cityName) => {
    try {
        const res = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(cityName)}&appid=${API_KEY}&units=metric`
        );
        if (!res.ok) throw new Error(`Forecast API error: ${res.status}`);
        const data = await res.json();

        // Group forecast by day
        const dailyMap = {};
        data.list.forEach(item => {
            const date = new Date(item.dt * 1000);
            const day = date.toLocaleDateString("en-US", { weekday: "long" });

            if (!dailyMap[day]) {
                dailyMap[day] = { temps: [], humidities: [], winds: [] };
            }

            dailyMap[day].temps.push(item.main.temp);
            dailyMap[day].humidities.push(item.main.humidity);
            dailyMap[day].winds.push(item.wind.speed);
        });

        const dailyArray = Object.keys(dailyMap).map(day => {
            const values = dailyMap[day];
            return {
                day,
                temp: average(values.temps),
                humidity: average(values.humidities),
                wind_speed: average(values.winds)
            };
        });

        updateForecastTable(dailyArray);

    } catch (err) {
        console.error(err);
        alert("Error fetching weekly forecast!");
    }
};

// ------------------------
// Autocomplete Suggestions
// ------------------------
searchInput.addEventListener("input", async () => {
    const query = searchInput.value.trim();
    if (!query) {
        suggestions.innerHTML = "";
        return;
    }

    try {
        const res = await fetch(
            `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${API_KEY}`
        );
        const data = await res.json();

        suggestions.innerHTML = "";
        data.forEach((item) => {
            const div = document.createElement("div");
            div.classList.add("list-group-item", "list-group-item-action");
            div.textContent = `${item.name}, ${item.country}`;

            div.addEventListener("click", () => {
                fetchWeather(`${item.name},${item.country}`);
                searchInput.value = `${item.name}, ${item.country}`;
                suggestions.innerHTML = "";
            });

            suggestions.appendChild(div);
        });
    } catch (err) {
        console.error(err);
    }
});

// Search button click
searchBtn.addEventListener("click", () => {
    const cityName = searchInput.value.trim();
    if (cityName) {
        fetchWeather(cityName);
        suggestions.innerHTML = "";
    }
});

// Hide suggestions when clicking outside
document.addEventListener("click", (e) => {
    if (!searchInput.contains(e.target) && !suggestions.contains(e.target)) {
        suggestions.innerHTML = "";
    }
});

// ------------------------
// Footer Cards
// ------------------------
const updateFooterCard = async (cityName, cardBody) => {
    try {
        const res = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityName)}&appid=${API_KEY}&units=metric`
        );
        const data = await res.json();
        if (data.cod !== 200) return;

        cardBody.querySelector(".bi-thermometer-half + span").textContent = `${data.main.temp.toFixed(1)} °C`;
        cardBody.querySelector(".bi-droplet + span").textContent = `${data.main.humidity}%`;
        cardBody.querySelector(".bi-wind + span").textContent = `${data.wind.speed.toFixed(1)} km/h`;
    } catch (err) {
        console.error(`Error fetching footer city ${cityName}:`, err);
    }
};

// Render footer cards
const renderFooterCards = async () => {
    footerContainer.innerHTML = "";

    footerCitiesAll.forEach((cityName, index) => {
        const colDiv = document.createElement("div");
        colDiv.classList.add("col-12", "col-md-4");
        if (index >= footerVisibleCount && !showAll) colDiv.style.display = "none";

        colDiv.innerHTML = `
            <div class="card h-100 text-center">
                <div class="card-header bg-primary text-white">
                    <i class="bi bi-flag-fill"></i> ${cityName}
                </div>
                <div class="card-body">
                    <div class="d-flex justify-content-between mb-2">
                        <i class="bi bi-thermometer-half"></i>
                        <span>-- °C</span>
                    </div>
                    <div class="d-flex justify-content-between mb-2">
                        <i class="bi bi-droplet"></i>
                        <span>--%</span>
                    </div>
                    <div class="d-flex justify-content-between">
                        <i class="bi bi-wind"></i>
                        <span>-- km/h</span>
                    </div>
                </div>
            </div>
        `;
        footerContainer.appendChild(colDiv);
        updateFooterCard(cityName, colDiv.querySelector(".card-body"));
    });
};

// Initial render of default footer cities
renderFooterCards();

// Add more city from modal
saveBtn.addEventListener("click", () => {
    const newCity = newCountryInput.value.trim();
    if (!newCity) return alert("Enter a city name");

    footerCitiesAll.push(newCity);
    renderFooterCards();

    newCountryInput.value = "";
    const modalEl = document.getElementById("exampleModal");
    const modal = bootstrap.Modal.getInstance(modalEl);
    modal.hide();
});

// See More toggle
seeMoreBtn.addEventListener("click", () => {
    showAll = !showAll;
    renderFooterCards();
    seeMoreBtn.textContent = showAll ? "See Less" : "See More";
});

// ------------------------
// Load default city
// ------------------------
window.addEventListener("DOMContentLoaded", () => {
    fetchWeather(DEFAULT_CITY);
});