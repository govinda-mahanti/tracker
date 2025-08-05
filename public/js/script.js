const socket = io();

let map;
let myMarker;
const otherMarkers = {};

// Initialize map only once
function initMap(lat, lng) {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat, lng },
    zoom: 16,
  });

  myMarker = new google.maps.Marker({
    position: { lat, lng },
    map: map,
    title: "You",
    icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
  });
}

// Watch your own location

if (navigator.geolocation) {
  navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude } = position.coords;

      // Send to server
      socket.emit("send-location", { latitude, longitude });

      // First-time map setup
      if (!map) {
        initMap(latitude, longitude);
      }

      // Update your marker and map center
      myMarker.setPosition({ lat: latitude, lng: longitude });
      map.setCenter({ lat: latitude, lng: longitude });
    },
    (err) => {
      console.error("Geolocation error:", err);
    },
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    }
  );
}

// Receive other users' locations
socket.on("receive-location", ({ id, latitude, longitude }) => {
  const position = { lat: latitude, lng: longitude };

  if (otherMarkers[id]) {
    otherMarkers[id].setPosition(position);
  } else {
    otherMarkers[id] = new google.maps.Marker({
      position,
      map,
      icon: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
      title: `User ${id}`
    });
  }
});

// Remove marker if user disconnects
socket.on("user-disconnected", (id) => {
  if (otherMarkers[id]) {
    otherMarkers[id].setMap(null);
    delete otherMarkers[id];
  }
});
