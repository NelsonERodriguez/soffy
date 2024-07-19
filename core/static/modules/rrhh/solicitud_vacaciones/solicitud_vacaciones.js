let objVacaciones = [];
let totalDias = 0;
let calendar = null;
let boolMedioDia = false;
document.addEventListener('DOMContentLoaded', function () {
    const calendarEl = document.getElementById('divCalendar');
    calendar = new FullCalendar.Calendar(calendarEl, {
        locale: 'es',
        initialView: mobileCheck() ? 'dayGridMonth' : 'multiMonthYear',
        selectable: true,
        events: arrHistoricoVacaciones,
        headerToolbar: {
            start: '',
            center: 'title',
            end: 'today prev next dayGridMonth multiMonthYear',
        },
        buttonText: {
            today: 'Hoy',
            month: 'Mes',
            year: 'Año',
        },
        weekends: false,
        eventClick: function (eventClickInfo) {
            const indexEvent = objVacaciones.findIndex(eventData => eventData.start === eventClickInfo.event.startStr);
            if (indexEvent >= 0) {
                objVacaciones.splice(indexEvent, 1);
                eventClickInfo.event.remove();

                for (let i = 0; i < arrPeriodosDisponiblesBKP.length; i++) {
                    const periodoNuevo = arrPeriodosDisponiblesBKP[i];
                    const indexPeriodo = arrPeriodosDisponibles.findIndex(periodoTmp => periodoTmp.Periodo === arrPeriodosDisponiblesBKP[i].Periodo);
                    arrPeriodosDisponibles[indexPeriodo] = {
                        Periodo: periodoNuevo.Periodo,
                        DiasPendientes: periodoNuevo.DiasPendientes,
                    };
                }
                totalDias = 0;

                for (const evento of objVacaciones) {
                    const fechaInicio = new Date(evento.start);
                    const fechaFin = new Date(evento.end);
                    const diaHabiles = new Date(addDays(fechaInicio, 1));
                    const diasSeleccionados = getDiasHabiles(diaHabiles, fechaFin);
                    let diasRestantes = diasSeleccionados.length;
                    let periodoConcatenado = '';

                    for (const periodo of arrPeriodosDisponibles) {
                        if (diasRestantes <= 0) {
                            break; // Salir del bucle si ya no quedan días por asignar
                        }

                        const diasDisponibles = Math.min(diasRestantes, periodo.DiasPendientes);

                        if (diasDisponibles > 0) {
                            const periodoActual = periodo.Periodo;

                            for (let i = 0; i < diasDisponibles; i++) {
                                periodoConcatenado += (periodoConcatenado !== '') ? ';' + periodoActual : periodoActual;
                            }

                            // Restar los días tomados del periodo actual
                            periodo.DiasPendientes -= diasDisponibles;
                            diasRestantes -= diasDisponibles;
                        }
                    }
                    evento.periodos = periodoConcatenado;
                    totalDias += diasSeleccionados.length;
                }

            }
            if (boolMedioDia) boolMedioDia = false
            if (objVacaciones.length === 0) {
                document.getElementById('btnEnviar').style.display = 'none';
            }
        },
        select: function (selectionInfo) {
            if (boolMedioDia) {
                alert_nova.showNotification("Las solicitudes de medio día son individuales, no puede agregar mas días.", "warning", "danger");
                return false;
            }
            if (boolVacacionesNoFirmadas) {
                alert_nova.showNotification("Tiene otra solicitud de vacaciones pendiente de finalizar.", "warning", "danger");
                return false;
            }

            const fechaInicio = new Date(selectionInfo.startStr);
            const fechaFin = new Date(selectionInfo.endStr);
            const diaHabiles = new Date(addDays(fechaInicio, 1));
            const diasSeleccionados = getDiasHabiles(diaHabiles, fechaFin);

            if (diasSeleccionados.length === 1 && objVacaciones.length === 0) {
                swal({
                    title: `Elija una opción`,
                    html: `
                        <br> 
                        <input type="radio" name="tipo_dia" value="dia_completo" checked> Día completo 
                        <hr>
                        <input type="radio" name="tipo_dia" value="medio_dia"> Medio día
                        <br>
                    `,
                    type: `warning`,
                    showCancelButton: false,
                    confirmButtonClass: 'btn btn-outline-success',
                    cancelButtonClass: 'btn btn-outline-danger',
                    confirmButtonText: `Aceptar`,
                    // cancelButtonText: `Cancelar`,
                    buttonsStyling: false,
                    allowEscapeKey: false
                }).then(function (e) {
                    if (e.value) {
                        boolMedioDia = (document.querySelector('input[name="tipo_dia"]:checked').value === "medio_dia");
                    }
                }).catch(swal.noop);
            }
            // Agregar los eventos al calendario
            const eventData = {
                title: 'Vacaciones',
                start: selectionInfo.startStr,
                end: selectionInfo.endStr,
                backgroundColor: '#FFFF00',
                className: ['cursorPointer'],
                textColor: 'black',
                periodos: '',
            };
            if (validarEventoDuplicado(eventData)) {
                alert_nova.showNotification("No puede volver a seleccionar una misma fecha.", "warning", "danger");
                return false;
            }

            // Verificar si los días seleccionados exceden el límite de 15 días hábiles
            const diasDisponibles = intTotalDiasDisponibles - totalDias;
            if (diasSeleccionados.length > diasDisponibles) {
                alert_nova.showNotification("No puedes seleccionar más días de los disponibles.", "warning", "danger");
                return;
            }

            // Verificar si se excede el límite de 15 días hábiles consecutivos
            if (excedeLimiteConsecutivo(eventData)) {
                alert_nova.showNotification("No puedes seleccionar más de 15 días hábiles consecutivos.", "warning", "danger");
                return;
            }

            let diasRestantes = diasSeleccionados.length;
            let periodoConcatenado = '';

            for (const periodo of arrPeriodosDisponibles) {
                if (diasRestantes <= 0) {
                    break; // Salir del bucle si ya no quedan días por asignar
                }

                const diasDisponibles = Math.min(diasRestantes, periodo.DiasPendientes);

                if (diasDisponibles > 0) {
                    const periodoActual = periodo.Periodo;

                    for (let i = 0; i < diasDisponibles; i++) {
                        periodoConcatenado += (periodoConcatenado !== '') ? ';' + periodoActual : periodoActual;
                    }

                    // Restar los días tomados del periodo actual
                    periodo.DiasPendientes -= diasDisponibles;
                    diasRestantes -= diasDisponibles;
                }
            }

            eventData.periodos = periodoConcatenado;

            totalDias += diasSeleccionados.length;

            document.getElementById('btnEnviar').style.display = '';
            calendar.addEvent(eventData);
            objVacaciones.push(eventData);
        }
    });
    calendar.render();
    document.getElementById('btnEnviar').addEventListener('click', () => {
        dialogConfirm(sendEnviarSolicitud);
    });
});

function validarEventoDuplicado(eventData) {
    for (const evento of objVacaciones) {
        const fechaInicioEventoExistente = new Date(evento.start);
        const fechaFinEventoExistente = new Date(evento.end);
        const fechaInicioNuevoEvento = new Date(eventData.start);
        const fechaFinNuevoEvento = new Date(eventData.end);

        // Verificar si las fechas del nuevo evento están dentro del rango del evento existente
        if (fechaInicioNuevoEvento >= fechaInicioEventoExistente &&
            fechaFinNuevoEvento <= fechaFinEventoExistente) {
            return true; // El evento duplicado fue encontrado5
        }
    }

    for (const evento of arrHistoricoVacaciones) {
        const fechaInicioEventoExistente = new Date(evento.start);
        const fechaFinEventoExistente = new Date(evento.end);
        const fechaInicioNuevoEvento = new Date(eventData.start);
        const fechaFinNuevoEvento = new Date(eventData.end);

        // Verificar si las fechas del nuevo evento se superponen con las fechas del evento existente
        if (((fechaInicioNuevoEvento < fechaFinEventoExistente && fechaFinNuevoEvento > fechaInicioEventoExistente) ||
                (fechaFinNuevoEvento > fechaInicioEventoExistente && fechaInicioNuevoEvento < fechaFinEventoExistente) ||
                (fechaInicioNuevoEvento <= fechaInicioEventoExistente && fechaFinNuevoEvento >= fechaFinEventoExistente)) &&
            (!evento.estatus_id || evento.estatus_id && evento.estatus_id !== 3)) {
            return true; // El evento duplicado fue encontrado
        }
    }

    return false; // No se encontró ningún evento duplicado
}

function getDiasHabiles(fechaInicio, fechaFin) {
    const diasHabiles = [];
    let currentDate = fechaInicio;
    while (currentDate <= fechaFin) {
        if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) { // Excluir sábado y domingo
            diasHabiles.push(currentDate);
        }
        currentDate = addDays(currentDate, 1);
    }
    return diasHabiles;
}

// Función auxiliar para agregar días a una fecha
function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

// Función para verificar si se excede el límite de 15 días hábiles consecutivos
function excedeLimiteConsecutivo(objFirstEvent) {
    let contadorDiasConsecutivos = 0;
    let ultimoDiaHabil = null;

    // Función para verificar si un día es hábil (lunes a viernes)
    function isDiaHabil(date) {
        const diaSemana = date.getDay();
        return diaSemana !== 0 && diaSemana !== 6; // Excluir sábado y domingo
    }

    const objTmp = (objVacaciones.length) ? [...objVacaciones, objFirstEvent] : [objFirstEvent];
    objTmp.sort((a, b) => {
        return new Date(a.start) - new Date(b.start);
    });
    // Verificar días hábiles consecutivos en todas las selecciones del usuario
    for (let i = 0; i < objTmp.length; i++) {
        const evento = objTmp[i];
        const fechaInicio = new Date(evento.start);
        const fechaFin = new Date(evento.end);

        for (let dia = new Date(fechaInicio); dia <= fechaFin; dia.setDate(dia.getDate() + 1)) {
            if (isDiaHabil(dia)) {
                // Si el día actual no es consecutivo al último día hábil, reinicia el contador
                if (ultimoDiaHabil !== null && !isDiaHabilConsecutivo(ultimoDiaHabil, dia) || i > 0 && !validarViernesYProximoLunes(new Date(objTmp[i - 1].end), dia)) {
                    contadorDiasConsecutivos = 1;
                } else {
                    contadorDiasConsecutivos++;
                }

                // Si se alcanzan 15 días hábiles consecutivos, devuelve true
                if (contadorDiasConsecutivos > 15) {
                    return true;
                }

                ultimoDiaHabil = new Date(dia);
            } else {
                // Reiniciar el contador si se encuentra un día no hábil
                //contadorDiasConsecutivos = 0;
                ultimoDiaHabil = null;
            }
        }
    }
    return false;
}

function validarViernesYProximoLunes(fechaViernes, fechaLunes) {
    // Comprobar si el lunes es de la semana siguiente al viernes
    const semanaViernes = getWeekNumber(fechaViernes);
    const semanaLunes = getWeekNumber(fechaLunes);

    return semanaLunes === semanaViernes + 1;
}

// Obtener el número de semanas del año
function getWeekNumber(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// Función auxiliar para verificar si dos fechas son días hábiles consecutivos
function isDiaHabilConsecutivo(date1, date2) {
    const nextDiaHabil = addDays(date1, 1);
    return nextDiaHabil.getTime() === date2.getTime();
}

const sendEnviarSolicitud = async () => {
    const formData = new FormData();
    for (let i = 0; i < objVacaciones.length; i++) {
        formData.append('fecha_inicio[]', objVacaciones[i].start);
        formData.append('fecha_fin[]', objVacaciones[i].end);
        formData.append('periodos[]', objVacaciones[i].periodos);
    }
    formData.append('dias_solicitados', totalDias);
    if (boolMedioDia) formData.append('medio_dia', '1');

    const objInit = {
        method: 'POST',
        headers: {'X-CSRFToken': getCookie('csrftoken')},
        body: formData
    };

    open_loading();
    const objFunction = (data) => {
        close_loading();
        if (data.status) window.location.reload();
    };
    await coreFetch(strUrlSaveSolicitud, objInit, objFunction);
};

const showInfoPeriodosMobile = () => {
    alert_nova.showNotification(`Se te presenta el listado de la disponibilidad de días que tienes para poder solicitar vacaciones y a que periodo pertenecen.`, "info", "info");
};

const showInfoCalendarioMobile = () => {
    alert_nova.showNotification(`En el calendario de abajo podrás seleccionar las fechas en las cuales deseas tomar vacaciones. <br>
                                        Si te equivocaste al seleccionar alguna fecha, puedes quitarla dando clic a esta misma. <br>
                                        No podrás seleccionar más de 15 días hábiles, 21 días consecutivos, tampoco puedes superar la cantidad de días disponibles.<br>
                                        Deberás dejar presionado por 1 segundo para poder seleccionar las fechas, puedes seleccionar rangos de fechas o por día individual.<br>`, "info", "warning");
};
