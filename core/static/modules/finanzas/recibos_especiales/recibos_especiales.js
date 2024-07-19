const drawHeadersTable = async () => {
    const cnt = document.getElementById('cntTablePrincipal');
    cnt.innerHTML = '';
    const table = ` <table id='dtDefault' class='table table-striped table-no-bordered table-hover' cellspacing='0' width='100%'>
                        <thead>
                            <tr>
                                <th>No.</th>
                                <th>Solicitante</th>
                                <th>Monto</th>
                                <th>Saldo</th>
                                <th>Fecha</th>
                                <th class="disabled-sorting">Opciones</th>
                            </tr>
                        </thead>
                        <tbody id='tBodyPrincipal'></tbody>
                        <tfoot>
                            <tr>
                                <th>No.</th>
                                <th>Solicitante</th>
                                <th>Monto</th>
                                <th>Saldo</th>
                                <th>Fecha</th>
                                <th>Opciones</th>
                            </tr>
                        </tfoot>
                    </table>`;
    cnt.insertAdjacentHTML('beforeend', table);
};

const imprimirVale = async (intVale = 0) => {
    let strUrlPrint = urlPrint.replace('0', intVale);
    window.open(strUrlPrint);
};

const drawTable = async (objData) => {
    await drawHeadersTable();
    if(Object.keys(objData).length > 0) {
        const cnt = document.getElementById('tBodyPrincipal');
        let strRows = '';
        objData.map(d => {
            let strUrlEdit = urlEdit.replace('0', d.NoVale);
            strRows += `<tr>
                            <td>${d.Numero}</td>
                            <td>${d.cliente}</td>
                            <td>${d.Valor}</td>
                            <td>${d.Saldo}</td>
                            <td>${d.Fecha}</td>
                            <td>
                                <a type='button', rel='tooltip' class='btn btn-link btn-just-icon btn-info' data-original-title='Editar' href="${strUrlEdit}">
                                    <i class='material-icons'>edit</i>
                                </a>
                                <button class="btn btn-link btn-just-icon btn-success" type="button" onclick="imprimirVale('${d.NoVale}');">
                                    <i class="material-icons">print</i>
                                </button>
                            </td>
                        </tr>`;
        });

        cnt.insertAdjacentHTML('beforeend', strRows);
    }
}

const getDataList = async () => {
    open_loading();
    let formData = new FormData();
    formData.append('csrfmiddlewaretoken', valCSRF);
    formData.append('fecha', document.getElementById('fecha').value);
    const response = await fetch(urlGetList, {method: 'POST', body: formData});
    let data = [];
    try {
        data = await response.json();
    } catch(error) {
        console.error(error);
        data = [];
    }
    close_loading();
    if(data?.status)
        drawTable(data?.data);
};

getDataList()