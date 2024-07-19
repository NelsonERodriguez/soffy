const objInit = {
    method: 'POST',
    headers: {'X-CSRFToken': getCookie('csrftoken')},
};

const AsistenciasComponent = {
    data() {
        return {
            arrAsistencias: [] // Inicializar con los datos que deseas
        }
    },
    mounted() {
        this.fetchData(); // Llamar al método fetchData al montar el componente
    },
    methods: {
        async determinarColor(horarioEntradaEmpleadoStr, horaEntradaRealStr) {
            // Si el horario de entrada del empleado no está configurado, se asume que es a la hora actual
            let horaActual = new Date();
            let horarioEntradaEmpleado;
            if (horarioEntradaEmpleadoStr) {
                let horarioEntradaEmpleadoParts = horarioEntradaEmpleadoStr.split(":");
                horarioEntradaEmpleado = new Date(horaActual.getFullYear(), horaActual.getMonth(), horaActual.getDate(), horarioEntradaEmpleadoParts[0], horarioEntradaEmpleadoParts[1], horarioEntradaEmpleadoParts[2]);
            } else {
                horarioEntradaEmpleado = horaActual;
            }

            // Convertir la hora de entrada real a objeto Date
            let horaEntradaRealParts = horaEntradaRealStr.split(":");
            let horaEntradaReal = new Date(horaActual.getFullYear(), horaActual.getMonth(), horaActual.getDate(), horaEntradaRealParts[0], horaEntradaRealParts[1], horaEntradaRealParts[2]);

            // Calcular la diferencia en minutos
            let diferenciaMinutos = Math.floor((horaEntradaReal - horarioEntradaEmpleado) / (1000 * 60));

            // Definir el color
            let background= 'red';
            let color = 'white';
            if (horarioEntradaEmpleadoStr) {
                if (diferenciaMinutos < 6 && diferenciaMinutos > -1) {
                    background = "yellow"; // El empleado llegó dentro de los 30 minutos antes de su hora de entrada
                    color = 'black';
                } else if (diferenciaMinutos > 5) {
                    background = "red"; // El empleado llegó dentro de los 15 minutos después de su hora de entrada
                } else if (diferenciaMinutos < 0) {
                    background= 'green';
                }
            }

            return {color: color, background: background};
        },
        fetchData() {
            fetch(strUrlAsistencias, objInit)
                .then(response => response.json())
                .then(data => {
                    this.arrAsistencias = data;
                    this.drawAsistencias();
                })
                .catch(error => {
                    console.error('Error fetching data:', error);
                });
        },
        async drawAsistencias() {
            const arrAsistencias = this.arrAsistencias;

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

                // Crear contenido para cada usuario
                const row = document.createElement('div');
                row.classList.add('row');
                const columnHeaders = ['Empleado', 'Puesto', 'Marca', 'Horario'];
                columnHeaders.forEach(header => {
                    const columnHeader = document.createElement('div');
                    columnHeader.classList.add('col-3');
                    columnHeader.innerHTML = `<span style="font-weight: bold;">${header}</span>`;
                    row.appendChild(columnHeader);
                });

                tabPane.appendChild(row);

                for (let intCount in arrDepartamento.usuarios) {
                    const arrUser = arrDepartamento.usuarios[intCount];
                    const userRow = document.createElement('div');
                    userRow.classList.add('row');
                    let strBackgroundColor = '#5ac9d2';
                    let strColor = 'white';
                    if (arrUser.hora_entrada) {
                        const objStyle = await this.determinarColor(arrUser.horario_entrada, arrUser.hora_entrada);
                        strBackgroundColor = objStyle.background;
                        strColor = objStyle.color;
                    } else {
                        strBackgroundColor = 'red';
                    }

                    const userColumns = [
                        {
                            name: 'nombre',
                            style: 'font-weight: bold; font-size: 14px;'
                        },
                        {
                            name: 'descripcion',
                            style_span: 'background: #8888e9; border-radius: 8px; padding: 3px; color: white; font-size: 10px; font-weight: bold;'
                        },
                        {
                            name: 'hora_entrada',
                            style_span: `background: ${strBackgroundColor}; border-radius: 8px; padding: 3px; color: ${strColor}; font-size: 12px; font-weight: bold;`
                        },
                        {
                            name: 'horario_entrada',
                            style_span: `background: ${strBackgroundColor}; border-radius: 8px; padding: 3px; color: ${strColor}; font-size: 12px; font-weight: bold;`
                        }
                    ];

                    userColumns.forEach(column => {
                        const userColumn = document.createElement('div');
                        userColumn.classList.add('col-3');
                        userColumn.style.cssText = `border-top: solid #d9d9d9 1px; padding: 10px 10px; ${column.style ?? ""}`;
                        const strColumn = (column.name === "hora_entrada") ? "No hay marca" : "No hay horario";
                        userColumn.innerHTML = `<span style="${column.style_span ?? ""}">${arrUser[column.name] ?? strColumn}</span>`;
                        userRow.appendChild(userColumn);
                    });

                    tabPane.appendChild(userRow);
                }

                tabsContainer.appendChild(tabPane);
            }

            // Limpiar el contenedor antes de agregar elementos nuevos
            this.$refs.asistenciasContainer.innerHTML = '';

            // Agregar elementos al contenedor
            this.$refs.asistenciasContainer.appendChild(ulElement);
            this.$refs.asistenciasContainer.appendChild(tabsContainer);
        }

    },
    template: '<div ref="asistenciasContainer">Cargando...</div>'
};

// Montar la aplicación de Vue
const appAsistencias = Vue.createApp(AsistenciasComponent);
appAsistencias.mount('#app');
appAsistencias.config.compilerOptions.delimiters = ['[[', ']]'];
appAsistencias.config.errorHandler = (err, instance, info) => {
    console.error("ERROR", err);
    console.log("INSTANCE", instance);
    console.log("INFO", info);
};
