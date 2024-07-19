const fntGetListado = async () => {
    const objFormData = new FormData();

    objFormData.append('csrfmiddlewaretoken', getCookie('csrftoken'));

    fntCleanTable();

    let objInit = {
        method: 'POST',
        body: objFormData
    };

    open_loading();
    await coreFetch(strUrlGetListado, objInit, (data) => {
        objDataTable.rows.add(data.data).draw();
        objDataTable.responsive.recalc();
        objDataTable.columns.adjust();

        $('[rel="tooltip"]').tooltip();

        close_loading();
    }, {boolShowSuccessAlert: false});
};

const fntCleanTable = () => {
    if (objDataTable) {
        $(".ui-tooltip").remove();
        objDataTable.clear().draw();
    }
}

const fntAgregar = async () => {
    window.id_cliente = 0;

    const objFormData = new FormData();

    objFormData.append('csrfmiddlewaretoken', getCookie('csrftoken'));

    let objInit = {
        method: 'POST',
        body: objFormData
    };

    open_loading();
    await coreFetch(strUrlGetCodigoNuevo, objInit, (data) => {
        document.getElementById("txtCodigo").value = data.data.codigo_nuevo;
        document.getElementById("txtCliente").value = "";
        document.getElementById("txtTelefono").value = "";
        document.getElementById("txtEmail").value = "";
        document.getElementById("txtDireccionFiscal").value = "";
        document.getElementById("chkActivo").checked = true;
        document.getElementById("mdlCliente").querySelector(".modal-title").innerText = "Nuevo Cliente";

        $("#mdlCliente").modal("show");

        close_loading();
    }, {boolShowSuccessAlert: false});
}

const fntEditar = async ( intCliente ) => {
    window.id_cliente = intCliente;

    const objFormData = new FormData();

    objFormData.append('csrfmiddlewaretoken', getCookie('csrftoken'));
    objFormData.append('id_cliente', intCliente);

    let objInit = {
        method: 'POST',
        body: objFormData
    };

    open_loading();
    await coreFetch(strUrlGetData, objInit, (data) => {
        document.getElementById("txtCodigo").value = data.data.codigo_cliente;
        document.getElementById("txtCliente").value = data.data.cliente;
        document.getElementById("txtTelefono").value = data.data.telefono;
        document.getElementById("txtEmail").value = data.data.email;
        document.getElementById("txtDireccionFiscal").value = data.data.direccion_fiscal;
        document.getElementById("chkActivo").checked = data.data.activo;

        document.getElementById("mdlCliente").querySelector(".modal-title").innerText = "Editar Cliente";

        $('[rel="tooltip"]').tooltip();

        $("#mdlCliente").modal("show");

        close_loading();
    }, {boolShowSuccessAlert: false});
};

const fntGuardar = async () => {
    let boolVacioCodigo = false,
        boolVacioCliente = false,
        boolVacioTelefono = false,
        boolVacioEmail = false,
        boolVacioDireccionFiscal = false,
        strCodigo = document.getElementById("txtCodigo").value,
        strCliente = document.getElementById("txtCliente").value,
        strTelefono = document.getElementById("txtTelefono").value,
        strEmail = document.getElementById("txtEmail").value,
        strDireccionFiscal = document.getElementById("txtDireccionFiscal").value,
        boolActivo = document.getElementById("chkActivo").checked;

    if( strCodigo.trim().length === 0 ){
        boolVacioCodigo = true;
    }

    if( strCliente.trim().length === 0 ){
        boolVacioCliente = true;
    }

    if( strTelefono.trim().length === 0 ){
        boolVacioTelefono = true;
    }

    if( strEmail.trim().length === 0 ){
        boolVacioEmail = true;
    }

    if( strDireccionFiscal.trim().length === 0 ){
        boolVacioDireccionFiscal = true;
    }

    if( boolVacioCodigo ){
        alert_nova.showNotification(`El código del cliente es requerido`, "warning", "danger");
    }

    if( boolVacioCliente ){
        alert_nova.showNotification(`El nombre del cliente es requerido`, "warning", "danger");
    }

    if( boolVacioTelefono ){
        alert_nova.showNotification(`El teléfono del cliente es requerido`, "warning", "danger");
    }

    if( boolVacioEmail ){
        alert_nova.showNotification(`El email del cliente es requerido`, "warning", "danger");
    }

    if( boolVacioDireccionFiscal ){
        alert_nova.showNotification(`La dirección fiscal del cliente es requerido`, "warning", "danger");
    }

    if( boolVacioCodigo || boolVacioCliente || boolVacioTelefono || boolVacioEmail || boolVacioDireccionFiscal ){
        return false;
    }

    const data = new FormData();

    data.append('csrfmiddlewaretoken', getCookie('csrftoken'));
    data.append('id_cliente', window.id_cliente);
    data.append('strCodigo', strCodigo);
    data.append('strCliente', strCliente);
    data.append('strTelefono', strTelefono);
    data.append('strEmail', strEmail);
    data.append('strDireccionFiscal', strDireccionFiscal);
    data.append('boolActivo', boolActivo ? "1" : "0");

    let objInit = {
        method: 'POST',
        body: data
    };

    open_loading();
    await coreFetch(strUrlGuardar, objInit, (data) => {
        if( data.status ){
            $("#mdlCliente").modal("hide");
            fntGetListado();
        }
        close_loading();
    });
};

const fntPreguntarEliminar = async ( intCliente ) => {
    window.id_cliente = intCliente;
    dialogConfirm(fntEliminar, false, '¿Estás seguro?', '¡Se eliminará el cliente y no se podrá recuperar!', 'error')
};

const fntEliminar = async () => {
    const data = new FormData();

    data.append('csrfmiddlewaretoken', getCookie('csrftoken'));
    data.append('id_cliente', window.id_cliente);

    let objInit = {
        method: 'POST',
        body: data
    };

    open_loading();
    await coreFetch(strUrlEliminar, objInit, (data) => {
        close_loading();
        fntGetListado();
    });
};

$(document).ready(function(){
    objDataTable = $('#tblClientes').DataTable({
        data: [],
        processing: true,
        responsive: false,
        "pagingType": "full_numbers",
        "lengthMenu": [
            [10, 25, 50, -1],
            [10, 25, 50, "Todos"]
        ],
        columns: [

            {data: 'codigo_cliente'},
            {data: 'cliente'},
            {data: 'telefono'},
            {
                data: 'activo',
                "render": function ( data, type, row ) {
                    if (type === 'display') {
                        return row.activo ? "Si" : "No";

                    }
                    return data;
                }
            },
            {
                "defaultContent": '&nbsp;',
                orderable: false,
                "render": function ( data, type, row ) {
                    if ( type === 'display' ) {
                        let strContenido = '';

                        return `
                            <button class="btn btn-sm btn-outline-primary" href="#" onclick="fntEditar(${row.id});" rel="tooltip" title="Editar" position="right">
                                <i class="fas fa-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" href="#" onclick="fntPreguntarEliminar(${row.id});" rel="tooltip" title="Eliminar" position="right">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        `;
                    }
                    return data;
                }

            },
        ],
        order: [[1, 'asc']],
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

    fntGetListado();
});