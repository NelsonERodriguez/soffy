
const validarNumerosPonderacion = (e) => {
    const tecla = (document.all) ? e.keyCode : e.which;
    const patron = /[\d\t]/;
    const te = String.fromCharCode(tecla);

    if (tecla === 8)
        return true;
    if (tecla === 0)
        return true;

    const intValorMaximo = (typeof arrReglas[e.srcElement.getAttribute('data-regla')] != "undefined")? arrReglas[e.srcElement.getAttribute('data-regla')].valor_maximo : 0;
    if (patron.test(te)) {
        if (parseInt((e.srcElement.value) + (e.key)) <= intValorMaximo) {
            return true;
        }
        else {
            alert_nova.showNotification(`Solo puede ingresar números del 1 al ${intValorMaximo}.`, "warning", "danger");
            return false;
        }
    }
    else {
        alert_nova.showNotification(`Solo puede ingresar números del 1 al ${intValorMaximo}.`, "warning", "danger");
        return false;
    }
};

const changePonderacion = (intID) => {
    const objInputs = document.querySelectorAll(`input[name="valor_${intID}[]"]`);

    let boolCalcular = true;
    let intPorcentajeTotal = 0;
    objInputs.forEach((element) => {
        const intRegla = element.getAttribute('data-regla');
        const intValorMaximo = arrReglas[intRegla].valor_maximo;
        const boolAscendente = arrReglas[intRegla].valor_ascendente;
        const intPorcentaje = arrReglas[intRegla].porcentaje;
        let intValor = element.value;

        document.getElementById(`span_${intID}_${intRegla}`).innerText = intValor;

        if (intValor === '' || intValor === '0') {
            boolCalcular = false
        }
        else {
            let intValorReal = 0;
            let intValorPorcentaje = 0;

            if (boolAscendente) {
                intValorReal = (parseInt(intValor) / parseFloat(intValorMaximo));
                intValorPorcentaje = (intValorReal * intPorcentaje);
            }
            else {
                let boolCount = 0;
                let intValorReverso = 1;

                for (let i = intValorMaximo; i > 0; i--) {
                    if (i == intValor) {
                        intValorReal = (parseInt(intValorReverso) / parseFloat(intValorMaximo));
                        intValorPorcentaje = (intValorReal * intPorcentaje);
                    }
                    intValorReverso++;
                    boolCount++;
                    if (boolCount === intValorMaximo) {
                        break
                    }
                }
            }
            intPorcentajeTotal += intValorPorcentaje;

        }

    });

    if (boolCalcular) {

        const intPonderacion = (intPorcentajeTotal * 0.05).toFixed(2);
        document.getElementById(`td_${intID}`).innerHTML = intPonderacion;
        document.getElementById(`ponderacion_${intID}`).value = intPonderacion;

        savePonderacion(intID);
    }

}

const savePonderacion = (intID) => {

    open_loading();
    const csrftoken = getCookie('csrftoken'),
        objForm = new FormData(),
        intPonderacion = document.getElementById(`ponderacion_${intID}`).value,
        objInputs = document.querySelectorAll(`input[name="valor_${intID}[]"]`);

    objForm.append('ticket_id', intID);
    objForm.append('ponderacion', intPonderacion);

    objInputs.forEach((element) => {
        objForm.append('regla[]', `${element.getAttribute('data-regla')}_${element.value}`);
    });

    fetch(strUrlSavePonderacion, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrftoken
        },
        body: objForm
    })
        .then(response => response.json())
        .then( data => {
            if (data.status) {
                alert_nova.showNotification('Ponderación grabada exitosamente.', "add_alert", "success");
            }
            else {
                alert_nova.showNotification('Error al grabar, intente de nuevo. Si continua el error comuníquese con IT.', "warning", "danger");
            }
            close_loading();
        })
        .catch((error) => {
            console.error(error);
            alert_nova.showNotification('Error al grabar, intente de nuevo. Si continua el error comuníquese con IT.', "warning", "danger");
            close_loading();
        });

};

const saveDatos = (objThis) => {

    open_loading();
    const csrftoken = getCookie('csrftoken'),
        objForm = new FormData();

    objForm.append('grupo_id', objThis.getAttribute('data-key'));
    objForm.append('field', objThis.getAttribute('data-field'));
    objForm.append('value', objThis.value);

    fetch(strUrlSaveDatos, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrftoken
        },
        body: objForm
    })
        .then(response => response.json())
        .then( data => {
            if (data.status) {
                alert_nova.showNotification('Ponderación grabada exitosamente.', "add_alert", "success");
            }
            else {
                alert_nova.showNotification('Error al grabar, intente de nuevo. Si continua el error comuníquese con IT.', "warning", "danger");
            }
            close_loading();
        })
        .catch((error) => {
            console.error(error);
            alert_nova.showNotification('Error en comunicación, intente de nuevo. Si continua el error comuníquese con IT.', "warning", "danger");
            close_loading();
        });

};

const exportReportToExcel = () => {
    let table = document.getElementById("tblReporte"); // you can use document.getElementById('tableId') as well by providing id to the table tag
    TableToExcel.convert(table, {
        name: `Matriz_Causa-Efecto-Solución_GB.xlsx`,
        sheet: {
            name: 'MCES'
        }
    });
};

$('#tblReporte').DataTable({
    "pagingType": "full_numbers",
    "lengthMenu": [
        [10, 25, 50, -1],
        [10, 25, 50, "All"]
    ],
    iDisplayLength: -1,
    responsive: false,
    language: objLenguajeDataTable,
    /*dom: 'lBfrtip',
    buttons: [
        {
            extend: 'excel',
            text: 'Excel',
            className: 'btn btn-default',
            exportOptions: {
                modifier: {
                    page: 'current'
                }
            }
        }
    ]*/
});
