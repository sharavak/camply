mapboxgl.accessToken = mapToken;
const map = new mapboxgl.Map({
  container: "cluster-map",
  style: "mapbox://styles/mapbox/light-v10",
  center: [-103.5917, 40.6699],
  zoom: 3,
});

//Adding Map Controls                         ,//'bottom-left

map.addControl(
  new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl,
  })
);
map.addControl(new mapboxgl.NavigationControl());
map.addControl(new mapboxgl.FullscreenControl());

map.on("load", function () {
  console.log("MAP");
  // Add a new source from our GeoJSON data and
  // set the 'cluster' option to true. GL-JS will
  // add the point_count property to your source data.
  map.addSource("campgrounds", {
    type: "geojson",
    // Point to GeoJSON data. This example visualizes all M1.0+ earthquakes
    // from 12/22/15 to 1/21/16 as logged by USGS' Earthquake hazards program.
    data: campgrounds, //Basic Clustering Campgrounds
    cluster: true,
    clusterMaxZoom: 14, // Max zoom to cluster points on
    clusterRadius: 50, // Radius of each cluster when clustering points (defaults to 50)
  });

  map.addLayer({
    id: "clusters",
    type: "circle",
    source: "campgrounds",
    filter: ["has", "point_count"],
    paint: {
      // Use step expressions (https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-step)
      // with three steps to implement three types of circles:
      //   * Blue, 20px circles when point count is less than 100
      //   * Yellow, 30px circles when point count is between 100 and 750
      //   * Pink, 40px circles when point count is greater than or equal to 750
      "circle-color": [
        "step",
        ["get", "point_count"],
        "#a3cef1",
        10,
        "#80ded9",
        30,
        "#00a6fb",
      ],
      "circle-radius": ["step", ["get", "point_count"], 15, 10, 20, 30, 25],
    },
  });

  map.addLayer({
    id: "cluster-count",
    type: "symbol",
    source: "campgrounds",
    filter: ["has", "point_count"],
    layout: {
      "text-field": "{point_count_abbreviated}",
      "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
      "text-size": 12,
    },
  });

  map.addLayer({
    id: "unclustered-point",
    type: "circle",
    source: "campgrounds",
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-color": "#11b4da",
      "circle-radius": 4,
      "circle-stroke-width": 1,
      "circle-stroke-color": "#fff",
    },
  });

  // inspect a cluster on click
  map.on("click", "clusters", function (e) {
    console.log();
    const features = map.queryRenderedFeatures(e.point, {
      layers: ["clusters"],
    });
    const clusterId = features[0].properties.cluster_id;
    map
      .getSource("campgrounds")
      .getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err) return;

        map.easeTo({
          center: features[0].geometry.coordinates,
          zoom: zoom,
        });
      });
  });

  // When a click event occurs on a feature in
  // the unclustered-point layer, open a popup at
  // the location of the feature, with
  // description HTML from its properties.
  map.on("click", "unclustered-point", function (e) {
    console.log("UNCLUSTERED POINT CLICKED", e.features[0]);
    const { popUpMarkUp } = e.features[0].properties;
    const coordinates = e.features[0].geometry.coordinates.slice();

    // Ensure that if the map is zoomed out such that
    // multiple copies of the feature are visible, the
    // popup appears over the copy being pointed to.
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    new mapboxgl.Popup().setLngLat(coordinates).setHTML(popUpMarkUp).addTo(map);
  });

  map.on("mouseenter", "clusters", function () {
    console.log("CLUSTERS");
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", "clusters", function () {
    map.getCanvas().style.cursor = "";
  });
});

// "features": [  It accepts as data as features as a key and with Array of objects
//     {
//         "type": "Feature", "properties":
//             { "id": "ak16994521", "mag": 2.3, "time": 1507425650893, "felt": null, "tsunami": 0 },
//         "geometry":
//             { "type": "Point", "coordinates": [-151.5129, 63.1016, 0.0] }
//     }]
