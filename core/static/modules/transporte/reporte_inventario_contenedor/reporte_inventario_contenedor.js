const btnReporte = document.getElementById('btnReporte');

if (btnReporte) {

    btnReporte.addEventListener('click', () => {
       dialogConfirm(simple_submit, 'frm_reporte_contenedores');
    });

}

$(document).ready(function() {
    $('#datatables').DataTable({
        "pagingType": "full_numbers",
        "lengthMenu": [
            [10, 25, 50, -1],
            [10, 25, 50, "All"]
        ],
        responsive: true,
        language: objLenguajeDataTable,
    });
});
