
// ==========================================
// 1. VARIABLES Y ELEMENTOS DEL HTML
// ==========================================

let movimientos = [];
let movimientoEnEdicionId = null;

const formulario = document.getElementById("formulario-gasto");
const tituloFormularioMovimiento = document.getElementById("titulo-formulario-movimiento");
const botonGuardarMovimiento = document.getElementById("boton-guardar-movimiento");
const botonCancelarEdicion = document.getElementById("boton-cancelar-edicion");

const descripcionInput = document.getElementById("descripcion");
const montoInput = document.getElementById("monto");
const tipoInput = document.getElementById("tipo");
const categoriaInput = document.getElementById("categoria");
const fechaInput = document.getElementById("fecha");
const mesEstadisticas = document.getElementById("mes-estadisticas");
const balanceElement = document.getElementById("balance");
const ingresosElement = document.getElementById("ingresos");
const gastosElement = document.getElementById("gastos");

const listaMovimientos = document.getElementById("lista-movimientos");

const filtroMes = document.getElementById("filtro-mes");
const filtroTipo = document.getElementById("filtro-tipo");
const filtroCategoria = document.getElementById("filtro-categoria");
const ordenMovimientos = document.getElementById("orden-movimientos");
const mesResumen = document.getElementById("mes-resumen");
const botonInformeMensual = document.getElementById("boton-informe-mensual");
// ==========================================
// NAVEGACIÓN ENTRE SECCIONES
// ==========================================

const botonesMenu = document.querySelectorAll(".enlace-menu");
const vistas = document.querySelectorAll(".vista");
const tituloVista = document.getElementById("titulo-vista");
let presupuestos = [];

const mesPresupuesto = document.getElementById("mes-presupuesto");
const formularioPresupuesto = document.getElementById("formulario-presupuesto");
const categoriaPresupuesto = document.getElementById("categoria-presupuesto");
const montoPresupuesto = document.getElementById("monto-presupuesto");

const presupuestoTotalElement = document.getElementById("presupuesto-total");
const presupuestoGastadoElement = document.getElementById("presupuesto-gastado");
const presupuestoDisponibleElement = document.getElementById("presupuesto-disponible");

const contenedorPresupuestos = document.getElementById("contenedor-presupuestos");
let graficoCategorias = null;
let graficoMensual = null;
botonesMenu.forEach(function(boton) {

    boton.addEventListener("click", function() {

        // Identificamos la vista que queremos abrir
        const nombreVista = boton.dataset.vista;

        // Ocultamos todas las vistas
        vistas.forEach(function(vista) {
            vista.classList.remove("activa");
        });

        // Quitamos el estado activo de todos los botones
        botonesMenu.forEach(function(elemento) {
            elemento.classList.remove("activo");
        });

        // Mostramos la vista seleccionada
        const vistaSeleccionada = document.getElementById(
            "vista-" + nombreVista
        );

        vistaSeleccionada.classList.add("activa");

        // Marcamos el botón seleccionado
        boton.classList.add("activo");

        // Actualizamos el título
        tituloVista.textContent = boton.textContent.trim();
        if (nombreVista === "estadisticas") {
        actualizarGraficos();
}

    });

});


// ==========================================
// 2. FUNCIONES AUXILIARES
// ==========================================

function guardarMovimientos() {
    localStorage.setItem("movimientos", JSON.stringify(movimientos));
}

function obtenerFechaHoy() {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, "0");
    const dia = String(hoy.getDate()).padStart(2, "0");

    return `${anio}-${mes}-${dia}`;
}

function formatearDinero(cantidad) {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 2
    }).format(cantidad);
}

function convertirMonto(valor) {
    valor = valor.trim().replace(/\s/g, "");

    const formatoValido = /^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d+)?$/;

    if (!formatoValido.test(valor)) {
        return NaN;
    }

    return Number(valor.replace(/\./g, "").replace(",", "."));
}

function guardarPresupuestos() {
    localStorage.setItem("presupuestos", JSON.stringify(presupuestos));
}


function cargarPresupuestos() {

    const datosGuardados = localStorage.getItem("presupuestos");

    if (datosGuardados !== null) {
        presupuestos = JSON.parse(datosGuardados);
    }

    actualizarPresupuestos();
}

// ==========================================
// CREAR Y ELIMINAR PRESUPUESTOS
// ==========================================

formularioPresupuesto.addEventListener("submit", function(event) {

    event.preventDefault();

    const categoria = categoriaPresupuesto.value;
    const monto = convertirMonto(montoPresupuesto.value);
    const mes = mesPresupuesto.value;

    if (
        categoria === "" ||
        !Number.isFinite(monto) ||
        monto <= 0 ||
        mes === ""
    ) {
        alert("Ingresá una categoría, un monto y un mes válidos.");
        return;
    }

    // Buscamos si ya existe un presupuesto para esa categoría y mes
    const presupuestoExistente = presupuestos.find(function(presupuesto) {
        return presupuesto.categoria === categoria &&
               presupuesto.mes === mes;
    });

    if (presupuestoExistente) {

        // Actualizamos el presupuesto existente
        presupuestoExistente.monto = monto;

    } else {

        // Creamos uno nuevo
        const nuevoPresupuesto = {
            id: Date.now(),
            categoria: categoria,
            monto: monto,
            mes: mes
        };

        presupuestos.push(nuevoPresupuesto);
    }

    guardarPresupuestos();
    actualizarPresupuestos();

    formularioPresupuesto.reset();

});


function eliminarPresupuesto(id) {

    presupuestos = presupuestos.filter(function(presupuesto) {
        return presupuesto.id !== id;
    });

    guardarPresupuestos();
    actualizarPresupuestos();

}

// ==========================================
// CALCULAR GASTOS DE UN PRESUPUESTO
// ==========================================

function calcularGastoCategoria(categoria, mes) {

    let total = 0;

    movimientos.forEach(function(movimiento) {

        if (
            movimiento.tipo === "gasto" &&
            movimiento.categoria === categoria &&
            movimiento.fecha &&
            movimiento.fecha.startsWith(mes)
        ) {
            total += movimiento.monto;
        }

    });

    return total;

}

// ==========================================
// ACTUALIZAR PANTALLA DE PRESUPUESTOS
// ==========================================

function actualizarPresupuestos() {

    const mes = mesPresupuesto.value;

    // Obtenemos los presupuestos del mes seleccionado
    const presupuestosDelMes = presupuestos.filter(function(presupuesto) {
        return presupuesto.mes === mes;
    });

    let totalPresupuestado = 0;
    let totalGastado = 0;

    contenedorPresupuestos.innerHTML = "";

    const nombresCategorias = {
        alimentacion: "Alimentación",
        transporte: "Transporte",
        vivienda: "Vivienda",
        servicios: "Servicios",
        salud: "Salud",
        entretenimiento: "Entretenimiento",
        trabajo: "Trabajo",
        otros: "Otros"
    };

    if (presupuestosDelMes.length === 0) {

        const mensaje = document.createElement("p");
        mensaje.textContent = "Todavía no tenés presupuestos para este mes.";
        mensaje.style.color = "#64748b";

        contenedorPresupuestos.appendChild(mensaje);

    }

    presupuestosDelMes.forEach(function(presupuesto) {

        const gastado = calcularGastoCategoria(
            presupuesto.categoria,
            presupuesto.mes
        );

        const disponible = presupuesto.monto - gastado;

        const porcentaje = (gastado / presupuesto.monto) * 100;

        totalPresupuestado += presupuesto.monto;
        totalGastado += gastado;

        // Determinamos el estado visual
        let estado = "";

        if (porcentaje >= 100) {
            estado = "excedido";
        } else if (porcentaje >= 80) {
            estado = "alerta";
        }

        const porcentajeVisual = Math.min(porcentaje, 100);

        // Creamos la tarjeta
        const tarjeta = document.createElement("article");
        tarjeta.classList.add("presupuesto-item");

        // Información de categoría y montos
        const informacion = document.createElement("div");
        informacion.classList.add("presupuesto-info");

        const titulo = document.createElement("h3");
        titulo.textContent =
            nombresCategorias[presupuesto.categoria] || "Otros";

        const montos = document.createElement("p");
        montos.textContent =
            formatearDinero(gastado) +
            " de " +
            formatearDinero(presupuesto.monto);

        informacion.appendChild(titulo);
        informacion.appendChild(montos);

        // Barra de progreso
        const barra = document.createElement("div");
        barra.classList.add("barra-progreso");

        const progreso = document.createElement("div");
        progreso.classList.add("barra-progreso-valor");

        if (estado !== "") {
            progreso.classList.add(estado);
        }

        progreso.style.width = porcentajeVisual + "%";

        barra.appendChild(progreso);

        // Detalles
        const detalle = document.createElement("div");
        detalle.classList.add("presupuesto-detalle");

        const textoDisponible = document.createElement("span");

        if (disponible >= 0) {
            textoDisponible.textContent =
                "Disponible: " + formatearDinero(disponible);
        } else {
            textoDisponible.textContent =
                "Excedido por: " + formatearDinero(Math.abs(disponible));
        }

        const textoPorcentaje = document.createElement("span");
        textoPorcentaje.textContent =
            porcentaje.toFixed(1) + "% utilizado";

        detalle.appendChild(textoDisponible);
        detalle.appendChild(textoPorcentaje);

        // Botón eliminar
        const botonEliminar = document.createElement("button");
        botonEliminar.classList.add("boton-eliminar-presupuesto");
        botonEliminar.textContent = "Eliminar";

        botonEliminar.addEventListener("click", function() {
            eliminarPresupuesto(presupuesto.id);
        });

        // Armamos la tarjeta
        tarjeta.appendChild(informacion);
        tarjeta.appendChild(barra);
        tarjeta.appendChild(detalle);
        tarjeta.appendChild(botonEliminar);

        contenedorPresupuestos.appendChild(tarjeta);

    });

    // Actualizamos las tarjetas generales
    const disponibleTotal = totalPresupuestado - totalGastado;

    presupuestoTotalElement.textContent =
        formatearDinero(totalPresupuestado);

    presupuestoGastadoElement.textContent =
        formatearDinero(totalGastado);

    presupuestoDisponibleElement.textContent =
        formatearDinero(disponibleTotal);

    presupuestoDisponibleElement.style.color =
        disponibleTotal >= 0 ? "#16a34a" : "#dc2626";

}



// ==========================================
// 3. REGISTRAR UN MOVIMIENTO
// ==========================================

formulario.addEventListener("submit", function(event) {

    event.preventDefault();

    const descripcion = descripcionInput.value.trim();

    const descripcionFormateada =
        descripcion.charAt(0).toUpperCase() + descripcion.slice(1);

    const monto = convertirMonto(montoInput.value);
    const tipo = tipoInput.value;
    const categoria = categoriaInput.value;
    const fecha = fechaInput.value;

    if (
        descripcion === "" ||
        !Number.isFinite(monto) ||
        monto <= 0 ||
        fecha === ""
    ) {
        alert("Ingresá una descripción, un monto y una fecha válidos.");
        return;
    }

    if (movimientoEnEdicionId !== null) {
        movimientos = movimientos.map(function(movimiento) {
            if (movimiento.id === movimientoEnEdicionId) {
                return {
                    ...movimiento,
                    descripcion: descripcionFormateada,
                    monto: monto,
                    tipo: tipo,
                    categoria: categoria,
                    fecha: fecha
                };
            }
            return movimiento;
        });
    } else {
        const movimiento = {
            id: Date.now(),
            descripcion: descripcionFormateada,
            monto: monto,
            tipo: tipo,
            categoria: categoria,
            fecha: fecha
        };
        movimientos.push(movimiento);
    }

    guardarMovimientos();
    actualizarResumen();
    cargarMeses();
    mostrarMovimientos();
    actualizarGraficos();
    actualizarPresupuestos();

    cancelarEdicionMovimiento();

});


// ==========================================
// 4. CALCULAR INGRESOS, GASTOS Y BALANCE
// ==========================================


function actualizarResumen() {

    let totalIngresos = 0;
    let totalGastos = 0;

    const mesSeleccionado = mesResumen.value;

    // Recorremos todos los movimientos
    movimientos.forEach(function(movimiento) {

        // Comprobamos si pertenece al mes seleccionado
        const perteneceAlMes =
            movimiento.fecha &&
            movimiento.fecha.startsWith(mesSeleccionado);

        if (!perteneceAlMes) {
            return;
        }

        // Sumamos según el tipo de movimiento
        if (movimiento.tipo === "ingreso") {
            totalIngresos += movimiento.monto;
        } else if (movimiento.tipo === "gasto") {
            totalGastos += movimiento.monto;
        }

    });

    // Calculamos el balance
    const balance = totalIngresos - totalGastos;

    // Actualizamos las tarjetas
    ingresosElement.textContent = formatearDinero(totalIngresos);
    gastosElement.textContent = formatearDinero(totalGastos);
    balanceElement.textContent = formatearDinero(balance);

 }

// ==========================================
// INFORME MENSUAL DESCARGABLE (IMPRIMIR / PDF)
// ==========================================

function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, function(caracter) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[caracter];
    });
}

function generarInformeMensual() {
    const mesSeleccionado = mesResumen.value;

    if (!mesSeleccionado) {
        alert("Seleccioná un mes para generar el informe.");
        return;
    }

    const movimientosDelMes = movimientos.filter(function(movimiento) {
        return movimiento.fecha && movimiento.fecha.startsWith(mesSeleccionado);
    }).sort(function(a, b) {
        return (a.fecha || "").localeCompare(b.fecha || "");
    });

    const totalIngresos = movimientosDelMes.reduce(function(total, movimiento) {
        return movimiento.tipo === "ingreso" ? total + Number(movimiento.monto || 0) : total;
    }, 0);

    const totalGastos = movimientosDelMes.reduce(function(total, movimiento) {
        return movimiento.tipo === "gasto" ? total + Number(movimiento.monto || 0) : total;
    }, 0);

    const balance = totalIngresos - totalGastos;
    const nombresCategorias = {
        alimentacion: "Alimentación",
        transporte: "Transporte",
        vivienda: "Vivienda",
        servicios: "Servicios",
        salud: "Salud",
        entretenimiento: "Entretenimiento",
        trabajo: "Trabajo",
        otros: "Otros"
    };

    const gastosPorCategoria = {};
    movimientosDelMes.forEach(function(movimiento) {
        if (movimiento.tipo === "gasto") {
            const categoria = nombresCategorias[movimiento.categoria] || "Otros";
            gastosPorCategoria[categoria] = (gastosPorCategoria[categoria] || 0) + Number(movimiento.monto || 0);
        }
    });

    const nombreMes = new Intl.DateTimeFormat("es-AR", {
        month: "long",
        year: "numeric"
    }).format(new Date(mesSeleccionado + "-15T12:00:00"));

    const filasMovimientos = movimientosDelMes.length
        ? movimientosDelMes.map(function(movimiento) {
            const partesFecha = (movimiento.fecha || "").split("-");
            const fecha = partesFecha.length === 3 ? `${partesFecha[2]}/${partesFecha[1]}/${partesFecha[0]}` : "Sin fecha";
            const tipo = movimiento.tipo === "ingreso" ? "Ingreso" : "Gasto";
            const categoria = nombresCategorias[movimiento.categoria] || "Otros";
            const signo = movimiento.tipo === "ingreso" ? "+" : "−";
            return `<tr>
                <td>${escaparHTML(fecha)}</td>
                <td>${escaparHTML(movimiento.descripcion)}</td>
                <td>${escaparHTML(categoria)}</td>
                <td>${tipo}</td>
                <td class="numero">${signo}${formatearDinero(Number(movimiento.monto) || 0)}</td>
            </tr>`;
        }).join("")
        : '<tr><td colspan="5" class="vacio">No hay movimientos registrados para este mes.</td></tr>';

    const filasCategorias = Object.entries(gastosPorCategoria)
        .sort(function(a, b) { return b[1] - a[1]; })
        .map(function([categoria, total]) {
            return `<tr><td>${escaparHTML(categoria)}</td><td class="numero">${formatearDinero(total)}</td></tr>`;
        }).join("") || '<tr><td colspan="2" class="vacio">No hay gastos para clasificar.</td></tr>';

    const ventanaInforme = window.open("", "_blank");
    if (!ventanaInforme) {
        alert("El navegador bloqueó la ventana del informe. Permití las ventanas emergentes para Lupus e intentá nuevamente.");
        return;
    }

    ventanaInforme.document.open();
    ventanaInforme.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Informe mensual Lupus - ${escaparHTML(nombreMes)}</title>
<style>
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; color: #172033; margin: 32px auto; padding: 0 24px; max-width: 1000px; }
    header { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; border-bottom: 3px solid #2563eb; padding-bottom: 18px; margin-bottom: 24px; }
    h1 { margin: 0 0 6px; color: #1e40af; font-size: 28px; }
    h2 { font-size: 18px; margin: 28px 0 12px; }
    p { color: #64748b; margin: 4px 0; }
    .marca { font-weight: bold; color: #2563eb; font-size: 20px; }
    .acciones { display: flex; gap: 8px; margin: 0 0 20px; }
    button { border: 0; border-radius: 7px; background: #2563eb; color: white; padding: 10px 16px; cursor: pointer; font-weight: bold; }
    button.secundario { background: #64748b; }
    .tarjetas { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .tarjeta { border: 1px solid #dbe3ef; border-radius: 10px; padding: 16px; }
    .tarjeta span { display: block; color: #64748b; font-size: 13px; margin-bottom: 8px; }
    .tarjeta strong { font-size: 20px; }
    .balance { color: ${balance >= 0 ? '#15803d' : '#dc2626'}; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { padding: 10px 8px; border-bottom: 1px solid #e2e8f0; text-align: left; }
    th { background: #eff6ff; color: #1e40af; }
    .numero { text-align: right; white-space: nowrap; }
    .vacio { text-align: center; color: #64748b; padding: 18px; }
    footer { border-top: 1px solid #e2e8f0; margin-top: 30px; padding-top: 12px; color: #94a3b8; font-size: 11px; }
    @media (max-width: 600px) { body { margin: 16px auto; padding: 0 12px; } .tarjetas { grid-template-columns: 1fr; } header { flex-direction: column; } table { font-size: 11px; } th, td { padding: 7px 4px; } }
    @media print { body { margin: 0; padding: 0; } .acciones { display: none; } .tarjeta, table { break-inside: avoid; } }
</style>
</head>
<body>
<header>
    <div><h1>Informe financiero mensual</h1><p>${escaparHTML(nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1))}</p></div>
    <div class="marca">LUPUS</div>
</header>
<div class="acciones">
    <button onclick="window.print()">Guardar como PDF / Imprimir</button>
    <button class="secundario" onclick="window.close()">Cerrar</button>
</div>
<section class="tarjetas">
    <div class="tarjeta"><span>Ingresos del mes</span><strong>${formatearDinero(totalIngresos)}</strong></div>
    <div class="tarjeta"><span>Gastos del mes</span><strong>${formatearDinero(totalGastos)}</strong></div>
    <div class="tarjeta"><span>Balance mensual</span><strong class="balance">${formatearDinero(balance)}</strong></div>
</section>
<h2>Gastos por categoría</h2>
<table><thead><tr><th>Categoría</th><th class="numero">Total gastado</th></tr></thead><tbody>${filasCategorias}</tbody></table>
<h2>Detalle de movimientos (${movimientosDelMes.length})</h2>
<table><thead><tr><th>Fecha</th><th>Descripción</th><th>Categoría</th><th>Tipo</th><th class="numero">Importe</th></tr></thead><tbody>${filasMovimientos}</tbody></table>
<footer>Generado con Lupus · Los datos corresponden a los movimientos guardados en este dispositivo.</footer>
</body>
</html>`);
    ventanaInforme.document.close();
}

botonInformeMensual.addEventListener("click", generarInformeMensual);

// ==========================================
// ESTADÍSTICAS Y GRÁFICOS
// ==========================================

function obtenerGastosPorCategoria() {

    const mesSeleccionado = mesResumen.value;
    const totales = {};

    movimientos.forEach(function(movimiento) {

        if (
            movimiento.tipo === "gasto" &&
            movimiento.fecha &&
            movimiento.fecha.startsWith(mesSeleccionado)
        ) {

            const categoria = movimiento.categoria;

            if (!totales[categoria]) {
                totales[categoria] = 0;
            }

            totales[categoria] += movimiento.monto;
        }

    });

    return totales;
}


function actualizarGraficoCategorias() {

    const nombresCategorias = {
        alimentacion: "Alimentación",
        transporte: "Transporte",
        vivienda: "Vivienda",
        servicios: "Servicios",
        salud: "Salud",
        entretenimiento: "Entretenimiento",
        trabajo: "Trabajo",
        otros: "Otros"
    };

    const datos = obtenerGastosPorCategoria();

    const etiquetas = Object.keys(datos).map(function(categoria) {
        return nombresCategorias[categoria] || "Otros";
    });

    const valores = Object.values(datos);

    // Si todavía no hay gastos, mostramos un estado vacío
    if (valores.length === 0) {
        etiquetas.push("Sin gastos");
        valores.push(1);
    }

    if (graficoCategorias === null) {

        const contexto = document
            .getElementById("grafico-categorias")
            .getContext("2d");

        graficoCategorias = new Chart(contexto, {
            type: "doughnut",

            data: {
                labels: etiquetas,
                datasets: [{
                    data: valores,
                    backgroundColor: [
                        "#2563eb",
                        "#16a34a",
                        "#f59e0b",
                        "#9333ea",
                        "#ec4899",
                        "#0891b2",
                        "#64748b",
                        "#dc2626"
                    ],
                    borderWidth: 2,
                    borderColor: "#ffffff"
                }]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "bottom"
                    }
                }
            }
        });

    } else {

        graficoCategorias.data.labels = etiquetas;
        graficoCategorias.data.datasets[0].data = valores;
        graficoCategorias.update();

    }

}


function actualizarGraficoMensual() {

    const nombresMeses = [
        "Ene", "Feb", "Mar", "Abr", "May", "Jun",
        "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
    ];

    const etiquetas = [];
    const ingresos = [];
    const gastos = [];

    const [anioSeleccionado, numeroMesSeleccionado] =
        mesResumen.value.split("-").map(Number);

    // Calculamos los últimos seis meses,
    // incluyendo el mes seleccionado
    for (let i = 5; i >= 0; i--) {

        const fecha = new Date(
            anioSeleccionado,
            numeroMesSeleccionado - 1 - i,
            1
        );

        const anio = fecha.getFullYear();
        const mes = String(fecha.getMonth() + 1).padStart(2, "0");

        const claveMes = `${anio}-${mes}`;

        etiquetas.push(
            `${nombresMeses[fecha.getMonth()]} ${anio}`
        );

        let totalIngresos = 0;
        let totalGastos = 0;

        movimientos.forEach(function(movimiento) {

            if (movimiento.fecha.startsWith(claveMes)) {

                if (movimiento.tipo === "ingreso") {
                    totalIngresos += movimiento.monto;
                } else if (movimiento.tipo === "gasto") {
                    totalGastos += movimiento.monto;
                }

            }

        });

        ingresos.push(totalIngresos);
        gastos.push(totalGastos);

    }

    if (graficoMensual === null) {

        const contexto = document
            .getElementById("grafico-mensual")
            .getContext("2d");

        graficoMensual = new Chart(contexto, {

            type: "bar",

            data: {
                labels: etiquetas,

                datasets: [
                    {
                        label: "Ingresos",
                        data: ingresos,
                        backgroundColor: "#16a34a"
                    },
                    {
                        label: "Gastos",
                        data: gastos,
                        backgroundColor: "#dc2626"
                    }
                ]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,

                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(valor) {
                                return "$" + valor.toLocaleString("es-AR");
                            }
                        }
                    }
                },

                plugins: {
                    legend: {
                        position: "bottom"
                    }
                }
            }

        });

    } else {

        graficoMensual.data.labels = etiquetas;
        graficoMensual.data.datasets[0].data = ingresos;
        graficoMensual.data.datasets[1].data = gastos;

        graficoMensual.update();

    }

}


function actualizarGraficos() {

    if (typeof Chart === "undefined") {
        console.error("No se pudo cargar Chart.js.");
        return;
    }

    actualizarGraficoCategorias();
    actualizarGraficoMensual();

}




// ==========================================
// 5. FILTRAR MOVIMIENTOS
// ==========================================

function filtrarMovimientos() {

    const mesSeleccionado = filtroMes.value;
    const tipoSeleccionado = filtroTipo.value;
    const categoriaSeleccionada = filtroCategoria.value;

    return movimientos.filter(function(movimiento) {

        const coincideMes =
            mesSeleccionado === "todos" ||
            (movimiento.fecha &&
             movimiento.fecha.startsWith(mesSeleccionado));

        const coincideTipo =
            tipoSeleccionado === "todos" ||
            movimiento.tipo === tipoSeleccionado;

        const coincideCategoria =
            categoriaSeleccionada === "todos" ||
            movimiento.categoria === categoriaSeleccionada;

        return coincideMes && coincideTipo && coincideCategoria;

    });

}


// ==========================================
// 6. MOSTRAR EL HISTORIAL
// ==========================================

function mostrarMovimientos() {

    listaMovimientos.innerHTML = "";

    const movimientosFiltrados = filtrarMovimientos();
    const movimientosOrdenados = [...movimientosFiltrados];

    movimientosOrdenados.sort(function(a, b) {
        const fechaA = a.fecha || "";
        const fechaB = b.fecha || "";
        const importeA = Number(a.monto) || 0;
        const importeB = Number(b.monto) || 0;

        switch (ordenMovimientos.value) {
            case "antiguos":
                return fechaA.localeCompare(fechaB);
            case "mayor-menor":
                return importeB - importeA;
            case "menor-mayor":
                return importeA - importeB;
            case "recientes":
            default:
                return fechaB.localeCompare(fechaA);
        }
    });

    movimientosOrdenados.forEach(function(movimiento) {

        const elemento = document.createElement("li");
        elemento.classList.add("fila-movimiento");

        // Descripción
        const descripcion = document.createElement("span");
        descripcion.textContent = movimiento.descripcion;

        // Categoría
        const categoria = document.createElement("span");

        const nombresCategorias = {
            alimentacion: "Alimentación",
            transporte: "Transporte",
            vivienda: "Vivienda",
            servicios: "Servicios",
            salud: "Salud",
            entretenimiento: "Entretenimiento",
            trabajo: "Trabajo",
            otros: "Otros"
        };

        categoria.textContent =
            nombresCategorias[movimiento.categoria] || "Otros";

        categoria.classList.add("etiqueta-categoria");

        // Fecha
        const fecha = document.createElement("span");

        if (movimiento.fecha) {
            const partes = movimiento.fecha.split("-");
            fecha.textContent =
                `${partes[2]}/${partes[1]}/${partes[0]}`;
        } else {
            fecha.textContent = "Sin fecha";
        }

        // Monto
        const monto = document.createElement("span");

        const signo = movimiento.tipo === "ingreso" ? "+" : "-";

        monto.textContent = signo + formatearDinero(movimiento.monto);

        monto.classList.add(
            movimiento.tipo === "ingreso" ? "monto-ingreso" : "monto-gasto"
        );

        // Acciones: editar y eliminar
        const acciones = document.createElement("div");
        acciones.classList.add("acciones-movimiento");

        const botonEditar = document.createElement("button");
        botonEditar.type = "button";
        botonEditar.textContent = "Editar";
        botonEditar.classList.add("boton-editar-movimiento");
        botonEditar.addEventListener("click", function() {
            editarMovimiento(movimiento.id);
        });

        const botonEliminar = document.createElement("button");
        botonEliminar.type = "button";
        botonEliminar.textContent = "Eliminar";
        botonEliminar.classList.add("boton-eliminar-movimiento");
        botonEliminar.addEventListener("click", function() {
            eliminarMovimiento(movimiento.id);
        });

        acciones.appendChild(botonEditar);
        acciones.appendChild(botonEliminar);

        elemento.appendChild(descripcion);
        elemento.appendChild(categoria);
        elemento.appendChild(fecha);
        elemento.appendChild(monto);
        elemento.appendChild(acciones);

        listaMovimientos.appendChild(elemento);

    });

}


// ==========================================
// EDITAR Y CANCELAR EDICIÓN DE MOVIMIENTOS
// ==========================================

function editarMovimiento(id) {
    const movimiento = movimientos.find(function(item) {
        return item.id === id;
    });

    if (!movimiento) return;

    movimientoEnEdicionId = id;
    descripcionInput.value = movimiento.descripcion;
    montoInput.value = String(movimiento.monto).replace(".", ",");
    tipoInput.value = movimiento.tipo;
    categoriaInput.value = movimiento.categoria;
    fechaInput.value = movimiento.fecha;

    tituloFormularioMovimiento.textContent = "Editar movimiento";
    botonGuardarMovimiento.textContent = "Guardar cambios";
    botonCancelarEdicion.hidden = false;
    formulario.scrollIntoView({ behavior: "smooth", block: "center" });
    descripcionInput.focus();
}

function cancelarEdicionMovimiento() {
    movimientoEnEdicionId = null;
    formulario.reset();
    fechaInput.value = obtenerFechaHoy();
    tituloFormularioMovimiento.textContent = "Registrar movimiento";
    botonGuardarMovimiento.textContent = "Agregar movimiento";
    botonCancelarEdicion.hidden = true;
}

botonCancelarEdicion.addEventListener("click", cancelarEdicionMovimiento);


// ==========================================
// 7. ELIMINAR UN MOVIMIENTO
// ==========================================

function eliminarMovimiento(id) {
    if (movimientoEnEdicionId === id) {
        cancelarEdicionMovimiento();
    }

    movimientos = movimientos.filter(function(movimiento) {
        return movimiento.id !== id;
    });

    guardarMovimientos();
    actualizarResumen();
    cargarMeses();
    mostrarMovimientos();
    actualizarGraficos();
    actualizarPresupuestos();

}


// ==========================================
// 8. CARGAR LOS MESES DISPONIBLES
// ==========================================

function cargarMeses() {

    const meses = [...new Set(
        movimientos
            .filter(function(movimiento) {
                return movimiento.fecha;
            })
            .map(function(movimiento) {
                return movimiento.fecha.substring(0, 7);
            })
    )];

    meses.sort().reverse();

    const mesAnterior = filtroMes.value;

    filtroMes.innerHTML =
        '<option value="todos">Todos los meses</option>';

    meses.forEach(function(mes) {

        const [anio, numeroMes] = mes.split("-");

        const fecha = new Date(Number(anio), Number(numeroMes) - 1);

        const nombreMes = fecha.toLocaleDateString("es-AR", {
            month: "long",
            year: "numeric"
        });

        const opcion = document.createElement("option");

        opcion.value = mes;
        opcion.textContent =
            nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);

        filtroMes.appendChild(opcion);

    });

    if (meses.includes(mesAnterior)) {
        filtroMes.value = mesAnterior;
    }

}


// ==========================================
// 9. CARGAR LOS MOVIMIENTOS GUARDADOS
// ==========================================

function cargarMovimientos() {

    const datosGuardados = localStorage.getItem("movimientos");

    if (datosGuardados !== null) {
        movimientos = JSON.parse(datosGuardados);
    }

    actualizarResumen();
    cargarMeses();
    mostrarMovimientos();

}


// ==========================================
// 10. INICIALIZAR APLICACIÓN
// ==========================================

fechaInput.value = obtenerFechaHoy();

mesResumen.value = obtenerFechaHoy().substring(0, 7);
mesEstadisticas.value = mesResumen.value;
mesPresupuesto.value = mesResumen.value;

cargarMovimientos();
cargarPresupuestos();

filtroMes.addEventListener("change", mostrarMovimientos);
filtroTipo.addEventListener("change", mostrarMovimientos);
filtroCategoria.addEventListener("change", mostrarMovimientos);
ordenMovimientos.addEventListener("change", mostrarMovimientos);
mesPresupuesto.addEventListener("change", actualizarPresupuestos);

mesResumen.addEventListener("change", function() {

    // Sincronizamos los selectores
    mesEstadisticas.value = mesResumen.value;

    actualizarResumen();
    actualizarGraficos();

});


mesEstadisticas.addEventListener("change", function() {

    // El selector de estadísticas controla el período general
    mesResumen.value = mesEstadisticas.value;

    actualizarResumen();
    actualizarGraficos();
    if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./service-worker.js")
            .then(() => {
                console.log("Aplicación preparada para funcionar sin conexión.");
            })
            .catch((error) => {
                console.error("Error al registrar Service Worker:", error);
            });
    });
}

});


