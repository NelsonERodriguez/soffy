const objDate = new Date(),
    intDay = objDate.getDate(),
    intMonth = objDate.getMonth() + 1,
    intYear = objDate.getFullYear();

let strMaxDate = '';
let strMinDate = ''
let intTmpMonth = (intMonth < 10)? `0${intMonth}` : intMonth;

if (intDay < 16) {
    strMinDate = `${intYear}-${intTmpMonth}-01`;
    strMaxDate = `${intYear}-${intTmpMonth}-15`;
}
else {
    const objLastDay = new Date(intYear, intMonth, 0);
    const strLastDay = objLastDay.toISOString();
    const arrSplit = strLastDay.split('T');
    strMinDate = `${intYear}-${intTmpMonth}-16`;
    strMaxDate = arrSplit[0];
}

const toggleDepartamento = (objBotton, intDeparamento) => {

    if (!objBotton.hasAttribute('data-active')) {
        $('.btnDepartamento').removeClass('active').removeAttr('data-active');
        objBotton.classList.add('active');
        objBotton.setAttribute('data-active', '');
        if (intDeparamento === 0) {
            $(`[class^="div-departamento-"]`).show('slow');
        }
        else {
            $(`[class^="div-departamento-"]`).hide('slow');
            $(`.div-departamento-${intDeparamento}`).show('slow');
        }
    }
};

const getEmpleados = () => {
    open_loading();
    let csrftoken = getCookie('csrftoken');
    fetch(strUrlGetHorarios, {
        method: 'POST',
        headers: {"X-CSRFToken": csrftoken}
    })
        .then(response => response.json())
        .then((data) => {

            close_loading();

            strMaxDate = data.date_end;
            strMinDate = data.date_start;

            const divContenido = document.getElementById('contenido');

            let divDepartamentos = `
                <div class="row">
                    <div class="col-12 text-center">
                    <button type="button" class="btn btn-outline-info active btnDepartamento" onclick="toggleDepartamento(this, 0);" data-active>
                        Todos
                    </button>
            `;
            for (let key in data.departamentos) {
                const arrData = data.departamentos[key];
                const strName = arrData.Descripcion.replace('<', '').replace('>', '');

                divDepartamentos += `
                    <button type="button" class="btn btn-outline-info btnDepartamento" onclick="toggleDepartamento(this, ${arrData.No_Depto});">
                        ${strName}
                    </button>
                `;
            }
            divDepartamentos += `
                    </div>
                </div>
            `;

            let strCerrar = '';
            if (data.id) {
                let strQuincena = (data.quincena === 1)? "1era" : "2da";
                strCerrar = `
                    <div class="row" style="margin: 25px;">
                        <div class="col-12 text-right">
                            <button type="button" class="btn btn-outline-danger" rel="tooltip" data-original-title="Cerrar" onclick="dialogConfirm(cerrarQuincena, false, '¿Estás seguro de cerrar la ${strQuincena} quincena de ${monthNamesSpanish[data.month - 1]}?');">
                                <i class="material-icons">https</i> Cerrar
                            </button>
                        </div>
                    </div>
                `;
            }

            let strAcordiones = `
                ${strCerrar}
                ${divDepartamentos}
                <div id="accordion" role="tablist">
            `;

            let intRow = 0;
            for (let key in data.reporte) {
                const arrData = data.reporte[key];

                strAcordiones += `
                    <div class="div-departamento-${arrData.No_Depto} card-collapse" style="margin: 25px 0;">
                        <div class="card-header" role="tab" id="headingOne${intRow}">
                            <h5 class="mb-0">
                                <a data-toggle="collapse" href="#collapseOne${intRow}" aria-expanded="false" aria-controls="collapseOne${intRow}" class="collapsed">
                                    ${arrData.CodigoEmpleado} -
                                    ${arrData.name}
                                    <i class="material-icons">keyboard_arrow_down</i>
                                </a>
                            </h5>
                        </div>
                        <div id="collapseOne${intRow}" class="collapse" role="tabpanel" aria-labelledby="headingOne${intRow}" data-parent="#accordion">
                            <div class="card-body">
                                <form method="POST" name="frm_empleado_id_${arrData.id}" id="frm_empleado_id_${arrData.id}">
                                    <div class="row">
                                        <div class="col-12 text-right">
                                            ${objCsrfToken}
                                            <input type="hidden" name="empleado_id" id="empleado_id" data-row="${intRow}" value="${arrData.id}">
                                            <input type="hidden" name="id" id="id" value="${data.id}">
                                            <button type="button" class="btn btn-info" rel="tooltip" data-original-title="Agregar" onclick="addRow(${arrData.id});">
                                                <i class="material-icons">add</i>
                                            </button>
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-12">
                                            <table class="table table-striped">
                                                <thead>
                                                    <tr>
                                                        <td>Fecha</td>
                                                        <td>Entrada</td>
                                                        <td>Salida</td>
                                                        <td>Horas</td>
                                                        <td>Simples</td>
                                                        <td>Dobles</td>
                                                    </tr>
                                                </thead>
                                                <tbody id="tbodyEmpleado_${arrData.id}">

            `;

                let intRowDetail = 0;
                for (let key2 in arrData.fechas) {
                    const arrFechas = arrData.fechas[key2];

                    let strFecha = '';
                    if (arrFechas.fecha) {
                        const arrSplit = arrFechas.fecha.split('/');
                        strFecha = `${arrSplit[2]}-${arrSplit[1]}-${arrSplit[0]}`;
                    }

                    const intHorasSimples = (arrFechas.horas_simples !== 'None')? (arrFechas.horas_simples * 1) : 0;
                    const intHorasDobles = (arrFechas.horas_dobles !== 'None')? (arrFechas.horas_dobles * 1) : 0;
                    let strHoraEntrada = (arrFechas.hora_entrada !== 'None')? arrFechas.hora_entrada : '';
                    let strHoraSalida = (arrFechas.hora_salida !== 'None')? arrFechas.hora_salida : '';
                    strHoraEntrada = (strHoraEntrada && strHoraEntrada.length === 8)? strHoraEntrada.substr(0, 5) : strHoraEntrada;
                    strHoraSalida = (strHoraSalida && strHoraSalida.length === 8)? strHoraSalida.substr(0, 5) : strHoraSalida;
                    let strHorasTrabajadas = (arrFechas.horas_trabajadas && arrFechas.horas_trabajadas.length === 8)? arrFechas.horas_trabajadas.substr(0, 5) : arrFechas.horas_trabajadas;
                    strHorasTrabajadas = (arrFechas.horas_trabajadas && arrFechas.horas_trabajadas.length === 7)? '0' + arrFechas.horas_trabajadas.substr(0, 4) : strHorasTrabajadas;

                    let strRequeridoSimples = '';
                    let strRequeridoDobles = '';
                    if (intHorasSimples === 0 && intHorasDobles === 0) {
                        strRequeridoSimples = 'required';
                        strRequeridoDobles = 'required';
                    }
                    else if (intHorasSimples > 0) {
                        strRequeridoSimples = 'required';
                    }
                    else if (intHorasDobles > 0) {
                        strRequeridoDobles = 'required';
                    }

                    strAcordiones += `
                        <tr class="tr_${arrData.id}" id="tr_${intRowDetail}" data-row="${intRowDetail}">
                            <td>
                                <input type="date" name="fecha[]" id="fecha_${arrData.id}_${intRowDetail}" data-row="${intRowDetail}" value="${strFecha}" onchange="validateDate(this);" class="form-control" min="${strMinDate}" max="${strMaxDate}" required>
                                <input type="hidden" name="detalle_id[]" id="detalle_id_${arrData.id}_${intRowDetail}" value="${arrFechas.detalle_id}">
                            </td>
                            <td>
                                <input type="time" name="hora_entrada[]" id="hora_entrada_${arrData.id}_${intRowDetail}" value="${strHoraEntrada}" onchange="calculateHoras(this);" class="form-control" required>
                            </td>
                            <td>
                                <input type="time" name="hora_salida[]" id="hora_salida_${arrData.id}_${intRowDetail}" value="${strHoraSalida}" onchange="calculateHoras(this);" class="form-control" required>
                            </td>
                            <td id="td_${arrData.id}_${intRowDetail}">
                                ${strHorasTrabajadas}
                            </td>
                            <td>
                                <input type="number" name="horas_simples[]" id="horas_simples_${arrData.id}_${intRowDetail}" step="any" value="${intHorasSimples}" class="form-control">
                            </td>
                            <td>
                                <input type="number" name="horas_dobles[]" id="horas_dobles_${arrData.id}_${intRowDetail}" step="any" value="${intHorasDobles}" class="form-control">
                            </td>
                        </tr>
                `;

                    intRowDetail++;
                }

                strAcordiones += `
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-12 text-center">
                                            <button type="button" class="btn btn-outline-success" rel="tooltip" data-original-title="Grabar" onclick="validateForm(${arrData.id});">
                                                <i class="material-icons">save</i>
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
            `;

                intRow++;
            }

            strAcordiones += `
                </div>
            `;

            divContenido.innerHTML = strAcordiones;

        })
        .catch((error) => {

            close_loading();
            console.error(error);
            alert_nova.showNotification('Error de conexión, comuníquese con IT.', "warning", "danger");

        });
}

const calculateHoras = (objTime) => {
    const arrSplit = objTime.id.split('_');
    const intEmpleadoID = arrSplit[2];
    const intRow = arrSplit[3];
    const objTd = document.getElementById(`td_${intEmpleadoID}_${intRow}`);
    const objHoraEntrada = document.getElementById(`hora_entrada_${intEmpleadoID}_${intRow}`);
    const objHoraSalida = document.getElementById(`hora_salida_${intEmpleadoID}_${intRow}`);
    const strHoraEntrada = objHoraEntrada.value;
    const strHoraSalida = objHoraSalida.value;

    if (strHoraEntrada !== '' && strHoraSalida !== '') {

        // Expresión regular para comprobar formato
        const strFormatHora = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

        // Si algún valor no tiene formato correcto sale
        if (!(strHoraEntrada.match(strFormatHora) && strHoraSalida.match(strFormatHora))){
            objTd.innerHTML = '';
            return false;
        }

        // Calcula los minutos de cada hora
        const strMinutoEntrada = strHoraEntrada.split(':').reduce((p, c) => parseInt(p) * 60 + parseInt(c));
        const strMinutoSalida = strHoraSalida.split(':').reduce((p, c) => parseInt(p) * 60 + parseInt(c));

        // Si la hora final es anterior a la hora inicial sale
        if (strMinutoSalida < strMinutoEntrada) return false;

        // Diferencia de minutos
        const strDiferencia = strMinutoSalida - strMinutoEntrada;

        // Cálculo de horas y minutos de la diferencia
        const strHoras = Math.floor(strDiferencia / 60);
        const strMinutos = strDiferencia % 60;

        objTd.innerHTML = (strHoras < 10 ? '0' : '') + strHoras + ':' + (strMinutos < 10 ? '0' : '') + strMinutos;

    }
    else {
        objTd.innerHTML = '';
    }

};

const validateHoras = (objNumber) => {
    const strID = objNumber.id;
    const arrSplit = strID.split('_');
    const strTipo = arrSplit[1];
    const intEmpleado = arrSplit[2];
    const intRow = arrSplit[3];

    let objOtherTipo;
    if (strTipo === 'simples') {
        objOtherTipo = document.getElementById(`horas_dobles_${intEmpleado}_${intRow}`);
    }
    else {
        objOtherTipo = document.getElementById(`horas_simples_${intEmpleado}_${intRow}`);
    }

    if (objNumber.value.trim() === '' || objNumber.value.trim() === '0') {
        objOtherTipo.setAttribute("required", 'required');
    }
    else {
        objOtherTipo.removeAttribute("required");
    }

};

const validateForm = (intEmpleadoID) => {
    const objInputs = document.querySelectorAll(`#frm_empleado_id_${intEmpleadoID} input`);

    let boolError = false;
    objInputs.forEach(element => {
        if ((typeof element.getAttribute('required') !== 'object')) {
            if (element.type === "number") {
                if (element.value === '' || element.value === '0') {
                    boolError = true;
                    element.style.border = 'solid #f44336 1px';
                }
                else {
                    element.style.border = '';
                }
            }
            else {
                if (element.value === '') {
                    boolError = true;
                    element.style.border = 'solid #f44336 1px';
                }
                else {
                    element.style.border = '';
                }
            }
        }
        else {
            element.style.border = '';
        }
    });

    if (boolError) {
        alert_nova.showNotification('Debe llenar todos los campos marcados.', "warning", "danger");
        return false;
    }
    else {
        dialogConfirm(saveDatos, intEmpleadoID);
    }

};

const saveDatos = (intEmpleadoID) => {
    const objFrm = document.getElementById(`frm_empleado_id_${intEmpleadoID}`);
    const form = new FormData(objFrm);
    open_loading();
    let csrftoken = getCookie('csrftoken');
    fetch(strUrlHorasExtras, {
        method: 'POST',
        headers: {"X-CSRFToken": csrftoken},
        body: form
    })
        .then(response => response.json())
        .then((data) => {

            close_loading();

            if (data.status) {
                alert_nova.showNotification('Registros grabados.', "add_alert", "success");
                getEmpleados();
            }
            else {
                alert_nova.showNotification('Error de conexión, comuníquese con IT.', "warning", "danger");
            }

        })
        .catch((error) => {

            close_loading();
            console.error(error);
            alert_nova.showNotification('Error de conexión, comuníquese con IT.', "warning", "danger");

        });

};

const addRow = (intEmpleadoID) => {
    const objTr = document.querySelectorAll(`.tr_${intEmpleadoID}`);

    let intRowDetail = 0;
    objTr.forEach(element => {
        const intRowTMP = parseInt(element.getAttribute('data-row'));

        if (intRowTMP > intRowDetail) {
            intRowDetail = intRowTMP;
        }

    });
    intRowDetail++;

    const strAcordiones = `
            <tr class="tr_${intEmpleadoID}" id="tr_${intRowDetail}" data-row="${intRowDetail}">
                <td>
                    <input type="date" name="fecha[]" id="fecha_${intEmpleadoID}_${intRowDetail}" data-row="${intRowDetail}" class="form-control" onchange="validateDate(this);" min="${strMinDate}" max="${strMaxDate}"  required>
                    <input type="hidden" name="detalle_id[]" id="detalle_id_${intEmpleadoID}_${intRowDetail}" value="0">
                </td>
                <td>
                    <input type="time" name="hora_entrada[]" id="hora_entrada_${intEmpleadoID}_${intRowDetail}" class="form-control" onchange="calculateHoras(this);" required>
                </td>
                <td>
                    <input type="time" name="hora_salida[]" id="hora_salida_${intEmpleadoID}_${intRowDetail}" class="form-control" onchange="calculateHoras(this);" required>
                </td>
                <td id="td_${intEmpleadoID}_${intRowDetail}">

                </td>
                <td>
                    <input type="number" name="horas_simples[]" id="horas_simples_${intEmpleadoID}_${intRowDetail}" step="any" onchange="validateHoras(this);" class="form-control" value="0">
                </td>
                <td>
                    <input type="number" name="horas_dobles[]" id="horas_dobles_${intEmpleadoID}_${intRowDetail}" step="any" onchange="validateHoras(this);" class="form-control"  value="0">
                </td>
            </tr>
    `;

    document.getElementById(`tbodyEmpleado_${intEmpleadoID}`).insertAdjacentHTML('beforeend', strAcordiones);
};

const cerrarQuincena = () => {
    open_loading();
    let csrftoken = getCookie('csrftoken');
    const form = new FormData();
    form.append('id', document.getElementById('id').value);
    fetch(strUrlCerrarQuincena, {
        method: 'POST',
        headers: {"X-CSRFToken": csrftoken},
        body: form
    })
        .then(response => response.json())
        .then((data) => {

            close_loading();

            if (data.status) {
                window.location.href = strUrlHorasExtras;
            }

        })
        .catch((error) => {

            close_loading();
            console.error(error);
            alert_nova.showNotification('Error de conexión, comuníquese con IT.', "warning", "danger");

        });

};

const validateDate = (objFecha) => {

    const strFechaId = objFecha.id;
    const arrSplit = strFechaId.split('_');
    const intEmpleado = arrSplit[1];

    const strFecha = objFecha.value.trim();
    const objFechas = document.querySelectorAll(`input[id^="fecha_${intEmpleado}_"]`);
    const arrSplitMinDate = strMinDate.split('-');
    const intMinDay = parseInt(arrSplitMinDate[2]);
    const arrSplitMaxDate = strMaxDate.split('-');
    const intMaxDay = parseInt(arrSplitMaxDate[2]);
    const arrSplitDate = (strFecha)? strFecha.split('-') : false;
    const intDay = (arrSplitDate)? parseInt(arrSplitDate[2]) : 0;

    if (intDay >= intMinDay && intDay <= intMaxDay) {

        let boolMismaFecha = false;
        objFechas.forEach(element => {

            const strThisFechaValue = element.value.trim();
            if (element !== objFecha) {
                if (strFecha === strThisFechaValue) {
                    boolMismaFecha = true;
                }
            }

        });

        if (boolMismaFecha) {
            objFecha.value = '';
            alert_nova.showNotification('No puede ingresar la misma fecha en un mismo empleado.', "warning", "danger");
            return false;
        }

    }
    else {
        objFecha.value = '';
        alert_nova.showNotification('No puede ingresar una fecha fuera de la quincena actual.', "warning", "danger");
        return false;
    }

};

$(document).ready(() => {
    getEmpleados();
});
