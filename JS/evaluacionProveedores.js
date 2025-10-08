document.addEventListener('DOMContentLoaded', function () {
    let evaluaciones = [];           // Arreglo para almacenar las evaluaciones de un proveedor
    let idProveedorActual = null;    // Guardar el proveedor seleccionado
    const API_EVA_URL = '../backend/evaluacionProveedores.php';




    //Función para cargar las evaluaciones de un proveedor
    async function loadEvaluaciones() {
        if (!idProveedorActual) return; // Si no hay un proveedor seleccionado, no hace nada
        try {
            const response = await fetch(`${API_EVA_URL}?id_proveedor=${idProveedorActual}`, {
                method: 'GET',
                credentials: 'include',
            });
            if (response.ok) {
                evaluaciones = await response.json();
                numerarEvaluaciones();     // Asigna un número fijo a cada evaluación con la función numerarEvaluaciones
                filtroBusquedaEvaluaciones(); // Aplica el filtro de busqueda por fecha y promedio
            } else {
                console.error("Error al cargar las evaluaciones");
            }
        } catch (err) {
            console.error(err);
        }
    }




    // Función para renderizar las evaluaciones
    function renderEvaluaciones(lista) {
        const cont = document.getElementById('evaluacionesContenido');
        cont.innerHTML = '';

        // Si no hay evaluaciones, muestra un mensaje
        if (!lista || lista.length === 0) {
            cont.innerHTML = '<p>No hay evaluaciones para este proveedor.</p>';
            return;
        }

        // Recorre la lista y agrega tarjetas de evaluación
        lista.forEach(function (eva) {
            const prom = promedio1(eva); // Calcula el promedio con la función promedio1
            const fechaTxt = formatearFechaDMY(fechaRaw(eva)); // Formatea la fecha con la función formatearFechaDMY
            //Tarjeta de evaluación
            cont.innerHTML += `
        <div class="border rounded p-2 mb-2">
          <div class="d-flex justify-content-between align-items-center">
            <strong>Evaluación #${eva.numero}</strong>
            <small class="text-muted">Fecha: ${fechaTxt}</small>
          </div>

          <ul class="mb-1">
            <li>Puntualidad: ${eva.puntualidad}/5</li>
            <li>Atención: ${eva.atencion}/5</li>
            <li>Disponibilidad: ${eva.disponibilidad}/5</li>
          </ul>

          <p class="mb-1"><strong>Promedio:</strong> ${prom}/5</p>
          <p class="mb-0"><strong>Observación:</strong> ${eva.observacion ?? ''}</p>
        </div>
      `;
        });
    }




    function filtroBusquedaEvaluaciones() {
        // Inputs de los filtros
        const inputPromedio = document.getElementById('filtroCalificacion');
        const inputFecha = document.getElementById('filtroFechaEva');


        //Verificaciones del promedio

        // Valor de promedio buscado (texto del input)
        const textoPromedio = (inputPromedio?.value || '').trim(); // Valor con trim() para quitar espacios en blanco
        const hayTextoPromedio = textoPromedio !== ''; // Si el usuario escribió algo en el input

        // Valida si el texto es numérico entero o decimal
        const patronNumero = /^[0-9]+(\.[0-9]+)?$/;
        const esNumeroValido = patronNumero.test(textoPromedio);

        // Verifica si es numero, si no queda lo pone como NaN
        const promedioBuscado = esNumeroValido ? parseFloat(textoPromedio) : NaN;

        // Verifica si es entero o si se agregó un punto (decimal)
        const esPromedioEntero = esNumeroValido && !textoPromedio.includes('.');


        //Verificaciones de la fecha

        // Valor de la fecha buscada (YYYY-MM-DD)
        const fechaBuscada = (inputFecha?.value || '').trim(); // Valor con trim() para quitar espacios en blanco
        const hayFecha = !!fechaBuscada; // Si el usuario escribió algo en el input


        // Aplica filtros sobre el arreglo general de evaluaciones
        const listaFiltrada = evaluaciones.filter((eva) => {

            // Promedio de cada evaluación
            // Promedio = (Puntualidad + Atención + Disponibilidad) / 3
            const promedio = (Number(eva.puntualidad) + Number(eva.atencion) + Number(eva.disponibilidad)) / 3;
            // Promedio redondeado a 1 decimal
            const promedio1Dec = Math.round(promedio * 10) / 10;


            // Filtro por promedio
            let coincidePromedio = true;
            // Si escribió algo en el input y es numérico
            if (hayTextoPromedio && esNumeroValido) {

                coincidePromedio = esPromedioEntero // Si es entero
                    ? (Math.floor(promedio) === promedioBuscado) // Verifica si el promedio de la evaluación es igual al promedio buscado
                    : (promedio1Dec === Math.round(promedioBuscado * 10) / 10); // Si no es entero, verifica si el promedio de la evaluación es igual al promedio buscado

                // Si escribió algo en el input y no es numérico
            } else if (hayTextoPromedio && !esNumeroValido) {
                coincidePromedio = false;
            }

            // Filtro por fecha
            let coincideFecha = true;
            // Si escribió algo en el input
            if (hayFecha) {
                // Verifica si la fecha de la evaluación coincide con la fecha buscada, fechaRaw devuelve la fecha en formato DD-MM-YYYY
                coincideFecha = fechaRaw(eva).startsWith(fechaBuscada); //
            }

            // Devuelve true si coincide con ambos filtros
            return coincidePromedio && coincideFecha;
        });

        // Muestra las evaluaciones filtradas
        renderEvaluaciones(listaFiltrada);
    }




    // Agrega los eventos de los filtros de la tabla de evaluaciones
    const filtroProm = document.getElementById('filtroCalificacion');
    if (filtroProm) filtroProm.addEventListener('input', filtroBusquedaEvaluaciones);

    const filtroFecha = document.getElementById('filtroFechaEva');
    if (filtroFecha) filtroFecha.addEventListener('input', filtroBusquedaEvaluaciones);





    // Maneja el evento de clic en cualquier parte de la tabla de proveedores
    document.getElementById('tablaProveedores').addEventListener('click', (e) => {
        // Busca si el clic ocurrio sobre un botón con la clase "ver-evaluaciones"
        const btn = e.target.closest('.ver-evaluaciones');
        if (!btn) return; // Si no se hizo clic en un botón, sale

        // Toma el id_proveedor del botón
        idProveedorActual = parseInt(btn.dataset.id, 10);
        // Asigna el id_proveedor a la variable indiceEvaluacionActual
        document.getElementById('indiceEvaluacionActual').value = idProveedorActual;

        // Limpia los filtros
        if (filtroProm) filtroProm.value = '';
        if (filtroFecha) filtroFecha.value = '';
        ['evaPuntualidad', 'evaAtencion', 'evaDisponibilidad'].forEach(id => {
            const el = document.getElementById(id); // Busca el input con el id correspondiente
            if (el) el.value = '3';
        });

        // Resetea el valor que está a la par de los sliders a 3
        const lblP = document.getElementById('lblPuntualidad');
        const lblA = document.getElementById('lblAtencion');
        const lblD = document.getElementById('lblDisponibilidad');
        if (lblP) lblP.textContent = '3';
        if (lblA) lblA.textContent = '3';
        if (lblD) lblD.textContent = '3';
        const obs = document.getElementById('evaObservacion');
        if (obs) obs.value = '';

        // Carga las evaluaciones
        loadEvaluaciones();
        // Muestra el modal de evaluaciones
        bootstrap.Modal.getOrCreateInstance(document.getElementById('modalEvaluaciones')).show();
    });




    // Función para agregar una evaluación
    async function agregarEvaluacion() {
        const puntualidad = parseInt(document.getElementById('evaPuntualidad').value, 10);
        const atencion = parseInt(document.getElementById('evaAtencion').value, 10);
        const disponibilidad = parseInt(document.getElementById('evaDisponibilidad').value, 10);
        const observacion = (document.getElementById('evaObservacion').value || '').trim();


        // Realiza la petición POST
        const res = await fetch(API_EVA_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                id_proveedor: idProveedorActual,
                puntualidad,
                atencion,
                disponibilidad,
                observacion
            })
        });

        // Si la petición fue exitosa
        if (res.ok) {
            // Recarga y aplica los filtros de evaluaciones
            await loadEvaluaciones();
            filtroBusquedaEvaluaciones();

            // Limpia campos
            document.getElementById('evaObservacion').value = '';
            ['evaPuntualidad', 'evaAtencion', 'evaDisponibilidad'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '3';
            });

            // Resetea el valor que está a la par de los sliders a 3
            const lblP = document.getElementById('lblPuntualidad');
            const lblA = document.getElementById('lblAtencion');
            const lblD = document.getElementById('lblDisponibilidad');
            if (lblP) lblP.textContent = '3';
            if (lblA) lblA.textContent = '3';
            if (lblD) lblD.textContent = '3';
        } else {
            console.error('Error al agregar evaluación');
        }
    }




    // Llama a la función de agregar evaluación al hacer clic en el botón
    const btnGuardarEvaluacion = document.getElementById('btnGuardarEvaluacion');
    if (btnGuardarEvaluacion) {
        btnGuardarEvaluacion.addEventListener('click', agregarEvaluacion);
    }





    // Maneja los cambios en los inputs de puntualidad, atencion y disponibilidad
    ['evaPuntualidad', 'evaAtencion', 'evaDisponibilidad'].forEach(id => {
        const el = document.getElementById(id); // Busca el input con el id correspondiente
        if (!el) return; // Si no lo encuentra, sale
        // Agrega un event listener al input para actualizar el label
        el.addEventListener('input', () => {
            const map = {
                evaPuntualidad: 'lblPuntualidad',
                evaAtencion: 'lblAtencion',
                evaDisponibilidad: 'lblDisponibilidad'
            };
            const lbl = document.getElementById(map[id]); // Busca el label con el id correspondiente
            if (lbl) lbl.textContent = String(el.value || '3'); // Actualiza el texto del label con el valor del input
        });
    });




    // Función para obtener la lista de evaluaciones para exportar, puede ser toda o la filtrada
    function listaParaExportar() {
        //Inputs de los filtros de evaluaciones de promedio y fecha
        const inputPromedio = document.getElementById('filtroCalificacion');
        const inputFecha = document.getElementById('filtroFechaEva');

        // Datos para sacar el promedio
        const textoPromedio = (inputPromedio?.value || '').trim();
        const hayTextoPromedio = textoPromedio !== '';
        const esNumero = /^[0-9]+(\.[0-9]+)?$/.test(textoPromedio);
        const numeroPromedio = esNumero ? parseFloat(textoPromedio) : NaN;
        const esEntero = esNumero && !textoPromedio.includes('.');

        // Datos para sacar la fecha
        const fechaBuscada = (inputFecha?.value || '').trim();
        const hayFecha = !!fechaBuscada;

        // Filtro de evaluaciones por promedio y fecha
        return evaluaciones.filter(eva => {
            // Calcula el promedio de puntualidad, atencion y disponibilidad
            const promedio = (Number(eva.puntualidad) + Number(eva.atencion) + Number(eva.disponibilidad)) / 3;
            const promedio1Dec = Math.round(promedio * 10) / 10;

            // variable para saber si coincide el promedio
            let coincidePromedio = true;

            //verifica si hay texto y si es numérico
            if (hayTextoPromedio && esNumero) {
                // Verifica si el promedio es entero
                if (esEntero) {
                    coincidePromedio = Math.floor(promedio) === numeroPromedio;
                    // Verifica si el promedio es decimal
                } else {
                    const buscado1Dec = Math.round(numeroPromedio * 10) / 10;
                    coincidePromedio = promedio1Dec === buscado1Dec;
                }
                // Verifica si el usuario escribió algo en el input
            } else if (hayTextoPromedio && !esNumero) {
                coincidePromedio = false; // si escriben texto no numérico, no coincide
            }

            // variable para saber si coincide la fecha
            let coincideFecha = true;
            // Verifica si el usuario escribió algo en el input
            if (hayFecha) coincideFecha = fechaRaw(eva).startsWith(fechaBuscada);
            // Retorna true si coincide el promedio y la fecha
            return coincidePromedio && coincideFecha;
        });
    }




    // Reporte de evaluaciones para exportar a PDF (simple)
    window.exportarEvaluacionesPDF = function () {
        // Obtiene la clase jsPDF de la librería cargada en el HTML
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF(); // Crea el documento PDF
        let y = 15;// Posición vertical

        // Título y proveedor
        doc.setFontSize(14);
        doc.text('Evaluaciones de Proveedor', 14, y);
        y += 6; // Espacio despues del título

        // Si hay un proveedor seleccionado, lo muestra (usa el idProveedorActual)
        if (typeof idProveedorActual !== 'undefined' && idProveedorActual) {
            doc.setFontSize(11);
            doc.text(`Proveedor: ${idProveedorActual}`, 14, y);
            y += 8;// Espacio después del proveedor
        } else {
            y += 4;// Pequeño espacio si no hay proveedor
        }

        // Toma la lista que se va a exportar (respeta los filtros activos)
        const lista = listaParaExportar();

        // Si no hay datos, avisa en el PDF y lo guarda
        if (!lista.length) {
            doc.setFontSize(11);
            doc.text('No hay evaluaciones para exportar.', 14, y);
            doc.save('evaluaciones.pdf');
            return;
        }

        // Recorre cada evaluación y la escribe en el PDF
        doc.setFontSize(11);
        lista.forEach(ev => {
            const fecha = formatearFechaDMY(fechaRaw(ev)); // Formatea la fecha a DD/MM/AAAA
            const prom = promedio1(ev);                   // Calcula el promedio con 1 decimal

            // Encabezado de cada evaluación con número y fecha
            doc.text(`Evaluación #${ev.numero} — Fecha: ${fecha}`, 14, y); y += 6;

            // Detalle de calificaciones
            doc.text(`Puntualidad: ${ev.puntualidad}/5`, 14, y); y += 6;
            doc.text(`Atención: ${ev.atencion}/5`, 14, y); y += 6;
            doc.text(`Disponibilidad: ${ev.disponibilidad}/5`, 14, y); y += 6;

            // Promedio
            doc.text(`Promedio: ${prom}/5`, 14, y); y += 6;

            // Observación
            if (ev.observacion) {
                doc.text(`Observación: ${ev.observacion}`, 14, y);
                y += 6;
            }

            y += 4; // Espacio entre evaluaciones

            // Salto de página simple si se acerca al final de la hoja
            if (y > 280) {
                doc.addPage(); // Nueva página
                y = 15;        // Reinicia posición vertical
            }
        });

        // Guarda el archivo PDF con un nombre fijo
        doc.save('evaluaciones.pdf');
    };




    // Reporte de evaluaciones para exportar a Excel
    window.exportarEvaluacionesExcel = function () {
        // Toma la lista que se va a exportar (respeta los filtros activos)
        const lista = listaParaExportar();

        // Si no hay datos, avisa y no genera el archivo
        if (!lista.length) {
            alert('No hay evaluaciones para exportar.');
            return;
        }

        // Convierte la lista a un arreglo de objetos “planos” para la hoja
        const datos = lista.map(ev => ({
            'Evaluación #': ev.numero,
            'Fecha': formatearFechaDMY(fechaRaw(ev)), // Fecha DD/MM/AAAA
            'Puntualidad': ev.puntualidad,
            'Atención': ev.atencion,
            'Disponibilidad': ev.disponibilidad,
            'Promedio': promedio1(ev),                 // Promedio con 1 decimal
            'Observación': ev.observacion || ''        // Observación
        }));

        // Crea el libro y la hoja de Excel
        const wb = XLSX.utils.book_new();                 // Nuevo libro
        const ws = XLSX.utils.json_to_sheet(datos);       // Hoja a partir del JSON

        // Agrega la hoja al libro con el nombre “Evaluaciones”
        XLSX.utils.book_append_sheet(wb, ws, 'Evaluaciones');

        // Descarga el archivo Excel con un nombre fijo
        XLSX.writeFile(wb, 'evaluaciones.xlsx');
    };




    // Limpieza al cerrar el modal de evaluaciones
    document.getElementById('modalEvaluaciones').addEventListener('hidden.bs.modal', () => {
        evaluaciones = []; // Limpia las evaluaciones
        idProveedorActual = null; // Limpia el ID del proveedor
        const cont = document.getElementById('evaluacionesContenido'); // Obtiene el contenedor de evaluaciones
        if (cont) cont.innerHTML = ''; // Limpia el contenido del contenedor
        if (filtroProm) filtroProm.value = ''; // Limpia el filtro de promedio
        if (filtroFecha) filtroFecha.value = ''; // Limpia el filtro de fecha
    });




    // Funciones que me sirven para los filtros, render y exportar

    // Función para obtener el promedio de una evaluación
    function promedio1(e) {
        const p = (Number(e.puntualidad) + Number(e.atencion) + Number(e.disponibilidad)) / 3;
        return Math.round(p * 10) / 10;
    }




    // Función para obtener la fecha de una evaluación en formato
    function fechaRaw(e) {
        return (e.fecha_evaluacion || e.fecha || e.created_at || e.fecha_creacion || '').toString();
    }




    // Función para formatear la fecha en DD/MM/YYYY
    function formatearFechaDMY(str) {
        if (!str) return '—'; // Si no hay fecha, devuelve '—'
        const toParse = str.includes('T') || str.includes('Z') ? str : str.replace(' ', 'T'); // Si la fecha incluye 'T' o 'Z', la deja tal cual
        const d = new Date(toParse); // Intenta parsear la fecha
        if (isNaN(d)) return str; // Si falla, devuelve la fecha original
        const dd = String(d.getDate()).padStart(2, '0'); // Agrega ceros si es necesario para que tenga 2 dígitos
        const mm = String(d.getMonth() + 1).padStart(2, '0'); // Agrega ceros si es necesario para que tenga 2 dígitos
        const yyyy = d.getFullYear(); // Obtiene el año
        return `${dd}/${mm}/${yyyy}`; // Devuelve la fecha formateada
    }




    // Función para numerar las evaluaciones
    function numerarEvaluaciones() {
        // Se asigna número fijo según orden actual
        evaluaciones.forEach((e, i) => { e.numero = i + 1; });
    }
});
