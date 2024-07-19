function fntBuscarDocumento(){
    let strNoBoleta = document.getElementById('txtNoBoleta').value,
        strNoEmpresa = document.getElementById('sltEmpresa').value;

    if( strNoBoleta.length === 0 || strNoEmpresa === '-1' ){
        //alert_nova.showNotification(`${data[0].msj}`, "add_alert", "success");
        alert_nova.showNotification("Llene todos los campos para buscar una boleta", "warning", "danger");
        return false;
    }

    open_loading();
    let csrftoken = getCookie('csrftoken');
    let formData = new FormData();
    formData.append('no_boleta', strNoBoleta);
    formData.append('no_empresa', strNoEmpresa);
    fetch(strUrlBuscar, {
        method: 'POST',
        headers: { "X-CSRFToken": csrftoken },
        body: formData,
    })
    .then(response => response.json())
    .then( data => {
        if( data.status ){
            $("#divVistaDoc").html(data.data);
        }
        else{
            $("#divVistaDoc").html("");
            alert_nova.showNotification(data.msj, "warning", "danger");
        }

        close_loading();
    })
    .catch((error) => {
        close_loading();
        alert_nova.showNotification("Ocurrió un problema. Intente nuevamente o contacte a IT.", "warning", "danger");
    });
}

function fntConfirmar(intCierreVar, intLineaVar){
    dialogConfirm(fntRegresarEstado, [intCierreVar, intLineaVar], '¿Esta seguro(a) de regresar a estado Ingresado esta boleta?', '¡No podrás revertir esta acción!', 'error');
}

function fntRegresarEstado(arrParams){
    open_loading();
    let csrftoken = getCookie('csrftoken');
    let formData = new FormData();
    formData.append('cierre', arrParams[0]);
    formData.append('linea', arrParams[1]);

    fetch(strUrlGuardar, {
        method: 'POST',
        headers: { "X-CSRFToken": csrftoken },
        body: formData,
    })
    .then(response => response.json())
    .then( data => {
        if(data.status){
            alert_nova.showNotification(`${data.msj}`, "add_alert", "success");

            //$("#divVistaDoc").html("");
            fntBuscarDocumento()
        }
        else{
            alert_nova.showNotification(`${data.msj}`, "warning", "danger");
        }

        close_loading();
    })
    .catch((error) => {
        close_loading();
    });
}
