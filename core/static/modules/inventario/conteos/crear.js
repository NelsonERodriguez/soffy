$(".select2-encargado").select2({
    placeholder: 'Seleccione el encargado',
    language: 'es',
});

$(".select2-ayudantes").select2({
    placeholder: 'Seleccione los ayudantes (opcional)',
    language: 'es',
});

$(".select2-auxiliares").select2({
    placeholder: 'Seleccione los auxiliares (opcional)',
    language: 'es',
});

$(".select2-clasificacion").select2({
    placeholder: 'Seleccione una clasificación',
    language: 'es',
});

$(".select2-producto").select2({
    placeholder: 'Seleccione un producto',
    language: 'es',
});

$(".select2-ubicacion").select2({
    placeholder: 'Seleccione una ubicación',
    language: 'es',
});

$('a[data-toggle="tab"]').on('show.bs.tab', function (event) {
    const strLink = event.target.dataset.tab;

    const objRadio = document.querySelector(`input[data-radio="${strLink}"]`);
    objRadio.checked = true;

    const objCantidad = $(`input[name="cantidad"]`);
    const objClasificacion = $(`select[name="clasificacion"]`);
    const objProducto = $(`select[name="producto"]`);
    const objUbicacion = $(`select[name="ubicacion"]`);
    switch (objRadio.value) {
        case "1":
            objCantidad.prop("required", true)
                .removeAttr("disabled")
                .focus();

            objClasificacion.removeAttr("required")
                .prop("disabled", true)
                .val(null).trigger("change");

            objProducto.removeAttr("required")
                .prop("disabled", true)
                .val(null).trigger("change");

            objUbicacion.removeAttr("required")
                .prop("disabled", true)
                .val(null).trigger("change");
            break;
        case "3":
            objUbicacion.prop("required", true)
                .removeAttr("disabled");

            objClasificacion.removeAttr("required")
                .prop("disabled", true)
                .val(null).trigger("change");

            objProducto.removeAttr("required")
                .prop("disabled", true)
                .val(null).trigger("change");

            objCantidad.removeAttr("required")
                .prop("disabled", true)
                .val("");
            break;
        case "4":
            objClasificacion.prop("required", true)
                .removeAttr("disabled");

            objProducto.removeAttr("required")
                .prop("disabled", true)
                .val(null).trigger("change");

            objCantidad.removeAttr("required")
                .prop("disabled", true)
                .val("");

            objUbicacion.removeAttr("required")
                .prop("disabled", true)
                .val(null).trigger("change");
            break;
        case "5":
            objProducto.prop("required", true)
                .removeAttr("disabled");

            objClasificacion.removeAttr("required")
                .prop("disabled", true)
                .val(null).trigger("change");

            objCantidad.removeAttr("required")
                .prop("disabled", true)
                .val("");

            objUbicacion.removeAttr("required")
                .prop("disabled", true)
                .val(null).trigger("change");
            break;
    }

});

document.getElementById('regresar').onclick = () => {
    simple_redireccion(strUrlRegresar);
};

document.getElementById('guardar').onclick = () => {
    if ($(`#encargado`).val() === "") {
        alert_nova.showNotification('Ingrese el encargado', "warning", "danger");
        return false;
    }

    if (!document.querySelector(`input[name="tipo"]:checked`)) {
        alert_nova.showNotification('Seleccione el tipo de conteo.', "warning", "danger");
        return false;
    }

    if (document.querySelector(`input[name="tipo"]:checked`).value === "1" && document.getElementById('cantidad').value === "") {
        alert_nova.showNotification('Debe ingresar la cantidad.', "warning", "danger");
        return false;
    }

    if (document.querySelector(`input[name="tipo"]:checked`).value === "4" && document.getElementById('clasificacion').value === "") {
        alert_nova.showNotification('Debe ingresar la clasificación.', "warning", "danger");
        return false;
    }

    if (document.querySelector(`input[name="tipo"]:checked`).value === "3" && document.getElementById('ubicacion').value === "") {
        alert_nova.showNotification('Debe ingresar la ubicación.', "warning", "danger");
        return false;
    }

    if (document.querySelector(`input[name="tipo"]:checked`).value === "5" && document.getElementById('producto').value === "") {
        alert_nova.showNotification('Debe ingresar el producto.', "warning", "danger");
        return false;
    }

    dialogConfirm(() => {
        document.getElementById('orden').submit();
    });
};

const input = document.getElementById("cantidad");
input.addEventListener("change", () => {
  const value = parseInt(input.value);
  if (isNaN(value) || value < 1 || value > 10) {
      input.value = "";
      alert_nova.showNotification('Por favor, ingrese un valor del 1 al 10.', "warning", "danger")
  }
});
