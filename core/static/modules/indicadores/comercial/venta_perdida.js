$("#divReport_1").dxPivotGrid({
    showColumnGrandTotals:true,
    showColumnTotals:true,
    showRowGrandTotals:true,
    showRowTotals:true,
    showBorders: true,
    allowSorting: true,
    allowFiltering: true,
    export: {
        enabled: true,
        fileName: "Venta Perdida",
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
    dataSource: {
        fields: [
            {
                dataField: "Producto",
                dataType: "string",
                area: "row",
                width: 300
            },
            {
                dataField: "Motivo",
                dataType: "string",
                area: "column"
            },
            {
                dataField: "Vendedor",
                dataType: "string",
                area: "row"
            },
            {
                dataField: "Cantidad",
                caption: "Cantidad Libras",
                area: "data",
                dataType: "number",
                summaryType: "sum",
                alignment: "right",
                allowFiltering: false,
                sortOrder: "desc"
            },
            {
                dataField: "Valor",
                caption: "Valor",
                area: "data",
                dataType: "number",
                summaryType: "sum",
                alignment: "right",
                allowFiltering: false,
                sortOrder: "desc",
                format: {
                    type: "currency",
                    precision: 2,
                    currency: "GTQ"
                }
            }
        ],
        store: data
    }
}).dxPivotGrid("instance");
