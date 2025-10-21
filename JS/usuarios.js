document.addEventListener("DOMContentLoaded", () => {
  cargarEmpleados();
});

async function cargarEmpleados() {
  try {
    const respuesta = await fetch("../backend/usuarios.php");
    const datos = await respuesta.json();

    const tabla = document.getElementById("tablaEmpleados");
    tabla.innerHTML = "";

    if (!datos || datos.length === 0) {
      tabla.innerHTML = `<tr><td colspan="7" class="text-muted text-center">No hay empleados registrados.</td></tr>`;
      return;
    }

    datos.forEach(emp => {
      tabla.innerHTML += `
        <tr>
          <td>${emp.empleado ?? "-"}</td>
          <td>${emp.puesto ?? "-"}</td>
          <td>${emp.usuario ?? "<span class='text-muted'>No asignado</span>"}</td>
          <td>${emp.rol ?? "-"}</td>
          <td>${emp.contrasena ?? "<span class='text-muted'>No asignada</span>"}</td>
          <td>
            ${emp.estado
              ? `<span class="badge bg-${emp.estado === 'Activo' ? 'success' : 'secondary'}">${emp.estado}</span>`
              : "<span class='text-muted'>Sin usuario</span>"
            }
          </td>
          <td class="text-center">${crearDropdown(emp)}</td>
        </tr>`;
    });
  } catch (error) {
    console.error("❌ Error al cargar empleados:", error);
  }
}


function crearDropdown(emp) {
 
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
               onclick="abrirModal(${emp.id_empleado}, '${emp.empleado}')">
              <i class="fa-solid fa-user-plus me-2 text-warning"></i>Asignar Credenciales
            </a>
          </li>
        </ul>
      </div>`;
  }

 
  return `
    <div class="dropdown">
      <button class="btn btn-sm btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
        Acciones
      </button>
      <ul class="dropdown-menu">
        <li>
          <a class="dropdown-item" href="#" onclick="abrirEditar(${emp.id_empleado}, '${emp.usuario}', '${emp.rol}')">
            <i class="fa-solid fa-pen-to-square me-2 text-primary"></i>Editar
          </a>
        </li>
        <li>
          <a class="dropdown-item" href="#" onclick="abrirModalRol(${emp.id_empleado}, '${emp.rol}')">
            <i class="fa-solid fa-shield-halved me-2 text-info"></i>Cambiar rol
          </a>
        </li>
        <li>
          <a class="dropdown-item ${emp.estado === 'Activo' ? 'text-danger' : 'text-success'}" href="#"
             onclick="inactivarEmpleado(${emp.id_empleado}, '${emp.estado}')">
            <i class="fa-solid ${emp.estado === 'Activo' ? 'fa-user-slash text-danger' : 'fa-user-check text-success'} me-2"></i>
            ${emp.estado === 'Activo' ? 'Inactivar' : 'Activar'}
          </a>
        </li>
      </ul>
    </div>`;
}


function abrirModal(id, nombre) {
  document.getElementById("idEmpleado").value = id;
  document.getElementById("correoEmpleado").value = generarUsuario(nombre);
  document.getElementById("contrasenaEmpleado").value = "";
  document.getElementById("rolEmpleado").value = "";
}

function generarUsuario(nombre) {
  return nombre.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, ".");
}


async function registrarEmpleado() {
  const id_empleado = document.getElementById("idEmpleado").value;
  const usuario = document.getElementById("correoEmpleado").value.trim();
  const contrasena = document.getElementById("contrasenaEmpleado").value.trim();
  const rol = document.getElementById("rolEmpleado").value;

  if (!id_empleado || !usuario || !contrasena || !rol) {
    alert(" Por favor complete todos los campos.");
    return;
  }

  try {
    const res = await fetch("../backend/usuarios.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_empleado, usuario, contrasena, rol })
    });

    const data = await res.json();
    alert(data.success || data.error);
    cargarEmpleados();
  } catch (e) {
    console.error("Error:", e);
  }
}


function abrirEditar(id, usuarioActual, rolActual) {
  const nuevoUsuario = prompt(`Usuario actual: ${usuarioActual}\nIngrese nuevo nombre de usuario:`);
  const nuevaContrasena = prompt("Ingrese nueva contraseña:");
  if (!nuevoUsuario || !nuevaContrasena) return;

  fetch("../backend/usuarios.php", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id_empleado: id,
      usuario: nuevoUsuario,
      contrasena: nuevaContrasena
    })
  })
    .then(res => res.json())
    .then(data => {
      alert(data.success || data.error);
      cargarEmpleados();
    })
    .catch(err => console.error("Error al editar:", err));
}


async function inactivarEmpleado(id, estado) {
  const nuevoEstado = estado === "Activo" ? 0 : 1;
  if (!confirm(`¿Seguro que desea ${nuevoEstado ? "activar" : "inactivar"} este usuario?`)) return;

  const res = await fetch("../backend/usuarios.php", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_empleado: id, activo: nuevoEstado })
  });

  const data = await res.json();
  alert(data.success || data.error);
  cargarEmpleados();
}


async function abrirModalRol(id, rolActual) {
  document.getElementById("idEmpleadoRol").value = id;
  try {
    const res = await fetch("../backend/roles.php");
    const roles = await res.json();
    const select = document.getElementById("nuevoRol");
    select.innerHTML = "";
    roles.forEach(r => {
      select.innerHTML += `<option value="${r.nombre}" ${r.nombre === rolActual ? 'selected' : ''}>${r.nombre}</option>`;
    });
    new bootstrap.Modal(document.getElementById("modalCambiarRol")).show();
  } catch (e) {
    console.error("Error al cargar roles:", e);
  }
}


async function guardarNuevoRol() {
  const id_empleado = document.getElementById("idEmpleadoRol").value;
  const nuevo_rol = document.getElementById("nuevoRol").value;

  if (!id_empleado || !nuevo_rol) {
    alert("⚠️ Seleccione un rol válido.");
    return;
  }

  const res = await fetch("../backend/usuarios.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accion: "PUT_ROLE", id_empleado, nuevo_rol })
  });

  const data = await res.json();
  alert(data.success || data.error);
  cargarEmpleados();
}
