/**
 * Commuter trains?
 * Koodin siistiminen ja githubiin lisäys avoimeksi
 * Poista jo lähteneet junat
 */

"use strict";
let asemaData = [];
var buttonState = "ARRIVAL";
var kaupunki = "JY";

window.onload = function (e) {
    haeAsemaData();
    haeData(kaupunki);

    $('.colors input[type=radio]').on('change', function () {
        buttonState = this.value;
        haeData(kaupunki);
    });

    // Minuutin välein päivitys
    setInterval(function () {
        haeData(kaupunki);
    }, 60000);
}

// Select 2 kirjaston haku ja dropdown
$(document).ready(function () {
    $('.js-example-basic-single').select2();
});

/**  Haetaan data ja kerätään arvoja juna muuttujiin käsittelyn helpottamiseksi.
 * Kutsutaan funktiot järjestä ja teetable, koska ohjelma on asynkroninen
 */
function haeData(asema) {
    let url;
    if (buttonState == "ARRIVAL") {
        url = 'https://rata.digitraffic.fi/api/v1/live-trains?arrived_trains=0&arriving_trains=50&departed_trains=0&departing_trains=0&station=';
    } else url = 'https://rata.digitraffic.fi/api/v1/live-trains?arrived_trains=0&arriving_trains=0&departed_trains=0&departing_trains=50&station=';
    fetch(url + asema)
        .then((res) => res.json())
        .then((data) => {
            document.getElementById('table').innerHTML = "";

            // Poistetaan tavarajunat
            for (let i = data.length - 1; i >= 0; i--) {
                if (data[i].trainCategory === "Cargo" || data[i].trainCategory == "Locomotive" || data[i].trainCategory == "Shunting") {
                    data.splice(i, 1);
                }
                
            }

            data.forEach(function (juna, index) {
                for (let i in juna.timeTableRows) {
                    // haetaan lähtö ja pääteasema
                    juna.lahtoA = juna.timeTableRows[0].stationShortCode;
                    juna.paateA = juna.timeTableRows[i].stationShortCode;
                    // haetaan aikataulunmukainen ja arvio saapumisesta

                    if (asema === juna.timeTableRows[i].stationShortCode && juna.timeTableRows[i].type == buttonState) {
                        try {
                            juna.saapArvio = juna.timeTableRows[i].liveEstimateTime;
                            if (juna.saapArvio = !undefined) juna.saapArvio = new Date(juna.timeTableRows[i].liveEstimateTime);
                        } catch (e) { console.log(e); }
                        juna.AikaTaulu = new Date(juna.timeTableRows[i].scheduledTime);
                    }
                }
                for (let i in asemaData) {
                    // haetaan aseman nimi asemakoodin mukaan
                    if (juna.lahtoA == asemaData[i].stationShortCode) {
                        juna.lahtoANimi = asemaData[i].stationName;
                    }
                    if (juna.paateA == asemaData[i].stationShortCode) {
                        juna.paateANimi = asemaData[i].stationName;
                    }
                }
            });
            jarjestaSaapujat(data);
            teeTable(data);
            console.log(data);
        })
}

// Luodaan taulukko aseman tietojen mukaan.
function teeTable(data) {
    let suunta = "Saapuu";
    if (buttonState == "DEPARTURE") {
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

    for (let i = 0; i < lkm; i++) {
        let peruttu = "<tr>";
        let peruttuCancell = '<td>';

        if (data[i].cancelled == true) {
            peruttu = '<tr class="text-muted">';
            peruttuCancell = '<td> <div class="text-danger" >Cancelled</div>';
        }
        let aika = formatoiAika(data[i].AikaTaulu);
        let arvio = data[i].saapArvio.getTime();
        let taulu = data[i].AikaTaulu.getTime();

        // haetaan saaparvion ja aikataulun erotus
        let ero = arvio - taulu;
        var minuutit = Math.floor((ero / 1000) / 60);
        // jos erotus on 1 minuutti tai enemmän, se tulostetaan
        if (arvio > taulu && minuutit >= 1) {
            arvio = formatoiAika(data[i].saapArvio);
            peruttuCancell = '<td class="text-muted">('
            aika += `) <div class="text-danger">${arvio} </div> `
        }

        try {
            output += `
            ${peruttu}
            <td>${data[i].trainType} ${data[i].trainNumber}</td>
            <td>${data[i].lahtoANimi}</td>
            <td>${data[i].paateANimi}</td>
            ${peruttuCancell}${aika}</td>
            </tr>
            
        `;
        } catch (e) {
            console.log(e);
        }
    };
    output += `
    </tbody>
     </table>
    `
    document.getElementById('table').innerHTML = output;
}

// järjestetään data asspumisjärjestykseen aikataulun mukaan
function jarjestaSaapujat(data) {
    data.sort(function (a, b) {
        if (a.AikaTaulu < b.AikaTaulu) return -1;
        if (a.AikaTaulu > b.AikaTaulu) return 1;
        return 0;
    })
}

// Date tyyppinen muuttuja formatoidaan xx:xx muotoon
function formatoiAika(aika) {
    if (aika == undefined) return;
    let nolla = "0";
    let tunnit = aika.getHours();
    let minuutit = aika.getMinutes();
    if (minuutit < 10) minuutit = nolla + minuutit;
    if (tunnit < 10) tunnit = nolla + tunnit;
    let tuloste = tunnit + ":" + minuutit;
    return tuloste;
}

// Haetaan data asemista ja lisätään muuttujaan kaikki asemat
function haeAsemaData() {
    fetch('https://rata.digitraffic.fi/api/v1/metadata/stations')
        .then((res) => res.json())
        .then((asemat) => {
            for (let i in asemat) {
                // poistetaan "asema" stationName merkkijonosta paitsi poikkeuksessa pasila autojuna-asema
                if (asemat[i].stationName != "Pasila autojuna-asema") {
                    asemat[i].stationName = asemat[i].stationName.replace("asema", "");
                }
                asemat[i].stationName = asemat[i].stationName.replace("_", " ");
                asemaData.push(asemat[i]);
            }
        })
        .then(() => {
            asematValikkoon();
        })
}

function asematValikkoon() {
    for (let i in asemaData) {
        let koodi = asemaData[i].stationShortCode;
        let nimi = asemaData[i].stationName;
        // Jyväskylä valittuna default arvona
        if (koodi == "JY") koodi = "JY' selected='selected'";

        // Vain matkustaja trafiikki asemat valikkoon
        if (asemaData[i].passengerTraffic == true) {
            $('#valitsin').append('<option value=' + koodi + ' >' + nimi + '</option>');
        }
    }
    // kuunnellaan select boksin muutosta
    $('#valitsin').on('select2:select', function (e) {
        kaupunki = this.value;
        haeData(this.value);
    });
}







