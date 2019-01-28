"use strict";
let asemaData = [];
let buttonState = "ARRIVAL";
// https://rata.digitraffic.fi/api/v1/live-trains?arrived_trains=0&arriving_trains=100&departed_trains=0&departing_trains=100&station=TPE
window.onload = function(e){ 
    haeAsemaData();
    $('.colors input[type=radio]').on('change', function() {
        console.log(this.value);
        buttonState = this.value;
        haeData(buttonState);
    });
    console.log(asemaData);
}

// Select 2 kirjaston haku ja dropdown
$(document).ready(function() {
    $('.js-example-basic-single').select2();
});


function haeData(asema, buttonState){
   fetch('https://rata.digitraffic.fi/api/v1/live-trains?arrived_trains=0&arriving_trains=100&departed_trains=0&departing_trains=0&station='+asema)
  .then((res) => res.json())
  .then((data) => {
    document.getElementById('table').innerHTML = "";

      data.forEach(function(juna, index){
        // Poistetaan tavarajunat
        
        if (juna.trainCategory == "Cargo" ||juna.trainCategory =="Locomotive" ){//|| juna.trainType == "VET" || juna.trainType == "T"){
            data.splice(index,1);
        }
        for (let i in juna.timeTableRows){
            // haetaan lähtö ja pääteasema
            juna.lahtoA = juna.timeTableRows[0].stationShortCode;
            juna.paateA = juna.timeTableRows[i].stationShortCode;
            
            
            // haetaan aikataulunmukainen ja arvio saapumisesta
            if (asema === juna.timeTableRows[i].stationShortCode && juna.timeTableRows[i].type == "ARRIVAL"){
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
    teeTable(data);
  })
}

// Luodaan taulukko aseman tietojen mukaan.
function teeTable(data){
    let output = `<table class="table table-striped table-hover">
    <thead>
      <th class="text-muted">Juna</th>
      <th class="text-muted">Lähtöasema</th> 
      <th class="text-muted">Pääteasema</th> 
      <th class="text-muted">Saapuu</th>
    </thead>
    <tbody>`;
    
    for (let i=0; i<10;i++){
        try{
        output += `
            <tr>
                <td>${data[i].trainType} ${data[i].trainNumber}</td>
                <td>${data[i].lahtoANimi}</td>
                <td>${data[i].paateANimi}</td>
                <td>${formatoiAika(data[i].saapAikaTaulu)}</td>
            </tr>
            
        `;
        } catch (e){
            console.log("Taulukon luonnissta virhe(junia alle 10): junia "+i);
            break;
        }
    };
    output +=`
    </tbody>
     </table>
    `
    document.getElementById('table').innerHTML = output;
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
    let nolla = "0";
    let tunnit = aika.getHours();
    let minuutit = aika.getMinutes();
    if (minuutit < 9) minuutit = nolla+=minuutit;
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
    .then(() =>{
        asematValikkoon();
    })
    
}

function asematValikkoon(){
    //let vaihtoehdot = document.getElementById("options");
    for (let i in asemaData){
        let koodi = asemaData[i].stationShortCode;
        let nimi = asemaData[i].stationName;
        $('#valitsin').append('<option value='+koodi+' >'+nimi+'</option>');
    }
    // kuunnellaan select boksin muutosta
    $('#valitsin').on('select2:select', function (e) {
        console.log(this.value);
        haeData(this.value, buttonState);
      });    
}







