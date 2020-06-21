const URL = "https://corona.lmao.ninja/v2/";
let map;
let infoWindow;
let myChart = null;
let markers = [];
let mykey = config.API_KEY;

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
}

document.body.appendChild(script);

window.onload = function () {
  getGlobalData();
  getCountryMarkers();
  getChartData();
};

const biggerIcon = (elem) => {
  elem.classList.add("fa-6x");
};

const normalIcon = (elem) => {
  elem.classList.remove("fa-6x");
};

const getCountryMarkers = () => {
  const FULL_URL = "https://corona.lmao.ninja/v2/countries?yesterday=&sort=";

  const globalPromise = fetch(FULL_URL);

  globalPromise
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      showCountryMarkers(data);
      showDataInTable(data);
    });
};

const getGlobalData = () => {
  const FULL_URL = `${URL}all?yesterday=`;

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
  document.getElementById("total-cases").innerText = `TOTAL CASES: ${numeral(
    globalData.cases
  ).format("0,0")}`;
  document.getElementById("total-deaths").innerText = `TOTAL DEATHS: ${numeral(
    globalData.deaths
  ).format("0,0")}`;
  document.getElementById(
    "total-recoveries"
  ).innerText = `TOTAL RECOVERIES: ${numeral(globalData.recovered).format(
    "0,0"
  )}`;
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
  const FULL_URL = `${URL}countries/${country}?yesterday=true&strict=true&query`;

  const globalPromise = fetch(FULL_URL);

  globalPromise
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      showCountryData(data);
    });
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
  ).innerText = `NEW CASES: ${numeral(countryData.todayCases).format("0,0")}`;
  document.getElementById(
    "today-country-deaths"
  ).innerText = `NEW DEATHS: ${numeral(countryData.todayDeaths).format("0,0")}`;
  document.getElementById("active-cases").innerText = `ACTIVE CASES: ${numeral(
    countryData.active
  ).format("0,0")}`;
};

function showCountryMarkers(countries) {
  let totalCases = 0;
  let recovered = 0;
  let totalDeaths = 0;
  let name;
  var bounds = new google.maps.LatLngBounds();
  countries.forEach(function (country, index) {
    var latlng = new google.maps.LatLng(
      country.countryInfo.lat,
      country.countryInfo.long
    );
    name = country.country.toUpperCase();
    totalCases = numeral(country.cases).format("0,0");
    totalDeaths = numeral(country.deaths).format("0,0");
    recovered = numeral(country.recovered).format("0,0");
    createMarker(latlng, name, totalCases, totalDeaths, recovered, index);
    bounds.extend(latlng);
  });
  map.panToBounds(bounds);
}

function createMarker(latlng, name, totalCases, totalDeaths, recovered, index) {
  let country = name;
  var html = `<h6>${country}</h6>
                <p>Total cases: ${totalCases}</p>
                <p>Total Deaths: ${totalDeaths}</p>
                <p>Recovered: ${recovered}</p>
                `;
  var marker = new google.maps.Marker({
    map: map,
    position: latlng,
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 4,
      strokeColor: "#ff4c68",
    },
  });

  google.maps.event.addListener(marker, "click", function () {
    infoWindow.setContent(html);
    infoWindow.open(map, marker);
    getCountryData(country);
  });

  markers.push(marker);
}

const showDataInTable = (data) => {
  let dataSet = [];

  //let html = "";
  data.forEach((country) => {
    /*  html += `
        <tr>
          <td class="tableCountry" onclick="getChartData(this)">${
            country.country
          }</td>
          <td>${numeral(country.cases).format("0,0")}</td>
          <td>${numeral(country.recovered).format("0,0")}</td>
          <td>${numeral(country.deaths).format("0,0")}</td>
        </tr>
        `; */
    dataSet.push([
      country.country,
      numeral(country.cases).format("0,0"),
      numeral(country.recovered).format("0,0"),
      numeral(country.deaths).format("0,0"),
    ]);
  });

  //document.getElementById("table-data").innerHTML = html;

  $("#table").DataTable({
    columnDefs: [
      {
        targets: 0,
        createdCell: function (td) {
          $(td).attr("onclick", "getChartData(this)");
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

const getChartData = (elem = "") => {
  let country;
  if (elem == "") {
    country = "Afghanistan";
  } else {
    country = elem.innerHTML;
  }

  document.getElementById("tableCountry").innerText = country.toUpperCase();

  const FULL_URL = `${URL}historical/${country}?lastdays=30`;

  const globalPromise = fetch(FULL_URL);

  globalPromise
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      makeChart(data);
    });
};

const myChartFunc = (data) => {
  let ctx = document.getElementById("myChart").getContext("2d");
  let arrCases = Object.values(data.timeline.cases);
  let arrDeaths = Object.values(data.timeline.deaths);
  let arrRecovered = Object.values(data.timeline.recovered);
  let arrDates = Object.keys(data.timeline.cases);

  myChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [...arrDates],
      datasets: [
        {
          label: "Cases",
          backgroundColor: "rgba(0, 0, 0, 0.2)",
          borderColor: "rgba(0, 0, 0, 1)",
          data: [...arrCases],
          fill: true,
          borderWidth: 2,
        },
        {
          label: "Deaths",
          backgroundColor: "rgba(255, 76, 104, 0.5)",
          borderColor: "rgba(255, 76, 104, 1)",
          fill: true,
          data: [...arrDeaths],
          borderWidth: 2,
        },
        {
          label: "Recovered",
          backgroundColor: "rgba(201, 201, 201, 0.5)",
          borderColor: "rgba(201, 201, 201, 1)",
          fill: true,
          data: [...arrRecovered],
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      aspectRatio: 2,
      title: {
        display: true,
        text: "Country Stats",
      },
      tooltips: {
        mode: "index",
        intersect: true,
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
            display: true,
            scaleLabel: {
              display: true,
              labelString: "Month",
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
                return numeral(value).format("0,0");
              },
            },
          },
        ],
      },
    },
  });
};

const makeChart = (data) => {
  if (myChart != null) {
    myChart.destroy();
    myChartFunc(data);
  } else {
    myChartFunc(data);
  }
};
