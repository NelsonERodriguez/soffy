let objTblContenido, objTblDetalle;

const fntGetFacturas = () => {
    const objFormData = new FormData();

    let strFechaInicial = document.getElementById("txtFechaInicial").value,
        strFechaFinal = document.getElementById("txtFechaFinal").value;

    objFormData.append('csrfmiddlewaretoken', getCookie('csrftoken'));

    if( strFechaInicial === "" ){
        alert_nova.showNotification('El campo de Fecha Inicial es requerido.', 'warning', 'danger');
        return false;
    }

    if( strFechaFinal === "" ){
        alert_nova.showNotification('El campo de Fecha Final es requerido.', 'warning', 'danger');
        return false;
    }

    objFormData.append('strFechaInicial', strFechaInicial);
    objFormData.append('strFechaFinal', strFechaFinal);

    fntCleanTable();

    open_loading();
    fetch(strGetEmpresas, {
        method: 'POST',
        body: objFormData
    })
    .then( response => response.json() )
    .then( data => {
        objTblContenido.rows.add(data.data).draw();
        objTblContenido.responsive.recalc();
        objTblContenido.columns.adjust();

        objTblContenido.on('click', 'tr', function() {
            let data = objTblContenido.row(this).data();

            fntGetDetalles(data.NoEmpresa)
        });

        fntCleanTableDetalle();
        document.getElementById("divDetails").style.display = "none";

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

const fntGetDetalles = ( strNoEmpresa ) => {
    const objFormData = new FormData();

    let strFechaInicial = document.getElementById("txtFechaInicial").value,
        strFechaFinal = document.getElementById("txtFechaFinal").value;

    objFormData.append('csrfmiddlewaretoken', getCookie('csrftoken'));

    if( strFechaInicial === "" ){
        alert_nova.showNotification('El campo de Fecha Inicial es requerido.', 'warning', 'danger');
        return false;
    }

    if( strFechaFinal === "" ){
        alert_nova.showNotification('El campo de Fecha Final es requerido.', 'warning', 'danger');
        return false;
    }

    objFormData.append('strFechaInicial', strFechaInicial);
    objFormData.append('strFechaFinal', strFechaFinal);
    objFormData.append('strNoEmpresa', strNoEmpresa);

    fntCleanTableDetalle();

    open_loading();
    fetch(strUrlDetalles, {
        method: 'POST',
        body: objFormData
    })
    .then( response => response.json() )
    .then( data => {
        objTblDetalle.rows.add(data.data).draw();
        objTblDetalle.responsive.recalc();
        objTblDetalle.columns.adjust();

        document.getElementById("divDetails").style.display = "block";


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


const fntCleanTable = () => {
    if( objTblContenido ){
        objTblContenido.clear().draw();
    }
}

const fntCleanTableDetalle = () => {
    if( objTblDetalle ){
        objTblDetalle.clear().draw();
    }
}

$(document).ready(function(){
    objTblContenido = $('#tblContenido').DataTable({
        data:[],
        info: false,
        paging: false,
        ordering: false,
        processing: true,
        retrieve: true,
        responsive: true,
        columns: [
            { data: 'NoEmpresa' },
            { data: 'Empresa' },
            { data: 'CantidadFacturas' },
            { data: 'CantidadFacturasSP' },
        ],
        columnDefs: [
            //{targets: [3, 4], class: 'text-center' },
        ],
        dom:"<'row'<'col-sm-12 col-md-6'B><'col-sm-12 col-md-6'f>>" +
            "<'row'<'col-sm-12'tr>>",
        buttons: [
            {
                extend: 'excel',
                text: '<i class="fa fa-file-excel-o"></i> Excel',
                className: 'btn-flat btn-aquadeep'
            },
        ],
        language: objLenguajeDataTable,
    });

    objTblDetalle = $('#tblDetalles').DataTable({
        data:[],
        pagingType: "full_numbers",
        lengthMenu: [
            [10, 25, 50, -1],
            [10, 25, 50, "All"]
        ],
        ordering: false,
        processing: true,
        retrieve: true,
        responsive: true,
        columns: [
            { data: 'CodigoProveedor' },
            { data: 'NumSerieFac' },
            { data: 'NoFactura' },
            {
                data: 'FechaFactura',
                "render": function ( data, type, row ) {
                    if ( type === 'display' || type === 'filter' ) {
                        let date = new Date(data+" 00:00:00");
                        return dateGTFormat.format(date);
                    }
                    return data;
                }
            },
            {
                data: 'Valor',
                "render": function ( data, type, row ) {
                    if ( type === 'display' || type === 'filter' ) {
                        return numberGTFormat.format(data);
                    }
                    return data;
                }
            },
        ],
        columnDefs: [
            //{targets: [3, 4], class: 'text-center' },
        ],
        buttons: [
            {
                extend: 'excel',
                text: '<i class="fa fa-file-excel-o"></i> Excel',
                className: 'btn-flat btn-aquadeep'
            },
        ],
        language: objLenguajeDataTable,
    });
});