const URL = "https://disease.sh/v3/covid-19/";
let map;
let infoWindow;
let myChart = null;
let markers = [];
let mykey = config.API_KEY;

const CountUpOptions = {
  prefix: "+",
};

// load a locale
numeral.register("locale", "us", {
  delimiters: {
    thousands: ",",
    decimal: ".",
  },
  abbreviations: {
    thousand: "K",
    million: "M",
    billion: "B",
    trillion: "T",
  },
});

// switch between locales
numeral.locale("us");

function move(num) {
  let progress = Math.floor(num);
  document.getElementById("progress-percent").innerText = "0%";
  let elem = document.getElementById("myBar");
  let width = 1;
  let id = setInterval(frame, 10);
  function frame() {
    if (width >= num) {
      clearInterval(id);
      elem.style.width = width + "%";
    } else {
      width++;
      elem.style.width = width + "%";
    }
  }

  let progressCount = new CountUp("progress-percent", 0, progress, 0, 0.35, {
    suffix: "%",
  });
  progressCount.start();
}

const worldWideSelection = {
  name: "Global Data",
  value: "glob",
  selected: true,
};

let options = { year: "numeric", month: "long", day: "numeric" };
let year = new Date().getFullYear();
document.getElementById("year").innerText = year;
document.getElementById(
  "updated-date"
).innerText = new Date().toLocaleDateString("en-US", options);

let script = document.createElement("script");
script.src = `https://maps.googleapis.com/maps/api/js?key=${mykey}&callback=initMap`;
script.defer = true;
script.async = true;

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: {
      lat: 0,
      lng: 0,
    },
    zoom: 2,
    styles: mapStyle,
  });
  infoWindow = new google.maps.InfoWindow({
    maxWidth: 165,
  });
  let opt = { minZoom: 2, maxZoom: 4 };
  map.setOptions(opt);

  google.maps.event.addDomListener(window, "resize", function () {
    let center = map.getCenter();
    google.maps.event.trigger(map, "resize");
    map.setCenter(center);
  });
}

document.body.appendChild(script);

window.onload = function () {
  getCountryMarkers();
  getChartData();
  getNews();
};

const biggerIcon = (elem) => {
  elem.classList.add("fa-6x");
};

const normalIcon = (elem) => {
  elem.classList.remove("fa-6x");
};

const getCountryMarkers = (casesType = "") => {
  const FULL_URL = `${URL}countries`;

  const globalPromise = fetch(FULL_URL);

  globalPromise
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      if (!casesType) {
        showCountryMarkers(data);
        showDataInTable(data);
        setSearchList(data);
      } else {
        showCountryMarkers(data, casesType);
      }
    });
};

const initDropdown = (searchList) => {
  $(".ui.dropdown").dropdown({
    values: searchList,
    onChange: function (value) {
      if (value !== worldWideSelection.value) {
        getCountryData(value);
      } else {
        getGlobalData();
        showGlobalMessage();
      }
    },
  });
};

const setSearchList = (data) => {
  let searchList = [];
  searchList.push(worldWideSelection);
  data.forEach((countryData) => {
    searchList.push({
      name: countryData.country,
      value: countryData.countryInfo.iso3,
    });
  });
  initDropdown(searchList);
};

const changeDataSelection = (casesType = "cases") => {
  clearTheMap();
  makeActive(casesType);
  getCountryMarkers(casesType);
};

const makeActive = (elem) => {
  let cards = document.getElementsByClassName("global-stats");

  for (let i = 0; i < cards.length; i++) {
    cards[i].classList.remove("active");
  }

  document.querySelector(`.${elem}`).classList.add("active");
};

const clearTheMap = () => {
  for (let marker of markers) {
    marker.setMap(null);
  }
};

const getGlobalData = () => {
  const FULL_URL = `${URL}all`;

  const globalPromise = fetch(FULL_URL);

  globalPromise
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      showGlobalData(data);
    })
    .catch((error) => {
      alert("Problem getting data from the API. Please try again later.");
    });
};

const showGlobalData = (globalData) => {
  let precentage = (globalData.recovered / globalData.cases) * 100;
  let title = "Global Data";
  if (globalData.country) {
    title = globalData.country;
    document.getElementById("back-global").innerHTML =
      "<span id='back-global-span' onclick='getGlobalData()'>BACK TO GLOBAL STATS</span>";
  } else {
    showGlobalMessage();
    document.getElementById("back-global").innerHTML =
      "<span style='visibility: hidden;'>BACK TO GLOBAL STATS</span>";
  }
  document.getElementById("stats-title").innerText = title.toUpperCase();
  document.getElementById("total-cases").innerText = `${numeral(
    globalData.cases
  ).format("0.0a")} Total`;
  let countTotal = new CountUp(
    "new-total",
    0,
    globalData.todayCases,
    0,
    1.5,
    CountUpOptions
  );

  document.getElementById("total-deaths").innerText = `${numeral(
    globalData.deaths
  ).format("0.0a")} Total`;
  let countDeaths = new CountUp(
    "new-deaths",
    0,
    globalData.todayDeaths,
    0,
    1.5,
    CountUpOptions
  );

  document.getElementById("total-recoveries").innerText = `${numeral(
    globalData.recovered
  ).format("0.0a")} Total`;
  let countRecovered = new CountUp(
    "new-recoveries",
    0,
    globalData.todayRecovered,
    0,
    1.5,
    CountUpOptions
  );

  setTimeout(() => {
    move(precentage);
    countTotal.start();
    countDeaths.start();
    countRecovered.start();
  }, 400);
};

const onEnter = (e) => {
  if (e.key === "Enter") {
    getCountryData();
  }
};

const getCountryData = (country = "") => {
  if (country == "") {
    country = document.getElementById("search-country").value;
  }
  const FULL_URL = `${URL}countries/${country}`;

  const globalPromise = fetch(FULL_URL);

  globalPromise
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      showCountryData(data);
      showGlobalData(data);
    });
};

const showGlobalMessage = () => {
  document.getElementById("country").innerText = "";
  document.getElementById("flag").innerHTML = "";
  document.getElementById(
    "today-country-cases"
  ).innerHTML = `<h5 id="start-message">
                CLICK ON A COUNTRY MARKER TO GET THE SELECTED COUNTRY DATA (or
                use search)
              </h5>`;
  document.getElementById("today-country-deaths").innerHTML = "";
  document.getElementById("active-cases").innerHTML = "";
};

const showCountryData = (countryData) => {
  document.getElementById(
    "country"
  ).innerText = `${countryData.country.toUpperCase()}`;
  document.getElementById(
    "flag"
  ).innerHTML = `<img src='${countryData.countryInfo.flag}' alt='Country flag'>`;
  document.getElementById(
    "today-country-cases"
  ).innerHTML = `<strong>ACTIVE CASES</strong>: ${numeral(
    countryData.active
  ).format("0,0")}`;
  document.getElementById(
    "today-country-deaths"
  ).innerHTML = `<strong>CRITICAL</strong>: ${numeral(
    countryData.critical
  ).format("0,0")}`;
  document.getElementById(
    "active-cases"
  ).innerHTML = `<strong>TESTS</strong>: ${numeral(countryData.tests).format(
    "0,0"
  )}`;
};

function showCountryMarkers(countries, casesType = "cases") {
  let cases = 0;
  let recovered = 0;
  let deaths = 0;
  let title = "";
  let name = "";
  let casesNum = "";
  let color = "";
  var bounds = new google.maps.LatLngBounds();
  countries.forEach(function (country, index) {
    var latlng = new google.maps.LatLng(
      country.countryInfo.lat,
      country.countryInfo.long
    );
    name = country.country.toUpperCase();
    cases = country.cases;
    recovered = country.recovered;
    deaths = country.deaths;
    if (casesType === "cases") {
      casesNum = cases;
      title = "TOTAL CASES:";
      color = "#000";
    } else if (casesType === "recovered") {
      casesNum = recovered;
      title = "RECOVERED:";
      color = "rgb(255, 76, 104)";
    } else if (casesType === "deaths") {
      casesNum = deaths;
      title = "DEATHS:";
      color = "rgb(201, 201, 201)";
    }
    createMarker(latlng, name, casesNum, casesType, title, color, index);
    bounds.extend(latlng);
  });
  map.panToBounds(bounds);
}

function createMarker(
  latlng,
  name,
  cases,
  casesType = "cases",
  title,
  titleColor
) {
  let color;
  let scale;
  if (casesType === "cases" || casesType === "recovered") {
    if (cases > 1000000) {
      color = "#333333";
      scale = 17;
    } else if (cases > 500000) {
      color = "#666666";
      scale = 14;
    } else if (cases > 100000) {
      color = "#943f4c";
      scale = 12;
    } else if (cases > 50000) {
      color = "#ff4c68";
      scale = 10;
    } else if (cases > 10000) {
      color = "#e58e9b";
      scale = 7;
    } else if (cases > 1000) {
      color = "#d9acb2";
      scale = 5;
    } else {
      color = "#cccccc";
      scale = 4;
    }

    document.getElementById("map-legend").innerHTML = `
  <h3 id="legend-title" style='color: ${titleColor}'>${title}</h3>
            <div class="legend-color-container">
              <div id="7">> 1M</div>
              <div class="color7"></div>
            </div>
            <div class="legend-color-container">
              <div id="6">500K-1M</div>
              <div class="color6"></div>
            </div>
            <div class="legend-color-container">
              <div id="5">100K-500K</div>
              <div class="color5"></div>
            </div>
            <div class="legend-color-container">
              <div id="4">50K-100K</div>
              <div class="color4"></div>
            </div>
            <div class="legend-color-container">
              <div id="3">10K-50K</div>
              <div class="color3"></div>
            </div>
            <div class="legend-color-container">
              <div id="2">1K-10K</div>
              <div class="color2"></div>
            </div>
            <div class="legend-color-container">
              <div id="1">0-1K</div>
              <div class="color1"></div>
            </div>
  `;
  } else if (casesType === "deaths") {
    if (cases > 100000) {
      color = "#333333";
      scale = 17;
    } else if (cases > 50000) {
      color = "#666666";
      scale = 14;
    } else if (cases > 20000) {
      color = "#943f4c";
      scale = 12;
    } else if (cases > 5000) {
      color = "#ff4c68";
      scale = 10;
    } else if (cases > 1000) {
      color = "#e58e9b";
      scale = 7;
    } else if (cases > 100) {
      color = "#d9acb2";
      scale = 5;
    } else {
      color = "#cccccc";
      scale = 4;
    }

    document.getElementById("map-legend").innerHTML = `
  <h3 id="legend-title" style='color: ${titleColor}'>${title}</h3>
            <div class="legend-color-container">
              <div id="7">> 100K</div>
              <div class="color7"></div>
            </div>
            <div class="legend-color-container">
              <div id="6">50K-100K</div>
              <div class="color6"></div>
            </div>
            <div class="legend-color-container">
              <div id="5">20K-50K</div>
              <div class="color5"></div>
            </div>
            <div class="legend-color-container">
              <div id="4">5K-20K</div>
              <div class="color4"></div>
            </div>
            <div class="legend-color-container">
              <div id="3">1K-5K</div>
              <div class="color3"></div>
            </div>
            <div class="legend-color-container">
              <div id="2">100-1K</div>
              <div class="color2"></div>
            </div>
            <div class="legend-color-container">
              <div id="1">0-100</div>
              <div class="color1"></div>
            </div>
  `;
  }

  let marker = new google.maps.Marker({
    map: map,
    position: latlng,
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: scale,
      strokeColor: color,
      fillColor: color,
      fillOpacity: 0.7,
      strokeOpacity: 1,
      strokeWeight: 1,
    },
  });

  google.maps.event.addListener(marker, "click", function () {
    getCountryData(name);
  });

  markers.push(marker);
}

const showDataInTable = (data) => {
  let dataSet = [];

  data.forEach((country) => {
    dataSet.push([
      country.country,
      numeral(country.cases).format("0,0"),
      numeral(country.recovered).format("0,0"),
      numeral(country.deaths).format("0,0"),
    ]);
  });

  $("#table").DataTable({
    responsive: true,
    columnDefs: [
      {
        targets: 0,
        createdCell: function (td) {
          $(td).attr("onclick", "getPieChartData(this)");
        },
      },
    ],
    data: dataSet,
    columns: [
      { title: "Country Name" },
      { title: "Cases" },
      { title: "Recovered" },
      { title: "Deaths" },
    ],
  });
};

const getChartData = () => {
  document.getElementById("tableCountry").innerHTML =
    "<span id='global-chart' style='color: rgb(255, 76, 104)'>TOTAL STATS</span><span> / </span><span id='new-chart' style='cursor: pointer; text-decoration: line-through' onclick='getNewCasesChartData()'>NEW CASES</span>";
  document.getElementById("graph-title").innerText = "LAST 4 MONTHS:";
  document.getElementById("chart-type").innerText =
    "For country charts select a country from the table!";

  const FULL_URL = `${URL}historical/all?lastdays=120`;
  let type = "line_chart";

  const globalPromise = fetch(FULL_URL);

  globalPromise
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      makeChart(data, type);
    });
};

const getNewCasesChartData = () => {
  document.getElementById("tableCountry").innerHTML =
    "<span id='global-chart' style='cursor: pointer; text-decoration: line-through' onclick='getChartData()'>TOTAL STATS</span><span> / </span><span id='new-chart' style='color: rgb(255, 76, 104)'>NEW CASES</span>";
  document.getElementById("graph-title").innerText = "LAST 4 MONTHS:";
  document.getElementById("chart-type").innerText =
    "For country charts select a country from the table!";
  const FULL_URL = `${URL}historical/all?lastdays=120`;
  let type = "line_chart_new";

  const globalPromise = fetch(FULL_URL);

  globalPromise
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      makeChart(data, type);
    });
};

const getPieChartData = (elem = "") => {
  let country;
  if (elem == "") {
    country = "Afghanistan";
  } else {
    country = elem.innerHTML;
  }

  document.getElementById("tableCountry").innerText = country.toUpperCase();
  document.getElementById("graph-title").innerText = "COUNTRY STATS:";
  document.getElementById("chart-type").innerHTML =
    "<p>For global charts click <span class='get-global-chart' onclick='getChartData()'>here</span>!</p>";

  const FULL_URL = `${URL}countries/${country}`;
  let type = "pie_chart";

  const globalPromise = fetch(FULL_URL);

  globalPromise
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      makeChart(data, type);
    });
};

const buildPieChart = (data) => {
  var ctx = document.getElementById("myChart").getContext("2d");
  Chart.defaults.global.defaultFontFamily = "Montserrat";

  myChart = new Chart(ctx, {
    type: "pie",
    data: {
      datasets: [
        {
          data: [data.active, data.recovered, data.deaths],
          backgroundColor: [
            "rgba(0, 0, 0, 0.9)",
            "rgba(255, 76, 104, 0.9)",
            "rgba(201, 201, 201, 0.9)",
          ],
        },
      ],

      // These labels appear in the legend and in the tooltips when hovering different arcs
      labels: ["Active", "Recovered", "Deaths"],
    },
    options: {
      title: {
        display: true,
        text: "Total Stats",
      },
      responsive: true,
      maintainAspectRatio: false,
      legend: {
        onHover: function (e) {
          e.target.style.cursor = "pointer";
        },
      },
      tooltips: {
        mode: "index",
        intersect: true,
        callbacks: {
          label: function (tooltipItem, data) {
            let label = data.labels[tooltipItem.index] || "";
            let value =
              data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
            return label + ": " + numeral(value).format("0,0");
          },
        },
      },
    },
  });
};

const myNewCasesChartFunc = (data) => {
  let ctx = document.getElementById("myChart").getContext("2d");
  let chartData = [];
  let lastDataPoint;

  for (let date in data.cases) {
    if (lastDataPoint) {
      let newDataPoint = data.cases[date] - lastDataPoint;
      chartData.push(newDataPoint);
    }
    lastDataPoint = data.cases[date];
  }

  //let arrNew = Object.values(data.cases);
  let arrDates = Object.keys(data.cases);
  Chart.defaults.global.defaultFontFamily = "Montserrat";

  myChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [...arrDates],
      datasets: [
        {
          label: "New Cases",
          backgroundColor: "rgba(255, 76, 104, 0.7)",
          borderColor: "rgba(255, 76, 104, 0.9)",
          fill: true,
          data: [...chartData],
          pointRadius: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      title: {
        display: true,
        text: "Global Stats",
      },
      tooltips: {
        mode: "index",
        intersect: false,
        callbacks: {
          label: function (tooltipItem, data) {
            let label = data.datasets[tooltipItem.datasetIndex].label || "";
            let value =
              data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
            return label + ": " + numeral(value).format("0,0");
          },
        },
      },
      legend: {
        onHover: function (e) {
          e.target.style.cursor = "pointer";
        },
      },
      hover: {
        onHover: function (e) {
          let point = this.getElementAtEvent(e);
          if (point.length) e.target.style.cursor = "pointer";
          else e.target.style.cursor = "default";
        },
      },
      scales: {
        xAxes: [
          {
            gridLines: {
              display: false,
            },
            display: true,
            scaleLabel: {
              display: true,
              labelString: "Date",
            },
          },
        ],
        yAxes: [
          {
            display: true,
            scaleLabel: {
              display: true,
              labelString: "Value",
            },
            ticks: {
              callback: function (value) {
                return numeral(value).format("0a");
              },
            },
          },
        ],
      },
    },
  });
};

const myChartFunc = (data) => {
  let ctx = document.getElementById("myChart").getContext("2d");
  let arrCases = Object.values(data.cases);
  let arrDeaths = Object.values(data.deaths);
  let arrRecovered = Object.values(data.recovered);
  let arrDates = Object.keys(data.cases);
  Chart.defaults.global.defaultFontFamily = "Montserrat";

  myChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [...arrDates],
      datasets: [
        {
          label: "Cases",
          backgroundColor: "rgba(0, 0, 0, 1)",
          borderColor: "rgba(0, 0, 0, 1)",
          fill: false,
          data: [...arrCases],
          pointRadius: 0,
        },
        {
          label: "Recovered",
          backgroundColor: "rgba(255, 76, 104, 1)",
          borderColor: "rgba(255, 76, 104, 1)",
          fill: false,
          data: [...arrRecovered],
          pointRadius: 0,
        },
        {
          label: "Deaths",
          backgroundColor: "rgba(201, 201, 201, 1)",
          borderColor: "rgba(201, 201, 201, 1)",
          fill: false,
          data: [...arrDeaths],
          pointRadius: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      title: {
        display: true,
        text: "Global Stats",
      },
      tooltips: {
        mode: "index",
        intersect: false,
        callbacks: {
          label: function (tooltipItem, data) {
            let label = data.datasets[tooltipItem.datasetIndex].label || "";
            let value =
              data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
            return label + ": " + numeral(value).format("0,0");
          },
        },
      },
      legend: {
        onHover: function (e) {
          e.target.style.cursor = "pointer";
        },
      },
      hover: {
        onHover: function (e) {
          let point = this.getElementAtEvent(e);
          if (point.length) e.target.style.cursor = "pointer";
          else e.target.style.cursor = "default";
        },
      },
      scales: {
        xAxes: [
          {
            gridLines: {
              display: false,
            },
            display: true,
            scaleLabel: {
              display: true,
              labelString: "Date",
            },
          },
        ],
        yAxes: [
          {
            display: true,
            scaleLabel: {
              display: true,
              labelString: "Value",
            },
            ticks: {
              callback: function (value) {
                return numeral(value).format("0a");
              },
            },
          },
        ],
      },
    },
  });
};

const makeChart = (data, type) => {
  if (myChart != null) {
    myChart.destroy();
    if (type === "line_chart") {
      myChartFunc(data);
    } else if (type === "pie_chart") {
      buildPieChart(data);
    } else {
      myNewCasesChartFunc(data);
    }
  } else {
    if (type === "line_chart") {
      myChartFunc(data);
    } else if (type === "pie_chart") {
      buildPieChart(data);
    } else {
      myNewCasesChartFunc(data);
    }
  }
};

const getNews = () => {
  const globalPromise = fetch(
    "https://api.smartable.ai/coronavirus/news/global",
    {
      headers: {
        "Subscription-Key": "ca039a31fe874a5eb7032f33d8b23613",
      },
    }
  );

  globalPromise
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      showNews(data.news);
    });
};

function truncate(str, n) {
  return str.length > n ? str.substr(0, n - 1) + "..." : str;
}

const showNews = (data) => {
  let html = "";
  let src = "";

  for (let i = 15; i <= 18; i++) {
    let text = truncate(data[i].excerpt, 170);
    let title = truncate(data[i].title, 68);
    if (data[i].images === null) {
      src =
        "https://images.unsplash.com/photo-1583324113626-70df0f4deaab?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1489&q=80";
    } else {
      src = data[i].images[0].url;
    }
    html += `<div class="col-md-4">
                <div class="card mb-2">
                  <img
                    class="card-img-top"
                    src=${src}
                    alt="Title image"
                  />
                  <div class="card-body">
                    <h5 class="card-title">${title}</h5>
                  </div>
                  <p class="card-text">${text}</p>
                  <div>
                    <a href=${data[i].webUrl} target='_blank' class="btn btn-primary">Go to article</a>
                  </div>
                  </div>
                </div>
              </div>`;
  }

  document.getElementById("carousel-1").innerHTML = html;

  html = "";

  for (let i = 5; i <= 8; i++) {
    let text = truncate(data[i].excerpt, 160);
    let title = truncate(data[i].title, 68);
    if (data[i].images === null) {
      src =
        "https://images.unsplash.com/photo-1583324113626-70df0f4deaab?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1489&q=80";
    } else {
      src = data[i].images[0].url;
    }
    html += `<div class="col-md-4">
                <div class="card mb-2">
                  <img
                    class="card-img-top"
                    src=${src}
                    alt="Title image"
                  />
                  <div class="card-body">
                    <h5 class="card-title">${title}</h5>
                  </div>
                  <p class="card-text">${text}</p>
                  <div>
                    <a href=${data[i].webUrl} target='_blank' class="btn btn-primary">Go to article</a>
                  </div>
                  </div>
                </div>
              </div>`;
  }

  document.getElementById("carousel-2").innerHTML = html;

  html = "";

  for (let i = 9; i <= 12; i++) {
    let text = truncate(data[i].excerpt, 160);
    let title = truncate(data[i].title, 68);
    if (data[i].images === null) {
      src =
        "https://images.unsplash.com/photo-1583324113626-70df0f4deaab?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1489&q=80";
    } else {
      src = data[i].images[0].url;
    }
    html += `<div class="col-md-4">
                <div class="card mb-2">
                  <img
                    class="card-img-top"
                    src=${src}
                    alt="Title image"
                  />
                  <div class="card-body">
                    <h5 class="card-title">${title}</h5>
                  </div>
                  <p class="card-text">${text}</p>
                  <div>
                    <a href=${data[i].webUrl} target='_blank' class="btn btn-primary">Go to article</a>
                  </div>
                </div>
              </div>`;
  }

  document.getElementById("carousel-3").innerHTML = html;
};
