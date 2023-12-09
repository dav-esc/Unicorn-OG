/*global WildRydes _config*/

var WildRydes = window.WildRydes || {};
WildRydes.map = WildRydes.map || {};
let map;

(function rideScopeWrapper($) {
    var authToken;
    WildRydes.authToken.then(function setAuthToken(token) {
        if (token) {
            authToken = token;
        } else {
            window.location.href = '/signin.html';
        }
    }).catch(function handleTokenError(error) {
        alert(error);
        window.location.href = '/signin.html';
    });

    //  requestUnicorn
    //      make the POST request to the server
    function requestUnicorn(pickupLocation) {
        $.ajax({
            method: 'POST',
            url: _config.api.invokeUrl + '/ride',
            headers: {
                Authorization: authToken
            },
            data: JSON.stringify({
                PickupLocation: {
                    Latitude: pickupLocation.latitude,
                    Longitude: pickupLocation.longitude
                }
            }),
            contentType: 'application/json',
            success: result => completeRequest(result, pickupLocation),
            error: function ajaxError(jqXHR, textStatus, errorThrown) {
                console.error('Error requesting ride: ', textStatus, ', Details: ', errorThrown);
                console.error('Response: ', jqXHR.responseText);
                alert('An error occurred when requesting your unicorn:\n' + jqXHR.responseText);
            }
        });
    }

    //  completeRequest
    //      a Unicorn has been dispatched to your location
    function completeRequest(result, pickupLocation) {
        var unicorn;
        var pronoun;

        console.log('Response received from API: ', result);
        unicorn = result.Unicorn;
        pronoun = unicorn.Gender === 'Male' ? 'his' : 'her';
        //displayUpdate(unicorn.Name + ', your ' + unicorn.Color + ' unicorn, is on ' + pronoun + ' way.', unicorn.Color);
        displayUpdate('David, your ' + unicorn.Color + ' unicorn, is on his way.', unicorn.Color);

        console.log(pickupLocation);
        //  get the local weather, find nearby restaurants, movies
        // getWeather(pickupLocation, unicorn)

        animateArrival(function animateCallback() {
            //displayUpdate(unicorn.Name + ' has arrived. Giddy up!', unicorn.Color);
            displayUpdate('David has arrived. Giddy up!', unicorn.Color);
            WildRydes.map.unsetLocation();

            $('#request').prop('disabled', 'disabled');
            $('#request').text('Set Pickup');
        });
    }

    // Register click handler for #request button
    $(function onDocReady() {
        $('#request').click(handleRequestClick);

        WildRydes.authToken.then(function updateAuthMessage(token) {
            if (token) {
                displayUpdate('You are authenticated. Click to see your <a href="#authTokenModal" data-toggle="modal">auth token</a>.');
                $('.authToken').text(token);
            }
        });

        if (!_config.api.invokeUrl) {
            $('#noApiMessage').show();
        }

        window.navigator.geolocation
            .getCurrentPosition(setLocation);

        //  put the map behind the updates list
        document.getElementById("map").style.zIndex = "10";

        function setLocation(loc) {
            map = L.map('map').setView([loc.coords.latitude, loc.coords.longitude], 13);
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap'
            }).addTo(map);

            WildRydes.map.center = {latitude: loc.coords.latitude, longitude: loc.coords.longitude};
            let b = map.getBounds();        //  TODO moved
            WildRydes.map.extent = {minLat: b._northEast.lat, minLng: b._northEast.lng,
                maxLat: b._southWest.lat, maxLng: b._southWest.lng};

            WildRydes.marker  = L.marker([loc.coords.latitude, loc.coords.longitude]).addTo(map);
            var myIcon = L.icon({
                iconUrl: 'images/unicorn-icon.png',
                iconSize: [25, 25],
                iconAnchor: [22, 24],
                shadowSize: [25, 25],
                shadowAnchor: [22, 24]
            });
            WildRydes.unicorn = L.marker([loc.coords.latitude, loc.coords.longitude], {icon: myIcon}).addTo(map);
            // WildRydes.marker.bindPopup("<b>Hello world!</b><br>I am a popup.").openPopup();

            // var popup = L.popup();
            map.on('click', onMapClick);

            function onMapClick(e) {            //  TODO move to esri.js
                WildRydes.map.selectedPoint = {longitude: e.latlng.lng, latitude: e.latlng.lat};
                if (WildRydes.marker)       WildRydes.marker.remove();
                handlePickupChanged();

                WildRydes.marker  = L.marker([e.latlng.lat, e.latlng.lng]).addTo(map);

                // popup
                //     .setLatLng(e.latlng)
                //     .setContent("You clicked the map at " + e.latlng.toString())
                //     .openOn(map);
            }
        }
    });

    //  handlePickupChanged
    //      enable the Pickup button and set text to Request Unicorn
    function handlePickupChanged() {
        var requestButton = $('#request');
        requestButton.text('Request Unicorn');
        requestButton.prop('disabled', false);
    }

    //  handleRequestClick
    //      get current request location and POST request to server
    function handleRequestClick(event) {
        var pickupLocation =  WildRydes.map.selectedPoint;

        event.preventDefault();
        requestUnicorn(pickupLocation);
    }

    //  animateArrival
    //      animate the Unicorn's arrival to the user's pickup location
    function animateArrival(callback) {
        var dest = WildRydes.map.selectedPoint;
        var origin = {};

        if (dest.latitude > WildRydes.map.center.latitude) {
            origin.latitude = WildRydes.map.extent.minLat;
        } else {
            origin.latitude = WildRydes.map.extent.maxLat;
        }

        if (dest.longitude > WildRydes.map.center.longitude) {
            origin.longitude = WildRydes.map.extent.minLng;
        } else {
            origin.longitude = WildRydes.map.extent.maxLng;
        }

        WildRydes.map.animate(origin, dest, callback);
    }


}(jQuery));

//  these functions below here are my utility functions
//      to present messages to users
//      and to particularly add some 'sizzle' to the application
const url = `https://api.thecatapi.com/v1/breeds`;

const api_key = "live_IhoDZOwQtiRrI9Y8JsmJY6bJDwTlQ60mkePbwpjV49Tzd3leEjNOv5dLxvrFGaom";

// a variable to store the information about the breeds

let storedBreeds = [];

// a function to select a random breed

function getRandomInt(min, max) {
return Math.floor(Math.random() * (max - min + 1)) + min;
}


// a function to show images and information of the breeds
function showCatImageAndInformation(index) {

// This will display the image of the cat
  document.getElementById("cat_image").src = storedBreeds[index].image.url;

// This will get the breed name
  document.getElementById("breed_name").innerHTML = storedBreeds[index].name;

// This will get the wiki link
  document.getElementById("wiki_link").href = storedBreeds[index].wikipedia_url;

  document.getElementById("wiki_link").innerHTML =
    storedBreeds[index].wikipedia_url;  

// This will get the characteristics of the cat
  document.getElementById("breed_json").textContent =
    storedBreeds[index].temperament;
}


// a function to retrieve data from the API
fetch(url, {
  headers: {
    "x-api-key": api_key,
  },
})
  .then((response) => {
    return response.json();
  })
  .then((data) => {
    // Storing the retrieved data from the API in our variable
    storedBreeds = data;


    // Using the random function to select a specific breed. Then extracting information from that breed
    showCatImageAndInformation(getRandomInt(0, storedBreeds.length - 1));
  })
  .catch(function (error) {
    console.log(error);
  });
//  displayUpdate
//      nice utility method to show message to user
function displayUpdate(text, color='green') {
    $('#updates').prepend($(`<li style="background-color:${color}">${text}</li>`));
}

