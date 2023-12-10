var modal = document.getElementById("productModal");
var btn = document.getElementById("btnRegistrarProducto");
var span = document.getElementsByClassName("close")[0];

btn.onclick = function () {
    modal.style.display = "block";
};

span.onclick = function () {
    modal.style.display = "none";
};

window.onclick = function (event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
};

document.addEventListener('DOMContentLoaded', (event) => {
    const modal = document.getElementById("productModal");
    const btn = document.getElementById("btnRegistrarProducto");
    const span = document.querySelector(".close");
    const form = document.getElementById('productForm');
    const updateButton = document.getElementById('updateButton');
    const statusFilter = document.getElementById('estatusFilterSelect');

    if (!modal || !btn || !span) {
        console.error("Elementos del modal o botón no encontrados en el DOM.");
        return;
    }

    btn.onclick = () => modal.style.display = "block";
    span.addEventListener('click', () => modal.style.display = "none");

    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    };

    if (form) {
        form.onsubmit = (e) => {
            const fields = ['productCode', 'productName', 'productDescription', 'productDate', 'clientName', 'projectId'];

            for (const field of fields) {
                if (!form[field].value.trim()) {
                    alert(`Por favor, ingresa el ${field.replace('product', '').replace(/([A-Z])/g, ' $1').trim().toLowerCase()}.`);
                    e.preventDefault();
                    return false;
                }
            }
        };
    } else {
        console.error("El formulario de registro de producto no fue encontrado.");
    }

    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');

    if (success) {
        alert('Producto registrado con éxito');
        if (form) form.reset();
    }

    document.querySelectorAll('.inventory-list table tbody tr').forEach(row => {
        row.addEventListener('dblclick', () => {
            const codigoProducto = row.getAttribute('data-codigo-producto');

            if (codigoProducto) { // Verificar si codigoProducto no es undefined
                console.log("Código del producto a buscar:", codigoProducto);

                fetch(`/producto/${codigoProducto}`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Producto no encontrado');
                        }
                        return response.json();
                    })
                    .then(producto => {
                        const detalles = ['Codigo', 'Descripcion', 'FechaIngreso', 'NombreCliente', 'Id', 'Comentarios'];
                        for (const detalle of detalles) {
                            document.getElementById(`detalles${detalle}`).textContent = producto[detalle.toLowerCase()];
                        }
                        document.getElementById('statusSelect').value = producto.estatus;

                        document.getElementById('taskDetails').style.display = 'block';
                        document.getElementById('modifySection').style.display = 'block';
                    })
                    .catch(error => {
                        console.error('Error:', error);
                    });
            } else {
                console.error("Código del producto no definido.");
            }
        });
    });

    if (updateButton) {
        updateButton.addEventListener('click', () => {
            const codigo = document.getElementById('detallesCodigo').textContent.trim();
            const estatus = document.getElementById('statusSelect').value;
            const nuevosComentarios = document.getElementById('newComment').value.trim();

            fetch('/actualizarTarea', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ codigo, estatus, nuevosComentarios }),
            })
                .then(response => response.text())
                .then(data => {
                    alert(data);
                    location.reload();
                })
                .catch((error) => {
                    console.error('Error al actualizar el producto:', error);
                });
        });
    } else {
        console.error("El botón de actualizar tarea no fue encontrado.");
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            const selectedStatus = statusFilter.value;
            const rows = document.querySelectorAll('.inventory-list table tbody tr');

            rows.forEach(row => {
                const statusCell = row.cells[7].textContent;
                row.style.display = (selectedStatus === 'Todos' || statusCell === selectedStatus) ? '' : 'none';
            });
        });
    } else {
        console.error("El filtro de estatus no fue encontrado.");
    }
});
