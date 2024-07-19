const fntGetProductos = async () => {
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

const fntAgregar = () => {
    window.id_tipo_producto = 0;

    document.getElementById("txtTipoProducto").value = "";
    document.getElementById("chkActivo").checked = true;
    document.getElementById("mdlTipoProducto").querySelector(".modal-title").innerText = "Nuevo Tipo de Producto";

    $("#mdlTipoProducto").modal("show");
}

const fntEditar = async ( intTipoProducto ) => {
    window.id_tipo_producto = intTipoProducto;

    const objFormData = new FormData();

    objFormData.append('csrfmiddlewaretoken', getCookie('csrftoken'));
    objFormData.append('id_tipo_producto', intTipoProducto);

    let objInit = {
        method: 'POST',
        body: objFormData
    };

    open_loading();
    await coreFetch(strUrlGetData, objInit, (data) => {
        document.getElementById("txtTipoProducto").value = data.data.tipo_producto;
        document.getElementById("chkActivo").checked = data.data.activo;

        document.getElementById("mdlTipoProducto").querySelector(".modal-title").innerText = "Editar Tipo de Producto";

        $('[rel="tooltip"]').tooltip();

        $("#mdlTipoProducto").modal("show");

        close_loading();
    }, {boolShowSuccessAlert: false});
};

const fntGuardar = async () => {
    let boolVacioTipoProducto = false,
        strTipoProducto = document.getElementById("txtTipoProducto").value,
        boolActivo = document.getElementById("chkActivo").checked;

    if( strTipoProducto.trim().length === 0 ){
        boolVacioTipoProducto = true;
    }

    if( boolVacioTipoProducto ){
        alert_nova.showNotification(`El tipo de producto es requerido`, "warning", "danger");
    }

    if( boolVacioTipoProducto ){
        return false;
    }

    const data = new FormData();

    data.append('csrfmiddlewaretoken', getCookie('csrftoken'));
    data.append('id_tipo_producto', window.id_tipo_producto);
    data.append('strTipoProducto', strTipoProducto);
    data.append('boolActivo', boolActivo ? "1" : "0");

    let objInit = {
        method: 'POST',
        body: data
    };

    open_loading();
    await coreFetch(strUrlGuardar, objInit, (data) => {
        if( data.status ){
            $("#mdlTipoProducto").modal("hide");
            fntGetProductos();
        }
        close_loading();
    });
};

const fntPreguntarEliminar = async ( intTipoProducto ) => {
    window.id_tipo_producto = intTipoProducto;
    dialogConfirm(fntEliminar, false, '¿Estás seguro?', '¡Se eliminará el tipo de producto y no se podrá recuperar!', 'error')
};

const fntEliminar = async () => {
    const data = new FormData();

    data.append('csrfmiddlewaretoken', getCookie('csrftoken'));
    data.append('id_tipo_producto', window.id_tipo_producto);

    let objInit = {
        method: 'POST',
        body: data
    };

    open_loading();
    await coreFetch(strUrlEliminar, objInit, (data) => {
        close_loading();
        fntGetProductos();
    });
};

$(document).ready(function(){
    objDataTable = $('#tblTiposProducto').DataTable({
        data: [],
        processing: true,
        responsive: false,
        "pagingType": "full_numbers",
        "lengthMenu": [
            [10, 25, 50, -1],
            [10, 25, 50, "Todos"]
        ],
        columns: [

            {data: 'tipo_producto'},
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

    fntGetProductos();
});