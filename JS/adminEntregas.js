const buscar = document.getElementById("buscarEntrega");
const tabla = document.getElementById("tablaEntregas");
const modalAgregarEntrega = document.getElementById("modalAgregarEntrega");
const modalAgregarDetallesEntrega = document.getElementById("modalAgregarDetallesEntrega");
const selectMensajero = document.getElementById("mensajeroEntrega");
const filtroClienteMensajero = document.getElementById("filtroClienteMensajero");
const filtroFecha = document.getElementById("filtroFecha");
const filtroEstado = document.getElementById("filtroEstado");

let entregasGlobal = [];
let empleadosMensajeros = [];
let idEntregaActual = null; // Guardará el ID de la entrega recién creada
let idEntregaSeleccionada = null;
let clientes = [];

// Renderizar tabla
function renderTabla(lista) {
  tabla.innerHTML = lista.length
    ? lista.map(ent => `
<tr>
  <td>${ent.nombre_cliente}</td>
  <td>${ent.nombre_empleado}</td>
  <td>${formatoFecha(ent.fecha_entrega)}</td>
  <td>
 <span class="badge ${
  ent.estado === "Pendiente" ? "bg-warning text-dark" :
  ent.estado === "En camino" ? "bg-info text-dark" :
  "bg-success"
}">
  ${ent.estado}
</span>
  </td>
  <td>
    <div class="dropdown">
      <button class="btn btn-sm btn-secondary dropdown-toggle" data-bs-toggle="dropdown">Acciones</button>
      <ul class="dropdown-menu">
         <li>
          <a class="dropdown-item" href="#" onclick="abrirEditar(${ent.id_entrega})">
            <i class="fa-solid fa-pen-to-square me-2"></i>Editar
          </a>
        </li>      
        <li>
         <a href="#" class="dropdown-item" onclick="verEntrega(${ent.id_entrega})">
  <i class="fa-solid fa-eye me-2"></i>Ver Detalles
</a>
        </li>
        <li>
  <a class="dropdown-item" href="#" onclick="abrirCambiarEstado(${ent.id_entrega}, '${ent.estado}')">
    <i class="fa-solid fa-arrows-rotate me-2"></i>Estado
  </a>
</li>
      </ul>
    </div>
  </td>
</tr>`).join("")

    : `<tr><td colspan="5" class="text-center text-muted">No se encontraron entregas</td></tr>`;
}

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

// 🔍 Filtrar en tiempo real
function aplicarFiltros() {
    let texto = filtroClienteMensajero.value.toLowerCase().trim();
    let fecha = filtroFecha.value;
    let estado = filtroEstado.value;

    let filtradas = entregasGlobal.filter(ent => {

        let coincideTexto =
            ent.nombre_cliente.toLowerCase().includes(texto) ||
            ent.nombre_empleado.toLowerCase().includes(texto);

        let coincideFecha =
            fecha === "" || ent.fecha_entrega === fecha;

        let coincideEstado =
            estado === "" || ent.estado === estado;

        return coincideTexto && coincideFecha && coincideEstado;
    });

    renderTabla(filtradas);
}

filtroClienteMensajero.addEventListener("keyup", aplicarFiltros);
filtroFecha.addEventListener("change", aplicarFiltros);
filtroEstado.addEventListener("change", aplicarFiltros);

// Cargar entregas
async function cargarEntregas() {
  const res = await fetch("../backend/adminEntregas.php?accion=listar");
  entregasGlobal = await res.json();
  renderTabla(entregasGlobal);
}

// Cargar empleados con puesto "Mensajero"
async function cargarMensajeros() {
  const res = await fetch("../backend/Empleados.php?accion=listar");
  const empleados = await res.json();
  empleadosMensajeros = empleados.filter(e =>
    e.puesto.toLowerCase() === "mensajero" &&
    e.estado.toLowerCase() === "activo"
  );

  // Para el modal de agregar
  selectMensajero.innerHTML = `
        <option value="">Seleccione un mensajero</option>
        ${empleadosMensajeros.map(e => `
            <option value="${e.id_empleado}">${e.nombre_completo}</option>
        `).join("")}
    `;

  // 🔹 Para el modal de editar
  const selectEditar = document.getElementById("editMensajero");
  if (selectEditar) {
    selectEditar.innerHTML = `
            <option value="">Seleccione un mensajero</option>
            ${empleadosMensajeros.map(e => `
                <option value="${e.id_empleado}">${e.nombre_completo}</option>
            `).join("")}
        `;
  }
}


// Cargar productos 
async function cargarProductos() {
  const selectProducto = document.getElementById("productoEntrega");
  const selectProductoEditar = document.getElementById("editProductoEntrega");

  try {
    const res = await fetch("../backend/adminProductos.php");
    const productos = await res.json();

    const opciones = `
      <option value="">Seleccione un producto</option>
      ${productos.map(p => `
        <option value="${p.id_producto}">${p.nombre}</option>
      `).join("")}
    `;

    if (selectProducto) selectProducto.innerHTML = opciones;
    if (selectProductoEditar) selectProductoEditar.innerHTML = opciones;

  } catch (error) {
    console.error("Error cargando productos:", error);
    if (selectProducto) selectProducto.innerHTML = `<option value="">Error al cargar productos</option>`;
    if (selectProductoEditar) selectProductoEditar.innerHTML = `<option value="">Error al cargar productos</option>`;
  }
}


// 🔍 Filtrar entregas
if (buscar) {
  buscar.addEventListener("keyup", () => {
    const texto = buscar.value.toLowerCase().trim();
    const filtradas = entregasGlobal.filter(e =>
      e.nombre_cliente.toLowerCase().includes(texto) ||
      e.nombre_empleado.toLowerCase().includes(texto)
    );
    renderTabla(filtradas);
  });
}

window.onload = () => {
  cargarEntregas();
  cargarMensajeros();
  cargarProductos();
};

//Agregar nueva entrega
document.getElementById("formAgregarEntrega").addEventListener("submit", async e => {
  e.preventDefault();

  const cedulaCliente = document.getElementById("cedulaCliente").value.trim();
  const idEmpleado = selectMensajero.value;
  const fechaEntrega = document.getElementById("fechaEntrega").value;

  if (!cedulaCliente || !idEmpleado || !fechaEntrega) {
    swWarn("Campos incompletos", "Por favor complete todos los campos.");
    return;
  }

  // Buscar cliente
  const clienteRes = await fetch(`../backend/adminEntregas.php?accion=buscarPorCedula&cedula=${cedulaCliente}`);
  const cliente = await clienteRes.json();

  if (!cliente || !cliente.id_cliente) {
    swError("Cliente no válido", "No se encontró un cliente con esa cédula o está inactivo.");
    return;
  }

  // Crear entrega
  const formData = new FormData();
  formData.append("cliente_cedula", cedulaCliente);
  formData.append("empleado_id", idEmpleado);
  formData.append("fecha", fechaEntrega);

  const res = await fetch("../backend/adminEntregas.php?accion=agregar", {
    method: "POST",
    body: formData
  });

  const result = await res.json();

  if (result.success) {
    idEntregaActual = result.id;
    bootstrap.Modal.getInstance(modalAgregarEntrega).hide();

    // Abrir modal de detalles automáticamente
    const modalDetalles = new bootstrap.Modal(modalAgregarDetallesEntrega);
    modalDetalles.show();
  } else {
    swError("Error", result.msg || "Error al registrar la entrega.");
  }
});


// Guardar detalle entrega 
document.getElementById("formAgregarDetallesEntrega").addEventListener("submit", async e => {
  e.preventDefault();

  const idProducto = document.getElementById("productoEntrega").value;
  const cantidad = document.getElementById("cantidadEntrega").value;
  const precio = document.getElementById("precioEntrega").value;
  const descuento = document.getElementById("descuentoEntrega").value || 0;
  const iva = document.getElementById("ivaEntrega").value;

  if (!idProducto || !cantidad || !precio) {
    swWarn("Campos incompletos", "Complete todos los campos del detalle.");
    return;
  }

  const formData = new FormData();
  formData.append("id_entrega", idEntregaActual);
  formData.append("id_producto", idProducto);
  formData.append("cantidad", cantidad);
  formData.append("precio_unitario", precio);
  formData.append("descuento_aplicado", descuento);
  formData.append("porcentaje_iva_aplicado", iva);

  const res = await fetch("../backend/adminEntregas.php?accion=agregarDetalle", {
    method: "POST",
    body: formData
  });

  const result = await res.json();

 const modal = bootstrap.Modal.getInstance(
  modalAgregarDetallesEntrega
);

modalAgregarDetallesEntrega.addEventListener(
  "hidden.bs.modal",
  async () => {

    if (result.success) {
      await swOk("Listo", "Entrega agregada correctamente.");

      e.target.reset();
      cargarEntregas();

    } else {
      await swError(
        "Error",
        result.msg || "Error al agregar la entrega."
      );

      // SOLO si es stock insuficiente, se vuelve a abrir
      if (result.msg === "Stock insuficiente") {
        new bootstrap.Modal(modalAgregarDetallesEntrega).show();
      }
    }

  },
  { once: true }
);

modal.hide();
});

// Abrir modal de edición
async function abrirEditar(id) {

  const entrega = entregasGlobal.find(e => e.id_entrega == id);
  if (!entrega) {
  swError("Error", "Entrega no encontrada.");
  return;
}

  // Cargar mensajeros y productos
  await cargarMensajeros();
  await cargarProductos();

  // Llenar campos de entrega
  document.getElementById("editIdEntrega").value = entrega.id_entrega;
  document.getElementById("editCedulaCliente").value = entrega.cedula_cliente;
  document.getElementById("editClienteId").value = entrega.id_cliente;
  document.getElementById("editMensajero").value = entrega.id_empleado;
  document.getElementById("editFecha").value = entrega.fecha_entrega;

  const modalEntrega = new bootstrap.Modal(document.getElementById("modalEditarEntrega"));
  modalEntrega.show();
}

document.getElementById("editCedulaCliente").addEventListener("blur", async () => {
  const cedula = document.getElementById("editCedulaCliente").value.trim();
  if (!cedula) return;

  const res = await fetch(`../backend/adminEntregas.php?accion=buscarPorCedula&cedula=${cedula}`);
  const cliente = await res.json();

  if (cliente && cliente.id_cliente) {
    document.getElementById("editClienteId").value = cliente.id_cliente;
  } else {
    swError("Cliente no válido", "Cliente no encontrado o inactivo.");
    document.getElementById("editClienteId").value = "";
  }
});

// Guardar cambios de entrega y luego abrir el modal del detalle con datos cargados
document.getElementById("formEditarEntrega").addEventListener("submit", async e => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const idEntrega = formData.get("id_entrega");
  const res = await fetch("../backend/adminEntregas.php?accion=editarEntrega", {
    method: "POST",
    body: formData
  });

  const result = await res.json();

  if (result.success) {
    // Cerrar modal de edición de entrega
    bootstrap.Modal.getInstance(document.getElementById("modalEditarEntrega")).hide();

    // 👉 Cargar detalle ANTES de abrir el modal de detalle
    await cargarDetalleEntrega(idEntrega);

    // Abrir modal de detalle
    const modalDetalles = new bootstrap.Modal(document.getElementById("modalEditarDetalle"));
    modalDetalles.show();
  } else {
    swError("Error", result.msg || "Error al editar la entrega.");
  }
});

// Cargar detalle de una entrega específica
async function cargarDetalleEntrega(idEntrega) {
  try {
    if (!idEntrega || idEntrega === "null") {
      swError("Error", "ID de entrega no válido.");
      return;
    }

    const res = await fetch(`../backend/adminEntregas.php?accion=obtenerDetallePorEntrega&id_entrega=${idEntrega}`);
    const detalle = await res.json();

    if (!Array.isArray(detalle) || detalle.length === 0) {
      swWarn("Sin detalles", "No se encontraron detalles para esta entrega.");
      return;
    }

    const d = detalle[0];
    idEntregaActual = idEntrega;

    await cargarProductos();
    document.getElementById("editIdDetalle").value = d.id_producto; // producto original
    document.getElementById("editProductoEntrega").value = d.id_producto;
    document.getElementById("editCantidad").value = d.cantidad;
    document.getElementById("editPrecio").value = d.precio_unitario;
    document.getElementById("editDescuento").value = d.descuento_aplicado;
    document.getElementById("editIVA").value = d.porcentaje_iva_aplicado;

  } catch (error) {
    console.error("Error al cargar detalle de entrega:", error);
    swError("Error", "Error al cargar los detalles.");
  }
}

// Guardar cambios del detalle de entrega
document.getElementById("formEditarDetalle").addEventListener("submit", async e => {
  e.preventDefault();

  const idProducto = document.getElementById("editProductoEntrega").value;
  const cantidad = document.getElementById("editCantidad").value;
  const precio = document.getElementById("editPrecio").value;
  const descuento = document.getElementById("editDescuento").value || 0;
  const iva = document.getElementById("editIVA").value || 13;

  if (!idProducto || !cantidad || !precio) {
    swWarn("Campos incompletos", "Por favor complete todos los campos del detalle.");
    return;
  }

  const formData = new FormData();
formData.append("id_entrega", idEntregaActual);
formData.append("id_producto_original", document.getElementById("editIdDetalle").value);
formData.append("id_producto", idProducto);
formData.append("cantidad", cantidad);
formData.append("precio_unitario", precio);
formData.append("descuento_aplicado", descuento);
formData.append("porcentaje_iva_aplicado", iva);


  try {
    const res = await fetch("../backend/adminEntregas.php?accion=editarDetalle", {
      method: "POST",
      body: formData
    });

    const result = await res.json();

    if (result.success) {
      swOk("Actualizado", "Entrega actualizada correctamente.");
      bootstrap.Modal.getInstance(document.getElementById("modalEditarDetalle")).hide();
      cargarEntregas();
    } else {
      swError("Error", result.msg || "Error al actualizar el detalle.");
    }
  } catch (error) {
    console.error("Error al editar detalle:", error);
    swError("Error de conexión", "No se pudo editar el detalle.");
  }
});

// Abrir el modal de cambiar estado
function abrirCambiarEstado(idEntrega, estadoActual) {
  idEntregaSeleccionada = idEntrega;
  const select = document.getElementById("nuevoEstado");
  select.value = estadoActual; // Mostrar el estado actual por defecto

  const modal = new bootstrap.Modal(document.getElementById("modalCambiarEstado"));
  modal.show();
}

// Guardar el nuevo estado
async function guardarNuevoEstado() {
  const nuevoEstado = document.getElementById("nuevoEstado").value;

  if (!idEntregaSeleccionada || !nuevoEstado) {
    swWarn("Estado inválido", "Seleccione un estado válido.");
    return;
  }

  const formData = new FormData();
  formData.append("id_entrega", idEntregaSeleccionada);
  formData.append("estado", nuevoEstado);

  try {
    const res = await fetch(`../backend/adminEntregas.php?accion=cambiarEstado`, {
      method: "POST",
      body: formData
    });

    const result = await res.json();

    if (result.success) {
      swOk("Estado actualizado", "La entrega fue actualizada correctamente.");
      bootstrap.Modal.getInstance(document.getElementById("modalCambiarEstado")).hide();
      cargarEntregas(); 
    } else {
      swError("Error", result.msg || "Error al actualizar el estado.");
    }
  } catch (error) {
    console.error("Error cambiando estado:", error);
    swError("Error de conexión", "No se pudo cambiar el estado.");
  }
}

async function verEntrega(idEntrega) {
  try {
    const res = await fetch(`../backend/adminEntregas.php?accion=obtenerDetallePorEntrega&id_entrega=${idEntrega}`);
    const detalles = await res.json();

    if (!Array.isArray(detalles) || detalles.length === 0) {
      swWarn("Sin detalles", "No se encontraron detalles para esta entrega.");
      return;
    }

    const d = detalles[0]; 

    document.getElementById("detCliente").textContent = d.nombre_cliente;
    document.getElementById("detDireccion").textContent = d.direccion;
    document.getElementById("detTelefono").textContent = d.telefono;
    document.getElementById("detRepartidor").textContent = d.nombre_empleado;
    document.getElementById("detFechaEntrega").textContent = formatoFecha(d.fecha_entrega);
    document.getElementById("detProducto").innerHTML = detalles.map(p => p.nombre_producto).join(", ");
    document.getElementById("detCantidad").innerHTML = detalles.map(p => p.cantidad).join(", ");
    document.getElementById("detPrecio").innerHTML = detalles.map(p => `₡${parseFloat(p.precio_unitario).toFixed(2)}`).join(", ");
    document.getElementById("detDescuento").innerHTML = detalles.map(p => `${parseFloat(p.descuento_aplicado).toFixed(2)}%`).join(", ");
    document.getElementById("detIVA").innerHTML = detalles.map(p => `${parseFloat(p.porcentaje_iva_aplicado).toFixed(2)}%`).join(", ");
    
    const badgeClass =
      d.estado === "Completada" ? "bg-success" :
      d.estado === "Pendiente" ? "bg-warning text-dark" :
      d.estado === "En camino" ? "bg-info text-dark" :
      "bg-secondary";
    document.getElementById("detEstado").innerHTML = `<span class="badge ${badgeClass}">${d.estado}</span>`;

    new bootstrap.Modal(document.getElementById("modalDetallesEntrega")).show();

  } catch (error) {
    console.error("Error al cargar detalles de entrega:", error);
    swError("Error", "No se pudo cargar el detalle de la entrega.");
  }
}

fetch("../backend/adminEntregas.php?accion=buscarCedulas")
    .then(r => r.json())
    .then(d => {
        clientes = d;
        mostrarCedulas("", "listaCedulas");
        mostrarCedulas("", "listaCedulasEditar");
    });

function mostrarCedulas(txt, id) {
    const l = document.getElementById(id);
    l.innerHTML = clientes
        .filter(c => !txt || c.cedula.includes(txt) || c.nombre.toLowerCase().includes(txt.toLowerCase()))
        .slice(0, txt ? 10 : 3)
        .map(c =>
            id === "listaCedulasEditar"
                ? `<option value="${c.cedula}" data-id="${c.id_cliente}">${c.nombre}</option>`
                : `<option value="${c.cedula}">${c.nombre}</option>`
        ).join("");
}

cedulaCliente.oninput = e => mostrarCedulas(e.target.value, "listaCedulas");
editCedulaCliente.oninput = e => mostrarCedulas(e.target.value, "listaCedulasEditar");

function formatoFecha(fecha) {
    if (!fecha) return "";
    const [anio, mes, dia] = fecha.split("-");
    return `${dia}/${mes}/${anio}`;
}

// Limpiar formularios al cerrar los modales
modalAgregarEntrega.addEventListener('hidden.bs.modal', () => {
  document.getElementById("formAgregarEntrega").reset();
});

modalAgregarDetallesEntrega.addEventListener('hidden.bs.modal', () => {
  document.getElementById("formAgregarDetallesEntrega").reset();
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
    const spanRol  = document.getElementById("usuarioRol");
 
    if (spanUser) spanUser.textContent = (me.empleado_nombre || me.username);
    if (spanRol)  spanRol.textContent  = "Rol: " + (me.rol || "-");
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
  cargarEntregas();
});
 
window.onpageshow = function(event) {
  if (event.persisted) {
    verificarSesionYMostrarUsuario();
    cargarEntregas();
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
