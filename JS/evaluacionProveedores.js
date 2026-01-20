document.addEventListener('DOMContentLoaded', function () {
    let evaluaciones = [];           // Arreglo para almacenar las evaluaciones de un proveedor
    let idProveedorActual = null;    // Guardar el proveedor seleccionado
    const API_EVA_URL = '../backend/evaluacionProveedores.php';

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


    //Función para cargar las evaluaciones de un proveedor
    async function loadEvaluaciones() {
        if (!idProveedorActual) return; // Si no hay un proveedor seleccionado, no hace nada
        try {
            const response = await fetch(`${API_EVA_URL}?id_proveedor=${idProveedorActual}`, {
                method: 'GET',
                credentials: 'include',
            });
            if (response.ok) {
                evaluaciones = await response.json(); // Obtiene las evaluaciones
                numerarEvaluaciones();     // Asigna un número fijo a cada evaluación con la función numerarEvaluaciones
                const deHoy = evaluaciones.filter(esEvaluacionDeHoy); // Filtra las evaluaciones de hoy
                // Si hay evaluaciones de hoy, las muestra
                if (deHoy.length > 0) {
                    renderEvaluaciones(deHoy);
                } else {
                    const cont = document.getElementById('evaluacionesContenido');
                    cont.innerHTML = '<p>No hay evaluaciones recientes de hoy.</p>';
                }
            } else {
                console.error("Error al cargar las evaluaciones");
                swError('Error', 'Error al cargar las evaluaciones');
            }
        } catch (err) {
            console.error(err);
            swError('Error', 'Ocurrió un error al cargar las evaluaciones');
        }
    }




    // Función para renderizar el modal de historial
    function renderEvaluacionesHistorial(lista) {
        const cont = document.getElementById('historialContenido');
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




    // Listener para abrir el modal de historial
    document.addEventListener('click', (ev) => {
        const btn = ev.target.closest('#btnVerHistorialEvaluaciones');
        if (!btn) return; // Si no se hizo clic en el botón, no hace nada

        // Renderiza todas las evaluaciones
        renderEvaluacionesHistorial(evaluaciones);

        // Abre el modal de historial
        bootstrap.Modal.getOrCreateInstance(document.getElementById('modalHistorialEvaluaciones')).show();
    });




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
        renderEvaluacionesHistorial(listaFiltrada);
    }




    // Agrega los eventos de los filtros de la tabla de evaluaciones
    const filtroProm = document.getElementById('filtroCalificacion');
    if (filtroProm) filtroProm.addEventListener('input', filtroBusquedaEvaluaciones);

    const filtroFecha = document.getElementById('filtroFechaEva');
    if (filtroFecha) filtroFecha.addEventListener('input', filtroBusquedaEvaluaciones);




    //Listener para buscar evaluaciones
    const btnBuscarEvaluaciones = document.getElementById('btnBuscarEvaluaciones');
    if (btnBuscarEvaluaciones) {
        btnBuscarEvaluaciones.addEventListener('click', filtroBusquedaEvaluaciones);
    }




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

        //Verifica si se escribió algo en la observación
        const verificaObservacion = document.getElementById('evaObservacion');
        if (!observacion) {
            verificaObservacion.setCustomValidity('La observación es obligatoria.'); // Mensaje del navegador
            verificaObservacion.reportValidity(); // Despliega el aviso
            verificaObservacion.focus(); // Lleva el foco al campo
            return; // No continúa si está vacío
        }


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

            swOk('Listo', 'Evaluación agregada correctamente.');
        } else {
            console.error('Error al agregar evaluación');
            swError('Error', 'Error al agregar evaluación');
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




    // Reporte de evaluaciones para exportar a PDF (formato dashboard)
    window.exportarEvaluacionesPDF = function () {
        // Crea el PDF en horizontal como en el dashboard
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'landscape' });

        // Márgenes y posición inicial
        const MARGIN_L = 14;
        const MARGIN_R = 14;
        const MARGIN_T = 10;
        const PAGE_W = doc.internal.pageSize.getWidth();
        const PAGE_H = doc.internal.pageSize.getHeight();

        let y = MARGIN_T + 5;

        // ---- Encabezado con logo, empresa y título ----
        const logo = new Image();
        logo.src = '../IMG/logo.png';
        doc.addImage(logo, 'PNG', MARGIN_L, MARGIN_T, 15, 15);

        doc.setFontSize(14);
        doc.text('Abrasivos Industriales S.A.', MARGIN_L + 18, MARGIN_T + 8);

        doc.setFontSize(11);
        doc.text('Reporte de Evaluaciones de Proveedores', MARGIN_L + 18, MARGIN_T + 16);

        // Fecha y hora (alineado a la derecha)
        doc.setFontSize(9);
        doc.text(`Generado: ${new Date().toLocaleString('es-CR')}`, PAGE_W - MARGIN_R, MARGIN_T + 8, { align: 'right' });

        // Si hay un proveedor seleccionado, lo indica debajo del título
        if (typeof idProveedorActual !== 'undefined' && idProveedorActual) {
            doc.setFontSize(10);
            doc.text(`Proveedor: ${idProveedorActual}`, MARGIN_L, MARGIN_T + 26);
        }

        y = MARGIN_T + 30; // baja un poco para empezar la tabla

        // ---- Datos a exportar (usa tu arreglo "evaluaciones") ----
        const lista = evaluaciones || [];

        if (!lista.length) {
            doc.setFontSize(11);
            doc.text('No hay evaluaciones para exportar.', MARGIN_L, y);
            ponerPieDePagina(doc);
            doc.save('evaluaciones.pdf');
            return;
        }

        // ---- Definición de columnas (ancho similar al dashboard) ----
        // El ancho total usable ~ PAGE_W - (MARGIN_L + MARGIN_R) ≈ 269mm
        const cols = [
            { key: 'numero', title: 'Evaluación #', width: 22 },
            { key: 'fecha', title: 'Fecha', width: 28 },
            { key: 'puntualidad', title: 'Puntualidad', width: 28 },
            { key: 'atencion', title: 'Atención', width: 28 },
            { key: 'disponibilidad', title: 'Disponibilidad', width: 33 },
            { key: 'promedio', title: 'Promedio', width: 25 },
            { key: 'observacion', title: 'Observación', width: 100 }
        ];

        // ---- Dibuja cabeceras ----
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        let x = MARGIN_L;
        cols.forEach(c => {
            doc.text(c.title, x, y);
            x += c.width;
        });
        y += 8;
        doc.setFont('helvetica', 'normal');

        // ---- Filas ----
        doc.setFontSize(10);
        const lineH = 6; // alto de línea por fila

        for (const ev of lista) {
            // Prepara valores
            const fecha = formatearFechaDMY(fechaRaw(ev)); // ya tienes esta función
            const prom = promedio1(ev);                     // ya tienes esta función
            const fila = {
                numero: `#${ev.numero || '-'}`,
                fecha: fecha || '-',
                puntualidad: `${ev.puntualidad ?? '-'}/5`,
                atencion: `${ev.atencion ?? '-'}/5`,
                disponibilidad: `${ev.disponibilidad ?? '-'}/5`,
                promedio: `${prom ?? '-'}/5`,
                observacion: (ev.observacion || '').toString()
            };

            // Calcular alto real de la fila según observación (se hace wrap)
            const obsCol = cols.find(c => c.key === 'observacion');
            const obsLines = doc.splitTextToSize(fila.observacion || '-', obsCol.width - 2);
            const rowHeight = Math.max(lineH, obsLines.length * (lineH - 1)); // un poco más compacto

            // Salto de página si no cabe
            if (y + rowHeight > PAGE_H - 20) {
                doc.addPage();
                y = MARGIN_T + 20;
                // Repetir cabeceras en nueva página
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(10);
                x = MARGIN_L;
                cols.forEach(c => {
                    doc.text(c.title, x, y);
                    x += c.width;
                });
                y += 8;
                doc.setFont('helvetica', 'normal');
            }

            // Imprimir celdas (las simples en una línea)
            x = MARGIN_L;
            cols.forEach(c => {
                if (c.key !== 'observacion') {
                    const val = (fila[c.key] ?? '').toString();
                    doc.text(val || '-', x, y);
                } else {
                    // Observación con wrap
                    let yy = y;
                    for (const line of obsLines) {
                        doc.text(line, x, yy);
                        yy += (lineH - 1);
                    }
                }
                x += c.width;
            });

            y += rowHeight; // siguiente fila
            // línea separadora opcional: doc.line(MARGIN_L, y - 2, PAGE_W - MARGIN_R, y - 2);
        }

        // ---- Pie de página con numeración ----
        ponerPieDePagina(doc);

        // ---- Guardar PDF ----
        doc.save('evaluaciones.pdf');

        // ---- Función: pie de página al estilo dashboard ----
        function ponerPieDePagina(docRef) {
            const total = docRef.internal.getNumberOfPages();
            for (let i = 1; i <= total; i++) {
                docRef.setPage(i);
                docRef.setFontSize(9);
                docRef.text(`Página ${i} de ${total}`, PAGE_W - MARGIN_R, PAGE_H - 10, { align: 'right' });
                docRef.text('Abrasivos Industriales S.A.', MARGIN_L, PAGE_H - 10);
            }
        }
    };




    //Listener para exportar a PDF
    const btnExportarPDF = document.getElementById('btnExportarPDF');
    if (btnExportarPDF) {
        btnExportarPDF.addEventListener('click', exportarEvaluacionesPDF);
    }




    // Reporte de evaluaciones para exportar a Excel
    window.exportarEvaluacionesExcel = function () {
        // Toma la lista que se va a exportar (respeta los filtros activos)
        const lista = evaluaciones;

        // Si no hay datos, avisa y no genera el archivo
        if (!lista.length) {
            swWarn('Sin datos', 'No hay evaluaciones para exportar.');
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
        swOk('Listo', 'Excel generado correctamente.');
    };




    //Listener para exportar a Excel
    const btnExportarExcel = document.getElementById('btnExportarExcel');
    if (btnExportarExcel) {
        btnExportarExcel.addEventListener('click', exportarEvaluacionesExcel);
    }




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



    // Función para saber si la evaluación es de hoy YYYY-MM-DD
    function esEvaluacionDeHoy(e) {
        const hoy = new Date(); // Obtiene la fecha de hoy
        const yyyy = hoy.getFullYear(); // Obtiene el año
        const mm = String(hoy.getMonth() + 1).padStart(2, '0'); // Obtiene el mes
        const dd = String(hoy.getDate()).padStart(2, '0'); // Obtiene el día
        const prefijoHoy = `${yyyy}-${mm}-${dd}`; // Prefijo para comparar la fecha

        return fechaRaw(e).startsWith(prefijoHoy); // Si la fecha de la evaluación empieza con el prefijo de hoy, devuelve true
    }

});
