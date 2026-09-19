let resources = [];

let trackingTimer = null;

let currentRequest = null;


/* ==========================================
   LOAD RESQLink SERVICES
========================================== */

fetch("resources.json")
    .then(response => response.json())
    .then(data => {

        resources = data;

    })
    .catch(error => {

        console.error(
            "Unable to load resources.json:",
            error
        );

    });


/* ==========================================
   DEMO LOCATION DATABASE
========================================== */

const locations = {

    "ongole": {
        lat: 15.5057,
        lng: 80.0499
    },

    "guntur": {
        lat: 16.3067,
        lng: 80.4365
    },

    "vijayawada": {
        lat: 16.5062,
        lng: 80.6480
    },

    "hyderabad": {
        lat: 17.3850,
        lng: 78.4867
    },

    "nellore": {
        lat: 14.4426,
        lng: 79.9865
    },

    "tirupati": {
        lat: 13.6288,
        lng: 79.4192
    }

};


/* ==========================================
   GET COORDINATES
========================================== */

function getCoordinates() {

    const locationInput =
        document
            .getElementById("location")
            .value
            .trim()
            .toLowerCase();


    if (!locationInput) {

        alert(
            "Please enter your location."
        );

        return;

    }


    const coordinates =
        locations[locationInput];


    if (!coordinates) {

        alert(
            "For this prototype, enter one of: Ongole, Guntur, Vijayawada, Hyderabad, Nellore or Tirupati."
        );

        return;

    }


    document
        .getElementById("latitude")
        .value =
        coordinates.lat.toFixed(6);


    document
        .getElementById("longitude")
        .value =
        coordinates.lng.toFixed(6);


    alert(
        "📍 ResQLink coordinates obtained successfully!"
    );

}


/* ==========================================
   FIND EMERGENCY SERVICE
========================================== */

function findService(type) {

    let service =
        resources.find(
            item =>
                item.type === type
        );


    if (!service) {

        service =
            resources[0];

    }


    return service;

}


/* ==========================================
   PRIORITY
========================================== */

function calculatePriority(type) {

    if (
        type === "Medical" ||
        type === "Accident" ||
        type === "Fire" ||
        type === "Rescue"
    ) {

        return "High";

    }


    return "Medium";

}


/* ==========================================
   HAVERSINE DISTANCE
========================================== */

function calculateDistance(
    lat1,
    lng1,
    lat2,
    lng2
) {

    const earthRadius = 6371;


    const dLat =
        (lat2 - lat1)
        *
        Math.PI / 180;


    const dLng =
        (lng2 - lng1)
        *
        Math.PI / 180;


    const a =
        Math.sin(dLat / 2)
        *
        Math.sin(dLat / 2)

        +

        Math.cos(
            lat1 * Math.PI / 180
        )

        *

        Math.cos(
            lat2 * Math.PI / 180
        )

        *

        Math.sin(dLng / 2)
        *
        Math.sin(dLng / 2);


    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );


    return earthRadius * c;

}


/* ==========================================
   SUBMIT EMERGENCY
========================================== */

function submitEmergency() {

    const emergencyType =
        document
            .getElementById(
                "emergencyType"
            )
            .value;


    const location =
        document
            .getElementById(
                "location"
            )
            .value
            .trim();


    const latitude =
        parseFloat(
            document
                .getElementById(
                    "latitude"
                )
                .value
        );


    const longitude =
        parseFloat(
            document
                .getElementById(
                    "longitude"
                )
                .value
        );


    if (!emergencyType) {

        alert(
            "Please select an emergency type."
        );

        return;

    }


    if (!location) {

        alert(
            "Please enter your location."
        );

        return;

    }


    if (
        Number.isNaN(latitude) ||
        Number.isNaN(longitude)
    ) {

        alert(
            "Please click 'Get My Coordinates' first."
        );

        return;

    }


    if (!resources.length) {

        alert(
            "Emergency resources are still loading. Please try again."
        );

        return;

    }


    const service =
        findService(
            emergencyType
        );


    const priority =
        calculatePriority(
            emergencyType
        );


    currentRequest = {

        emergencyType,

        location,

        userLatitude:
            latitude,

        userLongitude:
            longitude,

        serviceName:
            service.name,

        serviceStartLatitude:
            service.latitude,

        serviceStartLongitude:
            service.longitude,

        currentLatitude:
            service.latitude,

        currentLongitude:
            service.longitude,

        priority

    };


    /* ======================================
       SHOW REQUEST ACCEPTED
    ====================================== */

    document
        .getElementById(
            "acceptedSection"
        )
        .classList
        .remove("hidden");


    document
        .getElementById(
            "selectedEmergency"
        )
        .textContent =
        emergencyType;


    document
        .getElementById(
            "serviceName"
        )
        .textContent =
        service.name;


    document
        .getElementById(
            "priority"
        )
        .textContent =
        priority;


    document
        .getElementById(
            "userLat"
        )
        .textContent =
        latitude.toFixed(6);


    document
        .getElementById(
            "userLng"
        )
        .textContent =
        longitude.toFixed(6);


    document
        .getElementById(
            "trackingService"
        )
        .textContent =
        service.name;


    document
        .getElementById(
            "arrivedMessage"
        )
        .classList
        .add("hidden");


    document
        .getElementById(
            "trackingStatus"
        )
        .textContent =
        "● LIVE";


    /* RESET PROGRESS */

    document
        .getElementById(
            "routeProgress"
        )
        .style.width =
        "0%";


    /* STOP PREVIOUS TRACKING */

    if (trackingTimer) {

        clearInterval(
            trackingTimer
        );

    }


    /* START TRACKING */

    startLiveTracking();


    /* SCROLL */

    document
        .getElementById(
            "acceptedSection"
        )
        .scrollIntoView({
            behavior: "smooth"
        });

}


/* ==========================================
   START LIVE TRACKING
========================================== */

function startLiveTracking() {

    updateTracking();


    trackingTimer =
        setInterval(
            () => {

                moveService();

                updateTracking();

            },
            1000
        );

}


/* ==========================================
   MOVE EMERGENCY SERVICE
========================================== */

function moveService() {

    const request =
        currentRequest;


    const targetLat =
        request.userLatitude;


    const targetLng =
        request.userLongitude;


    const currentLat =
        request.currentLatitude;


    const currentLng =
        request.currentLongitude;


    const remainingDistance =
        calculateDistance(

            currentLat,

            currentLng,

            targetLat,

            targetLng

        );


    /* ARRIVED */

    if (
        remainingDistance < 0.05
    ) {

        request.currentLatitude =
            targetLat;


        request.currentLongitude =
            targetLng;


        clearInterval(
            trackingTimer
        );


        updateTracking();


        document
            .getElementById(
                "trackingStatus"
            )
            .textContent =
            "● ARRIVED";


        document
            .getElementById(
                "arrivedMessage"
            )
            .classList
            .remove("hidden");


        return;

    }


    /*
       Simulated live movement.
       The service moves 8% closer
       to the destination every second.
    */

    const movementFactor =
        0.08;


    request.currentLatitude +=
        (
            targetLat -
            currentLat
        )
        *
        movementFactor;


    request.currentLongitude +=
        (
            targetLng -
            currentLng
        )
        *
        movementFactor;

}


/* ==========================================
   UPDATE TRACKING
========================================== */

function updateTracking() {

    const request =
        currentRequest;


    if (!request) {

        return;

    }


    /* SERVICE COORDINATES */

    document
        .getElementById(
            "currentServiceLat"
        )
        .textContent =
        request.currentLatitude
            .toFixed(6);


    document
        .getElementById(
            "currentServiceLng"
        )
        .textContent =
        request.currentLongitude
            .toFixed(6);


    /* DISTANCE */

    const distance =
        calculateDistance(

            request.currentLatitude,

            request.currentLongitude,

            request.userLatitude,

            request.userLongitude

        );


    document
        .getElementById(
            "distance"
        )
        .textContent =
        distance.toFixed(2)
        + " km";


    /* ETA */

    const averageSpeed =
        40;


    const minutes =
        distance <= 0.05

            ? 0

            : Math.max(

                1,

                Math.ceil(
                    (
                        distance /
                        averageSpeed
                    )
                    *
                    60
                )

            );


    document
        .getElementById(
            "eta"
        )
        .textContent =
        minutes
        + " min";


    /* PROGRESS */

    const totalDistance =
        calculateDistance(

            request.serviceStartLatitude,

            request.serviceStartLongitude,

            request.userLatitude,

            request.userLongitude

        );


    let progress = 0;


    if (totalDistance > 0) {

        progress =
            (
                1 -
                (
                    distance /
                    totalDistance
                )
            )
            *
            100;

    }


    progress =
        Math.max(
            0,
            Math.min(
                100,
                progress
            )
        );


    document
        .getElementById(
            "routeProgress"
        )
        .style.width =
        progress + "%";

}