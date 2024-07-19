
var tr_click;

$('#detalles').DataTable({
    'responsive': true,
    'paging': false,
    'ordering': false,
    'info': false,
    'searching': false,
    'tabIndex': -1,
    'columnDefs': [
        { 'width': "120px", "targets": 0 },
        { 'width': "130px", "targets": 2 },
        { 'width': "25px", "targets": 5 }
    ],
    'language': {
        'zeroRecords': 'Solicitud sin productos'
    }
});

$(document).on('click', 'button.modals', function (e) {
    e.preventDefault();
    tr_click = $(this).closest('tr');
    document.getElementById('guardar_pesos').style.removeProperty('display');
    document.getElementById('cancelar').style.removeProperty('display');
});

$(document).on('hidden.bs.modal', '.modal', function () {
    $(this).find('.modal-body').empty();
});

$(document).on('click', 'button.icon-delete', function () {
    $(this).closest('tr').remove();
});

$(document).on('click', '#agregar_peso', function () {
    let peso = document.getElementById('peso').value;
    if (peso !== "") {
        $('#pesos > tbody:last-child').append(
            '<tr>' +
            '<td class="col-9 text-right">' + peso + '<input type="hidden" name="pesos[]" value="' + peso + '"></td>' +
            '<td class="col-3 text-center"><button type="button" class="icon-delete btn btn-link btn-outline-danger"><i class="material-icons">delete</i></button></td>' +
        '</tr>');

        document.getElementById('peso').value = '';
        document.getElementById('peso').focus();
    }
});

$(document).keypress(function(e) {
    if (e.which === 13) {
        $("#agregar_peso").click();
        e.preventDefault();
        return false;
    }
});

document.getElementById( 'guardar_pesos' ).addEventListener('click', (e) => {
    const objForm = new FormData(document.getElementById('guardar'));
    open_loading();

    // $('#guardar_pesos').hide();
    // $('#cancelar').hide();
    e.currentTarget.style.display = 'none';
    document.getElementById('cancelar').style.display = 'none';

    fetch(strUrlGuardarPesos, {
        method: 'POST',
        headers: {'X-CSRFToken': getCookie('csrftoken')},
        body: objForm,
    })
        .then(response => response.json())
        .then((data) => {
            close_loading();

            if (data.status) {
                if (tr_click.hasClass('child')) {
                    tr_click.find('li[data-dtr-index="2"]').find('span[class="dtr-data"]').text(data.suma);
                } else {
                    tr_click.find('#span_cantidad').text(data.suma);
                }
            }

            $('#remote-modal').modal('toggle');

            alert_nova.showNotification('Ingresados con éxito', "add_alert", "success");
        })
        .catch((error) => {
            close_loading();
            console.error(error);
        });
});

const objAgregar = document.getElementById('agregar');
if (objAgregar) {
    objAgregar.addEventListener('click', () => {
        $('#detalles > tbody:last-child').append(
            '<tr>' +
            '<td><input type="text" id="codigo" class="form-control" required><input type="hidden" name="detalles[][id]" value="0"></td>' +
            '<td id="descripcion"></td>' +
            '<td id="cantidad"><input type="number" min="0" step="any" class="form-control"></td>' +
            '<td id="marchamo"><input type="text" class="form-control"></td>' +
            '<td id="comentario"><input type="text" class="form-control"></td>' +
            '<td class="text-center"><button type="button" class="icon-delete btn btn-link btn-outline-danger"><i class="material-icons">delete</i></button></td>' +
            '</tr>');
    });
}

$(document).on('change', '#codigo', function (e) {
    let tr = $(this).closest('tr');

    $.getJSON(strUrlGetProductos, {"codigo" : this.value, "orden_id": orden_id},function( data ) {
        if (data['productos'].length === 0) {
            alert_nova.showNotification('No se encontró el producto o ya existe en la orden', "warning", "danger");
            tr.find('#codigo').val('');
            e.stopPropagation();
        } else {
            tr.find('#descripcion').text('').append(data['productos'][0].Descripcion + '<input type="hidden" value="' + data['productos'][0].NoProducto + '" name="detalles[][noproducto]">' + '<input type="hidden" value="' + data['productos'][0].Descripcion + '" name="detalles[][producto]">');
            // tr.find('#descripcion input').attr('name', 'detalles[][noproducto]');
            tr.find('#cantidad input').attr('name', 'detalles[][conteo]');
            tr.find('#marchamo input').attr('name', 'detalles[][marchamo]');
            tr.find('#comentario input').attr('name', 'detalles[][comentario]');
        }
    });
});

const getPesos = (intDetail) => {
    open_loading();
    const objForm = new FormData();
    objForm.append('detalle_id', intDetail)

    fetch(strUrlGetPesos, {
        method: 'POST',
        headers: {'X-CSRFToken': getCookie('csrftoken')},
        body: objForm,
    })
        .then(response => response.json())
        .then((data) => {
            close_loading();

            const objBody = document.getElementById('bodyModal');

            let strModal = `
                <div class="panel" style="margin-bottom: 0">
                    <div class="panel-heading">
                        <div class="row">
                            <div class="col-12">
                                <input type="hidden" name="detalle_id" value="${intDetail}">
                                <div class="input-group">
                                    <input id="peso" type="number" class="form-control" placeholder="Ingresar peso" min="0" step="any" autofocus>
                                    <span class="input-group-btn">
                                        <button id="agregar_peso" type="button" class="btn btn-small btn-flat btn-bitbucket btn-block">
                                            <span class="glyphicon glyphicon-plus"></span> Agregar
                                        </button>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="panel-body">
                        <table id="pesos" class="table table-striped" style="margin: 35px 0;">
                            <thead>
                                <tr>
                                    <th class="col-9 text-center">Cantidad</th>
                                    <th class="col-3 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                            `;

            for (let key in data.detalles) {
                const arrDetalle = data.detalles[key];
                strModal += `<tr>
                                <td class="col-9 text-right">
                                    ${arrDetalle.cantidad}
                                    <input type="hidden" name="pesos[]" value="${arrDetalle.cantidad}">
                                </td>
                                <td class="col-3 text-center">
                                    <button type="button" class="icon-delete btn btn-link btn-outline-danger"><i class="material-icons">delete</i></button>
                                </td>
                            </tr>`;
            }

            strModal += `
                            </tbody>
                        </table>
                    </div>
                </div>            
            `;

            objBody.innerHTML = strModal;

            $('#remote-modal').modal('show');

        })
        .catch((error) => {
            close_loading();
            console.error(error);
        });

};