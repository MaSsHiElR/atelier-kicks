// ==========================================
// 1. CONFIGURACIÓN MOCKAPI
// ==========================================
const API_URL = "https://6af5d1d6f6270fa08d68ace9.mockapi.io/catalogo/productos";
const FALLBACK_IMG = "https://placehold.co/800x600/18181b/71717a?text=ATELIER+KICKS";

// ==========================================
// 2. ESTADO Y ELEMENTOS DEL DOM
// ==========================================
let productos = [];
let carrito = [];
let marcaActiva = "todas";
let productoModalId = null;

const galeriaGrid = document.getElementById("galeria-grid");
const catalogoGrid = document.getElementById("catalogo-grid");
const contadorResultados = document.getElementById("contador-resultados");
const heroTotalModels = document.getElementById("hero-total-models");
const heroTotalPairs = document.getElementById("hero-total-pairs");

const brandTabs = document.getElementById("brand-tabs");
const filtroBusqueda = document.getElementById("filtro-busqueda");
const filtroCategoria = document.getElementById("filtro-categoria");
const filtroOrden = document.getElementById("filtro-orden");

// Modal vista rápida
const modalOverlay = document.getElementById("product-modal-overlay");
const btnCloseModal = document.getElementById("btn-close-modal");
const modalImg = document.getElementById("modal-img");
const modalBrand = document.getElementById("modal-brand");
const modalTitle = document.getElementById("modal-title");
const modalPrice = document.getElementById("modal-price");
const modalDesc = document.getElementById("modal-desc");
const modalTalla = document.getElementById("modal-talla");
const modalColor = document.getElementById("modal-color");
const modalStock = document.getElementById("modal-stock");
const modalAddBtn = document.getElementById("modal-add-btn");

// Carrito
const btnOpenCart = document.getElementById("btn-open-cart");
const btnCloseCart = document.getElementById("btn-close-cart");
const cartOverlay = document.getElementById("cart-overlay");
const cartDrawer = document.getElementById("cart-drawer");
const cartItemsContainer = document.getElementById("cart-items");
const cartCount = document.getElementById("cart-count");
const cartSubtitle = document.getElementById("cart-subtitle");
const cartTotal = document.getElementById("cart-total");
const btnCheckout = document.getElementById("btn-checkout");
const btnClearCart = document.getElementById("btn-clear-cart");
const toastEl = document.getElementById("toast");

// ==========================================
// 3. CARGA DESDE MOCKAPI
// ==========================================
async function cargarProductos() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} en ${API_URL}`);
    }

    const data = await res.json();
    if (!Array.isArray(data)) {
      throw new Error("MockAPI no devolvió una lista de productos válida.");
    }

    productos = data;
    actualizarMetricasHero(productos);
    renderizarGaleria(productos);
    aplicarFiltros();
  } catch (error) {
    console.error("Error MockAPI:", error);
    heroTotalModels.textContent = "0";
    heroTotalPairs.textContent = "0";
    contadorResultados.textContent = "Error de conexión";
    const detalle = `No se pudo cargar MockAPI (${error.message}). Verifica que la URL del recurso sea exacta y tenga datos cargados.`;
    galeriaGrid.innerHTML = `<div class="skeleton-box">${detalle}</div>`;
    catalogoGrid.innerHTML = `<div class="skeleton-box">${detalle}</div>`;
  }
}

function actualizarMetricasHero(lista) {
  const totalPares = lista.reduce((acc, p) => acc + Math.max(0, Number(p.stock) || 0), 0);
  heroTotalModels.textContent = lista.length;
  heroTotalPairs.textContent = totalPares;
}

// ==========================================
// 4. GALERÍA EDITORIAL BENTO
// ==========================================
function renderizarGaleria(lista) {
  const destacados = lista.filter((p) => Boolean(p.edicionLimitada)).slice(0, 5);
  const mostrar = destacados.length >= 3 ? destacados : lista.slice(0, 5);

  if (mostrar.length === 0) {
    galeriaGrid.innerHTML = `<div class="skeleton-box">MockAPI está conectado, pero aún no tiene productos cargados.</div>`;
    return;
  }

  galeriaGrid.innerHTML = mostrar
    .map(
      (p) => `
      <article class="bento-card" data-open-modal="${p.id}">
        <img src="${p.imagen || FALLBACK_IMG}" alt="${p.nombre}" onerror="this.src='${FALLBACK_IMG}'" />
        ${p.edicionLimitada ? `<span class="bento-tag">Edición Limitada</span>` : ""}
        <div class="bento-overlay">
          <span class="bento-brand">${p.marca || "Curated"}</span>
          <div class="bento-row">
            <h3>${p.nombre}</h3>
            <span>$${Number(p.precio || 0).toLocaleString()}</span>
          </div>
        </div>
      </article>
    `
    )
    .join("");
}

// ==========================================
// 5. CATÁLOGO Y FILTROS
// ==========================================
function renderizarCatalogo(lista) {
  contadorResultados.textContent = `${lista.length} ${lista.length === 1 ? "silueta" : "siluetas"}`;

  if (lista.length === 0) {
    catalogoGrid.innerHTML = `<div class="skeleton-box">Ningún sneaker coincide con tu búsqueda.</div>`;
    return;
  }

  catalogoGrid.innerHTML = lista
    .map((p) => {
      const stockNum = Number(p.stock) || 0;
      const sinStock = stockNum <= 0;

      let stockClass = "stock-ok";
      let stockLabel = `${stockNum} disponibles`;

      if (sinStock) {
        stockClass = "stock-out";
        stockLabel = "Agotado";
      } else if (stockNum <= 2) {
        stockClass = "stock-low";
        stockLabel = `Últimos ${stockNum}`;
      }

      return `
        <article class="product-card">
          <div class="product-media" data-open-modal="${p.id}">
            <img src="${p.imagen || FALLBACK_IMG}" alt="${p.nombre}" onerror="this.src='${FALLBACK_IMG}'" />
            ${p.edicionLimitada ? `<span class="pill-limited">Limitado</span>` : ""}
            <button
              class="quick-add-btn"
              data-add-id="${p.id}"
              ${sinStock ? "disabled" : ""}
            >
              ${sinStock ? "Agotado" : "+ Agregar"}
            </button>
          </div>

          <div class="product-head">
            <span class="product-brand">${p.marca || "Sneaker"}</span>
            <span class="product-price">$${Number(p.precio || 0).toLocaleString()}</span>
          </div>

          <h3 class="product-name" data-open-modal="${p.id}">${p.nombre}</h3>

          <div class="product-meta-row">
            <span>${p.talla || "Estándar"} • ${p.color || "—"}</span>
            <span class="stock-indicator ${stockClass}">
              <span class="stock-dot"></span>${stockLabel}
            </span>
          </div>

          <button
            class="card-action-btn"
            data-add-id="${p.id}"
            ${sinStock ? "disabled" : ""}
          >
            ${sinStock ? "Sin stock" : "Agregar a la bolsa"}
          </button>
        </article>
      `;
    })
    .join("");
}

function aplicarFiltros() {
  const texto = filtroBusqueda.value.trim().toLowerCase();
  const categoria = filtroCategoria.value;
  const orden = filtroOrden.value;

  let resultado = productos.filter((p) => {
    const nombre = (p.nombre || "").toLowerCase();
    const color = (p.color || "").toLowerCase();
    const marca = (p.marca || "").toLowerCase();

    const okTexto = nombre.includes(texto) || color.includes(texto) || marca.includes(texto);
    const okMarca = marcaActiva === "todas" || (p.marca || "") === marcaActiva;
    const okCat = categoria === "todas" || String(p.categoriaId) === String(categoria);

    return okTexto && okMarca && okCat;
  });

  if (orden === "price-asc") {
    resultado.sort((a, b) => Number(a.precio) - Number(b.precio));
  } else if (orden === "price-desc") {
    resultado.sort((a, b) => Number(b.precio) - Number(a.precio));
  } else if (orden === "stock-desc") {
    resultado.sort((a, b) => Number(b.stock) - Number(a.stock));
  }

  renderizarCatalogo(resultado);
}

brandTabs.addEventListener("click", (e) => {
  const tab = e.target.closest(".tab-btn");
  if (!tab) return;

  brandTabs.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
  tab.classList.add("active");
  marcaActiva = tab.dataset.brand;
  aplicarFiltros();
});

filtroBusqueda.addEventListener("input", aplicarFiltros);
filtroCategoria.addEventListener("change", aplicarFiltros);
filtroOrden.addEventListener("change", aplicarFiltros);

// ==========================================
// 6. MODAL VISTA RÁPIDA
// ==========================================
function abrirModal(id) {
  const p = productos.find((item) => item.id === id);
  if (!p) return;

  productoModalId = p.id;
  const stockNum = Number(p.stock) || 0;

  modalImg.src = p.imagen || FALLBACK_IMG;
  modalImg.alt = p.nombre;
  modalImg.onerror = () => (modalImg.src = FALLBACK_IMG);

  modalBrand.textContent = p.marca || "Curated";
  modalTitle.textContent = p.nombre;
  modalPrice.textContent = `$${Number(p.precio || 0).toLocaleString()} USD`;
  modalDesc.textContent = p.descripcion || "Calzado verificado de colección.";
  modalTalla.textContent = p.talla || "Estándar";
  modalColor.textContent = p.color || "—";
  modalStock.textContent = stockNum > 0 ? `${stockNum} u.` : "Agotado";

  modalAddBtn.disabled = stockNum <= 0;
  modalAddBtn.textContent = stockNum > 0 ? "Agregar a la bolsa" : "Agotado";

  modalOverlay.classList.add("open");
  modalOverlay.setAttribute("aria-hidden", "false");
}

function cerrarModal() {
  modalOverlay.classList.remove("open");
  modalOverlay.setAttribute("aria-hidden", "true");
  productoModalId = null;
}

btnCloseModal.addEventListener("click", cerrarModal);
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) cerrarModal();
});

modalAddBtn.addEventListener("click", () => {
  if (!productoModalId) return;
  agregarAlCarrito(productoModalId);
  cerrarModal();
});

document.addEventListener("click", (e) => {
  const addBtn = e.target.closest("[data-add-id]");
  if (addBtn) {
    e.stopPropagation();
    agregarAlCarrito(addBtn.dataset.addId);
    return;
  }

  const modalTrigger = e.target.closest("[data-open-modal]");
  if (modalTrigger) {
    abrirModal(modalTrigger.dataset.openModal);
  }
});

// ==========================================
// 7. CARRITO Y RESTA DE STOCK EN MOCKAPI
// ==========================================
function agregarAlCarrito(id) {
  const p = productos.find((item) => item.id === id);
  const stockNum = Number(p?.stock) || 0;
  if (!p || stockNum <= 0) return;

  const existente = carrito.find((item) => item.id === id);
  if (existente) {
    if (existente.cantidad >= stockNum) {
      mostrarToast(`Stock máximo disponible: ${stockNum} u.`);
      return;
    }
    existente.cantidad += 1;
  } else {
    carrito.push({
      id: p.id,
      nombre: p.nombre,
      talla: p.talla || "Estándar",
      precio: Number(p.precio) || 0,
      imagen: p.imagen || FALLBACK_IMG,
      stockMax: stockNum,
      cantidad: 1
    });
  }

  renderizarCarrito();
  mostrarToast(`Agregado: ${p.nombre}`);
}

function renderizarCarrito() {
  const unidades = carrito.reduce((acc, i) => acc + i.cantidad, 0);
  const total = carrito.reduce((acc, i) => acc + i.precio * i.cantidad, 0);

  cartCount.textContent = unidades;
  cartSubtitle.textContent = `${unidades} ${unidades === 1 ? "artículo" : "artículos"}`;
  cartTotal.textContent = `$${total.toLocaleString()}`;
  btnCheckout.disabled = carrito.length === 0;

  if (carrito.length === 0) {
    cartItemsContainer.innerHTML = `<p class="empty-state">Tu bolsa está vacía.</p>`;
    return;
  }

  cartItemsContainer.innerHTML = carrito
    .map(
      (item) => `
      <div class="cart-item">
        <img src="${item.imagen}" alt="${item.nombre}" onerror="this.src='${FALLBACK_IMG}'" />
        <div>
          <p class="cart-item-title">${item.nombre}</p>
          <p class="cart-item-meta">Talla ${item.talla}</p>
          <div class="cart-item-bottom">
            <div class="stepper">
              <button data-qty="dec" data-id="${item.id}" aria-label="Disminuir">−</button>
              <span>${item.cantidad}</span>
              <button data-qty="inc" data-id="${item.id}" aria-label="Aumentar">+</button>
            </div>
            <div>
              <span class="cart-item-price">$${(item.precio * item.cantidad).toLocaleString()}</span>
              <button class="remove-link" data-remove="${item.id}">Quitar</button>
            </div>
          </div>
        </div>
      </div>
    `
    )
    .join("");
}

cartItemsContainer.addEventListener("click", (e) => {
  const qtyBtn = e.target.closest("[data-qty]");
  if (qtyBtn) {
    const id = qtyBtn.dataset.id;
    const delta = qtyBtn.dataset.qty === "inc" ? 1 : -1;
    const item = carrito.find((i) => i.id === id);
    if (!item) return;

    const nuevaCant = item.cantidad + delta;
    if (nuevaCant <= 0) {
      carrito = carrito.filter((i) => i.id !== id);
    } else if (nuevaCant > item.stockMax) {
      mostrarToast(`Solo quedan ${item.stockMax} unidades disponibles.`);
      return;
    } else {
      item.cantidad = nuevaCant;
    }
    renderizarCarrito();
    return;
  }

  const removeBtn = e.target.closest("[data-remove]");
  if (removeBtn) {
    carrito = carrito.filter((i) => i.id !== removeBtn.dataset.remove);
    renderizarCarrito();
  }
});

btnClearCart.addEventListener("click", () => {
  carrito = [];
  renderizarCarrito();
});

function toggleCarrito(abrir) {
  cartDrawer.classList.toggle("open", abrir);
  cartOverlay.classList.toggle("open", abrir);
  cartOverlay.setAttribute("aria-hidden", String(!abrir));
}

btnOpenCart.addEventListener("click", () => toggleCarrito(true));
btnCloseCart.addEventListener("click", () => toggleCarrito(false));
cartOverlay.addEventListener("click", () => toggleCarrito(false));

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    cerrarModal();
    toggleCarrito(false);
  }
});

btnCheckout.addEventListener("click", async () => {
  if (carrito.length === 0) return;

  btnCheckout.disabled = true;
  btnCheckout.textContent = "Procesando orden...";

  try {
    for (const item of carrito) {
      const resActual = await fetch(`${API_URL}/${item.id}`);
      if (!resActual.ok) throw new Error(`No se encontró ${item.nombre} en MockAPI.`);
      const productoReal = await resActual.json();

      const stockActual = Number(productoReal.stock) || 0;
      if (stockActual < item.cantidad) {
        throw new Error(`Stock insuficiente para ${productoReal.nombre} (disponible: ${stockActual}).`);
      }

      const nuevoStock = Math.max(0, stockActual - item.cantidad);
      const resPut = await fetch(`${API_URL}/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...productoReal,
          stock: nuevoStock
        })
      });

      if (!resPut.ok) throw new Error(`No se pudo actualizar ${productoReal.nombre}.`);
    }

    carrito = [];
    renderizarCarrito();
    toggleCarrito(false);
    await cargarProductos();
    mostrarToast("Compra confirmada. Stock actualizado.");
  } catch (error) {
    console.error(error);
    alert(error.message || "Error al procesar la compra.");
    await cargarProductos();
  } finally {
    btnCheckout.textContent = "Confirmar compra";
    btnCheckout.disabled = carrito.length === 0;
  }
});

let toastTimer;
function mostrarToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2600);
}

cargarProductos();