function firstLoad(){
  header=document.getElementById('pageHeader');
  botonAddCity = document.getElementById('butAddCity');

  botonAddCity.addEventListener('click',saveStation,false);

  var createDB =indexedDB.open('EstacionesMetro');

  createDB.onsuccess= function(e){
    bd=e.target.result;
  }
  createDB.onupgradeneeded=function(e){
    bd=e.target.result;
    bd.createObjectStore('Estacion',{keyPath: 'key'});
  }
}

function saveStation() {
  var select = document.getElementById('selectTimetableToAdd');
  var selected = select.options[select.selectedIndex];
  var key = selected.value;
  var label = selected.textContent;

  var save= bd.transaction(['Estacion'],'readwrite');
  var tabla = save.objectStore('Estacion');
  var addCity = tabla.add({key: key, label: label});
}

window.addEventListener('load',firstLoad,false);
