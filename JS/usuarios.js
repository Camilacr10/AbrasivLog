// usuarios.js
document.addEventListener("DOMContentLoaded", async () => {
  // 1) Verificar sesión y rol antes de cargar datos
  const me = await verificarSesion();
  if (!me || !me.authenticated) {
    window.location.href = "/login.html";
    return;
  }
  const linkCredenciales = document.getElementById("linkCredenciales");
  if (linkCredenciales && me.rol !== "Administrador") {
    linkCredenciales.style.display = "none";
  }
  if (me.rol !== "Administrador") {
    alert("Acceso denegado. Solo Administrador.");
    window.location.href = "/login.html";
    return;
  }

  // Pintar usuario en el header si existe ese span
  const spanUser = document.getElementById("usuarioActual");
  if (spanUser) spanUser.textContent = `${me.empleado_nombre || me.username} (${me.rol})`;

  // 2) Cargar tabla
  cargarEmpleados();
});

// ---------------------
// Helper: verificar sesión
// ---------------------
async function verificarSesion() {
  try {
    const r = await fetch("../backend/login.php?op=me", {
      method: "GET",
      credentials: "same-origin",
    });
    return await r.json(); // { authenticated, username, rol, ... }
  } catch (e) {
    console.error("Error verificando sesión:", e);
    return null;
  }
}

// ---------------------
// Cargar empleados
// ---------------------
async function cargarEmpleados() {
  try {
    const respuesta = await fetch("../backend/usuarios.php", {
      method: "GET",
      credentials: "same-origin",
    });

    if (respuesta.status === 401) {
      alert("Sesión expirada. Inicie sesión nuevamente.");
      window.location.href = "/login.html";
      return;
    }
    if (respuesta.status === 403) {
      alert("Acceso denegado.");
      window.location.href = "/login.html";
      return;
    }

    const payload = await respuesta.json();
    if (!payload?.success) {
      throw new Error(payload?.message || "No se pudo cargar la lista de empleados.");
    }
    const datos = payload.data || [];

    const tabla = document.getElementById("tablaEmpleados");
    tabla.innerHTML = "";

    if (!Array.isArray(datos) || datos.length === 0) {
      tabla.innerHTML = `<tr><td colspan="6" class="text-muted text-center">No hay empleados registrados.</td></tr>`;
      return;
    }

    datos.forEach((emp) => {
      tabla.insertAdjacentHTML(
        "beforeend",
        `
        <tr>
          <td>${esc(emp.empleado) ?? "-"}</td>
          <td>${esc(emp.puesto) ?? "-"}</td>
          <td>${emp.usuario ? esc(emp.usuario) : "<span class='text-muted'>No asignado</span>"}</td>
          <td>${esc(emp.rol) ?esc(emp.rol) : "<span class='text-muted'>No asignado</span>"}</td>
          <td>
            ${
              emp.estado
                ? `<span class="badge bg-${emp.estado === "Activo" ? "success" : "secondary"}">${emp.estado}</span>`
                : "<span class='text-muted'>Sin usuario</span>"
            }
          </td>
          <td class="text-center">${crearDropdown(emp)}</td>
        </tr>`
      );
    });
  } catch (error) {
    console.error("❌ Error al cargar empleados:", error);
    alert(error.message || "Error al cargar empleados.");
  }
}

// ---------------------
// Dropdown por fila
// ---------------------
function crearDropdown(emp) {
  // Si no tiene usuario: solo opción de Asignar Credenciales
  if (!emp.usuario) {
    return `
      <div class="dropdown">
        <button class="btn btn-warning btn-sm dropdown-toggle" data-bs-toggle="dropdown">
          <i class="fa-solid fa-gear me-1"></i> Opciones
        </button>
        <ul class="dropdown-menu">
          <li>
            <a class="dropdown-item" href="#" data-bs-toggle="modal"
               data-bs-target="#modalRegistroEmpleado"
               onclick="abrirModal(${emp.id_empleado}, '${esc(emp.empleado)}')">
              <i class="fa-solid fa-user-plus me-2 text-warning"></i>Asignar Credenciales
            </a>
          </li>
        </ul>
      </div>`;
  }

  // Con usuario: editar / cambiar rol / activar-inactivar
  return `
    <div class="dropdown">
      <button class="btn btn-sm btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
        Acciones
      </button>
      <ul class="dropdown-menu">
        <li>
          <a class="dropdown-item" href="#" onclick="abrirEditar(${emp.id_empleado}, '${esc(emp.usuario)}', '${esc(emp.rol)}')">
            <i class="fa-solid fa-pen-to-square me-2 text-primary"></i>Editar
          </a>
        </li>
        <li>
          <a class="dropdown-item" href="#" onclick="abrirModalRol(${emp.id_empleado}, '${esc(emp.rol)}')">
            <i class="fa-solid fa-shield-halved me-2 text-info"></i>Cambiar rol
          </a>
        </li>
        <li>
          <a class="dropdown-item ${emp.estado === "Activo" ? "text-danger" : "text-success"}" href="#"
             onclick="inactivarEmpleado(${emp.id_empleado}, '${emp.estado}')">
            <i class="fa-solid ${emp.estado === "Activo" ? "fa-user-slash text-danger" : "fa-user-check text-success"} me-2"></i>
            ${emp.estado === "Activo" ? "Inactivar" : "Activar"}
          </a>
        </li>
      </ul>
    </div>`;
}

// ---------------------
// Modales
// ---------------------
function abrirModal(id, nombre) {
  document.getElementById("idEmpleado").value = id;
  document.getElementById("correoEmpleado").value = generarUsuario(nombre);
  document.getElementById("contrasenaEmpleado").value = "";
  document.getElementById("rolEmpleado").value = "";
}

function generarUsuario(nombre) {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, ".");
}

function esc(texto) {
  if (texto === null || texto === undefined) return "";
  return String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ---------------------
// Acciones: crear credenciales
// ---------------------
async function registrarEmpleado() {
  const id_empleado = document.getElementById("idEmpleado").value;
  const usuario = document.getElementById("correoEmpleado").value.trim();
  const contrasena = document.getElementById("contrasenaEmpleado").value.trim();
  const rol = document.getElementById("rolEmpleado").value;

  if (!id_empleado || !usuario || !contrasena || !rol) {
    alert("Por favor complete todos los campos.");
    return;
  }

  try {
    const res = await fetch("../backend/usuarios.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ id_empleado, usuario, contrasena, rol }),
    });

    if (res.status === 401) return redirectLogin();
    if (res.status === 403) return alert("Acceso denegado.");

    const data = await res.json();
    alert(data.message || data.success || data.error || "Operación realizada.");
    cargarEmpleados();
  } catch (e) {
    console.error("Error:", e);
    alert("Error al registrar usuario.");
  }
}

// ---------------------
// Acciones: editar credenciales (USANDO MODAL)
// ---------------------
function abrirEditar(id, usuarioActual /*, rolActual */) {
  // llenar campos del modal
  document.getElementById("editIdEmpleado").value = id;
  document.getElementById("editUsuario").value = usuarioActual || "";
  document.getElementById("editContrasena").value = "";

  // mostrar modal
  const modalEl = document.getElementById("modalEditarCredenciales");
  const modal = new bootstrap.Modal(modalEl);
  modal.show();
}

async function guardarEdicionCredenciales() {
  const id_empleado = document.getElementById("editIdEmpleado").value;
  const nuevoUsuario = document.getElementById("editUsuario").value.trim();
  const nuevaContrasena = document.getElementById("editContrasena").value.trim();

  if (!id_empleado || !nuevoUsuario || !nuevaContrasena) {
    alert("Debe ingresar usuario y contraseña.");
    return;
  }

  try {
    const res = await fetch("../backend/usuarios.php", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        id_empleado,
        usuario: nuevoUsuario,
        contrasena: nuevaContrasena,
      }),
    });

    if (res.status === 401) return redirectLogin();
    if (res.status === 403) throw new Error("Acceso denegado.");

    const data = await res.json();
    alert(data.message || data.success || data.error || "Operación realizada.");

    // cerrar modal
    const modalEl = document.getElementById("modalEditarCredenciales");
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();

    // recargar tabla
    cargarEmpleados();
  } catch (err) {
    console.error("Error al editar:", err);
    alert(err.message || "Error al editar credenciales.");
  }
}

// ---------------------
// Acciones: activar/inactivar
// ---------------------
async function inactivarEmpleado(id, estado) {
  const nuevoEstado = estado === "Activo" ? 0 : 1;
  if (!confirm(`¿Seguro que desea ${nuevoEstado ? "activar" : "inactivar"} este usuario?`)) return;

  try {
    const res = await fetch("../backend/usuarios.php", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ id_empleado: id, activo: nuevoEstado }),
    });

    if (res.status === 401) return redirectLogin();
    if (res.status === 403) return alert("Acceso denegado.");

    const data = await res.json();
    alert(data.message || data.success || data.error || "Operación realizada.");
    cargarEmpleados();
  } catch (e) {
    console.error("Error al cambiar estado:", e);
    alert("Error al cambiar estado.");
  }
}

// ---------------------
// Acciones: cambiar rol
// ---------------------
async function abrirModalRol(id, rolActual) {
  document.getElementById("idEmpleadoRol").value = id;
  try {
    const res = await fetch("../backend/roles.php", {
      method: "GET",
      credentials: "same-origin",
    });
    if (res.status === 401) return redirectLogin();
    const roles = await res.json();

    const select = document.getElementById("nuevoRol");
    select.innerHTML = "";
    (roles || []).forEach((r) => {
      const nombre = r.nombre || r; // por si roles.php devuelve un array simple
      select.insertAdjacentHTML(
        "beforeend",
        `<option value="${esc(nombre)}" ${nombre === rolActual ? "selected" : ""}>${esc(nombre)}</option>`
      );
    });

    new bootstrap.Modal(document.getElementById("modalCambiarRol")).show();
  } catch (e) {
    console.error("Error al cargar roles:", e);
    alert("No se pudieron cargar los roles.");
  }
}

async function guardarNuevoRol() {
  const id_empleado = document.getElementById("idEmpleadoRol").value;
  const nuevo_rol = document.getElementById("nuevoRol").value;

  if (!id_empleado || !nuevo_rol) {
    alert("Seleccione un rol válido.");
    return;
  }

  const res = await fetch("../backend/usuarios.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ accion: "PUT_ROLE", id_empleado, nuevo_rol }),
  });

  if (res.status === 401) return redirectLogin();
  if (res.status === 403) return alert("Acceso denegado.");

  const data = await res.json();
  alert(data.message || data.success || data.error || "Operación realizada.");
  cargarEmpleados();
}

function redirectLogin() {
  alert("Sesión expirada. Inicie sesión nuevamente.");
  window.location.href = "login.html";
}

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

  } catch (err) {
    console.error("Error verificando sesión:", err);
    window.location.href = "login.html";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  verificarSesionYMostrarUsuario();
});

window.onpageshow = function(event) {
  if (event.persisted) {
    verificarSesionYMostrarUsuario();
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

function filtrarEmpleados() {
  const input = document.getElementById("buscarEmpleado");
  const filtro = input.value.toLowerCase();
  const tbody = document.getElementById("tablaEmpleados");
  const filas = tbody.querySelectorAll("tr");
  let visibles = 0;

  filas.forEach(fila => {
    const texto = fila.textContent.toLowerCase();
    const match = texto.includes(filtro);
    fila.style.display = match ? "" : "none";
    if (match) visibles++;
  });

  if (visibles === 0 && filtro !== "") {
    tbody.innerHTML =
      "<tr><td colspan='6' class='text-center text-muted'>Sin resultados</td></tr>";
  }

  if (filtro === "") {
    cargarEmpleados();
  }
}
