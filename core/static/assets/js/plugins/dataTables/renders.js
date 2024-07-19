$.fn.dataTable.render.ellipsis = function () {
    return function ( data, type, row ) {
        return data.length > 40 ? data.substr( 0, 40 ) + '…' : data;
    }
};