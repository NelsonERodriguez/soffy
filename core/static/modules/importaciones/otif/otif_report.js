const drawHeadersTable = async () => {
    const container = document.getElementById('contentTableReport');
    container.innerHTML = ` <table class='table table-london'>
                                <thead>
                                    <th>
                                        Fecha Pedido
                                    </th>
                                    <th>
                                        Contenedores Pedidos
                                    </th>
                                    <th>
                                        Contenedores Confirmados
                                    </th>
                                    <th>
                                        <strong>Variación en Contenedores</strong>
                                    </th>
                                    <th>
                                        Contenedores <strong>Cargados</strong>
                                    </th>
                                    <th>
                                        <strong>Variación en Contenedores Cargados VS Confirmados</strong>
                                    </th>
                                    <th>
                                        Fecha Planeada de Embarque
                                    </th>
                                    <th>
                                        Fecha Real de Embarque
                                    </th>
                                    <th>
                                        Variación en Días de Embarque
                                    </th>
                                    <th>
                                        Fecha Planeada de Arribo
                                    </th>
                                    <th>
                                        Fecha Real de Arribo
                                    </th>
                                    <th>
                                        Variación Días Arribo
                                    </th>
                                </thead>
                            </table>`;
};

drawHeadersTable();