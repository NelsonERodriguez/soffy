const btnSave = document.getElementById('btnSave');
if(btnSave) {
    document.getElementById('btnSave').addEventListener('click', () => {
        dialogConfirm(simple_submit, 'frm_empleados_puestos');
    });
}

const elementSearchUser = document.getElementById('autocomplete_user');
if(elementSearchUser) {
    $('#autocomplete_user').autocomplete({
        minLength: 1,
        source: ( request, response ) => {
            const strUrl = urls.search_user.replace('strSearch', request.term);
            const data = new FormData();
            data.append('csrfmiddlewaretoken', valCSRF);
    
            fetch(strUrl, {
                method: 'POST',
                body: data,
            })
            .then(response => response.json())
            .then( data => {
                response($.map(data, function (item) {
                    return {
                        label: item.name,
                        value: item.id
                    }
                }))
            })
            .catch((error) => {
                console.error(error);
            });
        },
        select: function( event, ui ) {
            event.preventDefault();
            document.getElementById('autocomplete_user').value = ui.item.label;
            document.getElementById('autocomplete_user_id').value = ui.item.value;
        }
    });
}


const elementSearchDepartamento = document.getElementById('autocomplete_departamento');
if(elementSearchDepartamento) {
    $('#autocomplete_departamento').autocomplete({
        minLength: 1,
        source: ( request, response ) => {
            const strUrl = urls.search_departamento.replace('strSearch', request.term);
            const data = new FormData();
            data.append('csrfmiddlewaretoken', valCSRF);

            fetch(strUrl, {
                method: 'POST',
                body: data,
            })
            .then(response => response.json())
            .then( data => {
                response($.map(data, function (item) {
                    return {
                        label: item.name,
                        value: item.id
                    }
                }))
            })
            .catch((error) => {
                console.error(error);
            });
        },
        select: function( event, ui ) {
            event.preventDefault();
            document.getElementById('autocomplete_departamento').value = ui.item.label;
            document.getElementById('autocomplete_departamento_id').value = ui.item.value;
        }
    });    
}


const elementSearchPuesto = document.getElementById('autocomplete_puesto');
if(elementSearchPuesto) {
    $('#autocomplete_puesto').autocomplete({
        minLength: 1,
        source: ( request, response ) => {
            let strUrl = urls.search_puesto.replace('strSearch', request.term);
            strUrl = strUrl.replace('0', document.getElementById('autocomplete_departamento_id').value);
            const data = new FormData();
            data.append('csrfmiddlewaretoken', valCSRF);

            if(document.getElementById('autocomplete_departamento_id').value !== '') {
                fetch(strUrl, {
                    method: 'POST',
                    body: data,
                })
                .then(response => response.json())
                .then( data => {
                    response($.map(data, function (item) {
                        return {
                            label: item.name,
                            value: item.id
                        }
                    }))
                })
                .catch((error) => {
                    console.error(error);
                });
            }
            else {
                document.getElementById('autocomplete_departamento').classList.add('is-invalid');
                document.getElementById('contentDepartamento').classList.add('has-danger');
            }
        },
        select: function( event, ui ) {
            event.preventDefault();
            document.getElementById('autocomplete_puesto').value = ui.item.label;
            document.getElementById('autocomplete_puesto_id').value = ui.item.value;
        }
    });
}


const elementSearchJefe = document.getElementById('autocomplete_user_jefe');
if(elementSearchJefe) {
    $('#autocomplete_user_jefe').autocomplete({
        minLength: 1,
        source: ( request, response ) => {
            const strUrl = urls.search_user.replace('strSearch', request.term);
            const data = new FormData();
            data.append('csrfmiddlewaretoken', valCSRF);

            fetch(strUrl, {
                method: 'POST',
                body: data,
            })
            .then(response => response.json())
            .then( data => {
                response($.map(data, function (item) {
                    return {
                        label: item.name,
                        value: item.id
                    }
                }))
            })
            .catch((error) => {
                console.error(error);
            });
        },
        select: function( event, ui ) {
            event.preventDefault();
            document.getElementById('autocomplete_user_jefe').value = ui.item.label;
            document.getElementById('autocomplete_user_jefe_id').value = ui.item.value;
        }
    });
}