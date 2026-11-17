"use strict";

/* ---------- Utilidades ---------- */
const $ = (selector) => document.querySelector(selector);

function guardar(clave, valor) {
  try { localStorage.setItem(clave, valor); } catch (e) { /* almacenamiento no disponible */ }
}
function leer(clave) {
  try { return localStorage.getItem(clave); } catch (e) { return null; }
}

/* ---------- Año del footer ---------- */
$("#anio").textContent = new Date().getFullYear();

/* ---------- Modo oscuro ---------- */
const btnTema = $("#btnTema");

function aplicarTema(tema) {
  const oscuro = tema === "dark";
  document.documentElement.setAttribute("data-bs-theme", tema);
  btnTema.setAttribute("aria-pressed", String(oscuro));
  btnTema.setAttribute("aria-label", oscuro ? "Activar modo claro" : "Activar modo oscuro");
  $("#iconoTema").textContent = oscuro ? "☀️" : "🌙";
  $("#textoTema").textContent = oscuro ? "Modo claro" : "Modo oscuro";
}

const temaInicial = leer("tema") ||
  (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
aplicarTema(temaInicial);

btnTema.addEventListener("click", () => {
  const nuevo = document.documentElement.getAttribute("data-bs-theme") === "dark" ? "light" : "dark";
  aplicarTema(nuevo);
  guardar("tema", nuevo);
});

/* ---------- Cierra el menú móvil al elegir un enlace ---------- */
document.querySelectorAll("#menuPrincipal .nav-link").forEach((enlace) => {
  enlace.addEventListener("click", () => {
    const menu = $("#menuPrincipal");
    if (menu.classList.contains("show")) {
      bootstrap.Collapse.getOrCreateInstance(menu).hide();
    }
  });
});

/* ---------- Proyectos: fetch desde JSON + filtro ---------- */
let proyectos = [];

function crearTarjeta(p) {
  const col = document.createElement("div");
  col.className = "col-12 col-md-6 col-lg-4";

  const detalles = [p.entidad, p.horas ? `${p.horas} horas` : null, p.anio]
    .filter(Boolean).join(" · ");

  col.innerHTML = `
    <article class="card tarjeta-proyecto">
      <div class="card-body">
        <span class="badge text-bg-primary mb-2"></span>
        <h3 class="h5 card-title"></h3>
        <p class="card-text"></p>
      </div>
      <div class="card-footer text-secondary small"></div>
    </article>`;

  // textContent evita inyectar HTML desde el JSON
  col.querySelector(".badge").textContent = p.categoria;
  col.querySelector(".card-title").textContent = p.titulo;
  col.querySelector(".card-text").textContent = p.descripcion;
  col.querySelector(".card-footer").textContent = detalles;

  // Botón para abrir el certificado (solo si el JSON incluye el campo "certificado")
  if (p.certificado) {
    const enlace = document.createElement("a");
    enlace.href = p.certificado;
    enlace.target = "_blank";
    enlace.rel = "noopener";
    enlace.className = "btn btn-sm btn-outline-primary ms-2";
    enlace.textContent = "Ver certificado";
    col.querySelector(".card-footer").appendChild(enlace);
  }

  return col;
}

function mostrarProyectos(filtro = "todos") {
  const contenedor = $("#listaProyectos");
  contenedor.replaceChildren();
  const lista = filtro === "todos" ? proyectos : proyectos.filter((p) => p.categoria === filtro);
  lista.forEach((p) => contenedor.appendChild(crearTarjeta(p)));
  $("#estadoProyectos").textContent = `Mostrando ${lista.length} de ${proyectos.length} elementos.`;
}

function crearFiltros() {
  const contenedor = $("#filtros");
  const categorias = [...new Set(proyectos.map((p) => p.categoria))];

  categorias.forEach((cat) => {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "btn btn-sm btn-outline-primary";
    boton.dataset.filtro = cat;
    boton.setAttribute("aria-pressed", "false");
    boton.textContent = cat;
    contenedor.appendChild(boton);
  });

  contenedor.addEventListener("click", (e) => {
    const boton = e.target.closest("button[data-filtro]");
    if (!boton) return;
    contenedor.querySelectorAll("button").forEach((b) => {
      const activo = b === boton;
      b.classList.toggle("btn-primary", activo);
      b.classList.toggle("btn-outline-primary", !activo);
      b.setAttribute("aria-pressed", String(activo));
    });
    mostrarProyectos(boton.dataset.filtro);
  });
}

async function cargarProyectos() {
  try {
    const respuesta = await fetch("proyectos.json");
    if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
    proyectos = await respuesta.json();
    crearFiltros();
    mostrarProyectos();
  } catch (error) {
    $("#estadoProyectos").textContent =
      "No se pudieron cargar los proyectos. Abre el sitio con un servidor local (por ejemplo, Live Server) y no directamente desde el archivo.";
    $("#estadoProyectos").classList.add("text-danger");
    console.error(error);
  }
}
cargarProyectos();

/* ---------- Formulario de contacto con validación ---------- */
const form = $("#formContacto");
const campos = {
  nombre: { el: $("#nombre"), error: $("#errorNombre") },
  correo: { el: $("#correo"), error: $("#errorCorreo") },
  mensaje: { el: $("#mensaje"), error: $("#errorMensaje") },
};

function validarCampo(clave) {
  const { el, error } = campos[clave];
  const valor = el.value.trim();
  let mensaje = "";

  if (clave === "nombre") {
    if (!valor) mensaje = "Escribe tu nombre.";
    else if (valor.length < 3) mensaje = "El nombre debe tener al menos 3 caracteres.";
  } else if (clave === "correo") {
    const patron = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!valor) mensaje = "Escribe tu correo electrónico.";
    else if (!patron.test(valor)) mensaje = "Ingresa un correo válido (ejemplo@dominio.com).";
  } else if (clave === "mensaje") {
    if (!valor) mensaje = "Escribe un mensaje.";
    else if (valor.length < 10) mensaje = "El mensaje debe tener al menos 10 caracteres.";
  }

  error.textContent = mensaje;
  el.classList.toggle("is-invalid", Boolean(mensaje));
  el.classList.toggle("is-valid", !mensaje);
  el.setAttribute("aria-invalid", String(Boolean(mensaje)));
  return !mensaje;
}

Object.keys(campos).forEach((clave) => {
  campos[clave].el.addEventListener("blur", () => validarCampo(clave));
  campos[clave].el.addEventListener("input", () => {
    if (campos[clave].el.classList.contains("is-invalid")) validarCampo(clave);
  });
});

campos.mensaje.el.addEventListener("input", () => {
  $("#contador").textContent = `${campos.mensaje.el.value.length} / 500`;
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const resultado = $("#resultadoForm");
  const validos = Object.keys(campos).map(validarCampo).every(Boolean);

  if (!validos) {
    resultado.innerHTML = '<div class="alert alert-danger mb-0">Revisa los campos marcados en rojo.</div>';
    const primero = Object.values(campos).find((c) => c.el.classList.contains("is-invalid"));
    if (primero) primero.el.focus();
    return;
  }

  // Sin backend: se simula el envío
  resultado.innerHTML = '<div class="alert alert-success mb-0">¡Gracias! Tu mensaje fue validado correctamente.</div>';
  form.reset();
  $("#contador").textContent = "0 / 500";
  Object.values(campos).forEach((c) => c.el.classList.remove("is-valid", "is-invalid"));
});