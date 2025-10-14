 const buscar = document.getElementById("buscarEmpleado");
        const tabla = document.getElementById("tablaEmpleados");
        const modalEditarEmpleado = document.getElementById('modalEditarEmpleado');

        async function cargarEmpleados() {
            const res = await fetch("../backend/Empleados.php?accion=listar");
            const data = await res.json();

            tabla.innerHTML = "";
            data.forEach(emp => {
                const estadoTexto = emp.estado == "1" ? "Activo" : "Inactivo";
                const archivoLink = emp.archivo
                    ? `<a href="../${emp.archivo}" target="_blank">Ver archivo</a>`
                    : 'Sin archivo';
               tabla.innerHTML += `
<tr>
    <td>${emp.nombre_completo}</td>
    <td>${formatoFecha(emp.fecha_ingreso)}</td>
    <td>${emp.puesto}</td>
    <td>${emp.dias_vacaciones}</td>
    <td>${archivoLink}</td>
    <td>
        <span class="badge ${emp.estado == "1" ? "bg-success" : "bg-secondary"}">
            ${estadoTexto}
        </span>
    </td>
    <td>
        <div class="dropdown">
          <button class="btn btn-sm btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                Acciones
            </button>
            <ul class="dropdown-menu">
                <li>
                    <a class="dropdown-item" href="#" onclick="abrirEditar(${emp.id_empleado})">
                       <i class="fa-solid fa-pen-to-square me-2"></i>Editar
                    </a>
                </li>
                <li>
                    <a class="dropdown-item text-danger" href="#"onclick="inactivarEmpleado(${emp.id_empleado})">
                         <i class="fa-solid fa-user-slash me-2"></i>Inactivar
                    </a>
                </li>
            </ul>
        </div>
    </td>
</tr>`;
            });
        }

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
        formData.append("estado", 0); // Forzar a inactivo

        const res = await fetch("../backend/Empleados.php?accion=cambiarEstado", {
            method: "POST",
            body: formData
        });

        const data = await res.json();
        if (data.success) {
            cargarEmpleados(); // Recargar tabla
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
   


        function formatoFecha(fecha) {
            if (!fecha) return "";
            const [anio, mes, dia] = fecha.split("-");
            return `${dia}/${mes}/${anio}`;
        }