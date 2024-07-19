$(".reporte").dxPivotGrid({
    allowFiltering: true,
    allowSorting: true,
    // allowSortingBySummary: true,
    // height: 570,
    showBorders: true,
    headerFilter: {
      allowSearch: true,
      showRelevantValues: true,
      width: 300,
      height: 400,
    },
    // fieldChooser: {
    //   allowSearch: true,
    // },
    export: {
        enabled: true,
        fileName: "Presupuesto anual de vendedores",
    },
    fieldChooser: {
        allowSearch: false,
        applyChangesMode: "instantly",
        enabled: true,
        height: 600,
        layout: 0,
        searchTimeout: NaN,
        title: "Tabla dinamica",
        width: 400,
        texts: {
            allFields: "Campos",
            columnFields: "Columnas",
            dataFields: "Valores",
            rowFields: "Filas",
            filterFields: "Filtros"
        }
    },
    fieldPanel: {
      visible: true,
    },
    dataSource: {
        fields: [
            {
              dataField: 'Nombre',
              area: 'filter',
              // filterValues: ['Cesar Estuardo Pineda Morataya'],
            },
            {
                dataField: "Descripcion",
                dataType: "string",
                area: "row",
            },
            {
                dataField: "mes",
                dataType: "number",
                area: "column"
            },
            {
                dataField: "Unidades",
                area: "data",
                summaryType: "sum",
                dataType: "number",
                alignment: "right",
                format: {
                    decimal: 2
                }
            },
        ],
        store: objDatos
    },
    // onCellClick(e) {
    //   if (e.area === 'data') {
    //       console.log(e, 'EVENT');
    //     const pivotGridDataSource = e.component.getDataSource();
    //     // const rowPathLength = e.cell.rowPathLengthowPath.length;
    //     // const rowPathName = e.cell.rowPath[rowPathLength - 1];
    //     console.log(pivotGridDataSource);
    //     console.log(pivotGridDataSource._descriptions.filters[0].filterValues[0]);
    //     console.log(e.cell.value);
    //     console.log(pivotGridDataSource._data.columns[e.columnIndex].value);
    //     console.log(pivotGridDataSource._data.rows[e.rowIndex].value);
    //     // console.log(rowPathName);
    //
    //   }
    // },
    // onCellPrepared(e) {
    //     if (e.area === 'data') {
    //         console.log(e)
    //         var pivotGridDataSource = e.component.getDataSource();
    //         var drillDownDataSource = pivotGridDataSource.createDrillDownDataSource(e.cell);
    //         drillDownDataSource.paginate(false);
    //
    //         drillDownDataSource.load().
    //         then((data) => {
    //                 if (data.length) {
    //                     // e.cellElement.css('color', '#ED8585');
    //                         console.log(e.cellElement);
    //                 }
    //             },
    //             (error) => { /* Handle the "error" here */ }
    //         );
    //     }
    // }
    // onCellPrepared: function(e) {
    //     if(typeof(e.cell.rowPath) !== 'undefined') {
    //         console.log(e);
    //         // e.cell.value = 1;
    //         e.cellElement[0].innerHTML = `<input type="number" class="form-control" value="${e.cell.value}" onchange="${e.cell.value = this.value}">`
    //         // e.cellElement.css("font-size", "14px");
    //         // e.cellElement.css("font-weight", "bold");
    //     }
    // }
}).dxPivotGrid("instance");
