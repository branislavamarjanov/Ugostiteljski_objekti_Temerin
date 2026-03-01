// 1. KREIRANJE MAPE

var map = L.map("map").setView([45.45, 19.86], 11);
// OpenStreetMap 
var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);
// 2. RASTER SLOJ
var raster = L.tileLayer.wms(
    "http://localhost:8080/geoserver/Temerin_kafici/wms",
    {
        layers: "Temerin_kafici:temerin_rgb_rendered",
        format: "image/png",
        transparent: true
    }
).addTo(map);

// 3. GRANICE NASELJA
var granice = L.tileLayer.wms(
    "http://localhost:8080/geoserver/Temerin_kafici/wms",
    {
        layers: "Temerin_kafici:naselja_repr",
        format: "image/png",
        transparent: true,
        opacity: 0.8
    }
).addTo(map);

// 4. WFS URL 
const WFS_URL =
  "http://localhost:8080/geoserver/Temerin_kafici/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=Temerin_kafici:ugostiteljski_objekti_web&outputFormat=application/json";

var pointsLayer;

// FUNKCIJA ZA UCITAVANJE TACAKA
function loadPoints(cql = "") {
    let url = WFS_URL;

    if (cql !== "") {
        url += "&CQL_FILTER=" + encodeURIComponent(cql);
    }

    console.log("WFS URL:", url); 

    fetch(url)
        .then(r => r.json())
        .then(data => {
            console.log("WFS Features:", data.features.length);

            if (pointsLayer) map.removeLayer(pointsLayer);

            pointsLayer = L.geoJSON(data, {
                pointToLayer: function (feature, latlng) {
                    return L.circleMarker(latlng, {
                        radius: 7,
                        color: "#cc5200",
                        fillColor: "#ff944d",
                        fillOpacity: 0.9
                    });
                },
                onEachFeature: function (feature, layer) {
                    layer.bindPopup(
                        `<b>${feature.properties.naziv}</b><br>
                         ${feature.properties.tip}<br>
                         ${feature.properties.naselje}`
                    );
                }
            });

            if (document.getElementById("tackeCheck").checked) {
                pointsLayer.addTo(map);
            }

            // AUTOMATSKO ZUMIRANJE NA TAČKE 
            if (pointsLayer.getLayers().length > 0) {
                
            }
        })
        .catch(err => console.error("Greška u WFS fetch:", err));
}

// 5. PRETRAGA
document.getElementById("searchBtn").addEventListener("click", () => {
    let naselje = document.getElementById("naseljeInput").value;
    let tip = document.getElementById("tipInput").value;

    let filters = [];
    if (naselje !== "") filters.push(`naselje='${naselje}'`);
    if (tip !== "") filters.push(`tip='${tip}'`);

    let cql = filters.length ? filters.join(" AND ") : "";

    loadPoints(cql);
});

// 6. CHECKBOX
document.getElementById("rasterCheck").addEventListener("change", function () {
    this.checked ? map.addLayer(raster) : map.removeLayer(raster);
});

document.getElementById("graniceCheck").addEventListener("change", function () {
    this.checked ? map.addLayer(granice) : map.removeLayer(granice);
});

document.getElementById("tackeCheck").addEventListener("change", function () {
    if (!pointsLayer) return;
    this.checked ? map.addLayer(pointsLayer) : map.removeLayer(pointsLayer);
});

// 7. UCITAVANJE TACAKA
loadPoints();