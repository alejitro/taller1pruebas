function firstLoad() {

  botonAddCity = document.getElementById('butAddCity');

  //botonAddCity.addEventListener('click',saveStation,false);

  var createDB =indexedDB.open('EstacionesMetro');

  createDB.onsuccess= function(e){
    bd=e.target.result;
  }
  createDB.onupgradeneeded=function(e){
    bd=e.target.result;
    bd.createObjectStore('Estacion',{keyPath: 'key'});
  }
}
(function () {
    'use strict';

    var app = {
        isLoading: true,
        visibleCards: {},
        selectedTimetables: [],
        spinner: document.querySelector('.loader'),
        cardTemplate: document.querySelector('.cardTemplate'),
        container: document.querySelector('.main'),
        addDialog: document.querySelector('.dialog-container')
    };


    /*****************************************************************************
     *
     * Event listeners for UI elements
     *
     ****************************************************************************/

    document.getElementById('butRefresh').addEventListener('click', function () {
        // Refresh all of the metro stations
        app.updateSchedules();
    });

    document.getElementById('butAdd').addEventListener('click', function () {
        // Open/show the add new station dialog
        app.toggleAddDialog(true);
    });

    document.getElementById('butAddCity').addEventListener('click', function () {


        var select = document.getElementById('selectTimetableToAdd');
        var selected = select.options[select.selectedIndex];
        var key = selected.value;
        var label = selected.textContent;
        if (!app.selectedTimetables) {
            app.selectedTimetables = [];
        }
        app.getSchedule(key, label);
        app.selectedTimetables.push({key: key, label: label});
        app.saveLocationList(app.selectedTimetables);
        app.toggleAddDialog(false);

    });

    document.getElementById('butAddCancel').addEventListener('click', function () {
        // Close the add new station dialog
        app.toggleAddDialog(false);
    });


    /*****************************************************************************
     *
     * Methods to update/refresh the UI
     *
     ****************************************************************************/
    app.loadStations = function () {
        /*cargar.forEach(function (key) {
          app.getSchedule(key);
        })*/
        console.log("Entra a loadStations");
        var transaccion = bd.transaction(['Estacion'],'readonly');
        var almacen= transaccion.objectStore('Estacion');
        var cursor = almacen.openCursor();
        cursor.addEventListener('success',app.leerDatos,false);
     };

     app.leerDatos= function (e) {
        var dataLastUpdated = new Date(e.created);
        var cursor = e.target.result;
        /*console.log("Valor de Cursor",cursor);
        if(cursor){
        }*/
     };

    // Toggles the visibility of the add new station dialog.
    app.toggleAddDialog = function (visible) {
        if (visible) {
            app.addDialog.classList.add('dialog-container--visible');
        } else {
            app.addDialog.classList.remove('dialog-container--visible');
        }
    };
    //save location list
    app.saveLocationList= function (locations) {
      const data = JSON.stringify(locations);
      localStorage.setItem('locationList', data);
    }

    //load location list
    app.loadLocationList= function() {
      let locations = localStorage.getItem('locationList');
      if (locations) {
        try {
          locations = JSON.parse(locations);
        } catch (ex) {
          locations = {};
        }
      }
      if (!locations || Object.keys(locations).length === 0) {
        const key = initialStationTimetable.key;
        locations = {};
        locations[0] = {key: key, label: initialStationTimetable.label, created:initialStationTimetable.created, schedules: initialStationTimetable.sche};
      }
      console.log("Estaciones: ", locations);
      /*Object.keys(locations).value.forEach(function (data) {
        console.log("Key Estacion a mostrar: ",data.key);
        console.log("Label Estacion a mostrar: ",locations.label );
        //app.getSchedule(locations.key, locations.label);
      })*/
      var i;
      for(i=0;i<Object.keys(locations).length;i++){
        app.getSchedule(locations[i].key, locations[i].label);
      }
      //app.getSchedule(locations.key, locations.label);
      return locations;
    }
    // Updates a timestation card with the latest weather forecast. If the card
    // doesn't already exist, it's cloned from the template.

    app.updateTimetableCard = function (data) {
        var key = data.key;
        var dataLastUpdated = new Date(data.created);
        var schedules = data.schedules;
        var card = app.visibleCards[key];

        if (!card) {
            var label = data.label.split(', ');
            var title = label[0];
            var subtitle = label[1];
            card = app.cardTemplate.cloneNode(true);
            card.classList.remove('cardTemplate');
            card.querySelector('.label').textContent = title;
            card.querySelector('.subtitle').textContent = subtitle;
            card.removeAttribute('hidden');
            app.container.appendChild(card);
            app.visibleCards[key] = card;
        }
        card.querySelector('.card-last-updated').textContent = data.created;

        var scheduleUIs = card.querySelectorAll('.schedule');
        for(var i = 0; i<4; i++) {
            var schedule = schedules[i];
            var scheduleUI = scheduleUIs[i];
            if(schedule && scheduleUI) {
                scheduleUI.querySelector('.message').textContent = schedule.message;
            }
        }

        if (app.isLoading) {
            window.cardLoadTime = performance.now();
            app.spinner.setAttribute('hidden', true);
            app.container.removeAttribute('hidden');
            app.isLoading = false;
        }
    };

    /*****************************************************************************
     *
     * Methods for dealing with the model
     *
     ****************************************************************************/


    app.getSchedule = function (key, label) {
        var url = 'https://api-ratp.pierre-grimaud.fr/v3/schedules/' + key;
        console.log("la url es: ",url);
        var request = new XMLHttpRequest();
        request.onreadystatechange = function () {
            if (request.readyState === XMLHttpRequest.DONE) {
                if (request.status === 200) {
                    window.firstLoadRequest = performance.now();
                    var response = JSON.parse(request.response);
                    var result = {};
                    result.key = key;
                    result.label = label;
                    result.created = response._metadata.date;
                    result.schedules = response.result.schedules;
                    app.updateTimetableCard(result);
                    var save= bd.transaction(['Estacion'],'readwrite');
                    var tabla = save.objectStore('Estacion');
                    var addCity = tabla.add({key: key, label: label, schedules: result.schedules});
                    addCity.addEventListener('success',app.loadStations,false);
                  }
            } else {
                // Return the initial weather forecast since no data is available.
              app.updateTimetableCard(initialStationTimetable);
            }
        };
        request.open('GET', url);
        request.send();
    };

    // Iterate all of the cards and attempt to get the latest timetable data
    app.updateSchedules = function () {
        var keys = Object.keys(app.visibleCards);
        keys.forEach(function (key) {
            console.log("Llave schedules",key);
            app.getSchedule(key);
        });
    };

    /*
     * Fake timetable data that is presented when the user first uses the app,
     * or when the user has not saved any stations. See startup code for more
     * discussion.
     */

    var initialStationTimetable = {

        key: 'metros/1/bastille/A',
        label: 'Bastille, Direction La Défense',
        created: '2017-07-18T17:08:42+02:00',
        schedules: [
            {
                message: '0 mn'
            },
            {
                message: '2 mn'
            },
            {
                message: '5 mn'
            }
        ]


    };


    /************************************************************************
     *
     * Code required to start the app
     *
     * NOTE: To simplify this codelab, we've used localStorage.
     *   localStorage is a synchronous API and has serious performance
     *   implications. It should not be used in production applications!
     *   Instead, check out IDB (https://www.npmjs.com/package/idb) or
     *   SimpleDB (https://gist.github.com/inexorabletash/c8069c042b734519680c)
     ************************************************************************/
    var cargar = app.loadLocationList();
    //cargar.addEventListener('success', app.loadStations, false)

    app.getSchedule('metros/1/bastille/A', 'Bastille, Direction La Défense');
    app.selectedTimetables = [
        {key: initialStationTimetable.key, label: initialStationTimetable.label}
    ];
})();

window.addEventListener('load',firstLoad,false);
