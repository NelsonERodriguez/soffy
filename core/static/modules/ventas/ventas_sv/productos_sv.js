const fntGetProductos = async () => {
    const objFormData = new FormData();

    objFormData.append('csrfmiddlewaretoken', getCookie('csrftoken'));

    fntCleanTable();

    let objInit = {
        method: 'POST',
        body: objFormData
    };

    open_loading();
    await coreFetch(strUrlGetProductos, objInit, (data) => {
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
    window.id_producto = 0;

    const objFormData = new FormData();

    objFormData.append('csrfmiddlewaretoken', getCookie('csrftoken'));

    let objInit = {
        method: 'POST',
        body: objFormData
    };

    open_loading();
    await coreFetch(strUrlGetCodigoNuevo, objInit, (data) => {
        document.getElementById("sltTipoProducto").value = "0";
        document.getElementById("txtCodigo").value = data.data.codigo_nuevo;
        document.getElementById("txtProducto").value = "";
        document.getElementById("chkActivo").checked = true;
        document.getElementById("mdlProducto").querySelector(".modal-title").innerText = "Nuevo Producto";

        $("#mdlProducto").modal("show");

        close_loading();
    }, {boolShowSuccessAlert: false});
}

const fntEditar = async ( intProducto ) => {
    window.id_producto = intProducto;

    const objFormData = new FormData();

    objFormData.append('csrfmiddlewaretoken', getCookie('csrftoken'));
    objFormData.append('id_producto', intProducto);

    let objInit = {
        method: 'POST',
        body: objFormData
    };

    open_loading();
    await coreFetch(strUrlGetData, objInit, (data) => {
        document.getElementById("sltTipoProducto").value = data.data.tipo_producto_sv_id;
        document.getElementById("txtCodigo").value = data.data.codigo_producto;
        document.getElementById("txtProducto").value = data.data.nombre;
        document.getElementById("chkActivo").checked = data.data.activo;

        document.getElementById("mdlProducto").querySelector(".modal-title").innerText = "Editar Producto";

        $('[rel="tooltip"]').tooltip();

        $("#mdlProducto").modal("show");

        close_loading();
    }, {boolShowSuccessAlert: false});
};

const fntGuardar = async () => {
    let boolVacioTipo = false,
        boolVacioCodigo = false,
        boolVacioProducto = false,
        intTipoProducto = document.getElementById("sltTipoProducto").value,
        strCodigo = document.getElementById("txtCodigo").value,
        strProducto = document.getElementById("txtProducto").value,
        boolActivo = document.getElementById("chkActivo").checked;

    if( intTipoProducto.trim().length === 0 || intTipoProducto === "0" ){
        boolVacioTipo = true;
    }

    if( strCodigo.trim().length === 0 ){
        boolVacioCodigo = true;
    }

    if( strProducto.trim().length === 0 ){
        boolVacioProducto = true;
    }

    if( boolVacioTipo ){
        alert_nova.showNotification(`El tipo de producto es requerido`, "warning", "danger");
    }

    if( boolVacioCodigo ){
        alert_nova.showNotification(`El código del producto es requerido`, "warning", "danger");
    }

    if( boolVacioProducto ){
        alert_nova.showNotification(`El nombre del producto es requerido`, "warning", "danger");
    }

    if( boolVacioTipo || boolVacioCodigo || boolVacioProducto ){
        return false;
    }

    const data = new FormData();

    data.append('csrfmiddlewaretoken', getCookie('csrftoken'));
    data.append('id_producto', window.id_producto);
    data.append('intTipoProducto', intTipoProducto);
    data.append('strCodigo', strCodigo);
    data.append('strProducto', strProducto);
    data.append('boolActivo', boolActivo ? "1" : "0");

    let objInit = {
        method: 'POST',
        body: data
    };

    open_loading();
    await coreFetch(strUrlGuardar, objInit, (data) => {
        if( data.status ){
            $("#mdlProducto").modal("hide");
            fntGetProductos();
        }
        close_loading();
    });
};

const fntPreguntarEliminar = async ( intProducto ) => {
    window.id_producto = intProducto;
    dialogConfirm(fntEliminar, false, '¿Estás seguro?', '¡Se eliminará el producto y no se podrá recuperar!', 'error')
};

const fntEliminar = async () => {
    const data = new FormData();

    data.append('csrfmiddlewaretoken', getCookie('csrftoken'));
    data.append('id_producto', window.id_producto);

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
    objDataTable = $('#tblProductos').DataTable({
        data: [],
        processing: true,
        responsive: false,
        "pagingType": "full_numbers",
        "lengthMenu": [
            [10, 25, 50, -1],
            [10, 25, 50, "Todos"]
        ],
        columns: [

            {data: 'codigo_producto'},
            {data: 'producto'},
            {data: 'tipo'},
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