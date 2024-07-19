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

if (crear) {
    buttons.unshift({
        name: 'nuevo',
        className: 'btn-flat btn-azure',
        text: function (dt) {
            return '<i class="fa fa-plus"></i> ' + dt.i18n('buttons.create-alert', '<span class="hidden-xs">Nuevo</span>');
        },
        action: function () {
            window.location = window.location.href.replace(/\/+$/, "") + '/crear';
        }
    });
}

$('#vaciados').DataTable({
    order: [[0, 'desc']],
    pagingType: 'numbers',
    dom: "<'row buttons-container'<'col-12'B>><'row'<'col-6'l><'col-6'f>><'row'<'col-12'tr>><'row'<'col-12'p>>",
    lengthMenu: [[25, 50, 100, -1], [25, 50, 100, "Todo"]],
    buttons: [
        buttons
    ],
    language: objLenguajeDataTable,
    columnDefs: [
        {
            // 'targets': [5, 6],
            'className': 'text-center',
        },
    ]
});
