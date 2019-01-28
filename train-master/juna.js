/**
 * Bugin korjaus(näyttää 1 vanhan junan)
 * Aika-arvion lisäys jos myöhässä.
 * Commuter trains?
 * Koodin siistiminen ja githubiin lisäys avoimeksi
 */

"use strict";
let asemaData = [];
var buttonState = "ARRIVAL";
var kaupunki = "JY";

window.onload = function(e){ 
    haeAsemaData();
    haeData(kaupunki);
    $('.colors input[type=radio]').on('change', function() {       
        buttonState = this.value;
        haeData(kaupunki);
    });
}

// Select 2 kirjaston haku ja dropdown
$(document).ready(function() {
    $('.js-example-basic-single').select2();
});


function haeData(asema){
    let url;
    if (buttonState == "ARRIVAL"){
        url = 'https://rata.digitraffic.fi/api/v1/live-trains?arrived_trains=0&arriving_trains=50&departed_trains=0&departing_trains=0&station=';
    } else url = 'https://rata.digitraffic.fi/api/v1/live-trains?arrived_trains=0&arriving_trains=0&departed_trains=0&departing_trains=50&station=';
   fetch(url+asema)
  .then((res) => res.json())
  .then((data) => {
    document.getElementById('table').innerHTML = "";
    
      data.forEach(function(juna, index){
        // Poistetaan tavarajunat
        
        if (juna.trainCategory == "Cargo" ||juna.trainCategory =="Locomotive"||juna.trainCategory == "Shunting"){
            data.splice(index, 1);
        }
        for (let i in juna.timeTableRows){
            // haetaan lähtö ja pääteasema
            juna.lahtoA = juna.timeTableRows[0].stationShortCode;
            juna.paateA = juna.timeTableRows[i].stationShortCode;
            // haetaan aikataulunmukainen ja arvio saapumisesta

            if (asema === juna.timeTableRows[i].stationShortCode && juna.timeTableRows[i].type == buttonState){
                try{
                    juna.saapArvio = juna.timeTableRows[i].liveEstimateTime;
                    
                } catch (e){console.log(e);}
                juna.AikaTaulu = new Date(juna.timeTableRows[i].scheduledTime);
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
    let suunta = "Saapuu";
    if (buttonState == "DEPARTURE"){
        suunta = "Lähtee";
    }
    let output = `<table class="table table-striped table-hover">
    <thead>
      <th class="text-muted">Juna</th>
      <th class="text-muted">Lähtöasema</th> 
      <th class="text-muted">Pääteasema</th> 
      <th class="text-muted">${suunta}</th>
    </thead>
    <tbody>`;
    
    let lkm = data.length;
    
    for (let i=0; i<lkm;i++){
        let peruttu = "<tr>";
        let peruttuCancell = '<td>';

        if (data[i].cancelled == true){
            peruttu = '<tr class="text-muted">';
            peruttuCancell = '<td> <div class="text-danger" >Cancelled</div>';
        }
        try{
        output += `
            ${peruttu}
            <td>${data[i].trainType} ${data[i].trainNumber}</td>
            <td>${data[i].lahtoANimi}</td>
            <td>${data[i].paateANimi}</td>
            ${peruttuCancell}${formatoiAika(data[i].AikaTaulu)}</td>
            </tr>
            
        `;
        } catch (e){
             
          }
    };
    output +=`
    </tbody>
     </table>
    `
    document.getElementById('table').innerHTML = output;
}

// Tarkistetaan onko juna peruttu
function onkoPeruttu(juna){
    if (juna.cancelled == true) return true;
    else return false;

}

// järjestetään data asspumisjärjestykseen aikataulun mukaan
function jarjestaSaapujat(data){
    data.sort(function(a, b){
            if (a.AikaTaulu < b.AikaTaulu) return -1;
            if (a.AikaTaulu > b.AikaTaulu) return 1;
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
            // poistetaan "asema" stationName merkkijonosta paitsi poikkeuksessa pasila autojuna-asema
            if (asemat[i].stationName != "Pasila autojuna-asema"){
            asemat[i].stationName = asemat[i].stationName.replace("asema", "");
            }
            asemat[i].stationName = asemat[i].stationName.replace("_", " ");
            asemaData.push(asemat[i]);
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
        // Hyväskylä valittuna default arvona
        if (koodi == "JY") koodi = "JY' selected='selected'";
        
        // Vain matkustaja trafiikki asemat valikkoon
        if (asemaData[i].passengerTraffic == true){
        $('#valitsin').append('<option value='+koodi+' >'+nimi+'</option>');
        }
    }
    // kuunnellaan select boksin muutosta
    $('#valitsin').on('select2:select', function (e) {
        kaupunki = this.value;
        console.log(kaupunki);
        haeData(this.value);
      });
}







