const csrftoken = getCookie('csrftoken');
let table = null;
const buttons = [
    {
        name: 'excel',
        extend: 'excel',
        className: 'btn-flat btn-aquadeep',
        text: function (dt) {
            return '<i class="fa fa-file-excel"></i> ' + dt.i18n('buttons.excel', '<span class="hidden-xs">Excel</span>');
        },
        exportOptions: {
            columns: [0, 1, 2, 3, 4, 5]
        }
    },
];

if (agregar) {
    buttons.unshift({
        name: 'nuevo',
        className: 'btn-flat btn-azure',
        text: function (dt) {
            return '<i class="fa fa-plus"></i> ' + dt.i18n('buttons.create-alert', '<span class="hidden-xs">Nuevo</span>');
        },
        action: function (e, dt, button, config) {
            window.location = window.location.href.replace(/\/+$/, "") + '/crear';
        }
    });
}


const objGetConteos = () => {
    const objForm = new FormData();
    objForm.append('filtro', document.getElementById('filtro').value);

    open_loading();
    fetch(strUrlGetOrdenes, {
        method: 'POST',
        headers: {'X-CSRFToken': csrftoken},
        body: objForm,
    })
        .then(response => response.json())
        .then((data) => {
            close_loading();

            const objTbody = document.querySelector(`#ordenes tbody`);
            if (table) {
                table.destroy();
                table = null;
            }
            objTbody.innerHTML = '';

            if (data.status) {

                for (let key in data.data) {
                    const arrConteo = data.data[key];

                    let strAction = ``;
                    if (crear) {
                        if (arrConteo.etapa_id == 1) {
                            const strUrlHrefEstadisticas = strUrlEstadisticas.replace('0', arrConteo.orden);
                            const strUrlHrefConfirmar = strUrlConfirmar.replace('0', arrConteo.orden);
                            strAction += `
                                <a class="btn btn-flat btn-sm btn-info" href="${strUrlHrefEstadisticas}" title="Estadísticas">
                                    <span class="material-icons">query_stats</span>
                                </a>
                                <a id="confirmar" class="btn btn-flat btn-sm btn-warning" href="${strUrlHrefConfirmar}" target="_blank" onclick="simple_redireccion('${strUrlOrdenes}');" title="Confirmar">
                                    <span class="material-icons">check</span>
                                </a>
                            `;
                        } else if (arrConteo.etapa_id == 7 || arrConteo.etapa_id == 9) {
                            strUrl = strUrlImprimir.replace('0', arrConteo.orden);
                            strAction += `
                                <a class="btn btn-flat btn-sm btn-primary" href="${strUrl}" target="_blank" title="Imprimir">
                                    <span class="material-icons">print</span>
                                </a>
                            `;
                        }
                    }
                    if (ver) {
                        if (arrConteo.etapa_id == 4) {
                            strUrl = strUrlImprimir.replace('0', arrConteo.orden);
                            strAction += `
                                <a class="btn btn-flat btn-sm btn-info" href="${strUrl}?confirmar=1" target="_blank" title="Ver">
                                    <span class="material-icons">visibility</span>
                                </a>
                            `;
                        }
                    }
                    if (borrar) {
                        if (arrConteo.etapa_id != 3 && arrConteo.etapa_id != 4) {
                            const strUrlHrfAnular = strUrlAnular.replace('0', arrConteo.orden);
                            strAction += `
                                <a class="btn btn-flat btn-sm btn-danger" href="${strUrlHrfAnular}" title="Anular">
                                    <span class="material-icons">block</span>
                                </a>
                            `;
                        }
                    }
                    const objRow = `
                        <tr>
                            <td>${arrConteo.orden}</td>
                            <td>${arrConteo.tipo}</td>
                            <td>${arrConteo.jefe}</td>
                            <td>${arrConteo.encargado}</td>
                            <td>${arrConteo.etapa}</td>
                            <td class="text-center">${arrConteo.creacion}</td>
                            <td class="text-center">${strAction}</td>
                        </tr>
                    `;

                    objTbody.insertAdjacentHTML('beforeend', objRow);
                }

                table = $('#ordenes').DataTable({
                    pagingType: 'numbers',
                    dom: "<'row buttons-container'<'col-12'B>><'row'<'col-6'l><'col-6'f>><'row'<'col-12'tr>><'row'<'col-12'p>>",
                    lengthMenu: [[25, 50, 100, -1], [25, 50, 100, "Todo"]],
                    buttons: [
                        buttons
                    ],
                    language: objLenguajeDataTable,
                    columnDefs: [
                        {
                            'targets': [5, 6],
                            'className': 'text-center',
                        },
                    ],
                    order: [[0, 'desc']],
                });

            }

        })
        .catch((error) => {
            close_loading();
            console.error(error);
        });
};

objGetConteos();
