"use strict";
let asemaData = [];
// https://rata.digitraffic.fi/api/v1/live-trains?arrived_trains=0&arriving_trains=100&departed_trains=0&departing_trains=100&station=TPE
window.onload = function(e){
    haeAsemaData();
    //console.log(asemaData);
    haeData(asemaData);
    
}

function haeData(asemat){
   fetch('https://rata.digitraffic.fi/api/v1/live-trains?arrived_trains=0&arriving_trains=100&departed_trains=0&departing_trains=0&station=TPE')
  .then((res) => res.json())
  .then((data) => {
      console.log(data);
      console.log(asemat);
      data.forEach(function(juna){
        // Poistetaan tavarajunat
        if (juna.trainCategory != "cargo"){
            data.pop(juna);
        }
        for (let i in juna.timeTableRows){
            // haetaan lähtö ja pääteasema
            juna.lahtoA = juna.timeTableRows[0].stationShortCode;
            juna.paateA = juna.timeTableRows[i].stationShortCode;
            
            //juna.paateA = juna.timeTableRows[juna.timeTableRows.length].stationShortCode;
            // haetaan aikataulunmukainen ja arvio saapumisesta
            if ("TPE" === juna.timeTableRows[i].stationShortCode && juna.timeTableRows[i].type == "ARRIVAL"){
                try{
                    juna.saapArvio = juna.timeTableRows[i].liveEstimateTime;
                    
                } catch{    }
                juna.saapAikaTaulu = new Date(juna.timeTableRows[i].scheduledTime);
            }
        }
        for (let i in asemaData){
            // haetaan aseman nimi asemakoodin mukaan
            if (juna.lahtoA == asemaData[i].stationShortCode){
                juna.lahtoANimi = asemaData[i].stationName;
            }
            if (juna.paateA == asemaData[i].stationShortCode){
                juna.paateANimi = asemaData[i].stationName;
            }
        }
        
    });
    jarjestaSaapujat(data);

    

    //TÄMÄ SETTI OMAAN FUNKTIOON
    //teeTable(data);

    let output = `<table class="table table-striped table-hover">
    <thead>
      <th class="text-muted">Juna</th>
      <th class="text-muted">Lähtöasema</th> 
      <th class="text-muted">Pääteasema</th> 
      <th class="text-muted">Saapuu</th>
    </thead>
    <tbody>`;
    
    for (let i=0; i<10;i++){
        output += `
            <tr>
                <td>${data[i].trainType} ${data[i].trainNumber}</td>
                <td>${data[i].lahtoANimi}</td>
                <td>${data[i].paateANimi}</td>
                <td>${formatoiAika(data[i].saapAikaTaulu)}</td>
            </tr>
            
        `;
    };
    output +=`
    </tbody>
     </table>
    `
    document.getElementById('table').innerHTML = output;    

  })
}

// järjestetään data asspumisjärjestykseen aikataulun mukaan
function jarjestaSaapujat(data){
    data.sort(function(a, b){
            if (a.saapAikaTaulu < b.saapAikaTaulu) return -1;
            if (a.saapAikaTaulu > b.saapAikaTaulu) return 1;
            return 0;
        })
}

// Date tyyppinen muuttuja formatoidaan tunnit:minuutit muotoon
function formatoiAika(aika) {
    let tunnit = aika.getHours();
    let minuutit = aika.getMinutes();
    let tuloste = tunnit + ":"+ minuutit;
    return tuloste;
}

// Haetaan data asemista ja lisätään muuttujaan kaikki matkustaja asemat
function haeAsemaData(){
    fetch('https://rata.digitraffic.fi/api/v1/metadata/stations')
    .then((res) => res.json())
    .then((asemat) =>{
        for (let i in asemat){
            // poistetaan "asema" stationName merkkijonosta
            asemat[i].stationName = asemat[i].stationName.replace("asema", "");
          // Vain matkustaja trafiikki asemat
          if (asemat[i].passengerTraffic == true){
            asemaData.push(asemat[i]);
          }
          

        }
    })
}

function vertaaAsemat(asematData){
//Initialize with the list of symbols

//Find the input search box
let textBox = document.getElementById("textBox");

//Find every item inside the dropdown
let items = document.getElementsByClassName("dropdown-item")
function buildDropDown(values) {
    let contents = []
    for (let name of values) {
    contents.push('<input type="button" class="dropdown-item" type="button" value="' + name + '"/>')
    }
    $('#menuItems').append(contents.join(""))

    //Hide the row that shows no items were found
    $('#empty').hide()
}

//Capture the event when user types into the search box
window.addEventListener('input', function () {
    filter(search.value.trim().toLowerCase())
})

//For every word entered by the user, check if the symbol starts with that word
//If it does show the symbol, else hide it
function filter(word) {
    let length = items.length
    let collection = []
    let hidden = 0
    for (let i = 0; i < length; i++) {
    if (items[i].value.toLowerCase().startsWith(word)) {
        $(items[i]).show()
    }
    else {
        $(items[i]).hide()
        hidden++
    }
    }

    //If all items are hidden, show the empty view
    if (hidden === length) {
    $('#empty').show()
    }
    else {
    $('#empty').hide()
    }
}

//If the user clicks on any item, set the title of the button as the text of the item
$('#menuItems').on('click', '.dropdown-item', function(){
    $('#dropdown_coins').text($(this)[0].value)
    $("#dropdown_coins").dropdown('toggle');
})

buildDropDown(names)
}



