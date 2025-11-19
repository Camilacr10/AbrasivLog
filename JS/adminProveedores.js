document.addEventListener('DOMContentLoaded', function () {
  let edittingId; // Variable para almacenar el id del proveedor en edición
  let proveedores = []; // Arreglo para almacenar los proveedores
  let editOriginalCedula = ''; // Variable para almacenar la cedula juridica original en la edicion
  let editOriginalCorreo = ''; // Variable para almacenar el correo original en la edicion
  let agreOriginalCedula = ''; // Variable para almacenar la cedula juridica original cuando se agrega un nuevo proveedor
  let agreOriginalCorreo = ''; // Variable para almacenar el correo original cuando se agrega un nuevo proveedor
  const API_URL = '../backend/adminProveedores.php';


  //Codigo para proveedores




  // Función para cargar los proveedores
  async function loadProveedores() {
    try {
      const response = await fetch(API_URL, {
        method: 'GET',
        credentials: 'include',
      });
      if (response.ok) {
        proveedores = await response.json();
        filtroBusqueda();
      } else {
        console.error("Error al cargar los proveedores");
      }
    } catch (err) {
      console.error(err);
    }
  }




  // Función para renderizar la tabla de proveedores
  function renderProveedores(lista) {
    const proveedorList = document.getElementById('tablaProveedores');
    proveedorList.innerHTML = '';

    // Recorre la lista de proveedores
    lista.forEach(function (proveedor) {
      const row = document.createElement('tr');
      row.innerHTML = `
                <td>${proveedor.id_proveedor}</td>
                <td>${proveedor.nombre}</td>
                <td>${proveedor.cedula_juridica}</td>
                <td>${proveedor.telefono}</td>
                <td>${proveedor.correo}</td>
                <td>
                <span class="badge ${proveedor.estado === 'Activo' ? 'bg-success' : 'bg-secondary'}"> ${proveedor.estado} </span>
                </td>
                <td>
                  <div class="dropdown">
                    <button class="btn btn-sm btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                      Acciones
                    </button>
                    <ul class="dropdown-menu">
                      <li>
                        <button type="button" class="dropdown-item edit-proveedor" data-id="${proveedor.id_proveedor}">
                          <i class="fa-solid fa-pen-to-square me-2"></i>Editar
                        </button>
                      </li>
                      <li>
                        <button type="button" class="dropdown-item ver-evaluaciones" data-id="${proveedor.id_proveedor}">
                          <i class="fa-solid fa-star me-2"></i>Ver Evaluaciones
                        </button>
                      </li>
                      <li><hr class="dropdown-divider"></li>
                      <li>
                        <button type="button" class="dropdown-item ${proveedor.estado === 'Activo' ? 'text-danger' : 'text-success'} inactivar-proveedor" data-id="${proveedor.id_proveedor}">
                       <i class="fa-solid ${proveedor.estado === 'Activo' ? 'fa-user-slash' : 'fa-user-check'} me-2"></i>${proveedor.estado === 'Activo' ? 'Inactivar' : 'Activar'}
                        </button>
                      </li>
                      </li>
                    </ul>
                  </div>
                </td>
            `;
      proveedorList.appendChild(row);
    });

    document.querySelectorAll('.edit-proveedor').forEach(button =>
      button.addEventListener('click', handleEdit)
    );
    document.querySelectorAll('.inactivar-proveedor').forEach(button =>
      button.addEventListener('click', handleInactivarProveedor)
    );
  }




  // Función para buscar solo por nombre y cédula jurídica de los proveedores
  function filtroBusqueda() {
    // Obtiene el valor ingresado en el input y lo convierte a minúsculas para la comparación
    const q = (document.getElementById('buscarProveedor').value || '').trim().toLowerCase();

    // Si no hay texto en el input, muestra todos los proveedores
    if (!q) {
      renderProveedores(proveedores);
      return;
    }

    // Filtra los proveedores que contienen el texto ingresado
    const filtrados = proveedores.filter(p =>
      (p.nombre || '').toLowerCase().includes(q) || // Busca por nombre
      (p.cedula_juridica || '').toLowerCase().includes(q) // Busca por cédula jurídica
    );

    renderProveedores(filtrados); // Muestra los proveedores filtrados
  }




  // Agrega un event listener al input de busqueda
  document.getElementById('buscarProveedor').addEventListener('input', filtroBusqueda);




  // Función para manejar la edición de un proveedor
  function handleEdit(e) {

    // Obtiene el id del proveedor desde el atributo data-id del botón
    const id = parseInt(e.currentTarget.dataset.id, 10);

    // Busca en el arreglo de proveedores el que coincida con ese id
    const p = proveedores.find(x => Number(x.id_proveedor) === id);

    // Si no se encuentra el proveedor, muestra un mensaje y detiene la función
    if (!p) {
      alert('Proveedor no encontrado');
      return;
    }

    // Rellena los campos del formulario/modal de edición con los datos del proveedor
    document.getElementById('editNombreProveedor').value = p.nombre ?? '';
    document.getElementById('editCedulaProveedor').value = p.cedula_juridica ?? '';
    document.getElementById('editTelefonoProveedor').value = p.telefono ?? '';
    document.getElementById('editCorreoProveedor').value = p.correo ?? '';
    document.getElementById('editEstadoProveedor').value = p.estado ?? '';

    editOriginalCedula = p.cedula_juridica || ''; // Almacena la cedula juridica original
    editOriginalCorreo = p.correo || ''; // Almacena el correo original

    // Marca que se está en modo edición y guarda el id actual en una variable global
    edittingId = id;

    // Abre el modal de Bootstrap para mostrar el formulario de edición
    new bootstrap.Modal(document.getElementById('modalEditarProveedor')).show();
  }




  // Función para manejar inactivar o activar un proveedor
  async function handleInactivarProveedor(event) {

    // Obtiene el id del proveedor desde el botón
    const proveedorId = parseInt(event.currentTarget?.dataset.id || event.target.dataset.id, 10);

    // Busca el proveedor en el arreglo global
    const p = proveedores.find(x => Number(x.id_proveedor) === proveedorId);

    // Si no lo encuentra, muestra mensaje y detiene
    if (!p) {
      alert('Proveedor no encontrado');
      return;
    }

    // Verifica si el proveedor está activo o inactivo
    const estaActivo = String(p.estado).trim().toLowerCase() === 'activo';

    // Si está activo → inactivar (DELETE)
    if (estaActivo) {

      // Confirma antes de inactivar
      const ok1 = confirm(`¿Está seguro de inactivar al proveedor ${p.nombre}? Esta acción no se puede deshacer.`);
      if (!ok1) return; // Si cancela, no hace nada

      // Llama al backend con método DELETE
      const response = await fetch(`${API_URL}?id_proveedor=${proveedorId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      // Si la respuesta es correcta
      if (response.ok) {
        alert('Proveedor inactivado correctamente.');
        loadProveedores(); // Recarga la tabla
      } else {
        console.error("Error al inactivar el proveedor");
      }

    } else {
      // Si está inactivo → activar (PUT con estado Activo)

      // Confirma antes de activar
      const ok2 = confirm(`¿Desea activar nuevamente al proveedor ${p.nombre}?`);
      if (!ok2) return; // Si cancela, no hace nada

      // Cuerpo con los datos del proveedor
      const body = {
        id_proveedor: proveedorId,
        nombre: p.nombre || '',
        cedula_juridica: p.cedula_juridica || '',
        telefono: p.telefono || '',
        correo: p.correo || '',
        estado: 'Activo' // Cambia el estado
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
        alert('Proveedor activado correctamente.');
        loadProveedores(); // Recarga la tabla
      } else {
        console.error('Error al activar el proveedor');
      }
    }
  }




  // Función que limpia los campos  cedula, correo y validaciones del modal Agregar Proveedor
  function limpiarModalAgregarProveedor() {
    agreOriginalCedula = ''; // Limpia la cédula jurídica original
    agreOriginalCorreo = ''; // Limpia el correo original
    ['cedulaProveedor', 'correoProveedor'].forEach(id => {
      const el = document.getElementById(id); // Obtiene el input
      el.setCustomValidity(''); // Limpia la validación personalizada
      el.classList.remove('is-invalid'); // Limpia la clase de error
    });
    document.getElementById('formAgregarProveedor').reset(); // Limpia el formulario
  }

  // Maneja la limpieza cuando se cierra el modal de Agregar Proveedor
  document.getElementById('modalAgregarProveedor').addEventListener('hidden.bs.modal', () => {
    limpiarModalAgregarProveedor(); // Llama la función de limpieza
  });




  //Maneja la verificacion de los campos de cedula y correo antes de enviar el formulario para agregar un proveedor
  // Se ejecuta mientras el adminstrador o empleado escriben, el modal abierto
  ['cedulaProveedor', 'correoProveedor'].forEach(id => {
    const el = document.getElementById(id); // Obtiene el input
    el.addEventListener('input', () => { // Agrega un event listener al input
      el.setCustomValidity(''); // Limpia la validación personalizada
      el.classList.remove('is-invalid'); // Limpia la clase de error
    });
  });




  // Maneja el envío del formulario para agregar un proveedor
  document.getElementById('formAgregarProveedor').addEventListener('submit', async (e) => {
    e.preventDefault(); // Evita que el formulario recargue la página

    // Obtiene los valores de los campos del formulario
    const nombre = document.getElementById('nombreProveedor').value;
    const cedula_juridica = document.getElementById('cedulaProveedor').value;
    const telefono = document.getElementById('telefonoProveedor').value;
    const correo = document.getElementById('correoProveedor').value;

    //Validaciones

    // Verifica si la cedula juridica o el correo ya existen en la base de datos
    const cedulaEl = document.getElementById('cedulaProveedor'); // Obtiene el input de la cedula
    const correoEl = document.getElementById('correoProveedor');// Obtiene el input del correo
    // Busca en el arreglo de proveedores si el cedula juridica ya existe
    const dupCedula = proveedores.some(p => (p.cedula_juridica || '').toLowerCase() === cedula_juridica.toLowerCase());
    // Si la cedula juridica ya existe
    if (dupCedula) {
      cedulaEl.setCustomValidity('La cédula jurídica ya existe.'); // Establece el mensaje de validación personalizada
      cedulaEl.classList.add('is-invalid'); // Agrega la clase de error
      cedulaEl.reportValidity();  // muestra el mensaje en el formulario
      return; // no envía
    }
    // Busca en el arreglo de proveedores si el correo ya existe
    const dupCorreo = proveedores.some(p => (p.correo || '').toLowerCase() === correo.toLowerCase());
    // Si el correo ya existe
    if (dupCorreo) {
      correoEl.setCustomValidity('El correo ya existe.'); // Establece el mensaje de validación personalizada
      correoEl.classList.add('is-invalid'); // Agrega la clase de error
      correoEl.reportValidity();  // muestra el mensaje en el formulario
      return; // no envía
    }

    // Envía los datos al servidor usando fetch con método POST
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ nombre, cedula_juridica, telefono, correo })
    });

    // Si la respuesta es exitosa:
    if (res.ok) {

      // Referencia al modal
      const modalEl = document.getElementById('modalAgregarProveedor');
      const modal = bootstrap.Modal.getInstance(modalEl);
      modal.hide();

      // Limpia el formulario
      e.target.reset();

      // Espera a que el modal se cierre para mostrar el alert
      modalEl.addEventListener('hidden.bs.modal', () => {
        alert('Proveedor creado exitosamente');
      }, { once: true });

      // Recarga la lista de proveedores para mostrar el nuevo
      loadProveedores();
    } else {
      // Si falla, muestra un error en la consola
      console.error('POST proveedor failed');
    }
  });




  // Maneja la verificacion de los campos de cedula y correo antes de enviar el formulario para editar un proveedor
  //Se ejecuta cuando se cierra el modal
  document.getElementById('modalEditarProveedor').addEventListener('hidden.bs.modal', () => {
    editOriginalCedula = ''; // Limpia la cedula juridica original
    editOriginalCorreo = ''; // Limpia el correo original
    ['editCedulaProveedor', 'editCorreoProveedor'].forEach(id => {
      const el = document.getElementById(id); // Obtiene el input
      el.setCustomValidity(''); // Limpia la validación personalizada
      el.classList.remove('is-invalid'); // Limpia la clase de error
    });
  });




  //Maneja la verificacion de los campos de cedula y correo antes de enviar el formulario para editar un proveedor
  // Se ejecuta mientras el adminstrador o empleado escriben, el modal abierto
  ['editCedulaProveedor', 'editCorreoProveedor'].forEach(id => {
    const el = document.getElementById(id); // Obtiene el input
    el.addEventListener('input', () => { // Agrega un event listener al input
      el.setCustomValidity(''); // Limpia la validación personalizada
      el.classList.remove('is-invalid'); // Limpia la clase de error
    });
  });




  // Maneja el envío del formulario para editar un proveedor
  document.getElementById('formEditarProveedor').addEventListener('submit', async (e) => {
    e.preventDefault(); // Evita que el formulario recargue la página

    // Obtiene los valores de los campos del formulario de edición
    const nombre = document.getElementById('editNombreProveedor').value;
    const cedula_juridica = document.getElementById('editCedulaProveedor').value;
    const telefono = document.getElementById('editTelefonoProveedor').value;
    const correo = document.getElementById('editCorreoProveedor').value;
    const estado = document.getElementById('editEstadoProveedor').value;

    //Validaciones

    // Toma los valoses de los inputs y los guarda en variables
    const cedulaElE = document.getElementById('editCedulaProveedor');
    const correoElE = document.getElementById('editCorreoProveedor');

    // Limpia cualquier error previo antes de validar
    [cedulaElE, correoElE].forEach(el => { el.setCustomValidity(''); el.classList.remove('is-invalid'); });

    const norm = s => (s || '').trim().toLowerCase(); // Función para normalizar cadenas de texto
    const idActual = String(edittingId); // ID del proveedor actual

    // Solo valida cédula si el usuario la cambió respecto al original
    if (norm(cedula_juridica) !== norm(editOriginalCedula)) {
      const dupCedula = proveedores.some(p => // Verifica si la cedula juridica ya existe
        String(p.id_proveedor) !== idActual && // Excluye el proveedor actual
        norm(p.cedula_juridica) === norm(cedula_juridica) // Compara con la cedula juridica ingresada
      );

      // Si la cedula juridica ya existe
      if (dupCedula) {
        cedulaElE.setCustomValidity('La cédula jurídica ya existe.'); // Establece la validación personalizada
        cedulaElE.classList.add('is-invalid'); // Agrega la clase de error
        cedulaElE.reportValidity(); // Reporta la validación
        return; // no envía
      }
    }

    // Solo valida correo si lo cambió respecto al original
    if (norm(correo) !== norm(editOriginalCorreo)) {
      const dupCorreo = proveedores.some(p => // Verifica si el correo ya existe
        String(p.id_proveedor) !== idActual && // Excluye el proveedor actual
        norm(p.correo) === norm(correo) // Compara con el correo ingresado
      );

      // Si el correo ya existe
      if (dupCorreo) {
        correoElE.setCustomValidity('El correo ya existe.'); // Establece la validación personalizada
        correoElE.classList.add('is-invalid'); // Agrega la clase de error
        correoElE.reportValidity(); // Reporta la validación
        return; // no envía
      }
    }

    // Envía la información actualizada al servidor con método PUT
    // Incluye el id_proveedor que se está editando
    const res = await fetch(API_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id_proveedor: edittingId, nombre, cedula_juridica, telefono, correo, estado })
    });

    // Si la actualización fue exitosa:
    if (res.ok) {
      // Cierra el modal de edición y muestra el alert cuando termine de cerrarse
      const modalEl = document.getElementById('modalEditarProveedor');
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();

      modalEl.addEventListener('hidden.bs.modal', () => {
        alert(`Proveedor ${nombre} actualizado correctamente.`);
      }, { once: true });

      // Limpia la variable global de edición y recarga la tabla
      edittingId = null;
      loadProveedores();
    } else {
      console.error('PUT proveedor failed');
    }
  });

  // Limpieza al cerrar el modal de editar
  // Restaura la variable edittingId y resetea el formulario
  document.getElementById('modalEditarProveedor').addEventListener('hidden.bs.modal', () => {
    edittingId = null;
    document.getElementById('formEditarProveedor').reset();
  });

  // Reset automático al abrir el modal de agregar
  // Limpia el formulario y establece el estado por defecto en "1"
  document.getElementById('modalAgregarProveedor').addEventListener('show.bs.modal', () => {
    document.getElementById('formAgregarProveedor').reset();
    document.getElementById('estadoProveedor').value = '1';

  });




  // Maneja el evento de clic en cualquier parte de la tabla de proveedores
  document.getElementById('tablaProveedores').addEventListener('click', (e) => {
    // Busca si el clic ocurrió sobre un botón con la clase "ver-evaluaciones"
    const btn = e.target.closest('.ver-evaluaciones');
    if (!btn) return; // Si no es ese botón, no hace nada

    // Obtiene la referencia al modal de evaluaciones
    const modal = document.getElementById('modalEvaluaciones');

    // Abre (o crea si no existe aún) la instancia del modal de Bootstrap
    bootstrap.Modal.getOrCreateInstance(modal).show();
  });




  // Carga la lista de proveedores al cargar la página
  loadProveedores();
});

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("../backend/login.php?op=me", { credentials: "same-origin" });
    const me = await res.json();

    if (!me.authenticated) {
      alert("Sesión expirada. Inicie sesión nuevamente.");
      window.location.href = "login.html"; 
      return;
    }

    const spanUser = document.getElementById("usuarioActual");
    const spanRol  = document.getElementById("usuarioRol");
    if (spanUser) spanUser.textContent = (me.empleado_nombre || me.username);
    if (spanRol)  spanRol.textContent  = "Rol: " + (me.rol || "-");

  } catch (e) {
    console.error(e);
    alert("No se pudo verificar la sesión.");
    window.location.href = "login.html";  
  }
});

async function salir() {
  try {
    await fetch("../backend/login.php?op=logout", {
      method: "POST",
      credentials: "same-origin"
    });
  } catch (e) { /* ignore */ }

  window.location.href = "login.html";  
}
