pos = {
  lat: 37.7749,
  lng: -122.4194
};


function initAutocomplete() {
  var map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 37.7749, lng: -122.4194},
    zoom: 13,
    mapTypeId: 'hybrid'
  });

  //var directionsService = new google.maps.DirectionsService;


  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      var infoWindow = new google.maps.InfoWindow({map: map});

      infoWindow.setPosition(pos);
      infoWindow.setContent('You are here');
      map.setCenter(pos);
    }, function() {
      handleLocationError(true, infoWindow, map.getCenter());
    });
  } else {
    handleLocationError(false, infoWindow, map.getCenter());
  }

  function handleLocationError(browserHasGeolocation, infoWindow, pos) {
  infoWindow.setPosition(pos);
  infoWindow.setContent(browserHasGeolocation ?
                        'Error: The Geolocation service failed.' :
                        'Error: Your browser doesn\'t support geolocation.');
  }

  // Create the search box and link it to the UI element.
  var input = document.getElementById('pac-input');
  var searchBox = new google.maps.places.SearchBox(input);
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

  // Bias the SearchBox results towards current map's viewport.
  map.addListener('bounds_changed', function() {
    searchBox.setBounds(map.getBounds());
  });

  var markers = [];
  // Listen for the event fired when the user selects a prediction and retrieve
  // more details for that place.
  searchBox.addListener('places_changed', function() {
    var places = searchBox.getPlaces();

    if (places.length == 0) {
      return;
    }



    /*for (i = 0; i < places.length; i++) {
      alert(places[i].opening_hours.open_now);
    }*/
    loadResults(places.length, places);


    // Clear out the old markers.
    markers.forEach(function(marker) {
      marker.setMap(null);
    });
    markers = [];

    // For each place, get the icon, name and location.
    var bounds = new google.maps.LatLngBounds();
    places.forEach(function(place) {
      if (!place.geometry) {
        console.log("Returned place contains no geometry");
        return;
      }
      var icon = {
        url: place.icon,
        size: new google.maps.Size(71, 71),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(17, 34),
        scaledSize: new google.maps.Size(25, 25)
      };

      // Create a marker for each place.
      markers.push(new google.maps.Marker({
        map: map,
        icon: icon,
        title: place.name,
        position: place.geometry.location
      }));

      if (place.geometry.viewport) {
        // Only geocodes have viewport.
        bounds.union(place.geometry.viewport);
      } else {
        bounds.extend(place.geometry.location);
      }
    });
    map.fitBounds(bounds);
  });
}

function loadResults(numResults, placeResults) {
  date = new Date();
  hours = date.getHours();
  minutes = date.getMinutes();
  day = date.getDay();
  currentTime = hours*100+minutes;
  console.log(currentTime);

  document.getElementById("results").innerHTML = "<h1>Optimized Place Search</h1> <h3>Find places you can get to when they're open</h3>";
  console.log(numResults);
  for (i = 0; i < numResults; i++) {
    var p1 = document.createElement("h3");
    p1.setAttribute("id", String(i));
    var p2 = document.createElement("p");
    p2.setAttribute("id", "description_"+String(i));
    var resultDiv = document.createElement("div");
    resultDiv.setAttribute("id", "div_"+String(i));
    resultDiv.setAttribute("class", "resultDiv");

    var openNowStatus = document.createElement("p");
    openNowStatus.setAttribute("id", "openNow_"+String(i));

    var travelTimeData = document.createElement("p");
    travelTimeData.setAttribute("id", "travelTime_"+String(i));

    var etaTime = document.createElement("p");
    etaTime.setAttribute("id", "eta_"+String(i));

    console.log(placeResults[i].place_id);
    try{
      openHours = placeResults[i].opening_hours.periods[day].open.time;
    }
    catch(e){
      openHours='No work time';
    }

    try{
      closeHours = placeResults[i].opening_hours.periods[day].close.time;
    }
    catch(e){
      closeHours='No work time';
    }
    flag = true;
    if ((openHours=="No work time")&&(closeHours=="No work time")) {
      flag = false;
    } else {
      openHoursFormatted = openHours.substring(0, 2) + ":" + openHours.substring(2, 4);
      closeHoursFormatted = closeHours.substring(0, 2) + ":" + closeHours.substring(2, 4);
      var businessHours = document.createElement("p");
      businessHours.setAttribute("id", "busHours_"+String(i));
    }

    if (closeHours < openHours) {
      closeHours = parseInt(closeHours) + 2400;
    }

    console.log(openHours + " " + closeHours);

    try{
      open = placeResults[i].opening_hours.open_now ? "Open Now" : "Closed";
    }
    catch(e){
      open='No opening status available';
    }

    console.log(open);


    mapsTravelTime=getJSON("http://www.mapquestapi.com/directions/v2/route?key=0HG8b7rdqIkwZdFNGenpycewpmvze9KB&from=" + pos.lat + "," + pos.lng + "&to=" + placeResults[i].geometry.location.lat() + "," + placeResults[i].geometry.location.lng() + "&callback=renderNarrative");

    travelTimeBeg = mapsTravelTime.indexOf("formattedTime") + 16;
    travelTimeSub = mapsTravelTime.substring(travelTimeBeg);

    travelTimeString = travelTimeSub.substring(0, 5);

    travelTimeHours = travelTimeString.substring(0, 2);

    travelTimeMinutes = travelTimeString.substring(3);

    travelTimeSingle = parseInt(travelTimeHours)*100+parseInt(travelTimeMinutes);
    console.log(travelTimeSingle);

    if (travelTimeHours.substring(0, 1)=="0") {
      travelTimeHours = travelTimeHours.substring(1);
    }

    if (travelTimeMinutes.substring(0, 1)=="0") {
      travelTimeMinutes = travelTimeMinutes.substring(1);
    }

    projectedTime = travelTimeSingle + currentTime;
    if (projectedTime > 2400) {
      projectedTime = projectedTime - 2400;
    }
    if (flag) {
      if ((projectedTime >= openHours) && (projectedTime <= closeHours)) {
        console.log(projectedTime + " YOU CAN GO");
        willMakeIt = "You will arrive during business hours";
      } else {
        console.log(projectedTime + " YOU WILL NOT BE ABLE TO GO");
        willMakeIt = "You will NOT arrive during business hours";
      }
    } else {
      willMakeIt = "No business hours data available";
    }


    console.log("http://www.mapquestapi.com/directions/v2/route?key=0HG8b7rdqIkwZdFNGenpycewpmvze9KB&from=" + pos.lat + "," + pos.lng + "&to=" + placeResults[i].geometry.location.lat() + "," + placeResults[i].geometry.location.lng() + "&callback=renderNarrative");

    console.log(travelTimeHours + " " + travelTimeMinutes);

    etaMinutes = String(projectedTime%100);
    if (etaMinutes.length == 1) {
      etaMinutes = "0" + String(projectedTime%100);
    }

    eta = String(projectedTime/100-((projectedTime%100)/100)) + ":" + etaMinutes;
    console.log(eta);

    var willMakeItData = document.createElement("p");
    willMakeItData.setAttribute("id", "willMakeIt_"+String(i));
    if (willMakeIt == "You will arrive during business hours") {
      willMakeItData.setAttribute("style", "color: green;");
    } else if (willMakeIt == "You will NOT arrive during business hours"){
      willMakeItData.setAttribute("style", "color: red;");
    }

    document.getElementById("results").appendChild(resultDiv);
    document.getElementById("div_"+String(i)).appendChild(p1);
    document.getElementById("div_"+String(i)).appendChild(p2);
    document.getElementById("div_"+String(i)).appendChild(openNowStatus);
    document.getElementById("div_"+String(i)).appendChild(travelTimeData);
    document.getElementById("div_"+String(i)).appendChild(etaTime);
    document.getElementById("div_"+String(i)).appendChild(willMakeItData);
    document.getElementById("div_"+String(i)).appendChild(document.createElement("p"));


    document.getElementById(String(i)).innerHTML = placeResults[i].name;
    document.getElementById("description_"+String(i)).innerHTML = placeResults[i].formatted_address;
    document.getElementById("openNow_"+String(i)).innerHTML = open;
    document.getElementById("travelTime_"+String(i)).innerHTML = travelTimeHours + " hr " + travelTimeMinutes + " min";
    document.getElementById("eta_"+String(i)).innerHTML = "Estimated Time of Arrival: " + eta;
    document.getElementById("willMakeIt_"+String(i)).innerHTML = willMakeIt;

    if (flag) {
      document.getElementById("div_"+String(i)).appendChild(businessHours);
      document.getElementById("busHours_"+String(i)).innerHTML = "Hours: " + openHoursFormatted + " to " + closeHoursFormatted;
    }
  }

}

function getJSON(url) {
    var response;
    var xmlHttp;

    response  = "";
    xmlHTTP = new XMLHttpRequest();

    if(xmlHTTP !== null)
    {
        xmlHTTP.open( "GET", url, false );
        xmlHTTP.send( null );
        response = xmlHTTP.responseText;
    }

    return response;
}