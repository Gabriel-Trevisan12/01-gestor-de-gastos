
// ==========================================
// 1. VARIABLES Y ELEMENTOS DEL HTML
// ==========================================

let movimientos = [];

const formulario = document.getElementById("formulario-gasto");

const descripcionInput = document.getElementById("descripcion");
const montoInput = document.getElementById("monto");
const tipoInput = document.getElementById("tipo");
const categoriaInput = document.getElementById("categoria");
const fechaInput = document.getElementById("fecha");

const balanceElement = document.getElementById("balance");
const ingresosElement = document.getElementById("ingresos");
const gastosElement = document.getElementById("gastos");

const listaMovimientos = document.getElementById("lista-movimientos");

const filtroMes = document.getElementById("filtro-mes");
const filtroTipo = document.getElementById("filtro-tipo");
const filtroCategoria = document.getElementById("filtro-categoria");


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

    const movimiento = {
        id: Date.now(),
        descripcion: descripcionFormateada,
        monto: monto,
        tipo: tipo,
        categoria: categoria,
        fecha: fecha
    };

    movimientos.push(movimiento);

    guardarMovimientos();
    actualizarResumen();
    cargarMeses();
    mostrarMovimientos();

    formulario.reset();

    fechaInput.value = obtenerFechaHoy();

});


// ==========================================
// 4. CALCULAR INGRESOS, GASTOS Y BALANCE
// ==========================================

function actualizarResumen() {

    let totalIngresos = 0;
    let totalGastos = 0;

    movimientos.forEach(function(movimiento) {

        if (movimiento.tipo === "ingreso") {
            totalIngresos += movimiento.monto;
        } else {
            totalGastos += movimiento.monto;
        }

    });

    const balance = totalIngresos - totalGastos;

    ingresosElement.textContent = formatearDinero(totalIngresos);
    gastosElement.textContent = formatearDinero(totalGastos);
    balanceElement.textContent = formatearDinero(balance);

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

    movimientosFiltrados.forEach(function(movimiento) {

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

        // Botón eliminar
        const botonEliminar = document.createElement("button");

        botonEliminar.textContent = "Eliminar";

        botonEliminar.addEventListener("click", function() {
            eliminarMovimiento(movimiento.id);
        });

        elemento.appendChild(descripcion);
        elemento.appendChild(categoria);
        elemento.appendChild(fecha);
        elemento.appendChild(monto);
        elemento.appendChild(botonEliminar);

        listaMovimientos.appendChild(elemento);

    });

}


// ==========================================
// 7. ELIMINAR UN MOVIMIENTO
// ==========================================

function eliminarMovimiento(id) {

    movimientos = movimientos.filter(function(movimiento) {
        return movimiento.id !== id;
    });

    guardarMovimientos();
    actualizarResumen();
    cargarMeses();
    mostrarMovimientos();

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

cargarMovimientos();

filtroMes.addEventListener("change", mostrarMovimientos);
filtroTipo.addEventListener("change", mostrarMovimientos);
filtroCategoria.addEventListener("change", mostrarMovimientos);
