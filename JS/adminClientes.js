
const API = "../backend/adminClientes.php";


let clientes = [];
let clienteActual = -1;


document.addEventListener('DOMContentLoaded', cargarClientes);

function renderTabla() {
  const tbody = document.getElementById('tablaClientes');
  tbody.innerHTML = '';

  if (!clientes.length) {
    tbody.innerHTML = "<tr><td colspan='8'>Sin registros</td></tr>";
    return;
  }

  clientes.forEach((cliente, i) => {
    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td>${cliente.razon_social ?? ''}</td>
      <td>${cliente.nombre}</td>
      <td>${cliente.cedula}</td>
      <td>${cliente.telefono ?? ''}</td>
      <td>${cliente.correo_electronico ?? ''}</td>
      <td>${cliente.direccion ?? ''}</td>
      <td>
        <span class="badge ${cliente.estado === 'ACTIVO' ? 'bg-success' : 'bg-secondary'}">
          ${cliente.estado}
        </span>
      </td>
      <td>
        <button class="btn btn-info btn-sm me-1 text-white" onclick="verDetalle(${i})">Ver</button>
        <button class="btn btn-primary btn-sm me-1" onclick="abrirModal(${i})">Editar</button>
        <button class="btn btn-secondary btn-sm me-1" onclick="toggleEstado(${i})">
          ${cliente.estado === 'ACTIVO' ? 'Inactivar' : 'Activar'}
        </button>
        <button class="btn btn-warning btn-sm text-white me-1" onclick="abrirHistorial()">Historial</button>
        <button class="btn btn-danger btn-sm" onclick="eliminarCliente(${i})">Eliminar</button>
      </td>
    `;
    tbody.appendChild(fila);
  });
}


function filtrarClientes() {
  const filtro = document.getElementById('buscarInput').value.toLowerCase();
  const filas = document.querySelectorAll('#tablaClientes tr');

  let visibles = 0;
  filas.forEach(fila => {
    const texto = fila.textContent.toLowerCase();
    const match = texto.includes(filtro);
    fila.style.display = match ? '' : 'none';
    if (match) visibles++;
  });

  if (visibles === 0) {
    const tbody = document.getElementById('tablaClientes');
    const tr = document.createElement('tr');
    tr.innerHTML = "<td colspan='8'>sin resultados</td>";
    tbody.appendChild(tr);
  }
}


function abrirHistorial() {
  new bootstrap.Modal(document.getElementById('modalHistorial')).show();
}


async function cargarClientes() {
  const tbody = document.getElementById('tablaClientes');
  tbody.innerHTML = "<tr><td colspan='8'>Cargando...</td></tr>";
  try {
    const resp = await fetch(API);
    const data = await resp.json();
    if (!resp.ok || !data.ok) throw new Error(data.message || 'Error al cargar');
    clientes = data.data || [];
    renderTabla();
  } catch (err) {
    console.error(err);
    tbody.innerHTML = "<tr><td colspan='8'>Error al cargar</td></tr>";
  }
}

async function registrarCliente() {
  const nombre    = document.getElementById('nuevoNombre').value.trim();
  const razon     = document.getElementById('nuevaRazon').value.trim();
  const cedula    = document.getElementById('nuevaCedula').value.trim();
  const telefono  = document.getElementById('nuevoTelefono').value.trim();
  const correo    = document.getElementById('nuevoCorreo').value.trim();
  const direccion = document.getElementById('nuevaDireccion').value.trim();
  const estado    = document.getElementById('nuevoEstado').value;

  if (!nombre || !cedula) {
    alert('Por favor, verifique que los campos obligatorios estén completos y digitados correctamente.');
    return;
  }
  if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    alert('Los datos ingresados no son válidos. Por favor, verifique e intente de nuevo.');
    return;
  }

  try {
    const resp = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, razon_social: razon, cedula, telefono, correo, direccion, estado })
    });
    const data = await resp.json();
    if (!resp.ok || !data.ok) throw new Error(data.detail || data.message || 'Error al registrar');

    alert('Cliente registrado exitosamente');
    document.getElementById('formRegistro').reset();
    await cargarClientes();
  } catch (err) {
    console.error(err);
    alert('❌ ' + err.message);
  }
}

function abrirModal(index) {
  clienteActual = index;
  const c = clientes[index];

  document.getElementById('modalIdCliente').value   = c.id_cliente;
  document.getElementById('modalRazon').value       = c.razon_social ?? '';
  document.getElementById('modalNombre').value      = c.nombre ?? '';
  document.getElementById('modalCedula').value      = c.cedula ?? '';
  document.getElementById('modalTelefono').value    = c.telefono ?? '';
  document.getElementById('modalCorreo').value      = c.correo_electronico ?? '';
  document.getElementById('modalDireccion').value   = c.direccion ?? '';
  document.getElementById('modalEstado').value      = c.estado ?? 'ACTIVO';

  const bloqueado = (c.estado === 'INACTIVO');
  const inputs = ['modalRazon','modalNombre','modalTelefono','modalCorreo','modalDireccion'];
  inputs.forEach(id => document.getElementById(id).disabled = bloqueado);
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
    cedula: c.cedula.getElementById('modalCedula').value.trim(),
    telefono: document.getElementById('modalTelefono').value.trim(),
    correo: document.getElementById('modalCorreo').value.trim(),
    direccion: document.getElementById('modalDireccion').value.trim(),
    estado: document.getElementById('modalEstado').value
  };

  if (!payload.nombre || !payload.cedula) {
    alert('Por favor, verifique que los campos obligatorios estén completos y digitados correctamente.');
    return;
  }
  if (payload.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.correo)) {
    alert('Los datos ingresados no son válidos. Por favor, verifique e intente de nuevo.');
    return;
  }

  try {
    const resp = await fetch(API, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await resp.json();
    if (!resp.ok || !data.ok) throw new Error(data.detail || data.message || 'Error al guardar');

    alert('Datos actualizados con éxito');
    await cargarClientes();
  } catch (err) {
    console.error(err);
    alert('❌ ' + err.message);
  }
}

async function toggleEstado(index) {
  const c = clientes[index];
  const nuevoEstado = c.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';

  const payload = {
    id_cliente: c.id_cliente,
    nombre: c.nombre,
    razon_social: c.razon_social ?? '',
    cedula: c.cedula,
    telefono: c.telefono ?? '',
    correo: c.correo_electronico ?? '',
    direccion: c.direccion ?? '',
    estado: nuevoEstado
  };

  try {
    const resp = await fetch(API, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await resp.json();
    if (!resp.ok || !data.ok) throw new Error(data.detail || data.message || 'No se pudo cambiar el estado');

    await cargarClientes();
  } catch (err) {
    console.error(err);
    alert('❌ ' + err.message);
  }
}

async function eliminarCliente(index) {
  const c = clientes[index];
  if (!confirm(`¿Inactivar al cliente "${c.nombre}"?`)) return;

  try {
    const resp = await fetch(`${API}?id_cliente=${encodeURIComponent(c.id_cliente)}`, {
      method: 'DELETE'
    });
    const data = await resp.json();
    if (!resp.ok || !data.ok) throw new Error(data.detail || data.message || 'No se pudo eliminar');

    await cargarClientes();
  } catch (err) {
    console.error(err);
    alert('❌ ' + err.message);
  }
}

function verDetalle(index) {
  const c = clientes[index];
  document.getElementById('detRazon').textContent     = c.razon_social ?? '';
  document.getElementById('detNombre').textContent    = c.nombre ?? '';
  document.getElementById('detCedula').textContent    = c.cedula ?? '';
  document.getElementById('detCorreo').textContent    = c.correo_electronico ?? '';
  document.getElementById('detTelefono').textContent  = c.telefono ?? '';
  document.getElementById('detDireccion').textContent = c.direccion ?? '';
  document.getElementById('detEstado').textContent    = c.estado ?? 'ACTIVO';
  new bootstrap.Modal(document.getElementById('modalDetalleCliente')).show();
}

