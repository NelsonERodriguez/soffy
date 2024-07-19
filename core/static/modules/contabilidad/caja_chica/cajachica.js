$(document).ready(function() {
    $('#datatables').DataTable({
        "pagingType": "full_numbers",
        "lengthMenu": [
            [10, 25, 50, -1],
            [10, 25, 50, "All"]
        ],
        responsive: true,
        language: objLenguajeDataTable,
        order: [],
    });
});

async function getRePrint(intCaja) {
    let formData = new FormData();
    formData.append('caja_id', intCaja);
    formData.append('csrfmiddlewaretoken', valCSRF);

    let response = await fetch(`${urls.url_re_print}`, {method: 'POST', body: formData});
    let data = await response.json();

    let objResume = [
        { 'name': 'resumen' },
    ];
    if(!isNaN(data.no_poliza * 1)){
        objResume.push({ 'name': 'poliza' });
    }

    for(let k in objResume){
        const data = objResume[k];
        document.getElementById('contentFormPrint').innerHTML = `   <input type='hidden' name='caja' value='${intCaja}' />
                                                                    <input type='hidden' name='impresion' value='${data.name}' />`;
        document.getElementById('formRpt').submit();
    }
}

function confirm_delete(strUrl) {
    window.location.href = strUrl;
}

function modalPoliza(cajaID){
    $('#modalPoliza').modal('show');
    const button = document.getElementById('btnSendPolizaSave');
    if(button){
        button.addEventListener('click', () => {
            let no_poliza = document.getElementById('no_poliza').value,
                fecha_inicio = document.getElementById('fecha_inicio').value,
                fecha_fin = document.getElementById('fecha_fin').value,
                boolError = false;
            if(no_poliza == '' || no_poliza <= 0){
                document.getElementById('no_poliza').classList.add('is-invalid');
                boolError = true;
            }
            else {
                document.getElementById('no_poliza').classList.remove('is-invalid');
            }
            if(fecha_inicio == ''){
                document.getElementById('fecha_inicio').classList.add('is-invalid');
                boolError = true;
            }
            else {
                document.getElementById('fecha_inicio').classList.remove('is-invalid');
            }
            if(fecha_fin == ''){
                document.getElementById('fecha_fin').classList.add('is-invalid');
                boolError = true;
            }
            else {
                document.getElementById('fecha_fin').classList.remove('is-invalid');
            }
            if(!boolError){
                makeFormSend(cajaID, no_poliza, fecha_inicio, fecha_fin);
            }
        });
    }
}

function makeFormSend(cajaID, intNoPoliza, fecha_inicio, fecha_fin) {
    open_loading();
    let formData = new FormData();
    formData.append('caja', cajaID);
    formData.append('poliza', intNoPoliza);
    formData.append('inicio', fecha_inicio);
    formData.append('fin', fecha_fin);
    formData.append('csrfmiddlewaretoken', valCSRF);
    fetch(`${urls.save_poliza}`, {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        if(data[0].status){
            alert_nova.showNotification(`${data[0].msj}`, "add_alert", "success");
            setTimeout(() => {
                window.location.reload();
            }, 3000);
        }
        else {
            alert_nova.showNotification(`${data[0].msj}`, "warning", "danger");
        }
    })
    .catch(error => {console.error(error)})
}