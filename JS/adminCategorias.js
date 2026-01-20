document.addEventListener('DOMContentLoaded', function () {
    let edittingId; // Variable para almacenar el id de la categoría en edición
    let categorias = []; // Arreglo para almacenar las categorías
    let editOriginalSlug = ''; // Variable para almacenar el slug original en la edicion
    let agreOriginalSlug = ''; // Variable para almacenar el slug original cuando se agrega una nueva categoría
    let editOriginalNombre = ''; // Variable para almacenar el nombre original en la edicion
    let agreOriginalNombre = ''; // Variable para almacenar el nombre original cuando se agrega una nueva categoría
    const API_CATS = '../backend/adminCategorias.php';
    const pagina = location.pathname.split('/').pop().toLowerCase(); // Obtiene el nombre de la página actual para seleccionar la opción del menu
    // Icono "sin imagen" (SVG inline) -> no depende de archivos ni rutas
    const NO_IMAGE_SVG = `data:image/svg+xml;utf8,` + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24">
        <rect width="24" height="24" fill="#f2f2f2"/>
        <path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2ZM5 5h14v10.5l-3.5-3.5-3 3-2-2L5 18V5Zm2.5 3.5A1.5 1.5 0 1 0 9 7a1.5 1.5 0 0 0-1.5 1.5Z" fill="#999"/>
        <path d="M5 19h14" stroke="#ccc"/>
        <path d="M7 17l10-10" stroke="#999" stroke-width="1.2"/>
    </svg>
    `);



    // =============================
    //   SWEETALERT2 HELPERS
    // =============================
    function swOk(title, text = '', icon = 'success') {
        return Swal.fire({
            icon,
            title,
            text,
            confirmButtonText: 'OK'
        });
    }

    function swError(title, text = '') {
        return swOk(title, text, 'error');
    }

    function swWarn(title, text = '') {
        return swOk(title, text, 'warning');
    }

    // Reemplazo de confirm()
    function swConfirm(title, text = '', confirmText = 'Sí', cancelText = 'Cancelar') {
        return Swal.fire({
            icon: 'warning',
            title,
            text,
            showCancelButton: true,
            confirmButtonText: confirmText,
            cancelButtonText: cancelText,
            reverseButtons: true
        }).then(r => r.isConfirmed);
    }




    //Función para verificar si la página actual es 'inventarioCategorias.html' y la deja seleccionada en negro las letras
    if (pagina === 'inventariocategorias.html') {
        const inventarioCategoriasLink = document.getElementById('inventarioDropdown');
        if (inventarioCategoriasLink) {
            inventarioCategoriasLink.classList.add('active');
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
                filtroBusqueda();
            } else {
                console.error("Error al cargar las categorías");
            }
        } catch (err) {
            console.error(err);
        }
    }




    // Función para renderizar la tabla de categorías
    function renderCategorias(lista) {
        const catList = document.getElementById('tablaCategorias');
        catList.innerHTML = '';

        // Si no hay resultados, muestra un mensaje en la tabla
        if (!lista || lista.length === 0) {
            catList.innerHTML = `
          <tr>
            <td colspan="14" class="text-center text-muted py-3">
              No hay resultado de la categoría buscada.
            </td>
          </tr>
        `;
            return;
        }

        // Recorre la lista de categorías
        lista.forEach(function (c) {
            const row = document.createElement('tr');

            row.innerHTML = `
                <td>${c.id_categoria ?? ''}</td>
                <td class="text-center">
                    <img
                    src="${c.icono_path ? c.icono_path : NO_IMAGE_SVG}"
                    class="img-icono"
                    alt="${c.nombre ?? ''}"
                    onerror="this.onerror=null; this.src='${NO_IMAGE_SVG}';"
                    />
                </td>
                <td>${c.nombre ?? ''}</td>
                <td>${c.slug ?? ''}</td>
                <td>
                    <span class="badge ${c.estado === 'Activo' ? 'bg-success' : 'bg-secondary'}"> ${c.estado ?? '—'} </span>
                </td>
                <td>
                  <div class="dropdown">
                    <button class="btn btn-sm btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                      Acciones
                    </button>
                    <ul class="dropdown-menu">
                      <li>
                        <button type="button" class="dropdown-item edit-categoria" data-id="${c.id_categoria}">
                          <i class="fa-solid fa-pen-to-square me-2"></i>Editar
                        </button>
                      </li>
                      <li><hr class="dropdown-divider"></li>
                      <li>
                        <button type="button" class="dropdown-item ${c.estado === 'Activo' ? 'text-danger' : 'text-success'} inactivar-categoria" data-id="${c.id_categoria}">
                        <i class="fa-solid ${c.estado === 'Activo' ? 'fa-box-archive' : 'fa-box-open'} me-2"></i>${c.estado === 'Activo' ? 'Inactivar' : 'Activar'}
                        </button>
                      </li>
                    </ul>
                  </div>
                </td>
            `;
            catList.appendChild(row);
        });

        document.querySelectorAll('.edit-categoria').forEach(button =>
            button.addEventListener('click', handleEdit)
        );
        document.querySelectorAll('.inactivar-categoria').forEach(button =>
            button.addEventListener('click', handleInactivarCategoria)
        );
    }




    // Función para buscar solo por nombre y slug de las categorías
    function filtroBusqueda() {
        // Obtiene el valor ingresado en el input y lo convierte a minúsculas para la comparación
        const q = (document.getElementById('buscar').value || '').trim().toLowerCase();

        // Si no hay texto en el input, muestra todas las categorías
        if (!q) {
            renderCategorias(categorias);
            return;
        }

        // Filtra las categorías que contienen el texto ingresado
        const filtrados = categorias.filter(c =>
            (c.nombre || '').toLowerCase().includes(q) || // Busca por nombre
            (c.slug || '').toLowerCase().includes(q)      // Busca por slug
        );

        renderCategorias(filtrados); // Muestra las categorías filtradas
    }




    // Agrega un event listener al input de busqueda
    document.getElementById('buscar').addEventListener('input', filtroBusqueda);




    // Función para manejar la edición de una categoría
    function handleEdit(e) {
        // Obtiene el id de la categoría desde el atributo data-id del botón
        const id = parseInt(e.currentTarget.dataset.id, 10);

        // Busca en el arreglo de categorías la que coincida con ese id
        const c = categorias.find(x => Number(x.id_categoria) === id);

        // Si no se encuentra la categoría, muestra un mensaje y detiene la función
        if (!c) {
            swError('Categoría no encontrada');
            return;
        }

        // Rellena los campos del formulario/modal de edición con los datos de la categoría
        document.getElementById('editId').value = c.id_categoria ?? '';
        document.getElementById('editNombre').value = c.nombre ?? '';
        document.getElementById('editSlug').value = c.slug ?? '';
        document.getElementById('editIcono').value = c.icono_path || '';
        document.getElementById('editEstado').value = c.estado ?? 'Activo';

        // Muestra la imagen actual del ícono (URL) en preview
        const prev = document.getElementById('editPreviewIcono'); // Obtiene la imagen que se muestra en previa
        const urlEdit = c.icono_path || ''; // Guarda la URL del icono en una variable
        prev.src = urlEdit; // Establece la URL de la imagen previa del modal
        prev.classList.toggle('d-none', !urlEdit); // Muestra u oculta la imagen previa según si hay URL

        // Guarda los originales
        editOriginalSlug = c.slug || '';
        editOriginalNombre = c.nombre || '';

        // Marca que se está en modo edición y guarda el id actual en una variable global
        edittingId = id;

        // Abre el modal de Bootstrap para mostrar el formulario de edición
        new bootstrap.Modal(document.getElementById('modalEditar')).show();
    }




    // Función para manejar inactivar o activar una categoría
    async function handleInactivarCategoria(event) {

        // Obtiene el id de la categoría desde el botón
        const categoriaId = parseInt(event.currentTarget.dataset.id, 10);

        // Busca la categoría en el arreglo global
        const c = categorias.find(x => Number(x.id_categoria) === categoriaId);

        // Si no la encuentra, muestra mensaje y detiene
        if (!c) {
            swError('Categoría no encontrada');
            return;
        }

        // Verifica si la categoría está activa o inactiva
        const estaActivo = String(c.estado).trim().toLowerCase() === 'activo';

        // Si la categoría está activa
        if (estaActivo) {

            // Confirma antes de inactivar
            const ok1 = await swConfirm('Confirmar inactivación', `¿Está seguro de inactivar la categoría "${c.nombre}"? Esta acción no se puede deshacer.`, 'Sí, inactivar', 'Cancelar');
            if (!ok1) return; // Si cancela, no hace nada

            // Llama al backend con método DELETE
            const response = await fetch(`${API_CATS}?id_categoria=${categoriaId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            // Si la respuesta es correcta
            if (response.ok) {
                swOk('Listo', 'Categoría inactivada correctamente.');
                loadCategorias(); // Recarga la tabla
            } else {
                console.error("Error al inactivar la categoría");
            }

        } else {
            // Si la categoría está inactiva

            // Confirma antes de activar
            const ok2 = await swConfirm('Confirmar activación', `¿Desea activar nuevamente la categoría "${c.nombre}"?`, 'Sí, activar', 'Cancelar');
            if (!ok2) return;

            // Cuerpo con los datos de la categoría (mantiene todo igual y cambia estado)
            const body = {
                id_categoria: categoriaId,
                nombre: c.nombre || '',
                slug: c.slug || '',
                estado: 'Activo',             // Cambia el estado
                icono_path: c.icono_path || ''
            };

            // Llama al backend con método PUT
            const response = await fetch(`${API_CATS}?id_categoria=${categoriaId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(body)
            });

            // Si la respuesta es correcta
            if (response.ok) {
                swOk('Listo', 'Categoría activada correctamente.');
                loadCategorias(); // Recarga la tabla
            } else {
                console.error('Error al activar la categoría');
            }
        }
    }



    // Función que limpia los campos y validaciones del modal Agregar Categoría
    function limpiarModalAgregarCategoria() {
        agreOriginalSlug = ''; // Limpia el slug original
        agreOriginalNombre = ''; // Limpia el nombre original
        ['slug', 'nombre'].forEach(id => {
            const el = document.getElementById(id); // Obtiene el input
            el.setCustomValidity(''); // Limpia la validación personalizada
            el.classList.remove('is-invalid'); // Limpia la clase de error
        });
        document.getElementById('formAgregar').reset(); // Limpia el formulario
        const prev = document.getElementById('previewIcono'); // Obtiene la imagen que se muestra en previa
        if (prev) {
            prev.classList.add('d-none'); // Oculta la imagen previa
            prev.removeAttribute('src'); // Elimina la URL del icono
        }
        const est = document.getElementById('estadoProducto'); // Obtiene el selector de estado
        if (est) est.value = 'Activo'; // Establece el valor por defecto
    }




    // Maneja la limpieza cuando se cierra el modal de Agregar Categoría
    document.getElementById('modalAgregar').addEventListener('hidden.bs.modal', () => {
        limpiarModalAgregarCategoria(); // Llama la función de limpieza
    });




    //Maneja la verificacion de SLUG/NOMBRE mientras se escribe (AGREGAR)
    ['slug', 'nombre'].forEach(id => {
        const el = document.getElementById(id); // Obtiene el input
        el.addEventListener('input', () => { // Agrega un event listener al input
            el.setCustomValidity(''); // Limpia la validación personalizada
            el.classList.remove('is-invalid'); // Limpia la clase de error
        });
    });




    // Maneja el envío del formulario para agregar una categoría
    document.getElementById('formAgregar').addEventListener('submit', async (e) => {
        e.preventDefault(); // Evita que el formulario recargue la página

        // Obtiene los valores de los campos del formulario
        const nombre = (document.getElementById('nombre').value || '').trim();
        const slug = (document.getElementById('slug').value || '').trim();
        const icono_path = (document.getElementById('icono_path').value || '').trim();
        const estado = document.getElementById('estadoProducto').value;

        //Validaciones

        // Verifica si el slug/nombre ya existen en la base (en el arreglo cargado)
        const slugEl = document.getElementById('slug');
        const nombreEl = document.getElementById('nombre');

        const norm = s => (s || '').trim().toLowerCase();

        const dupSlug = categorias.some(c => norm(c.slug) === norm(slug));
        const dupNombre = categorias.some(c => norm(c.nombre) === norm(nombre));

        // Si el slug ya existe
        if (dupSlug) {
            slugEl.setCustomValidity('El slug ya existe.'); // Establece el mensaje de validación personalizada
            slugEl.classList.add('is-invalid'); // Agrega la clase de error
            slugEl.reportValidity();  // muestra el mensaje en el formulario
            return; // no envía
        }

        // Si el nombre ya existe
        if (dupNombre) {
            nombreEl.setCustomValidity('El nombre ya existe.'); // Establece el mensaje de validación personalizada
            nombreEl.classList.add('is-invalid'); // Agrega la clase de error
            nombreEl.reportValidity();  // muestra el mensaje en el formulario
            return; // no envía
        }

        // Envía los datos al servidor usando fetch con método POST
        const res = await fetch(API_CATS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                nombre,
                slug,
                icono_path,
                estado // tu backend fija Activo, esto no afecta
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
                swOk('Listo', 'Categoría creada exitosamente');
            }, { once: true });

            // Recarga la lista de categorías para mostrar la nueva
            loadCategorias();
        } else {
            // Si falla, muestra un error en la consola
            console.error('Error al crear la categoría');
        }
    });




    // Maneja la verificacion y limpieza cuando se cierra el modal de Editar Categoría
    document.getElementById('modalEditar').addEventListener('hidden.bs.modal', () => {
        editOriginalSlug = ''; // Limpia el slug original
        editOriginalNombre = ''; // Limpia el nombre original
        ['editSlug', 'editNombre'].forEach(id => {
            const el = document.getElementById(id); // Obtiene el input
            el.setCustomValidity(''); // Limpia la validación personalizada
            el.classList.remove('is-invalid'); // Limpia la clase de error
        });
    });




    //Maneja la verificacion de SLUG/NOMBRE mientras se escribe (EDITAR)
    ['editSlug', 'editNombre'].forEach(id => {
        const el = document.getElementById(id); // Obtiene el input
        el.addEventListener('input', () => { // Agrega un event listener al input
            el.setCustomValidity(''); // Limpia la validación personalizada
            el.classList.remove('is-invalid'); // Limpia la clase de error
        });
    });




    // Maneja el envío del formulario para editar una categoría
    document.getElementById('formEditar').addEventListener('submit', async (e) => {
        e.preventDefault(); // Evita que el formulario recargue la página

        // Obtiene los valores de los campos del formulario de edición
        const id_categoria = Number(document.getElementById('editId').value);
        const nombre = (document.getElementById('editNombre').value || '').trim();
        const slug = (document.getElementById('editSlug').value || '').trim();
        const icono_path = (document.getElementById('editIcono').value || '').trim();
        const estado = document.getElementById('editEstado').value;

        //Validaciones

        // Toma los valores de los inputs y los guarda en variables
        const slugElE = document.getElementById('editSlug');
        const nombreElE = document.getElementById('editNombre');

        // Limpia cualquier error previo antes de validar
        [slugElE, nombreElE].forEach(el => { el.setCustomValidity(''); el.classList.remove('is-invalid'); });

        const norm = s => (s || '').trim().toLowerCase(); // Función para normalizar cadenas de texto
        const idActual = String(edittingId); // ID de la categoría actual

        // Solo valida slug si el usuario lo cambió respecto al original
        if (norm(slug) !== norm(editOriginalSlug)) {
            const dupSlug = categorias.some(c => // Verifica si el slug ya existe
                String(c.id_categoria) !== idActual && // Excluye la categoría actual
                norm(c.slug) === norm(slug) // Compara con el slug ingresado
            );

            // Si el slug ya existe
            if (dupSlug) {
                slugElE.setCustomValidity('El slug ya existe.'); // Establece la validación personalizada
                slugElE.classList.add('is-invalid'); // Agrega la clase de error
                slugElE.reportValidity(); // Reporta la validación
                return; // no envía
            }
        }

        // Solo valida nombre si el usuario lo cambió respecto al original
        if (norm(nombre) !== norm(editOriginalNombre)) {
            const dupNombre = categorias.some(c => // Verifica si el nombre ya existe
                String(c.id_categoria) !== idActual && // Excluye la categoría actual
                norm(c.nombre) === norm(nombre) // Compara con el nombre ingresado
            );

            // Si el nombre ya existe
            if (dupNombre) {
                nombreElE.setCustomValidity('El nombre ya existe.'); // Establece la validación personalizada
                nombreElE.classList.add('is-invalid'); // Agrega la clase de error
                nombreElE.reportValidity(); // Reporta la validación
                return; // no envía
            }
        }

        // Envía la información actualizada al servidor con método PUT
        // Incluye el id_categoria que se está editando
        const res = await fetch(`${API_CATS}?id_categoria=${id_categoria}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                id_categoria,
                nombre,
                slug,
                estado,
                icono_path
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
                swOk('Listo', `Categoría "${nombre}" actualizada correctamente.`);
            }, { once: true });

            // Limpia la variable global de edición
            edittingId = null;

            // Recarga la lista de categorías
            loadCategorias();
        } else {
            // Si falla, muestra un error en consola
            console.error('PUT categoría failed');
        }
    });




    // Reset automático al abrir el modal de agregar
    // Limpia el formulario y establece el estado por defecto en "Activo"
    document.getElementById('modalAgregar').addEventListener('show.bs.modal', () => {
        document.getElementById('formAgregar').reset();
        const est = document.getElementById('estadoProducto');
        if (est) est.value = 'Activo';
        const prev = document.getElementById('previewIcono');
        if (prev) {
            prev.classList.add('d-none');
            prev.removeAttribute('src');
        }
    });




    // Vista previa inmediata de ÍCONO en AGREGAR
    const iconoUrlAgregar = document.getElementById('icono_path'); // Campo donde se ingresa la URL del icono
    const previewAgregar = document.getElementById('previewIcono'); // Imagen que muestra la vista previa
    if (iconoUrlAgregar) {
        iconoUrlAgregar.addEventListener('input', () => {
            const url = (iconoUrlAgregar.value || '').trim(); // Obtiene el valor del campo
            if (url) {
                // Si hay una URL, muestra la imagen
                previewAgregar.src = url;
                previewAgregar.classList.remove('d-none');
            } else {
                // Si no hay URL, limpia y oculta la imagen
                previewAgregar.removeAttribute('src');
                previewAgregar.classList.add('d-none');
            }
        });
    }




    // Vista previa inmediata de ÍCONO en EDITAR
    const iconoUrlEditar = document.getElementById('editIcono'); // Campo donde se ingresa la URL del icono al editar
    const previewEditar = document.getElementById('editPreviewIcono'); // Imagen que muestra la vista previa en edición
    if (iconoUrlEditar) {
        iconoUrlEditar.addEventListener('input', () => {
            const url = (iconoUrlEditar.value || '').trim(); // Obtiene el valor del campo
            if (url) {
                // Si hay una URL, muestra la imagen
                previewEditar.src = url;
                previewEditar.classList.remove('d-none');
            } else {
                // Si no hay URL, limpia y oculta la imagen
                previewEditar.removeAttribute('src');
                previewEditar.classList.add('d-none');
            }
        });
    }

    // Hacemos disponible loadCategorias fuera de este bloque
    window.loadCategorias = loadCategorias;

    // Carga la lista de categorías al cargar la página
    loadCategorias();
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
    window.loadCategorias && window.loadCategorias();
});

window.onpageshow = function (event) {
    if (event.persisted) {
        verificarSesionYMostrarUsuario();
        window.loadCategorias && window.loadCategorias();
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
