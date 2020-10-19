//MAP

const init = () => {
  const myMap = new ymaps.Map('ymaps', {
    center: [59.93812053, 30.31412708],
    zoom: 14,
    controls: ['zoomControl'],
  });
  const myClusterer = createClusterer(myMap);
  const reviewsForm = document.querySelector('#reviews__form');

  reviewsForm.map = myMap;
  reviewsForm.clusterer = myClusterer;
  reviewsForm.addEventListener('submit', save);

  myMap.events.add('click', async function (e) {
      const coords = e.get('coords');
      async function geocoder(coords) {
          var response = await ymaps.geocode(coords);
          return response.geoObjects.get(0).getAddressLine();
      }

      var address = await geocoder(coords);
      reviewsForm.point = coords;
      showEmptyForm(coords, address);
  });

  let markers = loadFromStorage();
  if (markers) {
      markers.forEach((marker) => {
          addMarker(myMap, myClusterer, marker);
      });
  }

  document.querySelector('#reviews__close').addEventListener('click', hideForm);
};

ymaps.ready(init);

//REVIEWS

const reviews = document.querySelector('#reviews');
const reviewsForm = document.querySelector('#reviews__form');
const title = reviews.querySelector('#reviews__header');
const reviewsContent = document.querySelector('#reviews__content');

function addMarker(map, clusterer, reviewData) {
  const marker = new ymaps.Placemark(reviewData.point, {
      openBalloonOnClick: false,
      balloonContentPlace: reviewData.place,
      balloonContentComment: reviewData.comment,
      balloonContentName: reviewData.name,
      balloonContentPoint: reviewData.point.toString(),
      balloonContentAddress: reviewData.address,
  });

  map.geoObjects.add(marker);

  clusterer.add(marker);

  marker.events.add('click', (e) => {
      e.preventDefault();
      showFilledForm(reviewData.point);
  });
}

function clearForm() {
  title.childNodes[0].textContent = '-';
  reviewsContent.innerText = '';
  document.querySelector('#reviews__form input[name="name"]').value = '';
  document.querySelector('#reviews__form input[name="place"]').value = '';
  document.querySelector('#reviews__form textarea').value = '';
}

function showEmptyForm(point, address = '') {
  clearForm();
  title.childNodes[0].textContent = address;
  reviews.classList.remove('hidden');
  reviewsForm.point = point;
}

function showFilledForm(point) {
  clearForm();
  let markers = loadFromStorage();
  let ul = document.createElement('ul');
  reviewsContent.appendChild(ul);

  markers.forEach((marker) => {
    if (JSON.stringify(marker.point) === JSON.stringify(point)) {
      let name = marker.name;
      let place = marker.place;
      let comment = marker.comment;
      let li = document.createElement('li');
        li.innerHTML = `
        <li> 
          <p> 
            <span class="name">${name}</span>
            <span class="place">${place}</span> 
          </p>
          <p class="comment"> 
            ${comment}
          </p> 
        </li>
        `;
        title.childNodes[0].textContent = marker.address;
        ul.appendChild(li);
      }
  });

  
  reviews.classList.remove('hidden');
  reviewsForm.point = point;
}

function hideForm() {
    reviews.classList.add('hidden');
}

function createClusterer(map) {
  const customItemContentLayout = ymaps.templateLayoutFactory.createClass(
    '<div class="balloon">' +
      '<h2 class=ballon__header>{{ properties.balloonContentPlace|raw }}</h2>' +
      '<div class=ballon__body>{{ properties.balloonContentName|raw }}</div>' +
      '<div class=ballon__body>{{ properties.balloonContentComment|raw }}</div>' 
  );

  const clusterer = new ymaps.Clusterer({
    clusterDisableClickZoom: true,
    clusterOpenBalloonOnClick: true,
    clusterBalloonContentLayout: 'cluster#balloonCarousel',
    clusterBalloonItemContentLayout: customItemContentLayout,
    clusterBalloonPanelMaxMapArea: 0,
    clusterBalloonContentLayoutWidth: 200,
    clusterBalloonContentLayoutHeight: 130,
    clusterBalloonPagerSize: 5
  });

  map.geoObjects.add(clusterer);

  clusterer.events.add('balloonopen', hideForm);

  const onClick = (e) => {
      if (e.target.id && e.target.id === 'balloon-link') {
          e.preventDefault();
          map.balloon.close();
          let pointData = e.target.dataset.point.split(',');
          let point = pointData.map(Number);
          showFilledForm(point);
      }
  };

  document.addEventListener('click', onClick);

  return clusterer;
}

function save(e) {
  e.preventDefault();

  let reviewData = {
      point: this.point,
      name: document.querySelector('#reviews__form input[name="name"]').value.trim(),
      place: document.querySelector('#reviews__form input[name="place"]').value.trim(),
      comment: document.querySelector('#reviews__form textarea[name="comment"]').value.trim(),
      address: document.querySelector('#reviews__header').childNodes[0].textContent.trim(),
  };

  addMarker(this.map, this.clusterer, reviewData);
  addToStorage(reviewData);
  showFilledForm(this.point);
}

//LOCAL STORAGE

function addToStorage(newData) {
  let markers = [];
  if (localStorage.getItem('markers')) {
      markers = JSON.parse(localStorage.getItem('markers'));
  }
  markers.push(newData);
  localStorage.setItem('markers', JSON.stringify(markers));
}

function loadFromStorage() {
  if (localStorage.getItem('markers')) {
      return JSON.parse(localStorage.getItem('markers'));
  }
}