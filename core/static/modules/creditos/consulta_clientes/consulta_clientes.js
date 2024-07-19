let objTblContenido, objTblDetalle;

const fntGetClientes = () => {
    const objFormData = new FormData();

    objFormData.append('csrfmiddlewaretoken', getCookie('csrftoken'));

    fntCleanTable();

    open_loading();
    fetch(strUrlGetClientes, {
        method: 'POST',
        body: objFormData
    })
    .then( response => response.json() )
    .then( data => {
        objTblContenido.rows.add(data.data).draw();
        objTblContenido.responsive.recalc();
        objTblContenido.columns.adjust();
        $("[rel='tooltip']").tooltip();

        if(data.status){
            alert_nova.showNotification(data.msj, "add_alert", "success");
        }
        else{
            alert_nova.showNotification(data.msj, "warning", "danger");
        }
        close_loading();
    })
    .catch(error => {
        close_loading();
        alert_nova.showNotification('Ocurrió un error, contacte con IT', 'warning', 'danger');
        console.error(error);
    })
};

const fntGetInfoCliente = ( strIntId ) => {
    const objFormData = new FormData();


    objFormData.append('csrfmiddlewaretoken', getCookie('csrftoken'));
    objFormData.append('strIntId', strIntId);

    open_loading();
    fetch(strUrlDetalle, {
        method: 'POST',
        body: objFormData
    })
    .then( response => response.json() )
    .then( data => {
        document.getElementById("div_content_2").innerHTML = data.data.html;

        $("#div_content_1").hide(400);
        $("#div_content_2").show(400);

        if(data.status){
            alert_nova.showNotification(data.msj, "add_alert", "success");
        }
        else{
            alert_nova.showNotification(data.msj, "warning", "danger");
        }
        close_loading();
    })
    .catch(error => {
        close_loading();
        alert_nova.showNotification('Ocurrió un error, contacte con IT', 'warning', 'danger');
        console.error(error);
    });
};

const fntRegresar = () => {
    $("#div_content_2").hide(400);
    $("#div_content_1").show(400);

    document.getElementById("div_content_2").innerHTML = "";
};

const fntCleanTable = () => {
    if( objTblContenido ){
        objTblContenido.clear().draw();
    }
}


$(document).ready(function(){
    objTblContenido = $('#tblContenido').DataTable({
        data:[],
        pagingType: "full_numbers",
        lengthMenu: [
            [10, 25, 50, -1],
            [10, 25, 50, "All"]
        ],
        processing: true,
        retrieve: true,
        responsive: true,
        columns: [
            { data: 'nit' },
            { data: 'nombre_empresa' },
            { data: 'nombre_comercial' },
            {
                data: 'created_at',
                render: function(data, type, row){
                    let date = new Date(data);
                    return dateGTFormat.format(date);
                },
            },
            {
                data: 'id',
                render: function(data, type, row) {
                    let strId = row.id;
                    return `<a class="btn btn-link btn-sm btn-outline-primary" href="#" onclick="fntGetInfoCliente(${strId});" rel="tooltip" title="Consultar" data-placement="right">
                        <i class="far fa-eye fa-2x"></i>
                    </a>`;
                },
                class: 'td-actions'
            },
        ],
        columnDefs: [
            {targets: [4], ordering: false },
        ],
        dom: 'Blfrtip',
        buttons: [
            {
                extend: 'excel',
                text: '<i class="fa fa-file-excel-o"></i> Excel',
                className: 'btn-flat btn-aquadeep'
            },
        ],
        language: objLenguajeDataTable,
    });

    fntGetClientes();
});