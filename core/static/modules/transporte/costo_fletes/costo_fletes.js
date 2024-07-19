const drawTableData = async (objData) => {
    let strElements = '';
    if(Object.keys(objData).length > 0) {
        urlEditDetail = urlEditDetail.replace('0', '');
        objData.map(d => {
            let strActive = (d.estado) ? 'Activo' : 'Inactivo',
                strSize = (d.size_truck == 'container') ? 'Contenedor' : (d.size_truck == 'truck') ? 'Camion' : '',
                strUpdate = new Date(d.updated_at),
                day = zfill(strUpdate.getDate(), 2),
                month = zfill(strUpdate.getMonth() + 1, 2),
                year = strUpdate.getFullYear(),
                hours = strUpdate.getHours(),
                minutes = zfill(strUpdate.getMinutes(), 2),
                strProducto = d?.producto ? d.producto : '- - -',
                strFormatUpdate = `${day}-${month}-${year} ${hours}:${minutes}`;
            strElements += `<tr>
                                <td data-filter="${d.bodega_actual}">${d.bodega_actual}</td>
                                <td data-filter="${d.bodega_destino}">${d.bodega_destino}</td>
                                <td data-filter="${day}${month}${year}-${hours}${minutes}">${strFormatUpdate}</td>
                                <td data-filter="${strSize}">${strSize}</td>
                                <td data-filter="${d.precio}">${numberFormat.format( (d.precio * 1).toFixed(2) )}</td>
                                <td data-filter="${strProducto}">${strProducto}</td>
                                <td data-filter="${strActive}">${strActive}</td>
                                <td>
                                    <a type="button" rel="tooltip" class="btn btn-info btn-just-icon btn-link" data-original-title="Editar" href="${urlEditDetail}${d.id}">
                                        <i class="fas fa-edit"></i>
                                    </a>
                                </td>
                            </tr>`;
        });
    }
    document.getElementById('tBodyDefault').innerHTML = strElements;
};

const getDataList = async () => {
    open_loading();
    let formData = new FormData();
    formData.append('csrfmiddlewaretoken', valCSRF);
    const response = await fetch(urlGetData, {method: 'POST', body: formData});
    const data = await response.json();
    if (data.status) {
        await drawTableData(data.result);
        makeDataTableDefault();
    }
    else {
        let emlTr = `   <tr>
                            <td colspan="8" style='text-align:center;'>
                                No hay información a mostrar
                            </td>
                        </tr>`;
        document.getElementById('tBodyDefault').innerHTML = emlTr;
    }
    close_loading();
};

getDataList();