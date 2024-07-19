const SelectNomina = document.getElementById('nomina');
const divContenido = document.getElementById('divContenido');
const divEmpleados = document.getElementById('divEmpleados');
const divModalClaves = document.getElementById('modal_body_claves');

if (SelectNomina) {
    SelectNomina.addEventListener('change', element => {
        if (element.value !== '') {
            getEmpleados();
        }
        else {
            divEmpleados.innerHTML = '';
        }

    });
}

const getEmpleados = () => {

    const frm_element = document.getElementById('frm_mantenimiento_claves');
    const form = new FormData(frm_element);

    open_loading();
    fetch(strUrlGetEmpleados, {
      method: 'POST',
      body: form
    })
      .then(response => response.json())
      .then( (data) => {
          close_loading();

          new DevExpress.ui.dxDataGrid(divEmpleados, {
                dataSource: data.empleados,
                onCellClick: function (element) {

                    if (element.data) {
                        getConfig(element.data.No_Empleado, element.data.empleado)
                    }

                },
                columns: [
                    {
                        caption: "No Empleado",
                        dataField: "No_Empleado",
                        dataType: "number",
                        cssClass: "cursor_pointer"
                    },
                    {
                        caption: "Empleado",
                        dataField: "empleado",
                        dataType: "string",
                        cssClass: "cursor_pointer"
                    }
                ],
                hoverStateEnabled: true,
                columnsAutoWidth: true,
                showBorders: true,
                filterRow: {
                    visible: true,
                    applyFilter: "auto"
                },
                searchPanel: {
                    visible: true,
                    //width: 240,
                    placeholder: "Buscar..."
                },
                headerFilter: {
                    visible: true
                },
                allowSorting:true,
                export: {
                    enabled:true,
                    fileName: "Reporte"
                }
            });

      })
      .catch((error) => {
          close_loading();
          console.error(error);
          alert_nova.showNotification('Error de conexión, intente nuevamente si continua el error comuníquese con IT.', "warning", "danger");
      });

};

const getConfig = (intEmpleado, strEmpleado) => {

    const frm_element = document.getElementById('frm_mantenimiento_claves');
    const form = new FormData(frm_element);
    form.append('no_empleado', intEmpleado);
    document.getElementById('empleado_id').value = intEmpleado;

    fetch(strUrlGetConfig, {
      method: 'POST',
      body: form
    })
      .then(response => response.json())
      .then( (data) => {
          close_loading();

          let objRegistros = `
            <div class="row">
                <div class="col-10">
                    <b>${strEmpleado}</b>
                </div>
                <div class="col-2">
                    <button class="btn btn-info btn-link" type="button" onclick="addConfig();">
                        <i class="material-icons">add</i>
                    </button>
                </div>
            </div>
            <hr>
            <div id="divClaves">
                <div class="row" style="margin-bottom: 20px;">
                    <div class="col-3">
                        <b>Area</b>
                    </div>
                    <div class="col-4">
                        <b>Clave</b>
                    </div>
                    <div class="col-4">
                        <b>Cuenta</b>
                    </div>
                </div>
          `;

          let intRow = 1;
          for (let key in data.claves) {
              const arrClaves = data.claves[key];

              objRegistros += `
                    <div class="row" style="margin: 10px 0;" id="row_${intRow}">
                        <div class="col-3">
                            <input type="text" name="area[]" id="area_${intRow}" value="${arrClaves.Area}" class="form-control" data-row="${intRow}">
                            <input type="hidden" name="area_id[]" id="areaID_${intRow}" value="${arrClaves.NoArea}" data-row="${intRow}">
                            <input type="hidden" name="area_hidden[]" value="${arrClaves.NoArea}" data-row="${intRow}">
                        </div>
                        <div class="col-4">
                            <input type="text" name="clave[]" id="clave_${intRow}" value="${arrClaves.Clave}" class="form-control" data-row="${intRow}">
                            <input type="hidden" name="clave_id[]" id="claveID_${intRow}" value="${arrClaves.NoClave}" data-row="${intRow}">
                            <input type="hidden" name="clave_hidden[]" value="${arrClaves.NoClave}" data-row="${intRow}">
                        </div>
                        <div class="col-4">
                            <input type="text" name="cuenta[]" id="cuenta_${intRow}" value="${arrClaves.Cuenta}" class="form-control" data-row="${intRow}">
                            <input type="hidden" name="cuenta_id[]" id="cuentaID_${intRow}" value="${arrClaves.NoCuenta}" data-row="${intRow}">
                            <input type="hidden" name="cuenta_hidden[]" value="${arrClaves.NoCuenta}" data-row="${intRow}">
                        </div>
                        <div class="col-1">
                            <input type="hidden" name="nomina_id[]" value="${arrClaves.NoNomina}">
                            <input type="hidden" name="delete[]" id="delete_${intRow}" value="0">
                            <input type="hidden" name="nuevo[]" id="nuevo_${intRow}" value="0">
                            <button class="btn btn-danger btn-link btn-just-icon" type="button" onclick="dialogConfirm(deleteConfig, ${intRow});">
                                <i class="material-icons">delete</i>
                            </button>
                        </div>
                    </div>
              `;

              intRow++;
          }

          objRegistros += `
            </div>
          `;

          divModalClaves.innerHTML = objRegistros;

          const objTxt = document.querySelectorAll(`input[name="area[]"]`);

          objTxt.forEach(element => {
              const intRowTMP = element.getAttribute('data-row');
              getAreas(element, document.getElementById(`areaID_${intRowTMP}`));
              getClaves(document.getElementById(`clave_${intRowTMP}`), document.getElementById(`claveID_${intRowTMP}`));
              getCuentas(document.getElementById(`cuenta_${intRowTMP}`), document.getElementById(`cuentaID_${intRowTMP}`));
          });

          $('#modal_claves').modal("show");

      })
      .catch((error) => {

          close_loading();
          console.error(error);
          alert_nova.showNotification('Error de conexión, intente nuevamente si continua el error comuníquese con IT.', "warning", "danger");

      });

};

const saveConfig = () => {

    const objAreas = document.querySelectorAll(`input[name="area[]"]`);
    const objClaves = document.querySelectorAll(`input[name="clave[]"]`);
    const objCuentas = document.querySelectorAll(`input[name="cuenta[]"]`);
    let boolError = false;

    let intRow = 0;
    objAreas.forEach(objAreaId => {
        const intAreaId = objAreaId.value;
        const intClave = objClaves[intRow].value;
        const strCuenta = objCuentas[intRow].value;

        if (intAreaId === '') {
            boolError = true;
            objAreaId.style.background = '#f8d7da';
        }
        else {
            objAreaId.style.background = '';
        }

        if (intClave === '') {
            boolError = true;
            objClaves[intRow].style.background = '#f8d7da';
        }
        else {
            objClaves[intRow].style.background = '';
        }

        if (strCuenta === '') {
            boolError = true;
            objCuentas[intRow].style.background = '#f8d7da';
        }
        else {
            objCuentas[intRow].style.background = '';
        }

        intRow++;
    });

    if (boolError) {
        alert_nova.showNotification('Por favor debe ingresar todos los campos.', "warning", "danger");
        return false;
    }

    open_loading();
    const frm_element = document.getElementById('frm_save_config');
    const form = new FormData(frm_element);
    form.append('empleado_id', document.getElementById('empleado_id').value);

    fetch(strUrlSaveConfig, {
      method: 'POST',
      body: form
    })
      .then(response => response.json())
      .then( (data) => {

          close_loading();

          if (data.status) {
              $('#modal_claves').modal("hide");
              alert_nova.showNotification("Registros grabados.", "add_alert", "success");
          }
          else {
              alert_nova.showNotification('Error de conexión, intente nuevamente si continua el error comuníquese con IT.', "warning", "danger");
          }

      })
      .catch((error) => {

          close_loading();
          console.error(error);
          alert_nova.showNotification('Error de conexión, intente nuevamente si continua el error comuníquese con IT.', "warning", "danger");

      });

};

const addConfig = () => {
    const divClaves = document.getElementById('divClaves');
    const objTxt = document.querySelectorAll(`input[name="area_id[]"]`);
    let intRow = 1;

    objTxt.forEach(element => {
        const intRowTMP = parseInt(element.getAttribute('data-row'));

        if (intRow < intRowTMP) {
            intRow = intRowTMP;
        }

    });

    intRow++;

    const intNomina = SelectNomina.options[SelectNomina.selectedIndex].getAttribute('data-value');

    divClaves.innerHTML = divClaves.innerHTML + `
        <div class="row" style="margin: 10px 0;" id="row_${intRow}" data-nuevo="1">
            <div class="col-3">
                <input type="text" name="area[]" id="area_${intRow}" class="form-control" data-row="${intRow}">
                <input type="hidden" name="area_id[]" id="areaID_${intRow}" data-row="${intRow}">
                <input type="hidden" name="area_hidden[]" data-row="${intRow}">
            </div>
            <div class="col-4">
                <input type="text" name="clave[]" id="clave_${intRow}" class="form-control" data-row="${intRow}">
                <input type="hidden" name="clave_id[]" id="claveID_${intRow}" data-row="${intRow}">
                <input type="hidden" name="clave_hidden[]" data-row="${intRow}">
            </div>
            <div class="col-4">
                <input type="text" name="cuenta[]" id="cuenta_${intRow}" class="form-control" data-row="${intRow}">
                <input type="hidden" name="cuenta_id[]" id="cuentaID_${intRow}" data-row="${intRow}">
                <input type="hidden" name="cuenta_hidden[]" data-row="${intRow}">
            </div>
            <div class="col-1">
                <input type="hidden" name="nomina_id[]" value="${intNomina}">
                <input type="hidden" name="delete[]" value="0">
                <input type="hidden" name="nuevo[]" value="1">
                <button class="btn btn-danger btn-link btn-just-icon" type="button" onclick="deleteConfig(${intRow});">
                    <i class="material-icons">delete</i>
                </button>
            </div>
        </div>
    `;

    document.querySelectorAll(`input[name="area_id[]"]`).forEach(element => {

        const intRow = parseInt(element.getAttribute('data-row'));

        getAreas(document.getElementById(`area_${intRow}`), document.getElementById(`areaID_${intRow}`));
        getClaves(document.getElementById(`clave_${intRow}`), document.getElementById(`claveID_${intRow}`));
        getCuentas(document.getElementById(`cuenta_${intRow}`), document.getElementById(`cuentaID_${intRow}`));

    });

};

const deleteConfig = (intRow) => {

    const divRow = document.getElementById(`row_${intRow}`);
    const boolNew =  divRow.getAttribute('data-nuevo');

    if (boolNew) {
        $(divRow).remove();
    }
    else {
        divRow.style.display = 'none';
        document.getElementById(`delete_${intRow}`).value = 1;
    }

};

const getAreas = (elementTxt, elementHidden) => {

    $( elementTxt ).autocomplete({
        minLength: 1,
        source: function( request, response ) {

            open_loading();
            const frm_element = document.getElementById('frm_mantenimiento_claves');
            const form = new FormData(frm_element);
            form.append('area', request.term);

            fetch(strUrlGetAreas, {
              method: 'POST',
              body: form
            })
              .then(response_data => response_data.json())
              .then( (data) => {

                  close_loading();
                  response(
                      $.map(data, function (item) {
                          return {
                              label: item.name,
                              value: item.id
                          }
                      })
                  );

              })
              .catch((error) => {

                  close_loading();
                  alert_nova.showNotification('Error de conexión, intente nuevamente si continua el error comuníquese con IT.', "warning", "danger");
                  console.error(error);

              });

        },
        select: function( event, ui ) {

            event.preventDefault();
            elementHidden.value = ui.item.value;
            this.value = ui.item.label;

        }

    }).focus(function () {

        this.value = '';
        //elementHidden.value = '';

    }).blur(function () {

        if (elementHidden.value === '') {
            this.value = '';
        }

    });

};

const getClaves = (elementTxt, elementHidden) => {

    $( elementTxt ).autocomplete({
        minLength: 1,
        source: function( request, response ) {

            open_loading();
            const frm_element = document.getElementById('frm_mantenimiento_claves');
            const form = new FormData(frm_element);
            form.append('clave', request.term);

            fetch(strUrlGetClaves, {
              method: 'POST',
              body: form
            })
              .then(response_data => response_data.json())
              .then( (data) => {

                  close_loading();
                  response(
                      $.map(data, function (item) {
                          return {
                              label: item.name,
                              value: item.id
                          }
                      })
                  );

              })
              .catch((error) => {

                  close_loading();
                  alert_nova.showNotification('Error de conexión, intente nuevamente si continua el error comuníquese con IT.', "warning", "danger");
                  console.error(error);

              });

        },
        select: function( event, ui ) {

            event.preventDefault();
            elementHidden.value = ui.item.value;
            this.value = ui.item.label;

        }

    }).focus(function () {

        this.value = '';
        //elementHidden.value = '';

    }).blur(function () {

        if (elementHidden.value === '') {
            this.value = '';
        }

    });

};

const getCuentas = (elementTxt, elementHidden) => {

    $( elementTxt ).autocomplete({
        minLength: 1,
        source: function( request, response ) {

            open_loading();
            const frm_element = document.getElementById('frm_mantenimiento_claves');
            const form = new FormData(frm_element);
            form.append('cuenta', request.term);

            fetch(strUrlGetCuentas, {
              method: 'POST',
              body: form
            })
              .then(response_data => response_data.json())
              .then( (data) => {

                  close_loading();
                  response(
                      $.map(data, function (item) {
                          return {
                              label: item.name,
                              value: item.id
                          }
                      })
                  );

              })
              .catch((error) => {

                  close_loading();
                  alert_nova.showNotification('Error de conexión, intente nuevamente si continua el error comuníquese con IT.', "warning", "danger");
                  console.error(error);

              });

        },
        select: function( event, ui ) {

            event.preventDefault();
            elementHidden.value = ui.item.value;
            this.value = ui.item.label;

        }

    }).focus(function () {

        this.value = '';
        //elementHidden.value = '';

    }).blur(function () {

        if (elementHidden.value === '') {
            this.value = '';
        }

    });

};
