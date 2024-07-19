function fntBuscar(){
    let fechaInicio = document.getElementById("txtFechaInicio").value
    let fechaFin = document.getElementById("txtFechaFin").value

    if( fechaInicio.length == 0 || fechaFin.length == 0 ){
        $("#div_tabla").html("");
        return false;
    }
    
    open_loading();
    let formData = new FormData();
    formData.append('csrfmiddlewaretoken', valCSRF);
    formData.append('fecha_inicial', fechaInicio);
    formData.append('fecha_final', fechaFin);

    fetch(urlGetBuscar, {
        method: 'POST',
        body: formData,
    })
    .then(response => response.text())
    .then(data => {
        $("#div_tabla").html(data);
        tblFacturas = $('#tblFacturas').DataTable({
            "pagingType": "full_numbers",
            "lengthMenu": [
                [10, 25, 50, -1],
                [10, 25, 50, "Todos"]
            ],
            language: objLenguajeDataTable,
        });
        close_loading();
    })
    .catch(error => {
        console.error(error)
        close_loading();
    })
}

$(document).ready(function(){
    $("#btnBuscar").click(function(){
        fntBuscar();
    });
});