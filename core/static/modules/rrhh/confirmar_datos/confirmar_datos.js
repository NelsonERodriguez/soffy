const fntGetInfo = (intId) =>{
    let formData = new FormData();
    formData.append('csrfmiddlewaretoken', getCookie('csrftoken'));
    formData.append('id', intId);
    sessionStorage.setItem("id_global", intId);

    open_loading();
    fetch(`${strUrlGetInfo}`, {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        if(data.status){
            //alert_nova.showNotification(data.msj, "add_alert", "success");

            document.getElementById("tdNombresA").innerHTML = data.info_vieja.Nombres;
            document.getElementById("tdNombresN").innerHTML = data.info_nueva.nombres;

            document.getElementById("tdApellidosA").innerHTML = data.info_vieja.Apellidos;
            document.getElementById("tdApellidosN").innerHTML = data.info_nueva.apellidos;

            document.getElementById("tdDpiA").innerHTML = data.info_vieja.DUI;
            document.getElementById("tdDpiN").innerHTML = data.info_nueva.dpi;

            document.getElementById("tdDepartamentoA").innerHTML = data.info_vieja.CedulaDepto;
            document.getElementById("tdDepartamentoN").innerHTML = data.info_nueva.departamento_dpi;

            document.getElementById("tdMunicipioA").innerHTML = data.info_vieja.cedulamunicipio;
            document.getElementById("tdMunicipioN").innerHTML = data.info_nueva.municipio_dpi;

            document.getElementById("tdDireccionA").innerHTML = data.info_vieja.direccion;
            document.getElementById("tdDireccionN").innerHTML = data.info_nueva.direccion;

            document.getElementById("tdEstadoA").innerHTML = data.info_vieja.EstadoCivil;
            document.getElementById("tdEstadoN").innerHTML = data.info_nueva.EstadoCivil;

            $('#mdlConfirmar').modal('show')
        }
        close_loading();
    })
    .catch(error => console.error(error))
};

const fntSave = () =>{
    let formData = new FormData();
    formData.append('csrfmiddlewaretoken', getCookie('csrftoken'));

    let intId;
    if( sessionStorage.getItem("id_global") ){
        intId = sessionStorage.getItem("id_global");
    }
    else{
        alert_nova.showNotification("No se seleccionó el empleado.", "warning", "danger");
        return false;
    }
    
    formData.append('id', intId);

    open_loading();
    fetch(`${strUrlGuardar}`, {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        if(data.status){
            alert_nova.showNotification(data.msj, "add_alert", "success");
            $('#mdlConfirmar').modal('hide')
            window.location.reload();
        }
        else{
            alert_nova.showNotification(data.msj, "warning", "danger");
        }
        close_loading();
    })
    .catch(error => console.error(error))
};

$(document).ready(function(){
    $("#tblDatos").DataTable({
        "pagingType": "full_numbers",
        "lengthMenu": [
            [10, 25, 50, -1],
            [10, 25, 50, "Todos"]
        ],
        "columns": [
            {"orderable": false},
            {"orderable": true},
            {"orderable": true},
            {"orderable": true},
            {"orderable": true},
            {"orderable": true},
            {"orderable": true}
        ],
        responsive: false,
        language: objLenguajeDataTable,
        autoPrint: false
    });

    $(document).on("click",".save-datos",function(){
        fntGetInfo($(this).data("id"));
    });

    $("#btnGuardar").on("click",function(){
        fntSave();
    });
});