const fntGuardar = () => {
    let objForm = document.getElementById("frm_orden");
    let objFormData = new FormData(objForm);

    objFormData.append('csrfmiddlewaretoken', valCSRF);
    objFormData.append('no_orden', strNoOrden);

    let boolVacio = false;
    $("select[id^='sltFormaPago_']").each(function(){
        if( this.value === "" ){
            boolVacio = true;
        }
    });

    if( boolVacio ){
        alert_nova.showNotification("Tiene que ingresar la forma de pago de todos los pedidos.", "warning", "danger");
        return false;
    }

    if( document.getElementById("txtHoraSalida").value.trim().length === 0 ){
        alert_nova.showNotification("La hora de salida es obligatoria.", "warning", "danger");
        return false;
    }

    if( document.getElementById("txtHoraEntrada").value.trim().length === 0 ){
        alert_nova.showNotification("La hora de entrada es obligatoria.", "warning", "danger");
        return false;
    }

    open_loading();

    fetch(urlGuardar, {
        method: 'POST',
        body: objFormData,
    })
    .then(response => response.json())
    .then(data => {
        if(data.status){
            //alert_nova.showNotification(`${data.message}`, "add_alert", "success");
            window.location = urlIndex;
        }
    })
    .catch(error => {
        console.error(error)
        alert_nova.showNotification("Ocurrió un error verifique su conexión e intente nuevamente o contacte a IT.", "warning", "danger");
        close_loading();
    });
};

const fntConfirmarGuardar = () => {
    dialogConfirm(fntGuardar, false, '¿Está seguro de liquidar esta orden?', '¡No se podrán modificar los datos luego de liquidarla!', 'warning');
};

const fntRegresar = () => {
    if( boolLiquidada ){
        simple_redireccion(urlIndex);
    }
    else{
        dialogConfirm(simple_redireccion, urlIndex, '¿Desea regresar?', '¡No se guardarán los cambios realizados!', 'error');
    }
};

$(function(){
    $("input, select").on("change", function(){
        let arrInput = $(this).attr("id").split("_");
        if( typeof(arrInput[1]) !== "undefined" ){
            if( this.value.trim().length > 0 ){
                if( arrInput[0] === "sltFormaPago" ){
                    $(this).parent().parent().removeClass("table-warning");
                    $(this).parent().parent().removeClass("table-info");
                    $(this).parent().parent().addClass("table-success");
                }
                else{
                    $(this).parent().parent().parent().removeClass("table-warning");
                    $(this).parent().parent().parent().removeClass("table-info");
                    $(this).parent().parent().parent().addClass("table-success");
                }
            }
        }
    });

});