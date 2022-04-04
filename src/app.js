let elements = {
    navigator: null,
    mapDiv: null,
    map: null,
    locateBtn: null,
    listenBtn: null,
    listenIntervalBtn: null,
    stopBtn: null,
    locationName: null,
    marker: null,
    circle: null,
  
    listenTimerID: null,
    shouldListen: false,
    lat: null,
    lon: null
  };
  

  const saveState = async () => {
    console.log('saving state:', state);
  
    try {
      await database.states.add({ ...state, date: new Date().getTime() })
    } catch (e) {
      return console.log('error', e);
    }
    
    console.log('success');
  }

  const loadState = async () => {
    console.log('loading state');
  
    try {
      const newState = (await database.states.orderBy("date").reverse().toArray())[0];
      console.log(newState);
      if (newState && Object.keys(newState).length !== 0) {
        state = { ...newState };
        delete state.date;
        delete state.id;
    
        // set the values of the controls on the page to match state
        elements.text.value = state.text;
        elements.range.value = state.range;
        elements.switch.checked = state.switch;
        elements.radio1.checked = state.radio === 'red';
        elements.radio2.checked = state.radio === 'blue';
      }
      console.log('success');
    } catch (e) {
      console.log('error loading state', e);
    }
  }
  const onLocateSuccess = (position) => {
    // const coords = position.coords;
    const { coords } = position;
  
    console.log(coords.latitude, coords.longitude);
    const leafletCoords = { lon: coords.longitude, lat: coords.latitude };
    elements.map.setView(leafletCoords, 12);
  
    if (elements.marker) elements.map.removeLayer(elements.marker);
    if (elements.circle) elements.map.removeLayer(elements.circle);
  
    elements.marker = L.marker(leafletCoords)
    //   .addTo(elements.map)
    //   .bindPopup(`You are within ${Number(coords.accuracy).toFixed(1)} meters from this point @ ${new Date(position.timestamp).toLocaleString()}`)
    //   .openPopup();
    // elements.circle = L.circle(leafletCoords, coords.accuracy).addTo(elements.map);
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
    var popup = L.popup();

    function onMapClick(e) {
    popup
        .setLatLng(e.latlng)
        .setContent("You clicked the map at " + e.latlng.toString())
        .openOn(map);
        elements.marker.bindPopup(elements.locationName).openPopup(); 
        
    }

    map.on('click', onMapClick);
  
    return map;
  };
  
  const setUpPage = (evt) => {
    console.log('start init', evt.target.id);
    database = new Dexie("MyDatabase");
    database.version(1).stores({ states: "++id, date" });

    if (evt.target.id === 'home') {
      elements = {
        navigator: document.querySelector('#navigator'),
        
        locationName: document.getElementById('username').value,
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