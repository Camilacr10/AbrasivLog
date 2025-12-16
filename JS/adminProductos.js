document.addEventListener('DOMContentLoaded', function () {
    let edittingId; // Variable para almacenar el id del producto en edición
    let productos = []; // Arreglo para almacenar los productos
    let categorias = []; // Arreglo para almacenar las categorías
    let editOriginalCodigo = ''; // Variable para almacenar el código original en la edicion
    let agreOriginalCodigo = ''; // Variable para almacenar el código original cuando se agrega un nuevo producto
    const STOCK_MIN = 5;
    const API_URL = '../backend/adminProductos.php';
    const API_CATS = '../backend/adminCategorias.php';
    const categoriaIndex = {}; // Índice id_categoria -> nombre
    const pagina = location.pathname.split('/').pop().toLowerCase(); // Obtiene el nombre de la página actual



    //Función para verificar si la página actual es 'inventario.html' o 'inventarioCategorias.html' y la deja seleccionada en negro las letras
    if (pagina === 'inventario.html') {
        const inventarioLink = document.getElementById('inventarioDropdown');
        if (inventarioLink) {
            inventarioLink.classList.add('active');
        }
    }




    // Función para cargar las categorías
    async function loadCategorias() {
        try {
            const response = await fetch(API_CATS, {
                method: 'GET',
                credentials: 'include',
            });
            if (response.ok) {
                categorias = await response.json();

                // Construye índice id -> nombre de las categorías
                categorias.forEach(c => { categoriaIndex[String(c.id_categoria)] = c.nombre || ''; });

                // Pobla los dropdown de categorías
                populateCategoriaSelects();
            } else {
                console.error("Error al cargar las categorías");
            }
        } catch (err) {
            console.error(err);
        }
    }




    // Función para cargar los productos
    async function loadProductos() {
        try {
            const response = await fetch(API_URL, {
                method: 'GET',
                credentials: 'include',
            });
            if (response.ok) {
                productos = await response.json();
                filtroBusqueda();
            } else {
                console.error("Error al cargar los productos");
            }
        } catch (err) {
            console.error(err);
        }
    }




    // Función para renderizar la tabla de productos
    function renderProductos(lista) {
        const productoList = document.getElementById('tablaProductos');
        productoList.innerHTML = '';

        // Si no hay resultados, muestra un mensaje en la tabla
        if (!lista || lista.length === 0) {
            productoList.innerHTML = `
          <tr>
            <td colspan="14" class="text-center text-muted py-3">
              No hay resultado del producto buscado.
            </td>
          </tr>
        `;
            return;
        }

        // Recorre la lista de productos
        lista.forEach(function (p) {
            const row = document.createElement('tr');

            // Marca el producto con fondo amarillo si la cantidad es menor o igual a 5
            if (Number(p.cantidad) <= 5) {
                row.classList.add('amarillo');
            }

            // Nombre de la categoría (no el id)
            const nombreCategoria = categoriaIndex[String(p.id_categoria)] || '';

            // Cálculos para mostrar en la tabla productos (solo visual)
            const precio = Number(p.precio_base) || 0;
            const ivaPct = Number(p.porcentaje_iva) || 0;
            const descPct = Number(p.porcentaje_descuento) || 0;
            const ivaColones = precio * ivaPct / 100;
            const descColones = precio * descPct / 100;
            const final = precio + ivaColones - descColones;

            row.innerHTML = `
        <td><img src="${p.imagen_path || ''}" class="product-image"/></td>
        <td>${p.codigo ?? ''}</td>
        <td>${p.nombre ?? ''}</td>
        <td>${nombreCategoria}</td>
        <td>${p.detalle ?? ''}</td>
        <td>${p.cantidad ?? 0}</td>
        <td>₡${precio.toFixed(2)}</td>
        <td>${ivaPct}%</td>
        <td>₡${ivaColones.toFixed(2)}</td>
        <td>${descPct}%</td>
        <td>₡${descColones.toFixed(2)}</td>
        <td>₡${final.toFixed(2)}</td>
        <td>
        <span class="badge ${p.estado === 'Activo' ? 'bg-success' : 'bg-secondary'}"> ${p.estado} </span>
        </td>
        <td>
          <div class="dropdown">
            <button class="btn btn-sm btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
              Acciones
            </button>
            <ul class="dropdown-menu">
              <li>
                <button type="button" class="dropdown-item edit-producto" data-id="${p.id_producto}">
                  <i class="fa-solid fa-pen-to-square me-2"></i>Editar
                </button>
              </li>
              <li><hr class="dropdown-divider"></li>
              <li>
                <button type="button" class="dropdown-item ${p.estado === 'Activo' ? 'text-danger' : 'text-success'} inactivar-producto" data-id="${p.id_producto}">
                    <i class="fa-solid ${p.estado === 'Activo' ? 'fa-box-archive' : 'fa-box-open'} me-2"></i>${p.estado === 'Activo' ? 'Inactivar' : 'Activar'}
                </button>
              </li>
            </ul>
          </div>
        </td>
      `;
            productoList.appendChild(row);
        });

        document.querySelectorAll('.edit-producto').forEach(button =>
            button.addEventListener('click', handleEdit)
        );
        document.querySelectorAll('.inactivar-producto').forEach(button =>
            button.addEventListener('click', handleInactivarProducto)
        );
    }




    // Función para buscar solo por nombre y código de los productos
    function filtroBusqueda() {
        // Obtiene el valor ingresado en el input y lo convierte a minúsculas para la comparación
        const q = (document.getElementById('buscar').value || '').trim().toLowerCase();

        // Si no hay texto en el input, muestra todos los productos
        if (!q) {
            renderProductos(productos);
            return;
        }

        // Filtra los productos que contienen el texto ingresado
        const filtrados = productos.filter(p =>
            (p.nombre || '').toLowerCase().includes(q) || // Busca por nombre
            (p.codigo || '').toLowerCase().includes(q)    // Busca por código
        );

        renderProductos(filtrados); // Muestra los productos filtrados
    }




    // Agrega un event listener al input de busqueda
    document.getElementById('buscar').addEventListener('input', filtroBusqueda);




    // Función para manejar la edición de un producto
    function handleEdit(e) {

        // Obtiene el id del producto desde el atributo data-id del botón
        const id = parseInt(e.currentTarget.dataset.id, 10);

        // Busca en el arreglo de productos el que coincida con ese id
        const p = productos.find(x => Number(x.id_producto) === id);

        // Si no se encuentra el producto, muestra un mensaje y detiene la función
        if (!p) {
            alert('Producto no encontrado');
            return;
        }

        // Asegura que el select de categorías esté poblado
        populateCategoriaSelects();

        // Rellena los campos del formulario/modal de edición con los datos del producto
        document.getElementById('editCodigo').value = p.codigo ?? '';
        document.getElementById('editNombre').value = p.nombre ?? '';
        document.getElementById('editCategoria').value = p.id_categoria ?? '';
        document.getElementById('editDetalle').value = p.detalle ?? '';
        document.getElementById('editCantidad').value = p.cantidad ?? '';
        document.getElementById('editPrecio').value = p.precio_base ?? '';
        document.getElementById('editIva').value = p.porcentaje_iva ?? 13;
        document.getElementById('editDescuento').value = p.porcentaje_descuento ?? 0;
        document.getElementById('editEstadoProducto').value = p.estado ?? 'Activo';

        // Recalcular IVA, descuento y precio final al abrir
        calcularYMostrarEnEditar();

        // Muestra la imagen actual del producto (URL) en preview
        const prev = document.getElementById('editPreviewImagen'); // Obtiene la imagen que se muestra en previa
        const urlEdit = p.imagen_path || ''; // Guarda la URL de la imagen en una variable
        prev.src = urlEdit; // Establece la URL de la imagen previa del modal
        prev.style.display = urlEdit ? 'block' : 'none'; // Muestra la imagen previa si la URL no es vacía
        const editUrl = document.getElementById('editImagenUrl'); //Campo de URL de la imagen en el modal
        if (editUrl) editUrl.value = urlEdit;  // Establece la URL de la imagen en el campo

        // Guarda el código original
        editOriginalCodigo = p.codigo || '';

        // Marca que se está en modo edición y guarda el id actual en una variable global
        edittingId = id;

        // Abre el modal de Bootstrap para mostrar el formulario de edición
        new bootstrap.Modal(document.getElementById('modalEditar')).show();
    }




    // Función para manejar inactivar o activar un producto
    async function handleInactivarProducto(event) {

        // Obtiene el id del producto desde el botón
        const productoId = parseInt(event.currentTarget.dataset.id, 10);

        // Busca el producto en el arreglo global
        const p = productos.find(x => Number(x.id_producto) === productoId);

        // Si no lo encuentra, muestra mensaje y detiene
        if (!p) {
            alert('Producto no encontrado');
            return;
        }

        // Verifica si el producto está activo o inactivo
        const estaActivo = String(p.estado).trim().toLowerCase() === 'activo';

        // Si el producto está activo
        if (estaActivo) {

            // Confirma antes de inactivar
            const ok1 = confirm(`¿Está seguro de inactivar el producto ${p.nombre}? Esta acción no se puede deshacer.`);
            if (!ok1) return; // Si cancela, no hace nada

            // Llama al backend con método DELETE
            const response = await fetch(`${API_URL}?id_producto=${productoId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            // Si la respuesta es correcta
            if (response.ok) {
                alert('Producto inactivado correctamente.');
                loadProductos(); // Recarga la tabla
            } else {
                console.error("Error al inactivar el producto");
            }

        } else {
            // Si el producto está inactivo

            // Confirma antes de activar
            const ok2 = confirm(`¿Desea activar nuevamente el producto ${p.nombre}?`);
            if (!ok2) return;

            // Calcula valores antes de enviar al backend
            const precio_base = Number(p.precio_base) || 0;
            const porcentaje_iva = Number(p.porcentaje_iva) || 0;
            const porcentaje_descuento = Number(p.porcentaje_descuento) || 0;
            const iva = +(precio_base * porcentaje_iva / 100).toFixed(2);
            const precio_final = +(precio_base + iva - (precio_base * porcentaje_descuento / 100)).toFixed(2);

            // Cuerpo con los datos del producto
            const body = {
                id_producto: productoId,
                id_categoria: Number(p.id_categoria),
                nombre: p.nombre || '',
                codigo: p.codigo || '',
                detalle: p.detalle || '',
                precio_base,
                porcentaje_iva,
                cantidad: Number(p.cantidad) || 0,
                iva,
                porcentaje_descuento,
                precio_final,
                estado: 'Activo', // Cambia el estado
                imagen_path: p.imagen_path || ''
            };

            // Llama al backend con método PUT
            const response = await fetch(API_URL, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(body)
            });

            // Si la respuesta es correcta
            if (response.ok) {
                alert('Producto activado correctamente.');
                loadProductos(); // Recarga la tabla
            } else {
                console.error('Error al activar el producto');
            }
        }
    }




    // Función que limpia los campos código y validaciones del modal Agregar Producto
    function limpiarModalAgregarProducto() {
        agreOriginalCodigo = ''; // Limpia el código original
        ['codigo'].forEach(id => {
            const el = document.getElementById(id); // Obtiene el input
            el.setCustomValidity(''); // Limpia la validación personalizada
            el.classList.remove('is-invalid'); // Limpia la clase de error
        });
        document.getElementById('formAgregar').reset(); // Limpia el formulario
        const prev = document.getElementById('previewImagen'); // Obtiene la imagen que se muestra en previa
        if (prev) {
            prev.style.display = 'none'; // Oculta la imagen previa
            prev.removeAttribute('src');
        } // Elimina la URL de la imagen
        const est = document.getElementById('estadoProducto'); // Obtiene el selector de estado
        if (est) est.value = 'Activo'; // Establece el valor por defecto
    }

    // Maneja la limpieza cuando se cierra el modal de Agregar Producto
    document.getElementById('modalAgregar').addEventListener('hidden.bs.modal', () => {
        limpiarModalAgregarProducto(); // Llama la función de limpieza
    });




    //Maneja la verificacion del campo de código antes de enviar el formulario para agregar un producto
    // Se ejecuta mientras el adminstrador o empleado escriben, el modal abierto
    ['codigo'].forEach(id => {
        const el = document.getElementById(id); // Obtiene el input
        el.addEventListener('input', () => { // Agrega un event listener al input
            el.setCustomValidity(''); // Limpia la validación personalizada
            el.classList.remove('is-invalid'); // Limpia la clase de error
        });
    });




    // Maneja el envío del formulario para agregar un producto
    document.getElementById('formAgregar').addEventListener('submit', async (e) => {
        e.preventDefault(); // Evita que el formulario recargue la página

        // Obtiene los valores de los campos del formulario
        const codigo = (document.getElementById('codigo').value || '').trim();
        const nombre = document.getElementById('nombre').value;
        const id_categoria = document.getElementById('categoria').value; // select con id_categoria
        const detalle = document.getElementById('detalle').value;
        const cantidad = document.getElementById('cantidad').value;
        const precio_base = document.getElementById('precio').value;
        const porcentaje_iva = document.getElementById('iva').value;
        const porcentaje_descuento = document.getElementById('descuento').value || 0;
        const imagen_path = (document.getElementById('imagenUrl').value || '').trim();
        const estado = document.getElementById('estadoProducto').value;

        //Validaciones

        // Verifica si el código ya existe en la base de datos
        const codigoEl = document.getElementById('codigo'); // Obtiene el input del código
        //Busca en el arreglo de productos si el codigo ya existe
        const dupCodigo = productos.some(p => (p.codigo || '').toLowerCase() === codigo.toLowerCase());
        // Si el código ya existe
        if (dupCodigo) {
            codigoEl.setCustomValidity('El código ya existe.'); // Establece el mensaje de validación personalizada
            codigoEl.classList.add('is-invalid'); // Agrega la clase de error
            codigoEl.reportValidity();  // muestra el mensaje en el formulario
            return; // no envía
        }

        // Cálculos en cliente para enviar a backend
        const ivaCol = Number(precio_base) * Number(porcentaje_iva) / 100;
        const descCol = Number(precio_base) * Number(porcentaje_descuento) / 100;
        const precioFin = Number(precio_base) + ivaCol - descCol;

        // Envía los datos al servidor usando fetch con método POST
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                id_categoria: Number(id_categoria),
                nombre,
                codigo,
                detalle,
                precio_base: Number(precio_base),
                porcentaje_iva: Number(porcentaje_iva),
                cantidad: Number(cantidad),
                iva: Number(ivaCol.toFixed(2)),
                porcentaje_descuento: Number(porcentaje_descuento),
                precio_final: Number(precioFin.toFixed(2)),
                estado,
                imagen_path
            })
        });

        // Si la respuesta es exitosa:
        if (res.ok) {

            // Referencia al modal
            const modalEl = document.getElementById('modalAgregar');
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal.hide();

            // Limpia el formulario
            e.target.reset();

            // Espera a que el modal se cierre para mostrar el alert
            modalEl.addEventListener('hidden.bs.modal', () => {
                alert('Producto creado exitosamente');
            }, { once: true });

            // Recarga la lista de productos para mostrar el nuevo
            loadProductos();
        } else {
            // Si falla, muestra un error en la consola
            console.error('Error al crear el producto');
        }
    });




    // Maneja la verificacion del campo de código antes de enviar el formulario para editar un producto
    //Se ejecuta cuando se cierra el modal
    document.getElementById('modalEditar').addEventListener('hidden.bs.modal', () => {
        editOriginalCodigo = ''; // Limpia el código original
        ['editCodigo'].forEach(id => {
            const el = document.getElementById(id); // Obtiene el input
            el.setCustomValidity(''); // Limpia la validación personalizada
            el.classList.remove('is-invalid'); // Limpia la clase de error
        });
    });




    //Maneja la verificacion del campo de código antes de enviar el formulario para editar un producto
    // Se ejecuta mientras el adminstrador o empleado escriben, el modal abierto
    ['editCodigo'].forEach(id => {
        const el = document.getElementById(id); // Obtiene el input
        el.addEventListener('input', () => { // Agrega un event listener al input
            el.setCustomValidity(''); // Limpia la validación personalizada
            el.classList.remove('is-invalid'); // Limpia la clase de error
        });
    });




    // Maneja el envío del formulario para editar un producto
    document.getElementById('formEditar').addEventListener('submit', async (e) => {
        e.preventDefault(); // Evita que el formulario recargue la página

        // Obtiene los valores de los campos del formulario de edición
        const codigo = (document.getElementById('editCodigo').value || '').trim();
        const nombre = document.getElementById('editNombre').value;
        const id_categoria = document.getElementById('editCategoria').value; // select con id_categoria
        const detalle = document.getElementById('editDetalle').value;
        const cantidad = document.getElementById('editCantidad').value;
        const precio_base = document.getElementById('editPrecio').value;
        const porcentaje_iva = document.getElementById('editIva').value;
        const porcentaje_descuento = document.getElementById('editDescuento').value || 0;
        const imagen_path = (document.getElementById('editImagenUrl').value || '').trim();
        const estado = document.getElementById('editEstadoProducto').value;

        //Validaciones

        // Toma los valores de los inputs y los guarda en variables
        const codigoElE = document.getElementById('editCodigo');

        // Limpia cualquier error previo antes de validar
        [codigoElE].forEach(el => { el.setCustomValidity(''); el.classList.remove('is-invalid'); });

        const norm = s => (s || '').trim().toLowerCase(); // Función para normalizar cadenas de texto
        const idActual = String(edittingId); // ID del producto actual

        // Solo valida código si el usuario lo cambió respecto al original
        if (norm(codigo) !== norm(editOriginalCodigo)) {
            const dupCodigo = productos.some(p => // Verifica si el código ya existe
                String(p.id_producto) !== idActual && // Excluye el producto actual
                norm(p.codigo) === norm(codigo) // Compara con el código ingresado
            );

            // Si el código ya existe
            if (dupCodigo) {
                codigoElE.setCustomValidity('El código ya existe.'); // Establece la validación personalizada
                codigoElE.classList.add('is-invalid'); // Agrega la clase de error
                codigoElE.reportValidity(); // Reporta la validación
                return; // no envía
            }
        }

        // Cálculos en cliente para enviar a backend
        const ivaCol = Number(precio_base) * Number(porcentaje_iva) / 100;
        const descCol = Number(precio_base) * Number(porcentaje_descuento) / 100;
        const precioFin = Number(precio_base) + ivaCol - descCol;

        // Envía la información actualizada al servidor con método PUT
        // Incluye el id_producto que se está editando
        const res = await fetch(API_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                id_producto: edittingId,
                id_categoria: Number(id_categoria),
                nombre,
                codigo,
                detalle,
                precio_base: Number(precio_base),
                porcentaje_iva: Number(porcentaje_iva),
                cantidad: Number(cantidad),
                iva: Number(ivaCol.toFixed(2)),
                porcentaje_descuento: Number(porcentaje_descuento),
                precio_final: Number(precioFin.toFixed(2)),
                estado,
                imagen_path
            })
        });

        // Si la actualización fue exitosa:
        if (res.ok) {

            // Cierra el modal de edición
            const modalEl = document.getElementById('modalEditar');
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal.hide();

            // Muestra el mensaje cuando el modal ya terminó de cerrarse (igual que en Agregar)
            modalEl.addEventListener('hidden.bs.modal', () => {
                alert(`Producto ${nombre} actualizado correctamente.`);
            }, { once: true });

            // Limpia la variable global de edición
            edittingId = null;

            // Recarga la lista de productos
            loadProductos();
        } else {
            // Si falla, muestra un error en consola
            console.error('PUT producto failed');
        }
    });




    // Reset automático al abrir el modal de agregar
    // Limpia el formulario y establece el estado por defecto en "Activo"
    document.getElementById('modalAgregar').addEventListener('show.bs.modal', () => {
        document.getElementById('formAgregar').reset();
        const est = document.getElementById('estadoProducto');
        if (est) est.value = 'Activo';
        const prev = document.getElementById('previewImagen');
        if (prev) { prev.style.display = 'none'; prev.removeAttribute('src'); }
        populateCategoriaSelects(); // asegura categorías en el dropdown
        // recalcular campos en cero
        document.getElementById('ivaColones').value = '';
        document.getElementById('descColones').value = '';
        document.getElementById('precioFinal').value = '';
    });




    // NOTIFICACIONES DE BAJO STOCK

    // Busca los productos con cantidad menor o igual al mínimo
    function getProductosBajoStock(arr) {
        return (arr || []).filter(p => Number(p.cantidad) <= STOCK_MIN);
    }

    // Muestra las alertas dentro del dropdown de la campana
    function pintarDropdownBajoStock(lista) {
        const cont = document.getElementById('listaLowStock');
        const badge = document.getElementById('badgeLowStock');
        if (!cont || !badge) return;

        cont.innerHTML = ''; // Limpia el contenido anterior

        // Si no hay productos en bajo stock
        if (!lista.length) {
            badge.classList.add('d-none'); // Oculta el número
            cont.innerHTML = '<div class="text-center text-muted small py-2">No hay productos con bajo inventario.</div>';
            return;
        }

        // Muestra el total de alertas
        badge.textContent = String(lista.length);
        badge.classList.remove('d-none');

        // Recorre la lista y muestra cada alerta
        lista.forEach(p => {
            const nombre = p.nombre || '';
            const img = p.imagen_path || '';

            const div = document.createElement('div');
            div.className = 'd-flex align-items-center gap-2 py-2 border-bottom';

            // Mensaje exacto solicitado + imagen
            div.innerHTML = `
                            <img src="${img}" alt="${nombre}" style="width:28px;height:28px;object-fit:cover;border-radius:6px;">
                            <div class="small">
                                <strong>Alerta:</strong> el producto <strong>${nombre}</strong> está por debajo del stock mínimo.
                            </div>
                            `;

            cont.appendChild(div);
        });
    }

    // Refresca el dropdown y el badge usando la lista actual
    function refrescarBajoStock() {
        const bajos = getProductosBajoStock(productos) // Busca los productos con bajo stock
            .sort((a, b) => a.cantidad - b.cantidad); // Ordena de menor a mayor stock
        pintarDropdownBajoStock(bajos); // Actualiza el dropdown
    }

    // Observa los cambios en la tabla (cuando se agregan o editan productos)
    (function observarTabla() {
        const tbody = document.getElementById('tablaProductos');
        if (!tbody || typeof MutationObserver === 'undefined') return;
        new MutationObserver(refrescarBajoStock).observe(tbody, { childList: true });
    })();

    // Actualiza al cerrar los modales de agregar o editar
    ['modalAgregar', 'modalEditar'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('hidden.bs.modal', refrescarBajoStock);
    });

    // Refresca cada 3 segundos (por si cambia sin recargar tabla)
    setInterval(refrescarBajoStock, 3000);

    // Refresca al entrar a la página
    refrescarBajoStock();

    // Limpia manualmente las notificaciones desde el botón del dropdown
    document.addEventListener('click', e => {
        if (!e.target.closest('#btnLimpiarNotif')) return;
        const cont = document.getElementById('listaLowStock');
        const badge = document.getElementById('badgeLowStock');
        if (cont) cont.innerHTML = '<div class="text-center text-muted small py-2">No hay productos con bajo inventario.</div>';
        if (badge) badge.classList.add('d-none');
    });




    // Calculos necesarios para las funciones


    // Calcula los valores de IVA, Descuento y Precio Final en AGREGAR
    ['precio', 'iva', 'descuento'].forEach(id => {
        const el = document.getElementById(id); // Obtiene cada input de precio, iva y descuento
        if (!el) return; // Si no existe el campo, detiene la función
        el.addEventListener('input', calcularYMostrarEnAgregar); // Escucha los cambios en los campos
    });



    // Función que calcula y muestra los valores correspondientes en el modal Agregar Producto
    function calcularYMostrarEnAgregar() {

        // Obtiene los valores numéricos de los campos (si están vacíos, usa 0)
        const precio = parseFloat(document.getElementById('precio').value) || 0;
        const iva = parseFloat(document.getElementById('iva').value) || 0;
        const desc = parseFloat(document.getElementById('descuento').value) || 0;

        // Realiza los cálculos
        const ivaCol = precio * iva / 100; // Calcula el IVA en colones
        const desCol = precio * desc / 100; // Calcula el descuento en colones
        const final = precio + ivaCol - desCol; // Calcula el precio final del producto

        // Muestra los resultados en los campos correspondientes del formulario
        document.getElementById('ivaColones').value = ivaCol.toFixed(2);
        document.getElementById('descColones').value = desCol.toFixed(2);
        document.getElementById('precioFinal').value = final.toFixed(2);
    }




    //Calculos necesarios para las funciones

    // Calcula los valores de IVA, Descuento y Precio Final en EDITAR
    ['editPrecio', 'editIva', 'editDescuento'].forEach(id => {
        const el = document.getElementById(id); // Obtiene cada input del modal de edición
        if (!el) return; // Si no existe el campo, detiene la función
        el.addEventListener('input', calcularYMostrarEnEditar); // Escucha los cambios en los campos
    });



    // Función que calcula y muestra los valores correspondientes en el modal Editar Producto
    function calcularYMostrarEnEditar() {

        // Obtiene los valores numéricos de los campos (si están vacíos, usa 0)
        const precio = parseFloat(document.getElementById('editPrecio').value) || 0;
        const iva = parseFloat(document.getElementById('editIva').value) || 0;
        const desc = parseFloat(document.getElementById('editDescuento').value) || 0;

        // Realiza los cálculos
        const ivaCol = precio * iva / 100; // Calcula el IVA en colones
        const desCol = precio * desc / 100; // Calcula el descuento en colones
        const final = precio + ivaCol - desCol; // Calcula el precio final del producto

        // Muestra los resultados en los campos correspondientes del formulario
        document.getElementById('editIvaColones').value = ivaCol.toFixed(2);
        document.getElementById('editDescColones').value = desCol.toFixed(2);
        document.getElementById('editPrecioFinal').value = final.toFixed(2);
    }




    // Vista previa inmediata de IMAGEN en AGREGAR
    const imagenUrlAgregar = document.getElementById('imagenUrl'); // Campo donde se ingresa la URL de la imagen
    const previewAgregar = document.getElementById('previewImagen'); // Imagen que muestra la vista previa

    if (imagenUrlAgregar) {
        imagenUrlAgregar.addEventListener('input', () => {
            const url = (imagenUrlAgregar.value || '').trim(); // Obtiene el valor del campo
            if (url) {
                // Si hay una URL, muestra la imagen
                previewAgregar.src = url;
                previewAgregar.style.display = 'block';
            } else {
                // Si no hay URL, limpia y oculta la imagen
                previewAgregar.removeAttribute('src');
                previewAgregar.style.display = 'none';
            }
        });
    }




    // Vista previa inmediata de IMAGEN en EDITAR
    const imagenUrlEditar = document.getElementById('editImagenUrl'); // Campo donde se ingresa la URL de la imagen al editar
    const previewEditar = document.getElementById('editPreviewImagen'); // Imagen que muestra la vista previa en edición

    if (imagenUrlEditar) {
        imagenUrlEditar.addEventListener('input', () => {
            const url = (imagenUrlEditar.value || '').trim(); // Obtiene el valor del campo
            if (url) {
                // Si hay una URL, muestra la imagen
                previewEditar.src = url;
                previewEditar.style.display = 'block';
            } else {
                // Si no hay URL, limpia y oculta la imagen
                previewEditar.removeAttribute('src');
                previewEditar.style.display = 'none';
            }
        });
    }




    // Función para poblar los dropdown de CATEGORÍAS en Agregar y Editar
    function populateCategoriaSelects() {

        // Sub-función que llena un <select> específico con la lista de categorías
        const fill = (id) => {
            const sel = document.getElementById(id); // Obtiene el <select> por su id
            if (!sel) return; // Si no existe el campo, detiene la función

            const current = sel.value; // Guarda la opción seleccionada actualmente
            sel.innerHTML = '<option value="" disabled selected>Seleccione una categoría</option>';
            // Reinicia el contenido del select, dejando una opción por defecto

            // Recorre el arreglo global "categorias" y crea una opción por cada una
            categorias.forEach(c => {
                const opt = document.createElement('option'); // Crea una nueva opción
                opt.value = String(c.id_categoria); // Asigna el id de la categoría como valor
                opt.textContent = c.nombre || ''; // Muestra el nombre de la categoría
                sel.appendChild(opt); // Agrega la opción al select
            });

            // Si el usuario tenía seleccionada una categoría válida antes, la restaura
            if (current && categorias.some(c => String(c.id_categoria) === String(current))) {
                sel.value = current;
            }
        };

        // Llama la función para llenar los selects tanto de Agregar como de Editar
        fill('categoria');     // Modal de Agregar
        fill('editCategoria'); // Modal de Editar
    }




    // Hacemos disponible loadProductos fuera de este bloque
    window.loadProductos = loadProductos;

    // Carga la lista de productos y categorías al cargar la página, por ser dos recursos aparte
    loadCategorias(); // Cargar primero categorías (para selects y nombre en tabla)
    loadProductos();
});

// =============================
//    VERIFICACIÓN DE SESIÓN
// =============================
async function verificarSesionYMostrarUsuario() {
    try {
        const res = await fetch("../backend/login.php?op=me", {
            credentials: "same-origin"
        });

        const me = await res.json();

        if (!me.authenticated) {
            window.location.href = "login.html";
            return;
        }

        const spanUser = document.getElementById("usuarioActual");
        const spanRol = document.getElementById("usuarioRol");

        if (spanUser) spanUser.textContent = (me.empleado_nombre || me.username);
        if (spanRol) spanRol.textContent = "Rol: " + (me.rol || "-");
        const linkCred = document.getElementById("linkCredenciales");
        if (linkCred && me.rol !== "Administrador") {
            linkCred.style.display = "none";
        }

    } catch (err) {
        console.error("Error verificando sesión:", err);
        window.location.href = "login.html";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    verificarSesionYMostrarUsuario();
    loadProductos();
});

window.onpageshow = function (event) {
    if (event.persisted) {
        verificarSesionYMostrarUsuario();
        loadProductos();
    }
};

async function salir() {
    try {
        await fetch("../backend/login.php?op=logout", {
            method: "POST",
            credentials: "same-origin"
        });
    } catch (e) { /* ignore */ }

    window.location.href = "login.html";
}
