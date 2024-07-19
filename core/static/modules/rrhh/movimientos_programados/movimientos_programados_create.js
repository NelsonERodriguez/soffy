const getEmployee = async (event, objElement, strNomina) => {
    if (typeof event.key === "undefined" || event.key === "ArrowLeft" || event.key === "ArrowRight" ||
        event.key === "ArrowRight" || event.key === "ArrowUp" || event.key === "ArrowDown" ||
        event.key === " " || event.key === "Meta" || event.key === "Tab" || event.key === "Shift" ||
        event.key === "CapsLock" || event.key === "Alt") return false;

    open_loading();
    if((objElement.value).length >= 2 ) {
        let formData = new FormData();
        formData.append('name', objElement.value);
        formData.append('nomina', document.getElementById(strNomina).value);
        formData.append('csrfmiddlewaretoken', valCSRF);
        const response = await fetch(urlGetInfoUsers, {method: 'POST', body: formData});
        const data = await response.json();

        if(data?.status) {
            const content = document.getElementById(objElement.getAttribute('list'));
            let strOptions = '';
            if(Object.keys(data['response']).length > 0) {
                data['response'].map(employee => {
                    strOptions += `<option value="${employee.No_Empleado}">${employee.Nombres} ${employee.Apellidos}</option>`;
                });
                content.innerHTML = strOptions;
            }
            else
                alert_nova.showNotification('No hay empleados a mostrar.', 'warning', 'danger');
        }
        else
            alert_nova.showNotification('Ocurrió un error en obtener los movimientos.', 'warning', 'danger');
    }
    close_loading();
};

const save = async (formData) => {
    open_loading();
    const response = await fetch(urlSave, { method: 'POST', body: formData });
    const data = await response.json();
    close_loading();
    if(data?.status && data.status) {
        alert_nova.showNotification(data.message, 'add_alert', 'success');
        setTimeout(() => { location.reload() }, 2500)
    }
    else {
        alert_nova.showNotification(data.message, 'warning', 'danger');
    }
};

const makeToSave = async () => {
    let formData = new FormData();
    formData.append('csrfmiddlewaretoken', valCSRF);
    formData.append('nomina', document.getElementById('slt_nomina_other').value);
    formData.append('employee', document.getElementById('employee_other').value);
    formData.append('key', document.getElementById('key_other').value);
    formData.append('period', document.getElementById('period_other').value);
    formData.append('init', document.getElementById('init_other').value);
    formData.append('end', document.getElementById('end_other').value);
    formData.append('observations', document.getElementById('observations_other').value);
    formData.append('quote', document.getElementById('quote_other').value);
    formData.append('total', document.getElementById('total_other').value);
    await save(formData);
};

const makeToSaveFigua = async () => {
    let formData = new FormData(document.getElementById('formSaveFigua'));
    formData.append('csrfmiddlewaretoken', valCSRF);
    formData.append('employee', document.getElementById('employee_figua').value);
    formData.append('nomina', document.getElementById('slt_nomina_figua').value);
    formData.append('months', document.getElementById('months_figua').value);

    const response = await fetch(urlSaveFigua, {method: 'POST', body: formData});
    const data = await response.json();

    if(data?.status) {
        alert_nova.showNotification(data.message, 'add_alert', 'success');
        setTimeout(() => {
            location.reload();
        }, 2500);
    }
    else {
        alert_nova.showNotification(data.message, 'warning', 'danger');
    }
}

const makeToSaveUpa = async () => {
    let formData = new FormData(document.getElementById('formSaveUpa'));
    formData.append('csrfmiddlewaretoken', valCSRF);
    formData.append('employee', document.getElementById('employee_upa').value);
    formData.append('nomina', document.getElementById('slt_nomina_upa').value);
    formData.append('type_payment', document.getElementById('type_payment_upa').value);
    let intQuantityQuotes = document.getElementById('quantity_quotes_upa').value;
    if(document.getElementById('type_payment_upa').value == 'F') {
        intQuantityQuotes = (intQuantityQuotes * 1) * 2;
    }
    formData.append('quantity_quotes', intQuantityQuotes);

    const response = await fetch(urlSaveUpa, {method: 'POST', body: formData});
    const data = await response.json();

    if(data?.status) {
        alert_nova.showNotification(data.message, 'add_alert', 'success');
        setTimeout(() => {
            location.reload();
        }, 2500);
    }
    else {
        alert_nova.showNotification(data.message, 'warning', 'danger');
    }
};

const goBack = () => { window.location = urlBase };

const clearContent = async (strElementID) => {
    let elem = document.getElementById('family');
    if(elem){
        const elements = document.querySelectorAll('.tab-pane');
        elements.forEach(element => { element.innerHTML = ''; });
    }
    const content = document.getElementById(`${strElementID}`);
    content.innerHTML = `<input type='hidden' id='family' value='${strElementID}' />`;
}

const elementsPeriodTypes = async () => {
    let strReturn = '';
    if(Object.keys(objPeriods).length > 0){
        let slt_nomina_other = document.getElementById('slt_nomina_other'),
            objToDraw = [];
        if (slt_nomina_other)
            objToDraw = (typeof objPeriods[slt_nomina_other.value] != 'undefined') ? objPeriods[slt_nomina_other.value] : [];
        else if (objKeysDiscounts?.nominagb)
            objToDraw = objPeriods.nominagb;
        objToDraw.map(period => {
            strReturn += `<option value="${period.CodigoTipo}">${period.Descripcion}</option>`;
        });
    }
    else {
        strReturn += `<option value="0">No hay tipos de periodo</option>`;
    }
    return strReturn;
};

const elementsKeys = async () => {
    let strReturn = '';
    if(Object.keys(objKeysDiscounts).length > 0){
        let slt_nomina_other = document.getElementById('slt_nomina_other'),
            objToDraw = [];
        if(slt_nomina_other)
            objToDraw = (typeof objKeysDiscounts[slt_nomina_other.value] != 'undefined') ? objKeysDiscounts[slt_nomina_other.value] : [];
        else if (objKeysDiscounts?.nominagb)
            objToDraw = objKeysDiscounts.nominagb;

        objToDraw.map(key => {
            strReturn += `<option value="${key.Clave}">${key.Descripcion}</option>`;
        });
    }
    else {
        strReturn += `<option value="0">No hay llaves a mostrar</option>`;
    }
    return strReturn;
};

const elementsNominas = async () => {
    let strReturn = '';
    if(Object.keys(objNominas).length > 0){
        objNominas.map(nomina => {
            strReturn += `<option value="${nomina.str_for_query}">${nomina.name}</option>`;
        });
    }
    else {
        strReturn += `<option value="nominagb">Solo se configuró la nomina general</option>`;
    }
    return strReturn;
}

const drawTableQuotesFigua = async (objData) => {
    let strRows = '',
        totalDays = 0,
        totalQuoteCapital = 0,
        totalQuoteInterest = 0,
        totalQuoteTotal = 0;
    objData.map(detail => {
        totalDays += (detail.days * 1);
        totalQuoteCapital += ((detail.capital_quote * 1).toFixed(2) * 1);
        totalQuoteInterest += ((detail.interest_quote * 1).toFixed(2) * 1);
        totalQuoteTotal += ((detail.total_quote * 1).toFixed(2) * 1);
        strRows += `<tr>
                        <td>
                            ${detail.date_payment}
                            <input type='hidden' name='date_init[]' value='${detail.date_payment}' />
                            <input type='hidden' name='end_payment[]' value='${detail.end_payment}' />
                        </td>
                        <td>
                            <input class='form-control' type='number' value='${detail.days}' disabled />
                        </td>
                        <td>
                            <input class='form-control' type='number' name='capital_quote[]' value='${detail.capital_quote}' />
                        </td>
                        <td>
                            <input class='form-control' type='number' name='interest_quote[]' value='${detail.interest_quote}' />
                        </td>
                        <td>
                            <input class='form-control' type='number' name='total_quote[]' value='${detail.total_quote}' />
                        </td>
                        <td>
                            <input class='form-control' type='number' name='residual[]' value='${detail.residual}' />
                        </td>
                    </tr>`;
    });

    const table = ` <form type='POST' id='formSaveFigua'>
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Fecha Prevista de pago</th>
                                    <th>Dias</th>
                                    <th>Cuota Capital</th>
                                    <th>Cuota Interés</th>
                                    <th>Cuota Total</th>
                                    <th>Deuda Residual</th>
                                </tr>
                            </thead>
                            <tbody>${strRows}</tbody>
                            <tfoot>
                                <tr>
                                    <th>TOTALES</th>
                                    <th>${numberFormat.format(totalDays * 1)}</th>
                                    <th>${numberFormat.format((totalQuoteCapital * 1).toFixed(2))}</th>
                                    <th>${numberFormat.format((totalQuoteInterest * 1).toFixed(2))}</th>
                                    <th>${numberFormat.format((totalQuoteTotal * 1).toFixed(2))}</th>
                                    <th></th>
                                </tr>
                            </tfoot>
                        </table>
                    </form>`;
    document.getElementById('cntTableQuotesFigua').innerHTML = table;

    let btnSave = ` <div class="col text-center">
                        <button class="btn btn-outline-success" type="button" id="btnSaveFigua" onclick='makeToSaveFigua()'>
                            <i class="fa fa-save"></i>
                            Guardar
                        </button>
                    </div>`;
    document.getElementById('cntBtnSaveFigua').innerHTML = btnSave;
};

const drawTableQuotesUPA = async (objData) => {
    let strRows = '',
        intRow = 1;

    objData.map(detail => {
        strRows += `<tr>
                        <td>${intRow}</td>
                        <td>Inicio: ${detail.date_init} Fin: ${detail.date_end}</td>
                        <td>
                            Q ${detail.quote}
                            <input type='hidden' name='date_init[]' value='${detail.date_init}' />
                            <input type='hidden' name='date_end[]' value='${detail.date_end}' />
                            <input type='hidden' name='quote[]' value='${detail.quote}' />
                        </td>
                    </tr>`;
        intRow++;
    });

    const table = ` <form type='POST' id='formSaveUpa'>
                        <table class='table'>
                            <thead>
                                <tr>
                                    <th>No. Cuota</th>
                                    <th>Fecha</th>
                                    <th>Monto</th>
                                <tr>
                            </thead>
                            <tbody>${strRows}</tbody>
                        </table>
                    </form>`;
    document.getElementById('cntTableQuotesUpa').innerHTML = table;

    let btnSave = ` <div class="col text-center">
                        <button class="btn btn-outline-success" type="button" id="btnSaveUpa" onclick='makeToSaveUpa()'>
                            <i class="fa fa-save"></i>
                            Guardar
                        </button>
                    </div>`;
    document.getElementById('cntBtnSaveUpa').innerHTML = btnSave;
};

const sendFormToCalculateFigua = async () => {
    open_loading();
    let formData = new FormData();
    formData.append('csrfmiddlewaretoken', valCSRF);
    formData.append('contabilidad', document.getElementById('slt_nomina_figua').value);
    formData.append('employee', document.getElementById('employee_figua').value);
    formData.append('interest', document.getElementById('interest_figua').value);
    formData.append('amount', document.getElementById('amount_figua').value);
    formData.append('months', document.getElementById('months_figua').value);
    formData.append('date_init', document.getElementById('date_init_figua').value);
    formData.append('date_first_quote', document.getElementById('date_first_quote_figua').value);

    const response = await fetch(urlCalculateFigua, {method: 'POST', body: formData})
    const data = await response.json();
    if(data?.status) {
        await drawTableQuotesFigua(data.arr_data);
    }
    else {
        alert_nova.showNotification(data.message, 'warning', 'danger')
    }
    close_loading();
};

const sendFormToCalculateUPA = async () => {
    open_loading();
    let formData = new FormData();
    formData.append('csrfmiddlewaretoken', valCSRF);
    formData.append('contabilidad', document.getElementById('slt_nomina_upa').value);
    formData.append('employee', document.getElementById('employee_upa').value);
    formData.append('quantity_quotes', document.getElementById('quantity_quotes_upa').value);
    formData.append('total_quote', document.getElementById('total_quote_upa').value);
    formData.append('last_quote', document.getElementById('last_quote_upa').value);
    formData.append('date_first_quote', document.getElementById('date_first_quote_upa').value);
    formData.append('type_payment', document.getElementById('type_payment_upa').value);

    const response = await fetch(urlCalculateUPA, {method: 'POST', body: formData})
    const data = await response.json();
    if(data?.status) {
        await drawTableQuotesUPA(data.arr_data);
    }
    else {
        alert_nova.showNotification(data.message, 'warning', 'danger')
    }
    close_loading();
};

const drawFormQuotesFigua = async () => {
    const content = document.getElementById('cuotas_figua');
    let strNominas = await elementsNominas();
    let elements = `<div class="row">
                        <div class="col-12 col-md-4 col-lg-3 cntInputDataForm">
                            <label class="bmd-label-floating">Selecciona Contabilidad</label>
                            <select name="slt_nomina_figua" id="slt_nomina_figua" class="form-control">
                                ${strNominas}
                            </select>
                        </div>
                        <div class="col-12 col-md-4 col-lg-3 cntInputDataForm">
                            <label for="employee_figua" class="bmd-label-floating">Empleado</label>
                            <input id='employee_figua' type='text' class='form-control' name='employee_figua' list='list_employee_figua' autocomplete='off' onkeyup='getEmployee(event, this, "slt_nomina_figua")' />
                            <datalist id="list_employee_figua"></datalist>
                        </div>
                        <div class="col-12 col-md-4 col-lg-3 cntInputDataForm">
                            <label for="interest_figua" class="bmd-label-floating">Tasa de Interes</label>
                            <input id='interest_figua' type='number' class='form-control' value='12' name='interest_figua' disabled />
                        </div>
                        <div class="col-12 col-md-4 col-lg-3 cntInputDataForm">
                            <label for="amount_figua" class="bmd-label-floating">Monto</label>
                            <input id='amount_figua' type='number' class='form-control' name='amount_figua' value='0' />
                        </div>
                        <div class="col-12 col-md-4 col-lg-3 cntInputDataForm">
                            <label for="months_figua" class="bmd-label-floating">Plazo en Meses</label>
                            <input id='months_figua' type='number' class='form-control' name='months_figua' value='12'/>
                        </div>
                        <div class="col-12 col-md-4 col-lg-3 cntInputDataForm">
                            <label for="date_init_figua" class="bmd-label-floating">Fecha de Entrega</label>
                            <input id='date_init_figua' type='date' class='form-control' name='date_init_figua' value='${dateNow}' />
                        </div>
                        <div class="col-12 col-md-4 col-lg-3 cntInputDataForm">
                            <label for="date_first_quote_figua" class="bmd-label-floating">Fecha Primera Cuota</label>
                            <input id='date_first_quote_figua' type='date' class='form-control' name='date_first_quote_figua' value='${dateNow}' />
                        </div>
                    </div>
                    <div class='row'>
                        <div class='col text-center btnCalculate'>
                            <button class="btn btn-outline-primary" type="button" id="btnCalculateFigua" onclick='sendFormToCalculateFigua();'>
                                <i class="fas fa-calculator"></i>
                                Calcular
                            </button>
                        </div>
                    </div>
                    <div class='row' id='cntTableQuotesFigua'></div>
                    <div class="row" style="margin-top: 45px;" id='cntBtnSaveFigua'></div>`;
    content.innerHTML = elements;
};

const drawFormQuotesUpa = async () => {
    const content = document.getElementById('cuotas_upa');
    let strNominas = await elementsNominas();
    let elements = `<div class="row">
                        <div class="col-12 col-md-4 col-lg-3 cntInputDataForm">
                            <label class="bmd-label-floating">Selecciona Contabilidad</label>
                            <select name="slt_nomina_upa" id="slt_nomina_upa" class="form-control">
                                ${strNominas}
                            </select>
                        </div>
                        <div class="col-12 col-md-4 col-lg-3 cntInputDataForm">
                            <label for="employee_upa" class="bmd-label-floating">Empleado</label>
                            <input id='employee_upa' type='text' class='form-control' name='employee_upa' list='list_employee_upa' autocomplete='off' onkeyup='getEmployee(event, this, "slt_nomina_upa")' />
                            <datalist id="list_employee_upa"></datalist>
                        </div>
                        <div class="col-12 col-md-4 col-lg-3 cntInputDataForm">
                            <label for="quantity_quotes_upa" class="bmd-label-floating">Cantidad de Cuotas</label>
                            <input id='quantity_quotes_upa' type='number' class='form-control' name='quantity_quotes_upa' />
                        </div>
                        <div class="col-12 col-md-4 col-lg-3 cntInputDataForm">
                            <label for="total_quote_upa" class="bmd-label-floating">Total Cuota Nivelada</label>
                            <input id='total_quote_upa' type='number' class='form-control' name='total_quote_upa' />
                        </div>
                        <div class="col-12 col-md-4 col-lg-3 cntInputDataForm">
                            <label for="last_quote_upa" class="bmd-label-floating">Total Ultima Cuota</label>
                            <input id='last_quote_upa' type='number' class='form-control' name='last_quote_upa' />
                        </div>
                        <div class="col-12 col-md-4 col-lg-3 cntInputDataForm">
                            <label for="date_first_quote_upa" class="bmd-label-floating">Fecha Primera Cuota</label>
                            <input id='date_first_quote_upa' type='date' class='form-control' name='date_first_quote_upa' value='${dateNow}' />
                        </div>
                        <div class="col-12 col-md-4 col-lg-3 cntInputDataForm">
                            <label for="type_payment_upa" class="bmd-label-floating">Forma de Pago</label>
                            <select id='type_payment_upa' class='form-control' name='type_payment_upa'>
                                <option value='F'>Frecuente</option>
                                <option value='Q'>Quincenal</option>
                                <option value='M'>Mensual</option>
                            </select>
                        </div>
                    </div>
                    <div class='row'>
                        <div class='col text-center btnCalculate'>
                            <button class="btn btn-outline-primary" type="button" id="btnCalculateUpa" onclick='sendFormToCalculateUPA();'>
                                <i class="fas fa-calculator"></i>
                                Mostrar Cuotas
                            </button>
                        </div>
                    </div>
                    <div class='row' id='cntTableQuotesUpa'></div>
                    <div class="row" style="margin-top: 45px;" id='cntBtnSaveUpa'></div>`;
    content.innerHTML = elements;
};

const drawOthers = async () => {
    const content = document.getElementById('others');
    let strNominas = await elementsNominas(),
        strKeys = await elementsKeys(),
        strPeriods = await elementsPeriodTypes();

    let elements = `<div class="row">
                        <div class="col-12 col-md-4 col-lg-3 cntInputDataForm">
                            <label class="bmd-label-floating">Selecciona Contabilidad</label>
                            <select name="slt_nomina_other" id="slt_nomina_other" class="form-control">
                                ${strNominas}
                            </select>
                        </div>
                        <div class="col-12 col-md-4 col-lg-3 cntInputDataForm">
                            <label for="employee_other" class="bmd-label-floating">Empleado</label>
                            <input id='employee_other' type='text' class='form-control' name='employee_other' list='list_employee_other' autocomplete='off' onkeyup='getEmployee(event, this, "slt_nomina_other")' />
                            <datalist id="list_employee_other"></datalist>
                        </div>
                        <div class="col-12 col-md-4 col-lg-3 cntInputDataForm">
                            <label for="key_other" class="bmd-label-floating">Clave</label>
                            <input id='key_other' type='text' class='form-control' name='key_other' list='list_key_other' autocomplete='off' />
                            <datalist id="list_key_other">
                                ${strKeys}
                            </datalist>
                        </div>
                        <div class="col-12 col-md-4 col-lg-3 cntInputDataForm">
                            <label for="period_other" class="bmd-label-floating">Tipo de Período</label>
                            <input id='period_other' type='text' class='form-control' name='period_other' list='list_period_other' autocomplete='off' />
                            <datalist id="list_period_other">
                                ${strPeriods}
                            </datalist>
                        </div>
                        <div class="col-12 col-md-4 col-lg-3 cntInputDataForm">
                            <label class="bmd-label-floating">Fecha Inicio</label>
                            <input id='init_other' type='date' class='form-control' value='${dateNow}' name='init_other' />
                        </div>
                        <div class="col-12 col-md-4 col-lg-3 cntInputDataForm">
                            <label class="bmd-label-floating">Fecha Fin</label>
                            <input id='end_other' type='date' class='form-control' value='${dateNow}' name='end_other' />
                        </div>
                        <div class="col-12 col-md-6 cntInputDataForm">
                            <label class="bmd-label-floating">Observaciones</label>
                            <input id='observations_other' type='text' class='form-control' name='observations_other' />
                        </div>
                        <div class="col-12 col-md-3 cntInputDataForm">
                            <label class="bmd-label-floating">Cuota</label>
                            <input id='quote_other' type='number' class='form-control' name='quote_other' />
                        </div>
                        <div class="col-12 col-md-3 cntInputDataForm">
                            <label class="bmd-label-floating">Total</label>
                            <input id='total_other' type='number' class='form-control' name='total_other' />
                        </div>
                    </div>
                    <div class='row'>
                        <div class="col text-center">
                            <button class="btn btn-outline-success" type="button" id="btnSaveOthers" onclick='makeToSave()'>
                                <i class="fa fa-save"></i>
                                Guardar
                            </button>
                        </div>
                    </div>`;
    content.insertAdjacentHTML('beforeend', elements)

    const slt_nomina_other = document.getElementById('slt_nomina_other');
    if(slt_nomina_other) {
        slt_nomina_other.addEventListener('change', async () => {
            const cntList = document.getElementById('list_key_other');
            let strKeysByOption = await elementsKeys();
            cntList.innerHTML = strKeysByOption;
        })
    }
};

const drawElementsIntoTabs = async (strOption) => {
    await clearContent(strOption);
    if (strOption === 'cuotas_figua') {
        drawFormQuotesFigua();
    }
    else if (strOption === 'cuotas_upa') {
        drawFormQuotesUpa();
    }
    else {
        drawOthers();
    }
};

drawFormQuotesFigua();