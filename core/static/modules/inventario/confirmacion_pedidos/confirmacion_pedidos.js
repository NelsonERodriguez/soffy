$(document).ready(function() {
  $('#datatables').DataTable({
        "pagingType": "full_numbers",
        "lengthMenu": [
            [10, 25, 50, -1],
            [10, 25, 50, "All"]
        ],
        "responsive": false,
        language: objLenguajeDataTable,
  });
});

const sendConfirmacion = (intPedido) => {
    const form = new FormData(document.getElementById('frm_confirmacion_pedidos'));
    form.append('pedido', intPedido);

    open_loading();
    fetch(strUrlSendConfirmacion, {
        method: 'POST',
        body: form
    })
      .then(response => response.json())
      .then( (data) => {

          if (data.status) {
              alert_nova.showNotification("Email enviado.", "add_alert", "success");
              $(`#tr_pedido_${intPedido}`).hide('slow');
              setTimeout(() => {
                  $(`#tr_pedido_${intPedido}`).remove();
              }, 2000);
          }
          else {
              alert_nova.showNotification("Ocurrió un error al enviar el email, intente nuevamente, si continua el error comuníquese con IT.", "warning", "danger");
          }
          close_loading();
      })
      .catch((error) => {
          close_loading();
          alert_nova.showNotification('Error de conexión, comuníquese con IT.', "warning", "danger");
          console.error(error);
      });
};
