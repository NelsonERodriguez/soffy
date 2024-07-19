const setSaldo = async () => {
    const cntSaldo = document.getElementById('saldo'),
        cntHidden = document.getElementById('saldo-hidden'),
        cntValor = document.getElementById('valor');
    
    let prevResult = parseFloat(cntValor.value) - 0;
    let intResult = parseFloat(prevResult);
    cntSaldo.value = intResult;
    cntHidden.value = intResult;
};

const updateIntRowsShow = async () => {
    let objElmRows = document.querySelectorAll('tr[role="row"]'),
        intRow = 1;
    objElmRows.forEach(elm => {
        let intElmRow = elm.getAttribute('row');
        if(intElmRow) {
            let elmLine = document.getElementById(`line_${intElmRow}`);
            if(elmLine) {
                elmLine.innerText = intRow;
                intRow++;
            }
        }
    });
};

const deleteRow = async (boolExist, intRow) => {
    const elmRow = document.getElementById(`row_${intRow}`);
    if(elmRow) {
        if(boolExist)
            alert_nova.showNotification('¡Recuerda guardar tus cambios!', 'warning', 'warning');
        elmRow.remove();
        await updateSaldo();
        await updateIntRowsShow();
    }
};

const validateSaldo = async () => {
    let objElmRows = document.querySelectorAll('tr[role="row"]'),
        objElmValor = document.getElementById('valor'),
        totalSum = 0,
        intRow = 1,
        boolError = false;
    objElmRows.forEach(elm => {
        let intElmRow = elm.getAttribute('row');
        if(intElmRow && !boolError) {
            let elmValor = document.getElementById(`valor_${intRow}`);
            if(elmValor && objElmValor)
                if(elmValor.value == 0)
                    boolError = true;
                totalSum += parseFloat(elmValor.value);
            intRow = parseInt(intElmRow) + 1;
        }
    });

    if(objElmValor && !boolError) {
        if(parseFloat(objElmValor.value) >= totalSum)
            return true;
        return false;
    }
    return false;
};

const updateSaldo = async () => {
    let objElmRows = document.querySelectorAll('tr[role="row"]'),
        objElmValor = document.getElementById('valor'),
        objElmSaldo = document.getElementById('saldo'),
        objElmSaldoHidden = document.getElementById('saldo-hidden'),
        totalSum = 0,
        intRow = 1;
    objElmRows.forEach(elm => {
        let intElmRow = elm.getAttribute('row');
        if(intElmRow) {
            let elmValor = document.getElementById(`valor_${intRow}`);
            if(elmValor && objElmValor)
                totalSum += parseFloat(elmValor.value);
            intRow = parseInt(intElmRow) + 1;
        }
    });

    if(objElmValor) {
        let intResultSaldo = parseFloat(objElmValor.value) - parseFloat(totalSum);
        objElmSaldo.value = intResultSaldo;
        objElmSaldoHidden.value = intResultSaldo;
    }
    else {
        objElmSaldo.value = 0;
        objElmSaldoHidden.value = 0;
    }
};

const changeValor = async (elm) => {
    const boolValidate = await validateSaldo();
    if(!boolValidate) {
        elm.value = 0;
        alert_nova.showNotification('Cantidad excede el saldo.', 'warning', 'danger');
    }
    await updateSaldo();
};

const setRowTable = async () => {
    open_loading();
    const boolValidate = await validateSaldo();
    if(boolValidate) {
        const cntTable = document.getElementById('tBodyRecibos');
        let objElmRows = document.querySelectorAll('tr[role="row"]'),
            objElmValor = document.getElementById('valor'),
            intRow = 1,
            intRowShow = 1;

        objElmRows.forEach(elm => {
            let intElmRow = elm.getAttribute('row');
            if(intElmRow) {
                intRow = parseInt(intElmRow) + 1;
                intRowShow++;
            }
        });

        let newTr = `   <tr row='${intRow}' id="row_${intRow}" role="row">
                            <td id='line_${intRow}'>
                                ${intRowShow}
                            </td>
                            <td>
                                <input type="text" id="banco_${intRow}-show" class="form-control" value='' placeholder='Busca tu Banco' />
                                <input type="hidden" name="banco[]" id="banco_${intRow}" />
                            </td>
                            <td>
                                <input id='valor_${intRow}' onchange='changeValor(this)' name='valor[]' type='number' class='form-control' placeholder='Valor' autocomplete="off" />
                            </td>
                            <td>
                                <input id='fecha_${intRow}' name='fecha[]' type='date' class='form-control' value='${strDefaultFecha}' />
                            </td>
                            <td>
                                <input id='no_cheque_${intRow}' name='no_cheque[]' type='text' class='form-control' placeholder='No. Cheque' autocomplete="off" />
                            </td>
                            <td>
                                <button id='delete_${intRow}' class='btn btn-just-icon btn-link btn-danger' type='button' onclick='deleteRow(false, "${intRow}")' />
                                    <i class='fa fa-trash'></i>
                                </button>
                            </td>
                        </tr>`;
        cntTable.insertAdjacentHTML('beforeend', newTr);
        setAutocomplete(`banco_${intRow}`);
    }
    close_loading();
};

const setAutocomplete = async (strSearch = 'empresas') => {
    let objInput = document.getElementById(`${strSearch}-show`),
        intMinLength = 0,
        strSendSearch = "",
        objElementToSend = document.getElementById(`${strSearch}`);
    
    if(strSearch.search('empresas') >= 0) {
        strSendSearch = strUrlGetEmpresas;
        intMinLength = 4;
    }
    else if(strSearch.search('clientes') >= 0) {
        strSendSearch = strUrlGetClientes;
        intMinLength = 2;
    }
    else if(strSearch.search('tipos') >= 0) {
        strSendSearch = strUrlGetTipos;
        intMinLength = 1;
    }
    else if(strSearch.search('banco') >= 0) {
        strSendSearch = strUrlGetBancos;
        intMinLength = 1;
    }
    
    $(objInput).autocomplete({
        minLength: 1,
        source: function( request, response ) {
            const form = new FormData();
            const csrftoken = getCookie('csrftoken');
            form.append('busqueda', request.term);
            open_loading();

            fetch(strSendSearch, {
                method: 'POST',
                headers: { "X-CSRFToken": csrftoken },
                body: form
            })
            .then(response => response.json())
            .then( (data) => {
                close_loading();
                let objProducts = data.data;
                response( objProducts.map(item => {
                    return {
                        label: item.name,
                        value: item.id
                    }
                }));
            })
            .catch((error) => {
                close_loading();
                console.error(error);
                alert_nova.showNotification('Error de conexión, comuníquese con IT.', "warning", "danger");
            });
        },
        select: function( event, ui ) {
            event.preventDefault();
            const strData = ui.item.label,
                intData = ui.item.value;
            this.value = strData;
            objElementToSend.value = intData;
        }
    })
    .focus(function () {
        this.value = '';
        objElementToSend.value = 0;
    });

};

const validateForm = async () => {
    open_loading();
    let boolDone = true;
    const elmClientes = document.getElementById('clientes'),
        elmTipos = document.getElementById('tipos'),
        elmEmpresa = document.getElementById('empresas'),
        elmValor = document.getElementById('valor');
    if(elmClientes.value == '' || elmClientes.value == '0')
        boolDone = false;
    if(elmTipos.value == '' || elmTipos.value == '0')
        boolDone = false;
    if(elmEmpresa.value == '' || elmEmpresa.value == '0')
        boolDone = false;
    if(elmValor.value == '' || elmValor.value <= 0)
        boolDone = false;
    close_loading();
    return boolDone;
};

const sendForm = async () => {
    open_loading();
    let formData = new FormData(document.getElementById('frm-general'));
    let response = await fetch(strUrlSave, {method: 'POST', body: formData});
    let data = [];
    try {
        data = await response.json();
    } catch(error) {
        data = [];
        console.error(error);
    }
    close_loading();
    if(data?.status) {
        if(data.status)
            alert_nova.showNotification(data.message);
        else
            alert_nova.showNotification(data.message, 'warning', 'danger');
        setTimeout(() => {
            location.href = strUrlBase;
        }, 2500);
    }
};

const sendToSave = async () => {
    let boolForm = await validateForm();
    if(boolForm)
        sendForm();
    else
        alert_nova.showNotification('No puedes guardar por que no tienes información completa.', 'warning', 'danger');
};

if (btnSave) {
    btnSave.addEventListener('click', () => {
        sendToSave();
    });
    btnSave.addEventListener('dblclick', () => {
        errorDblClick();
    });
}

setAutocomplete('empresas');
setAutocomplete('clientes');
setAutocomplete('tipos');