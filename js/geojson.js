/* Map of GeoJSON data from MegaCities.geojson */

//function to instantiate the Leaflet map
function createMap() {
  //create the map
  var map = L.map('map', {
      center: [20, 0],
      zoom: 2,
    });

  //add OSM base tilelayer
  L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(map);

  //call getData function
  getData(map);
}

//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
  //scale factor to adjust symbol size evenly
  var scaleFactor = 50;

  //area based on attribute value and scale factor
  var area = attValue * scaleFactor;

  //radius calculated based on area
  var radius = Math.sqrt(area / Math.PI);

  return radius;
}

//function to convert markers to circle markers
function pointToLayer(feature, latlng, attributes) {
  //Determine which attribute to visualize with proportional symbols
  var attribute = 'Pop_1985';

  //check
  console.log(attribute);

  //create marker options
  var options = {
    fillColor: '#ff7800',
    color: '#000',
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8,
  };

  //For each feature, determine its value for the selected attribute
  var attValue = Number(feature.properties[attribute]);

  //Give each feature's circle marker a radius based on its attribute value
  options.radius = calcPropRadius(attValue);

  //create circle marker layer
  var layer = L.circleMarker(latlng, options);

  //build popup content string
  var panelContent = '<p><b>City:</b> ' + feature.properties.City + '</p>';

  var year = attribute.split('_')[1];
  panelContent += '<p><b>Population in ' + year + ':</b> ' + feature.properties[attribute] + ' million</p>';

  var popupContent = feature.properties.City;

  //bind the popup to the circle marker
  layer.bindPopup(popupContent, {
    offset: new L.Point(0, -options.radius),
  });

  //event listeners to open popup on hover and fill panel on click
  layer.on({
    mouseover: function () {
      this.openPopup();
    },

    mouseout: function () {
      this.closePopup();
    },

    click: function () {
      $('#panel').html(panelContent);
    },

  });

  //return the circle marker to the L.geoJson pointToLayer option
  return layer;
}

//Add circle markers for point features to the map
function createPropSymbols(data, map, attributes) {

  //create a Leaflet GeoJSON layer and add it to the map
  L.geoJson(data, {
    pointToLayer: function (feature, latlng) {
        return pointToLayer(feature, latlng, attributes);
      },
  }).addTo(map);
}

//Step 1: Create new sequence controls
function createSequenceControls(map) {
  //create range input element (slider)
  $('#panel').append('<input class="range-slider" type="range">');
  $('#panel').append('<button class="skip" id="reverse">Reverse</button>');
  $('#panel').append('<button class="skip" id="forward">Skip</button>');
  $('#reverse').html('<img src="img/rewind.svg">');
  $('#forward').html('<img src="img/forward.svg">');

  //click listener for buttons
  $('.skip').click(function () {
    //get the old index value
    var index = $('.range-slider').val();

    if ($(this).attr('id') == 'forward') {
      index++;
      index = index > 6 ? 0 : index;
    } else if ($(this).attr('id') == 'reverse') {
      index--;
      index = index < 0 ? 6 : index;
    }

    $('.range-slider').val(index);
    updatePropSymbols(map, attributes[index]);
  });

  //input listener for slider
  $('.range-slider').on('input', function () {
    //get the new index value
    var index = $(this).val();
    updatePropSymbols(map, attributes[index]);
  });

  //set slider attributes
  $('.range-slider').attr({
    max: 6,
    min: 0,
    value: 0,
    step: 1,
  });
}

//Step 10: Resize proportional symbols according to new attribute values
function updatePropSymbols(map, attribute) {
  map.eachLayer(function (layer) {
        if (layer.feature && layer.feature.properties[attribute]) {
          //access feature properties
          var props = layer.feature.properties;

          //update each feature's radius based on new attribute values
          var radius = calcPropRadius(props[attribute]);
          layer.setRadius(radius);

          //add city to popup content string
          var popupContent = '<p><b>City:</b> ' + props.City + '</p>';

          //add formatted attribute to panel content string
          var year = attribute.split('_')[1];
          popupContent += '<p><b>Population in ' + year + ':</b> ' + props[attribute] + ' million</p>';

          //replace the layer popup
          layer.bindPopup(popupContent, {
              offset: new L.Point(0, -radius),
            });
        }
      }
    );
}

function processData(data) {
  //empty array to hold attributes
  var attributes = [];

  //properties of the first feature in the dataset
  var properties = data.features[0].properties;

  //push each attribute name into attributes array
  for (var attribute in properties) {
    //only take attributes with population values
    if (attribute.indexOf('Pop') > -1) {
      attributes.push(attribute);
    }
  }

  //check result
  console.log(attributes);

  return attributes;
}

//Import GeoJSON data
function getData(map) {
  //load the data
  $.ajax('data/MegaCities.geojson', {
    dataType: 'json',
    success: function (response) {
          var attributes = processData(response);

          createPropSymbols(response, map);
          createSequenceControls(map);
        },
  });
}

$(document).ready(createMap);
