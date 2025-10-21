const buscar = document.getElementById("buscarEmpleado");
const tabla = document.getElementById("tablaEmpleados");
const modalEditarEmpleado = document.getElementById('modalEditarEmpleado');

let empleadosGlobal = [];

async function cargarEmpleados() {
    const res = await fetch("../backend/Empleados.php?accion=listar");
    empleadosGlobal = await res.json();
    renderTabla(empleadosGlobal);
}

function renderTabla(lista) {
    tabla.innerHTML = lista.length
        ? lista.map(emp => `
<tr>
  <td>${emp.nombre_completo}</td>
  <td>${formatoFecha(emp.fecha_ingreso)}</td>
  <td>${emp.puesto}</td>
  <td>${emp.dias_vacaciones}</td>
  <td><span class="badge ${emp.estado === "Activo" ? "bg-success" : "bg-secondary"}">
  ${emp.estado}
</span></td>
  <td>
    <div class="dropdown">
      <button class="btn btn-sm btn-secondary dropdown-toggle" data-bs-toggle="dropdown">Acciones</button>
      <ul class="dropdown-menu">
        <li><a class="dropdown-item" href="#" onclick="abrirEditar(${emp.id_empleado})"><i class="fa-solid fa-pen-to-square me-2"></i>Editar</a></li>
        <li><a class="dropdown-item text-danger" href="#" onclick="inactivarEmpleado(${emp.id_empleado})"><i class="fa-solid fa-user-slash me-2"></i>Inactivar</a></li>
       <li><a class="dropdown-item" href="#" onclick="verPerfil(${emp.id_empleado})"><i class="fa-solid fa-user me-2"></i>Ver Perfil</a></li>
      </ul>
    </div>
  </td>
</tr>`).join("")
        : `<tr><td colspan="7" class="text-center text-muted">No se encontraron empleados</td></tr>`;
}

// 🔍 Filtrar en tiempo real
buscar.addEventListener("keyup", () => {
    const texto = buscar.value.toLowerCase().trim();
    const filtrados = empleadosGlobal.filter(e =>
        e.nombre_completo.toLowerCase().includes(texto)
    );
    renderTabla(filtrados);
});

window.onload = cargarEmpleados;


document.getElementById("formAgregarEmpleado").addEventListener("submit", async e => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("nombre", nombreEmpleado.value);
    formData.append("fecha", fechaIngreso.value);
    formData.append("vacaciones", vacacionesEmpleado.value);
    formData.append("puesto", puestoEmpleado.value);

    // archivo
    const archivo = document.getElementById("archivoEmpleado").files[0];
    if (archivo) {
        formData.append("archivo", archivo);
    }

    const res = await fetch("../backend/Empleados.php?accion=agregar", {
        method: "POST",
        body: formData
    });

    const result = await res.json();

    if (result.success) {
        alert("Empleado agregado con éxito");
        e.target.reset();
        bootstrap.Modal.getInstance(modalAgregarEmpleado).hide();
        cargarEmpleados();
    } else {
        alert("Error al guardar empleado");
    }
});


async function abrirEditar(id) {
    const res = await fetch("../backend/Empleados.php?accion=listar");
    const empleados = await res.json();
    const emp = empleados.find(e => e.id_empleado == id);
    if (!emp) return;

    indiceEmpleado.value = emp.id_empleado;
    editNombreEmpleado.value = emp.nombre_completo;
    editFechaIngreso.value = emp.fecha_ingreso;
    editPuestoEmpleado.value = emp.puesto;
    editVacacionesEmpleado.value = emp.dias_vacaciones;
    editEstadoEmpleado.value = emp.estado;
    document.getElementById("editArchivoEmpleado").value = "";
    new bootstrap.Modal(modalEditarEmpleado).show();
}

document.getElementById("formEditarEmpleado").addEventListener("submit", async e => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("id", indiceEmpleado.value);
    formData.append("nombre", editNombreEmpleado.value);
    formData.append("fecha", editFechaIngreso.value);
    formData.append("vacaciones", editVacacionesEmpleado.value);
    formData.append("puesto", editPuestoEmpleado.value);
    formData.append("estado", editEstadoEmpleado.value);

    const archivo = document.getElementById("editArchivoEmpleado").files[0];
    if (archivo) {
        formData.append("archivo", archivo);
    }

    const res = await fetch("../backend/Empleados.php?accion=editar", {
        method: "POST",
        body: formData
    });
    const result = await res.json();

    if (result.success) {
        bootstrap.Modal.getInstance(modalEditarEmpleado).hide();
        alert("Empleado editado con éxito");
        cargarEmpleados();
    } else {
        alert("Error al editar");
    }
});


async function inactivarEmpleado(id) {
    try {
        const formData = new FormData();
        formData.append("id", id);
        formData.append("estado", "Inactivo"); 

        const res = await fetch("../backend/Empleados.php?accion=cambiarEstado", {
            method: "POST",
            body: formData
        });

        const data = await res.json();
        if (data.success) {
            cargarEmpleados();
        } else {
            alert("Error al inactivar empleado");
        }
    } catch (error) {
        console.error("Error al cambiar estado:", error);
    }
}


/*
   const asignarRol = i => {
       indiceRolEmpleado.value = i;
       rolEmpleado.value = empleados[i].rol;
       new bootstrap.Modal(modalAsignarRol).show();
   };
 
   const guardarRol = () => {
       empleados[+indiceRolEmpleado.value].rol = rolEmpleado.value;
       bootstrap.Modal.getInstance(modalAsignarRol).hide();
       renderTablaEmpleados();
       mensaje2.classList.remove("d-none");
       setTimeout(() => mensaje2.classList.add("d-none"), 3000);
   };
 
   */

async function verPerfil(id) {
    // Buscar el empleado en la lista global
    const empleado = empleadosGlobal.find(e => e.id_empleado == id);

    if (!empleado) {
        alert("Empleado no encontrado");
        return;
    }

    // Insertar los detalles en el modal
    const modalBody = document.getElementById("detalleContenido");
    modalBody.innerHTML = `
        <h4>${empleado.nombre_completo}</h4>
        <p><strong>Puesto:</strong> ${empleado.puesto}</p>
        <p><strong>Fecha de ingreso:</strong> ${formatoFecha(empleado.fecha_ingreso)}</p>
        <p><strong>Días de vacaciones:</strong> ${empleado.dias_vacaciones ?? 'No registrado'}</p>
        ${empleado.archivo
            ? `<p><strong>Archivo:</strong> <a href="../${empleado.archivo}" target="_blank">Ver Curriculum</a></p>`
            : `<p><strong>Archivo:</strong> No adjunto</p>`}
    `;

    // Mostrar el modal
    new bootstrap.Modal(document.getElementById("modalDetallesEmpleado")).show();
}


function formatoFecha(fecha) {
    if (!fecha) return "";
    const [anio, mes, dia] = fecha.split("-");
    return `${dia}/${mes}/${anio}`;
}