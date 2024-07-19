const drawTabs = () => {

    const ulElement = document.createElement('ul');
    ulElement.classList.add('nav', 'nav-pills', 'nav-pills-primary');
    ulElement.setAttribute('role', 'tablist');

    const tabsContainer = document.createElement('div');
    tabsContainer.classList.add('tab-content', 'tab-space');

    for (const departamentoId in arrAsistencias) {
        const arrDepartamento = arrAsistencias[departamentoId];

        // Crear elemento <li> para el departamento
        const liElement = document.createElement('li');
        liElement.classList.add('nav-item');

        const aElement = document.createElement('a');
        aElement.classList.add('nav-link');
        aElement.setAttribute('data-toggle', 'tab');
        aElement.setAttribute('href', `#lnk${arrDepartamento.nombre}`);
        aElement.setAttribute('role', 'tablist');
        aElement.textContent = arrDepartamento.nombre;

        liElement.appendChild(aElement);
        ulElement.appendChild(liElement);

        // Crear elemento <div> para la pestaña del departamento
        const tabPane = document.createElement('div');
        tabPane.classList.add('tab-pane');
        tabPane.id = `lnk${arrDepartamento.nombre}`;
        tabPane.style.cssText = 'border: solid #d9d9d9 1px; border-radius: 5px; padding: 15px;';

        // Crear tabla para mostrar los usuarios y sus datos
        const table = document.createElement('table');
        table.classList.add('table');

        // Crear encabezados de tabla
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        const columnHeaders = ['Empleado'];
        columnHeaders.forEach(headerText => {
            const header = document.createElement('th');
            header.textContent = headerText;
            headerRow.appendChild(header);
        });
        thead.appendChild(headerRow);
        for (let key in arrDias) {
            const header = document.createElement('th');
            header.textContent = arrDias[key].nombre;
            headerRow.appendChild(header);
        }
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Llenar la tabla con los datos de cada usuario
        const tbody = document.createElement('tbody');
        for (let intCount in arrDepartamento.usuarios) {
            const userRow = document.createElement('tr');

            // Agregar celdas para cada columna
            const userColumn = document.createElement('td');
            userColumn.innerHTML = `
                    <span style="font-weight: bold; font-size: 15px;">${arrDepartamento.usuarios[intCount].nombre}</span>
                    <span style="background: #8888e9; border-radius: 8px; padding: 3px; color: white; font-size: 12px; font-weight: bold;">${arrDepartamento.usuarios[intCount].puesto}</span>`;
            userRow.appendChild(userColumn);

            const arrSplit = (arrDepartamento.usuarios[intCount].horarios_id !== '0') ? arrDepartamento.usuarios[intCount].horarios_id.split(',') : [];
            for (let key in arrDias) {
                const horarioColumn = document.createElement('td');
                const selectHorario = document.createElement('select');
                selectHorario.classList.add('form-control');
                selectHorario.setAttribute('data-empleado', arrDepartamento.usuarios[intCount].id);
                selectHorario.onchange = (e) => {
                    saveHorarios(e);
                    e.target.setAttribute('data-horario_anterior', e.target.value);
                };
                const optionHorario = document.createElement('option');
                selectHorario.appendChild(optionHorario);

                for (let keyHorario in arrDias[key].horarios) {
                    const arrHorario = arrDias[key].horarios[keyHorario];
                    const optionHorario = document.createElement('option');
                    optionHorario.text = `${arrHorario.hora_entrada} - ${arrHorario.hora_salida}`;
                    optionHorario.value = arrHorario.id;
                    if (arrSplit.length) {
                        const selected = arrSplit.find(horarioId => parseInt(horarioId) === arrHorario.id);
                        if (selected) {
                            optionHorario.selected = true;
                            selectHorario.setAttribute('data-horario_anterior', arrHorario.id);
                        }
                    }
                    selectHorario.appendChild(optionHorario);
                }
                horarioColumn.appendChild(selectHorario);
                userRow.appendChild(horarioColumn);
            }
            tbody.appendChild(userRow);

        }

        table.appendChild(tbody);
        tabPane.appendChild(table);

        tabsContainer.appendChild(tabPane);
    }

    // Limpiar el contenedor antes de agregar elementos nuevos
    document.getElementById('asistenciasContainer').innerHTML = '';

    // Agregar elementos al contenedor
    document.getElementById('asistenciasContainer').appendChild(ulElement);
    document.getElementById('asistenciasContainer').appendChild(tabsContainer);
}

// const saveHorarios = (empleadoId, horarioId, horarioAnteriorId = null) => {
const saveHorarios = (element) => {
    const form = new FormData();
    form.append('empleado', element.target.getAttribute('data-empleado'));
    form.append('horario', element.target.value);
    const intHorarioAnterior = element.target.getAttribute('data-horario_anterior');
    if (intHorarioAnterior) form.append('horario_anterior', intHorarioAnterior);
    const objInit = {
        method: 'POST',
        headers: {'X-CSRFToken': getCookie('csrftoken')},
        body: form
    };

    open_loading();
    fetch(strUrlSaveEmpleadosHorario, objInit)
        .then(response => response.json())
        .then(data => {
            close_loading();
            if (data.status) {
                alert_nova.showNotification(data.msg, "add_alert", "success");
            } else {
                alert_nova.showNotification(data.msg, "warning", "danger");
            }
        })
        .catch(error => {
            close_loading();
            console.log(error);
        });
};

document.addEventListener('DOMContentLoaded', () => {
    drawTabs();
});
