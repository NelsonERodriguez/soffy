const fntBuscarEmpresas = async () => {
    let strNomina = document.getElementById("nomina").value;

    document.getElementById("btnPdf").disabled = true;

    let formData = new FormData();
    formData.append('csrfmiddlewaretoken', valCSRF);
    formData.append('nomina', strNomina);

    let objInit = {
        method: 'POST',
        body: formData
    };

    open_loading();
    await coreFetch(strUrlGetEmpresas, objInit, async (data) => {
        if( data.status ){
            let objSelect = document.getElementById("empresa");

            objSelect.innerHTML = "";

            let objAttrs = {
                element: 'option',
                value: '0',
            };
            let objOptionDefault = await createElement(objAttrs);
            objOptionDefault.innerText = "Seleccione una empresa...";
            objSelect.appendChild(objOptionDefault);

            let objPromise;
            data.empresas.forEach( objPromise = async (key)=> {
                objAttrs = {
                    element: 'option',
                    value: key.no_empresa,
                };
                let objOptionProd = await createElement(objAttrs);
                objOptionProd.innerText = `${key.no_empresa} - ${key.razon_social}`;
                objSelect.appendChild(objOptionProd);
            });

            $("#empresa").select2();

            await fntBuscarPeriodos();
        }

        close_loading();
    });
}

const fntBuscarPeriodos = async () => {
    document.getElementById("btnPdf").disabled = true;
    let strNomina = document.getElementById("nomina").value,
        strEmpresa = document.getElementById("empresa").value;

    let formData = new FormData();
    formData.append('csrfmiddlewaretoken', valCSRF);
    formData.append('nomina', strNomina);
    formData.append('empresa', strEmpresa);

    let objInit = {
        method: 'POST',
        body: formData
    };

    open_loading();
    await coreFetch(strUrlGetPeriodos, objInit, async (data) => {
        if( data.status ){
            let objSelect = document.getElementById("periodo");

            objSelect.innerHTML = "";

            let objAttrs = {
                element: 'option',
                value: '0',
            };
            let objOptionDefault = await createElement(objAttrs);
            objOptionDefault.innerText = "Seleccione un periodo...";
            objSelect.appendChild(objOptionDefault);

            let objPromise;
            data.periodos.forEach( objPromise = async (key) => {
                objAttrs = {
                    element: 'option',
                    value: key.no_periodo.toString().trim(),
                };
                let objOptionProd = await createElement(objAttrs),
                    objInicial = new Date(`${key.fecha_inicial__date} 00:00:00`),
                    objFinal = new Date(`${key.fecha_final__date} 00:00:00`),
                    strInicial = dateGTFormat.format(objInicial),
                    strFinal = dateGTFormat.format(objFinal);
                objOptionProd.dataset.tipo_periodo = key.tipo_periodo;
                objOptionProd.dataset.fecha_inicial = key.fecha_inicial__date;
                objOptionProd.dataset.fecha_final = key.fecha_final__date;
                objOptionProd.innerText = `${key.tipo_periodo}: ${strInicial} - ${strFinal}`;
                objSelect.appendChild(objOptionProd);
            });

            $("#periodo").select2();
        }

        close_loading();
    });

}

const fntBuscar = async () => {
    let strNomina = document.getElementById("nomina").value,
        strEmpresa = document.getElementById("empresa").value,
        strPeriodo = document.getElementById("periodo").value;

    let formData = new FormData();
    formData.append('csrfmiddlewaretoken', getCookie('csrftoken'));
    formData.append('nomina', strNomina);
    formData.append('empresa', strEmpresa);
    formData.append('periodo', strPeriodo);

    let objInit = {
        method: 'POST',
        body: formData
    };

    fntCleanTable();

    open_loading();
    await coreFetch(strUrlGetNomina, objInit, async (data) => {
        tblNomina.rows.add(data.data).draw();
        tblNomina.responsive.recalc();
        tblNomina.columns.adjust();

        //$('[rel="tooltip"]').tooltip();

        close_loading();
    });
}

const fntCleanTable = () => {
    if (tblNomina) {
        //$(".ui-tooltip").remove();
        tblNomina.clear().draw();
    }
}

const fntMakePdf = () => {
    let strNomina = document.getElementById("nomina").value,
        strEmpresa = document.getElementById("empresa").value,
        strPeriodo = document.getElementById("periodo").value;

    if( strNomina.trim().length > 0 && strEmpresa.trim().length > 0 && strPeriodo.trim().length > 0 ){
        document.getElementById("hdnNomina").value = strNomina;
        document.getElementById("hdnEmpresa").value = strEmpresa;
        document.getElementById("hdnPeriodo").value = strPeriodo;
        document.getElementById("frm_impresion").submit();
    }
}

const fntHabilitarPdf = () => {
    let strPeriodo = document.getElementById("periodo").value;
    if( strPeriodo !== "0" ){
        document.getElementById("btnPdf").disabled = false;
    }
    else{
        document.getElementById("btnPdf").disabled = true;
    }
};

$(document).ready(function(){
    $("#empresa").select2();

    $("#periodo").select2();

    tblNomina = $('#tblNomina').DataTable({
        data:[],
        info: false,
        ordering: false,
        "pagingType": "full_numbers",
        "lengthMenu": [
            [-1, 10, 25, 50 ],
            ["Todos", 10, 25, 50]
        ],
        processing: true,
        retrieve: true,
        scrollX: true,
        dom: 'Blfrtip',
        columns: [

            { data: 'No_Empleado', width: '5%' },
            { data: 'NombreCompleto', width: '7.5%' },
            {
                data: 'Sueldo_Ordinario',
                class: 'text-right',
                render: $.fn.dataTable.render.number( ',', '.', 2),
                searchable: false
            },
            {
                data: 'Bonificacion_Productividad',
                class: 'text-right',
                render: $.fn.dataTable.render.number( ',', '.', 2),
                searchable: false
            },
            {
                data: 'OtrosIngresos',
                class: 'text-right',
                render: $.fn.dataTable.render.number( ',', '.', 2),
                searchable: false
            },
            {
                data: 'Bonificacion',
                class: 'text-right',
                render: $.fn.dataTable.render.number( ',', '.', 2),
                searchable: false
            },
            {
                data: 'Horas_Extras',
                class: 'text-right',
                render: $.fn.dataTable.render.number( ',', '.', 2),
                searchable: false
            },
            {
                data: 'Vacaciones',
                class: 'text-right',
                render: $.fn.dataTable.render.number( ',', '.', 2),
                searchable: false
            },
            {
                data: 'Total_Devengado',
                class: 'text-right',
                render: $.fn.dataTable.render.number( ',', '.', 2),
                searchable: false
            },
            {
                data: 'IGSS',
                class: 'text-right',
                render: $.fn.dataTable.render.number( ',', '.', 2),
                searchable: false
            },
            {
                data: 'ISR',
                class: 'text-right',
                render: $.fn.dataTable.render.number( ',', '.', 2),
                searchable: false
            },
            {
                data: 'Creditos',
                class: 'text-right',
                render: $.fn.dataTable.render.number( ',', '.', 2),
                searchable: false
            },
            {
                data: 'Prestamo',
                class: 'text-right',
                render: $.fn.dataTable.render.number( ',', '.', 2),
                searchable: false
            },
            {
                data: 'Celular',
                class: 'text-right',
                render: $.fn.dataTable.render.number( ',', '.', 2),
                searchable: false
            },
            {
                data: 'OtrosDescuentos',
                class: 'text-right',
                render: $.fn.dataTable.render.number( ',', '.', 2),
                searchable: false
            },
            {
                data: 'Liquido',
                class: 'text-right',
                render: $.fn.dataTable.render.number( ',', '.', 2),
                searchable: false
            },
            { data: 'NombreDepto', visible: false, searchable: true },

        ],
        buttons: [
            {
                extend: 'excel',
                text: '<i class="fa fa-file-excel-o"></i> Excel',
                className: 'btn-flat btn-aquadeep',
            },
        ],
        language: objLenguajeDataTable,

        rowGroup: {

            startRender: function (rows, group) {
                let strNoDepto = rows.data()[0].No_Depto;
                return $('<tr/>').append( '<td colspan="16" style="width: 100%;" class="text-left bg-info font-weight-bold">DEPARTAMENTO:  ' + strNoDepto + '   ' + (group.length > 0 ? group : 'Libre') + '</td></tr>' );
            },
            endRender: function ( rows, group ) {

                let sinSueldoOrdinario = rows.data().pluck('Sueldo_Ordinario').reduce( function (a, b) {
                    return parseFloat(a) + parseFloat(b);
                }, 0);

                let sinBonificacionProductividad = rows.data().pluck('Bonificacion_Productividad').reduce( function (a, b) {
                    return parseFloat(a) + parseFloat(b);
                }, 0);

                let sinOtrosIngresos = rows.data().pluck('OtrosIngresos').reduce( function (a, b) {
                    return parseFloat(a) + parseFloat(b);
                }, 0);

                let sinBonificacion = rows.data().pluck('Bonificacion').reduce( function (a, b) {
                    return parseFloat(a) + parseFloat(b);
                }, 0);

                let sinHorasExtras = rows.data().pluck('Horas_Extras').reduce( function (a, b) {
                    return parseFloat(a) + parseFloat(b);
                }, 0);

                let sinVacaciones = rows.data().pluck('Vacaciones').reduce( function (a, b) {
                    return parseFloat(a) + parseFloat(b);
                }, 0);

                let sinTotalDevengado = rows.data().pluck('Total_Devengado').reduce( function (a, b) {
                    return parseFloat(a) + parseFloat(b);
                }, 0);

                let sinIgss = rows.data().pluck('IGSS').reduce( function (a, b) {
                    return parseFloat(a) + parseFloat(b);
                }, 0);

                let sinIsr = rows.data().pluck('ISR').reduce( function (a, b) {
                    return parseFloat(a) + parseFloat(b);
                }, 0);

                let sinCreditos = rows.data().pluck('Creditos').reduce( function (a, b) {
                    return parseFloat(a) + parseFloat(b);
                }, 0);

                let sinPrestamo = rows.data().pluck('Prestamo').reduce( function (a, b) {
                    return parseFloat(a) + parseFloat(b);
                }, 0);

                let sinCelular = rows.data().pluck('Celular').reduce( function (a, b) {
                    return parseFloat(a) + parseFloat(b);
                }, 0);

                let sinOtrosDescuentos = rows.data().pluck('OtrosDescuentos').reduce( function (a, b) {
                    return parseFloat(a) + parseFloat(b);
                }, 0);

                let sinLiquido = rows.data().pluck('Liquido').reduce( function (a, b) {
                    return parseFloat(a) + parseFloat(b);
                }, 0);

                return $('<tr/>')
                .append( '<td colspan="2" style="width: 12.5%;" class="text-left font-weight-bold">TOTAL DEPARTAMENTO</td>' )
                .append( '<td class="text-right font-weight-bold">' + $.fn.dataTable.render.number(',', '.', 2).display( sinSueldoOrdinario ) + '</td></tr>')
                .append( '<td class="text-right font-weight-bold">' + $.fn.dataTable.render.number(',', '.', 2).display( sinBonificacionProductividad ) + '</td></tr>')
                .append( '<td class="text-right font-weight-bold">' + $.fn.dataTable.render.number(',', '.', 2).display( sinOtrosIngresos ) + '</td></tr>')
                .append( '<td class="text-right font-weight-bold">' + $.fn.dataTable.render.number(',', '.', 2).display( sinBonificacion ) + '</td></tr>')
                .append( '<td class="text-right font-weight-bold">' + $.fn.dataTable.render.number(',', '.', 2).display( sinHorasExtras ) + '</td></tr>')
                .append( '<td class="text-right font-weight-bold">' + $.fn.dataTable.render.number(',', '.', 2).display( sinVacaciones ) + '</td></tr>')
                .append( '<td class="text-right font-weight-bold">' + $.fn.dataTable.render.number(',', '.', 2).display( sinTotalDevengado ) + '</td></tr>')
                .append( '<td class="text-right font-weight-bold">' + $.fn.dataTable.render.number(',', '.', 2).display( sinIgss ) + '</td></tr>')
                .append( '<td class="text-right font-weight-bold">' + $.fn.dataTable.render.number(',', '.', 2).display( sinIsr ) + '</td></tr>')
                .append( '<td class="text-right font-weight-bold">' + $.fn.dataTable.render.number(',', '.', 2).display( sinCreditos ) + '</td></tr>')
                .append( '<td class="text-right font-weight-bold">' + $.fn.dataTable.render.number(',', '.', 2).display( sinPrestamo ) + '</td></tr>')
                .append( '<td class="text-right font-weight-bold">' + $.fn.dataTable.render.number(',', '.', 2).display( sinCelular ) + '</td></tr>')
                .append( '<td class="text-right font-weight-bold">' + $.fn.dataTable.render.number(',', '.', 2).display( sinOtrosDescuentos ) + '</td></tr>')
                .append( '<td class="text-right font-weight-bold">' + $.fn.dataTable.render.number(',', '.', 2).display( sinLiquido ) + '</td></tr>')
            },
            dataSrc: "NombreDepto"
        },

        footerCallback: function ( row, data, start, end, display ) {
            var api = this.api(), data;

            var intVal = function ( i ) {
                return typeof i === 'string' ?
                i.replace(/[\$,]/g, '')*1 :
                typeof i === 'number' ?
                i : 0.00;
            };

            total = api.column(6).data().reduce( function (a, b) {
                return intVal(a) + intVal(b);
            }, 0 );

            $( api.column( 6 ).footer() ).html(
            $.fn.dataTable.render.number(',', '.', 2).display( total ));
        }
    });
});