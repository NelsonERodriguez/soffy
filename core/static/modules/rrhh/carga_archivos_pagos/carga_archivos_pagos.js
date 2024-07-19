const downloadExample = () => {
    const elementOption = document.getElementById('optionsUpload');

    if(elementOption) {
        open_loading();
        let strColumns = '';
        objColumns.map(data => {
            const boolExist = data.apply.find(element => element == elementOption.value);
            if(boolExist){
                strColumns += `<th>${data.str_position}</th>`;
            }
        });
        const tableTMP = `  <table id='tableColumnsTMP'>
                                <thead>
                                    <tr>${strColumns}</tr>
                                </thead>
                            </table>`;
        document.getElementById('contentTable').innerHTML = tableTMP;

        exportTableToExcel('tableColumnsTMP', `Archivo ejemplo de ${elementOption.value}`);

        document.getElementById('contentTable').innerHTML = '';
        close_loading();
    }
};