let elements = {
    navigator: null,
    mapDiv: null,
    map: null,
    locateBtn: null,
    listenBtn: null,
    listenIntervalBtn: null,
    stopBtn: null,
  
    marker: null,
    circle: null,
  
    listenTimerID: null,
    shouldListen: false,
  };
  
  const onLocateSuccess = (position) => {
    // const coords = position.coords;
    const { coords } = position;
  
    console.log(coords.latitude, coords.longitude);
    const leafletCoords = { lon: coords.longitude, lat: coords.latitude };
    elements.map.setView(leafletCoords, 12);
  
    if (elements.marker) elements.map.removeLayer(elements.marker);
    if (elements.circle) elements.map.removeLayer(elements.circle);
  
    elements.marker = L.marker(leafletCoords)
      .addTo(elements.map)
      .bindPopup(`You are within ${Number(coords.accuracy).toFixed(1)} meters from this point @ ${new Date(position.timestamp).toLocaleString()}`)
      .openPopup();
    elements.circle = L.circle(leafletCoords, coords.accuracy).addTo(elements.map);
  };
  
  const errors = {
    1: '[PERMISSION_DENIED] Permission was denied to access location services.',
    2: '[POSITION_UNAVAILABLE] The GPS was not able to determine a location',
    3: '[TIMEOUT] The GPS failed to determine a location within the timeout duration',
  };
  
  const onLocateFailure = (error) => {
    console.error('Could not access location services!');
    console.error('errors[error.code]', errors[error.code]);
    console.error('error.message', error.message);
  };
  
  const locate = () => {
    if (!navigator.geolocation) {
      console.log('Geolocation is not supported by your browser!');
    } else {
      navigator.geolocation.getCurrentPosition(onLocateSuccess, onLocateFailure);
    }
  };
  
  const listen = () => {
    if (!navigator.geolocation) {
      console.log('Geolocation is not supported by your browser!');
    } else {
      elements.shouldListen = true;
      elements.listenTimerID = navigator.geolocation.watchPosition(onLocateSuccess, onLocateFailure);
    }
  };
  
  const listenInterval = () => {
    if (!navigator.geolocation) {
      console.log('Geolocation is not supported by your browser');
    } else {
      elements.shouldListen = true;
      elements.listenTimerID = setInterval(locate, 750);
    }
  };
  
  const stopListening = (keepListening) => {
    if (!navigator.geolocation) {
      console.log('Geolocation is not supported by your browser!');
    } else if (elements.listenTimerID) {
      navigator.geolocation.clearWatch(elements.listenTimerID);
      clearInterval(elements.listenTimerID);
      elements.listenTimerID = null;
      elements.shouldListen = keepListening;
    }
  };
  
  const initMap = () => {
    const map = L.map('map').setView({ lon: 0, lat: 0 }, 2);
  
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>',
    }).addTo(map);
  
    L.control.scale({ imperial: false, metric: true }).addTo(map);
  
    L.marker({ lon: 0, lat: 0 }).bindPopup('The center of the world').addTo(map);
  
    return map;
  };
  
  const setUpPage = (evt) => {
    console.log('start init', evt.target.id);
    if (evt.target.id === 'home') {
      elements = {
        navigator: document.querySelector('#navigator'),
        mapDiv: document.querySelector('#map'),
        map: initMap(),
        locateBtn: document.querySelector('#locateBtn'),
        listenBtn: document.querySelector('#listenBtn'),
        listenIntervalBtn: document.querySelector('#listenIntervalBtn'),
        stopBtn: document.querySelector('#stopBtn'),
      };
  
      elements.locateBtn.addEventListener('click', locate);
      elements.listenBtn.addEventListener('click', listen);
      elements.listenIntervalBtn.addEventListener('click', listenInterval);
      elements.stopBtn.addEventListener('click', () => stopListening(false));
    }
  };
  
  const handleVisibilityChange = () => {
    if (document.hidden) {
      if (elements.listenTimerID) stopListening(elements.shouldListen);
    } else {
      if (!elements.listenTimerID && elements.shouldListen) listenInterval();
    }
  }
  
  document.addEventListener('init', setUpPage);
  document.addEventListener('visibilitychange', handleVisibilityChange);