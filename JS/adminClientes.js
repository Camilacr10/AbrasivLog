const API = "../backend/adminClientes.php";

let clientes = [];
let clienteActual = -1;
let usuarioActual = null;          
let clienteHistorialActual = null;

// ======================================================
// ✅ SESIÓN Y USUARIO ACTUAL
// ======================================================
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

    usuarioActual = me; // guardamos para historial (id_empleado, etc.)

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

async function salir() {
  try {
    await fetch("../backend/login.php?op=logout", {
      method: "POST",
      credentials: "same-origin"
    });
  } catch (e) {
    console.error(e);
  }
  window.location.href = "login.html";
}

// Cuando carga la página
document.addEventListener("DOMContentLoaded", () => {
  verificarSesionYMostrarUsuario();
  cargarClientes();
});

// Si el usuario vuelve con el botón Atrás (BFCache)
window.onpageshow = function(event) {
  if (event.persisted) {
    verificarSesionYMostrarUsuario();
    cargarClientes();
  }
};

// ======================================================
// ✅ TABLA PRINCIPAL DE CLIENTES
// ======================================================

function renderTabla() {
  const tbody = document.getElementById('tablaClientes');
  tbody.innerHTML = '';

  if (!clientes.length) {
    tbody.innerHTML = "<tr><td colspan='8'>Sin registros</td></tr>";
    return;
  }

  clientes.forEach((cliente, i) => {
    const fila = document.createElement('tr');


    const estadoRaw   = cliente.estado ?? '';
    const estadoMayus = estadoRaw.toString().toUpperCase(); 
    const esActivo    = (estadoMayus === 'ACTIVO');
    const textoEstado = esActivo ? 'Activo' : 'Inactivo';

    fila.innerHTML = `
      <td>${cliente.razon_social ?? ''}</td>
      <td>${cliente.nombre}</td>
      <td>${cliente.cedula}</td>
      <td>${cliente.telefono ?? ''}</td>
      <td>${cliente.correo_electronico ?? ''}</td>
      <td>${cliente.direccion ?? ''}</td>
      <!-- 🔹 Verde cuando está activo, gris cuando está inactivo, texto en minúsculas -->
      <td>
        <span class="badge ${esActivo ? 'bg-success' : 'bg-secondary'}">
          ${textoEstado}
        </span>
      </td>
      <!-- 🔹 Le pasamos el estado en mayúsculas para que crearDropdown funcione bien -->
      <td class="text-center align-middle">${crearDropdown(i, estadoMayus)}</td>
    `;
    tbody.appendChild(fila);
  });

  document.querySelectorAll('.dropdown-toggle').forEach(el => new bootstrap.Dropdown(el));
}

function crearDropdown(index, estado) {
  const activo = estado === "ACTIVO";
  return `
    <div class="dropdown">
      <button class="btn btn-sm btn-secondary dropdown-toggle"
              type="button"
              data-bs-toggle="dropdown"
              data-bs-display="static"
              aria-expanded="false">
        Acciones
      </button>
      <ul class="dropdown-menu shadow">
        <li>
          <a class="dropdown-item" href="#" onclick="verDetalle(${index})">
            <i class="fa-solid fa-eye text-primary"></i> Ver
          </a>
        </li>
        <li>
          <a class="dropdown-item" href="#" onclick="abrirModal(${index})">
            <i class="fa-solid fa-pen-to-square text-warning"></i> Editar
          </a>
        </li>
        <li>
          <a class="dropdown-item" href="#" onclick="toggleEstado(${index})">
            <i class="fa-solid ${activo ? 'fa-user-slash text-danger' : 'fa-user-check text-success'}"></i> 
            ${activo ? 'Inactivar' : 'Activar'}
          </a>
        </li>
        <li>
          <a class="dropdown-item" href="#" onclick="abrirHistorial(${index})">
            <i class="fa-solid fa-clock-rotate-left text-info"></i> Historial
          </a>
        </li>
      </ul>
    </div>
  `;
}

function filtrarClientes() {
  const input = document.getElementById('buscarInput');
  const filtro = (input?.value || "").toLowerCase().trim();

  if (!filtro) {
    cargarClientes();
    return;
  }

  const filas = document.querySelectorAll('#tablaClientes tr');
  let visibles = 0;

  filas.forEach(fila => {
    const texto = (fila.textContent || "").toLowerCase();
    const match = texto.includes(filtro);
    fila.style.display = match ? '' : 'none';
    if (match) visibles++;
  });

  if (visibles === 0) {
    document.getElementById('tablaClientes').innerHTML =
      "<tr><td colspan='8'>Sin resultados</td></tr>";
  }
}
async function cargarClientes() {
  const tbody = document.getElementById('tablaClientes');
  tbody.innerHTML = "<tr><td colspan='8'>Cargando...</td></tr>";
  try {
    const resp = await fetch(API, { credentials: "include" });
    const data = await resp.json();
    if (!resp.ok || !data.ok) throw new Error(data.message || 'Error al cargar');
    clientes = data.data || [];
    renderTabla();
  } catch (err) {
    console.error(err);
    tbody.innerHTML = "<tr><td colspan='8'>Error al cargar</td></tr>";
  }
}

// ======================================================
// ✅ REGISTRO DE CLIENTE
// ======================================================

async function registrarCliente() {
  const nombre = document.getElementById('nuevoNombre').value.trim();
  const razon = document.getElementById('nuevaRazon').value.trim();
  const cedula = document.getElementById('nuevaCedula').value.trim();
  const telefono = document.getElementById('nuevoTelefono').value.trim();
  const correo = document.getElementById('nuevoCorreo').value.trim();
  const direccion = document.getElementById('nuevaDireccion').value.trim();
  const estado = document.getElementById('nuevoEstado').value;

  if (!nombre || !cedula) {
    alert('⚠️ Por favor complete los campos obligatorios.');
    return;
  }
  if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    alert('⚠️ Correo electrónico no válido.');
    return;
  }

  try {
    const resp = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: "include",
      body: JSON.stringify({ nombre, razon_social: razon, cedula, telefono, correo, direccion, estado })
    });
    const data = await resp.json();
    if (!resp.ok || !data.ok) throw new Error(data.message || 'Error al registrar');
    alert('✅ Cliente registrado exitosamente');
    document.getElementById('formRegistro').reset();
    await cargarClientes();
  } catch (err) {
    console.error(err);
    alert('❌ ' + err.message);
  }
}

// ======================================================
// ✅ EDICIÓN DE CLIENTE
// ======================================================

function abrirModal(index) {
  clienteActual = index;
  const c = clientes[index];
  document.getElementById('modalIdCliente').value = c.id_cliente;
  document.getElementById('modalRazon').value = c.razon_social ?? '';
  document.getElementById('modalNombre').value = c.nombre ?? '';
  document.getElementById('modalCedula').value = c.cedula ?? '';
  document.getElementById('modalTelefono').value = c.telefono ?? '';
  document.getElementById('modalCorreo').value = c.correo_electronico ?? '';
  document.getElementById('modalDireccion').value = c.direccion ?? '';
  document.getElementById('modalEstado').value = c.estado ?? 'ACTIVO';

  const bloqueado = (c.estado === 'INACTIVO');
  ['modalRazon', 'modalNombre', 'modalTelefono', 'modalCorreo', 'modalDireccion'].forEach(id => {
    document.getElementById(id).disabled = bloqueado;
  });
  document.getElementById('alertBloqueado').classList.toggle('d-none', !bloqueado);

  new bootstrap.Modal(document.getElementById('modalEditarCliente')).show();
}

async function guardarCambios() {
  if (clienteActual < 0) return;
  const c = clientes[clienteActual];

  const payload = {
    id_cliente: c.id_cliente,
    nombre: document.getElementById('modalNombre').value.trim(),
    razon_social: document.getElementById('modalRazon').value.trim(),
    cedula: document.getElementById('modalCedula').value.trim(),
    telefono: document.getElementById('modalTelefono').value.trim(),
    correo: document.getElementById('modalCorreo').value.trim(),
    direccion: document.getElementById('modalDireccion').value.trim(),
    estado: document.getElementById('modalEstado').value
  };

  if (!payload.nombre || !payload.cedula) {
    alert('⚠️ Complete los campos obligatorios.');
    return;
  }
  if (payload.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.correo)) {
    alert('⚠️ Correo inválido.');
    return;
  }

  try {
    const resp = await fetch(API, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: "include",
      body: JSON.stringify(payload)
    });
    const data = await resp.json();
    if (!resp.ok || !data.ok) throw new Error(data.message || 'Error al guardar');

    alert('✅ Datos actualizados');

    // HU05: registrar en historial la actualización
    await registrarInteraccionCliente(
      c.id_cliente,
      "Actualización de datos",
      "Datos del cliente actualizados desde el módulo adminClientes."
    );

    await cargarClientes();
  } catch (err) {
    console.error(err);
    alert('❌ ' + err.message);
  }
}

// ======================================================
// ✅ CAMBIO DE ESTADO (ACTIVO / INACTIVO)
// ======================================================

async function toggleEstado(index) {
  const c = clientes[index];
  if (!c) return;

  const nuevoEstado = c.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';

  const confirmar = confirm(
    `¿Seguro que desea marcar este cliente como ${nuevoEstado}?`
  );
  if (!confirmar) return;

  try {
    const resp = await fetch(API, {
      method: 'PATCH',          // 👈 ahora PATCH
      headers: { 
        'Content-Type': 'application/json' 
      },
      credentials: "include",
      body: JSON.stringify({
        id_cliente: c.id_cliente,
        estado: nuevoEstado
      })
    });

    const data = await resp.json();
    if (!resp.ok || !data.ok) {
      throw new Error(data.message || "Error al cambiar estado");
    }

    // Registrar en historial (opcional, ya lo tienes)
    const desc = nuevoEstado === 'ACTIVO'
      ? "Cliente activado nuevamente."
      : "Cliente marcado como INACTIVO.";

    await registrarInteraccionCliente(
      c.id_cliente,
      "Cambio de estado",
      desc
    );

    await cargarClientes();
  } catch (err) {
    console.error("Error al cambiar estado:", err);
    alert("❌ " + (err.message || "Error al cambiar estado."));
  }
}


// ======================================================
// ✅ DETALLE DEL CLIENTE
// ======================================================

function verDetalle(index) {
  const c = clientes[index];
  document.getElementById('detRazon').textContent = c.razon_social ?? '';
  document.getElementById('detNombre').textContent = c.nombre ?? '';
  document.getElementById('detCedula').textContent = c.cedula ?? '';
  document.getElementById('detCorreo').textContent = c.correo_electronico ?? '';
  document.getElementById('detTelefono').textContent = c.telefono ?? '';
  document.getElementById('detDireccion').textContent = c.direccion ?? '';
  document.getElementById('detEstado').textContent = c.estado ?? 'Activo';
  new bootstrap.Modal(document.getElementById('modalDetalleCliente')).show();
}


function abrirHistorial(index) {
  const c = clientes[index];
  if (!c) return;

  clienteHistorialActual = c;

 
  const titulo = document.getElementById("tituloHistorialCliente");
  if (titulo) {
    titulo.textContent = `Historial de: ${c.nombre || c.razon_social || 'Cliente'}`;
  }

  cargarHistorialCliente(c.id_cliente);

  new bootstrap.Modal(document.getElementById('modalHistorial')).show();
}

async function cargarHistorialCliente(idCliente) {
  const tbody = document.getElementById("tbodyHistorialCliente");
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="4" class="text-muted">Cargando...</td>
    </tr>
  `;

  try {
    const resp = await fetch(`${API}?op=listar_historial&id_cliente=${idCliente}`, {
      credentials: "include"
    });
    const data = await resp.json();
    if (!resp.ok || !data.ok) throw new Error(data.message || "Error al cargar historial");

    const historial = data.data || [];

    tbody.innerHTML = "";

    if (!historial.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="text-muted text-center">Sin datos</td>
        </tr>
      `;
      return;
    }

    historial.forEach(item => {
      const tr = document.createElement("tr");
      const fecha = item.fecha ? new Date(item.fecha) : null;

      tr.innerHTML = `
        <td>${item.tipo_interaccion}</td>
        <td>${fecha ? fecha.toLocaleString() : ''}</td>
        <td>${item.empleado ?? ''}</td>
        <td>${item.observaciones ?? ''}</td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error("Error cargando historial:", err);
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="text-danger text-center">Error al cargar el historial.</td>
      </tr>
    `;
  }
}


async function registrarInteraccionCliente(idCliente, tipo, observaciones) {
  try {
    if (!usuarioActual || !usuarioActual.id_empleado) {
      
      console.warn("No se encontró id_empleado en usuarioActual para historial.");
      return;
    }

    const payload = {
      id_cliente: idCliente,
      tipo_interaccion: tipo,
      id_empleado: usuarioActual.id_empleado,
      observaciones: observaciones || ""
    };

    const resp = await fetch(`${API}?op=registrar_historial`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload)
    });
    const data = await resp.json();
    if (!resp.ok || !data.ok) {
      console.warn("No se pudo registrar en historial:", data.message || "");
    } else {
     
      if (clienteHistorialActual && clienteHistorialActual.id_cliente === idCliente) {
        cargarHistorialCliente(idCliente);
      }
    }
  } catch (err) {
    console.error("Error registrando interacción en historial:", err);
  }
}
