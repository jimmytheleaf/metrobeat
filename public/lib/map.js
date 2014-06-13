define(['jquery', 'leaflet', 'underscore', 'tinycolor', 'clusterfck',
          'esri-leaflet', 'jquery-ui', 'bootstrap'],
          function($, L, _, tinycolor, clusterfck) {

    var marker_layers = {};
    var cluster_layer = new L.LayerGroup();
    var layers_control = L.control.layers({}, marker_layers, {'position': 'bottomleft'});

    var tron_cyan = "#6FC3DF";
    var tron_orange = "#DF740C";
    var tron_yellow = "#FFE64D";

    var colors = [tron_cyan, tron_yellow, tron_orange];
    var vehicle_cache = {};
    var route_cache = {};
    var code_to_color = {};


    var getColor = function(route) {
      if (code_to_color[route]) {
        return code_to_color[route];
      } else {
        return "#6FC3DF";
      }
    };

    var refreshColors = function() {

      var routes = _.keys(route_cache);
      var total = routes.length;

      var i = 0;
      _.each(routes, function(route) {
          i++;
          var color = tinycolor("hsv " + ((i / total) * 360) + " 100 75").toHexString();
          code_to_color[route] = color;
      });

    };

    var vehicleLatLng = function(vehicle_moment) {
      return L.latLng(vehicle_moment['latitude'], vehicle_moment['longitude']);
    };

    var popupText = function(vehicle) {
      var result = "<b>Vehicle " + vehicle["id"] + "</b><br/>";
      if (_.has(route_cache, vehicle["route_id"])) {
        result = result + "Route: " + route_cache[vehicle["route_id"]];
      }
      return result;
    };

    var getMarker = function(latlng, hex) {
      //var marker = L.marker(tweet['latlng']);
      var marker = L.circleMarker(latlng, {
        radius: 4,
        color: "black",
        fillColor: hex,
        fillOpacity: 0.5
      });
      return marker;
    };

    var initializeVehicle = function(vehicle_moment, map) {
      var marker = getMarker(vehicleLatLng(vehicle_moment), getColor(vehicle_moment['route_id']));
      vehicle_cache[vehicle_moment['id']] = marker;
      marker.bindPopup(popupText(vehicle_moment));
      marker.addTo(map);
    };

    var moveVehicle = function(vehicle_moment) {
      var marker = vehicle_cache[vehicle_moment['id']];
      marker.setLatLng(vehicleLatLng(vehicle_moment));
    };

    var initializeMap = function(socket) {
      $.ajax({url: "/routes"}).done(function(res) {
        route_cache = res;
        refreshColors();
      });

      $.ajax({url: "/mapconfig"}).done(function(mapconfig) {

        var point = [mapconfig['center']['latitude'], mapconfig['center']['longitude']];

        var map = L.map('map', {
          //'maxZoom': 15
        }).setView(point, mapconfig['zoom']);

        L.esri.basemapLayer("Gray").addTo(map);

        //layers_control.addTo(map);

        socket.on("vehicle_update", function(vehicle_moment) {
          var id = vehicle_moment['id'];
          if (_.has(vehicle_cache, id)) {
            moveVehicle(vehicle_moment);
          } else {
            initializeVehicle(vehicle_moment, map);
          }
        });
      });
    };

    return initializeMap;

});