/* =========================================================
   SUBSONIC — Frontend controller
   - Multi-page navigation (HTML per view)
   - Role-based access: visitor / client / provider
   - Query params: ?id=..., ?eventId=...
   - Tickets persisted (localStorage) via data.js
   - Store + Cart + Orders persisted (localStorage) via data.js
   ========================================================= */

const $ = (sel) => document.querySelector(sel);

function getQueryParam(key){
  const url = new URL(window.location.href);
  return url.searchParams.get(key);
}

function formatDate(iso){
  if(!iso) return "";
  const [y,m,d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function toLocalISODate(date = new Date()){
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toUTCISODate(date = new Date()){
  return date.toISOString().slice(0,10);
}

function addDays(date, days){
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function parseLocalISODate(value){
  if(!value) return new Date();
  const [year, month, day] = String(value).split("-").map(Number);
  if(!year || !month || !day) return new Date();
  return new Date(year, month - 1, day);
}

function randomDeliveryDays(){
  return Math.random() < 0.5 ? 2 : 3;
}

function stableDeliveryDays(orderId){
  return Number(orderId || 0) % 2 === 0 ? 2 : 3;
}

function normalizeStoreOrder(order){
  if(!order) return order;
  const deliveryDays = Number(order.deliveryDays) || stableDeliveryDays(order.id);
  const date = order.date || toLocalISODate();
  return {
    ...order,
    date,
    eta: order.deliveryDays ? order.eta : toLocalISODate(addDays(parseLocalISODate(date), deliveryDays)),
    deliveryDays,
    trackingCode: order.trackingCode || `SUBSHOP-${String(order.id).slice(-8)}`,
    status: order.status || "Preparando pedido",
    total: order.total ?? getOrderTotal(order)
  };
}

function normalizePurchaseDate(ticket){
  const storedDate = ticket?.purchaseDate || ticket?.purchase_date || "";
  const numericId = Number(ticket?.id);
  if(storedDate && Number.isFinite(numericId) && numericId > 1000000000000){
    const createdAt = new Date(numericId);
    if(storedDate === toUTCISODate(createdAt)){
      return toLocalISODate(createdAt);
    }
  }
  return storedDate;
}

function money(n){
  return `€${Number(n || 0).toFixed(2)}`;
}

// basePath helps build correct links when pages live in subfolders
const basePath = (() => {
  const seg = window.location.pathname.replace(/\\/g,'/').split('/');
  // if there are more than two segments (empty + filename) we are one level deep
  return seg.length > 2 ? '../' : '';
})();

/* -------------------- Session -------------------- */
function getSession(){
  return JSON.parse(localStorage.getItem("subsonic_session") || "null");
}
function setSession(session){
  localStorage.setItem("subsonic_session", JSON.stringify(session));
}
function clearSession(){
  localStorage.removeItem("subsonic_session");
}
function requireRole(allowedRoles){
  const s = getSession();
  if(!s || !allowedRoles.includes(s.role)){
    window.location.href = basePath + "auth/login.html";
  }
}

const API_BASE_URL = window.__SUBSONIC_API || "/api";

function getSessionAuthHeaders(){
  const s = getSession();
  return s?.idToken ? { Authorization: `Bearer ${s.idToken}` } : {};
}

async function createTicketInApi(eventId, passId){
  const authHeaders = getSessionAuthHeaders();
  if(!authHeaders.Authorization){
    throw new Error("Sesion de servidor no disponible");
  }

  const response = await fetch(`${API_BASE_URL}/tickets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders
    },
    body: JSON.stringify({
      event_id: Number(eventId),
      pass_id: Number(passId)
    })
  });

  if(!response.ok){
    throw new Error(`No se pudo guardar la entrada en servidor (${response.status})`);
  }

  return response.json();
}

async function getTicketFromApi(ticketId){
  const authHeaders = getSessionAuthHeaders();
  if(!authHeaders.Authorization){
    throw new Error("Sesion de servidor no disponible");
  }

  const response = await fetch(`${API_BASE_URL}/tickets/${encodeURIComponent(ticketId)}`, {
    headers: authHeaders
  });

  if(!response.ok){
    throw new Error(`No se pudo cargar la entrada (${response.status})`);
  }

  return response.json();
}

function normalizeLocalTicket(ticket, session){
  const eventId = Number(ticket.event_id ?? ticket.eventId ?? 0) || null;
  const passId = Number(ticket.pass_id ?? ticket.passId ?? 0) || null;
  const ev = eventId ? DB.events.find(e => e.id === eventId) : null;
  const pass = ev && passId ? ev.passes.find(p => p.id === passId) : null;
  const id = Number(ticket.id || Date.now() + Math.floor(Math.random() * 100000));
  const purchaseDate = normalizePurchaseDate(ticket) || toLocalISODate();

  return {
    id,
    userId: ticket.user_id ?? ticket.userId ?? session?.id ?? null,
    userEmail: ticket.userEmail || session?.email || "",
    eventId,
    passId,
    eventName: ticket.event_name || ticket.eventName || ev?.name || "Evento",
    passName: ticket.pass_name || ticket.passName || pass?.name || "Entrada",
    passPrice: Number(ticket.pass_price ?? ticket.passPrice ?? pass?.price ?? 0),
    purchaseDate,
    status: ticket.status || "Activa",
    code: ticket.code || `SUB-${eventId || "X"}-${passId || "X"}-${String(id).slice(-6)}`
  };
}

function upsertLocalTicket(ticket, session = getSession()){
  const normalized = normalizeLocalTicket(ticket, session);
  const existingIndex = DB.tickets.findIndex(t => String(t.id) === String(normalized.id));
  if(existingIndex >= 0){
    DB.tickets[existingIndex] = { ...DB.tickets[existingIndex], ...normalized };
  } else {
    DB.tickets.push(normalized);
  }
  window.saveTickets?.();
  return normalized;
}

function getLocalTicketsForSession(session = getSession()){
  if(!session) return [];
  return (DB.tickets || []).filter(t =>
    String(t.userEmail || "") === String(session.email || "") ||
    String(t.userId || "") === String(session.id || "")
  );
}

window.subsonicTickets = {
  getLocalTicketsForSession,
  upsertLocalTicket
};

function findEventForTicket(ticket){
  if(ticket?.eventId){
    const byId = DB.events.find(e => e.id === Number(ticket.eventId));
    if(byId) return byId;
  }

  const name = String(ticket?.eventName || "").trim().toLowerCase();
  if(name){
    return DB.events.find(e => String(e.name || "").trim().toLowerCase() === name) || null;
  }

  return null;
}

function getPassForTicket(ticket, event){
  if(event && ticket?.passId){
    return event.passes.find(p => p.id === Number(ticket.passId)) || null;
  }

  const passName = String(ticket?.passName || "").trim().toLowerCase();
  if(event && passName){
    return event.passes.find(p => String(p.name || "").trim().toLowerCase() === passName) || null;
  }

  return null;
}

function getTicketDisplayData(ticket, session = getSession()){
  const event = findEventForTicket(ticket);
  const pass = getPassForTicket(ticket, event);
  const eventName = event?.name || ticket?.eventName || (ticket?.eventId ? `Evento #${ticket.eventId}` : "Evento Subsonic");
  const location = [event?.venue, event?.city, event?.region].filter(Boolean).join(", ") || ticket?.location || "Ubicacion por confirmar";
  const eventDate = event?.date || ticket?.eventDate || "";
  const price = Number(ticket?.passPrice ?? pass?.price ?? 0);

  return {
    id: ticket?.id || "",
    eventName,
    passName: ticket?.passName || pass?.name || "Entrada",
    passIncludes: pass?.includes || ticket?.passIncludes || "Acceso general segun condiciones del evento.",
    location,
    eventDate,
    eventDateFormatted: eventDate ? formatDate(eventDate) : "Consultar programacion",
    purchaseDate: normalizePurchaseDate(ticket),
    purchaseDateFormatted: formatDate(normalizePurchaseDate(ticket)),
    status: ticket?.status || "Activa",
    code: ticket?.code || `SUB-${ticket?.eventId || "X"}-${ticket?.passId || "X"}-${String(ticket?.id || "").slice(-6)}`,
    price,
    priceFormatted: money(price),
    buyerName: session?.name || "Titular de la entrada",
    buyerEmail: session?.email || "",
    organizer: "Subsonic"
  };
}

function htmlEscape(value){
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function pdfSafe(value){
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pdfEscape(value){
  return pdfSafe(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapPdfText(text, maxChars){
  const words = pdfSafe(text).split(" ");
  const lines = [];
  let line = "";

  words.forEach(word => {
    const next = line ? `${line} ${word}` : word;
    if(next.length > maxChars && line){
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  });

  if(line) lines.push(line);
  return lines;
}

function makeTicketPdf(ticket){
  const data = getTicketDisplayData(ticket);
  const pageWidth = 842;
  const pageHeight = 595;
  const stream = [];
  const add = (line) => stream.push(line);
  const rgb = (r, g, b) => `${(r/255).toFixed(3)} ${(g/255).toFixed(3)} ${(b/255).toFixed(3)}`;
  const rect = (x, y, w, h, color) => add(`${rgb(...color)} rg ${x} ${y} ${w} ${h} re f`);
  const line = (x1, y1, x2, y2, color, width = 1) => add(`${rgb(...color)} RG ${width} w ${x1} ${y1} m ${x2} ${y2} l S`);
  const text = (x, y, value, size, font = "F1", color = [245, 245, 245]) => {
    add(`${rgb(...color)} rg BT /${font} ${size} Tf ${x} ${y} Td (${pdfEscape(value)}) Tj ET`);
  };
  const label = (x, y, value) => text(x, y, value, 9, "F2", [247, 203, 82]);
  const value = (x, y, textValue, size = 13) => text(x, y, textValue, size, "F1", [236, 239, 248]);

  rect(0, 0, pageWidth, pageHeight, [8, 10, 18]);
  rect(44, 62, 754, 470, [21, 22, 31]);
  rect(44, 502, 754, 30, [247, 203, 82]);
  rect(44, 62, 754, 14, [247, 73, 101]);
  rect(64, 92, 520, 386, [15, 17, 26]);
  rect(612, 92, 166, 386, [12, 18, 27]);
  line(600, 104, 600, 466, [82, 86, 104], 1);

  text(68, 512, "SUBSONIC FESTIVAL TICKET", 14, "F2", [16, 18, 24]);
  text(690, 512, "DIGITAL PASS", 10, "F2", [16, 18, 24]);

  wrapPdfText(data.eventName, 24).slice(0, 2).forEach((part, index) => {
    text(80, 445 - index * 28, part, index === 0 ? 26 : 21, "F2");
  });

  rect(80, 388, 150, 28, [247, 73, 101]);
  rect(246, 388, 120, 28, [247, 203, 82]);
  text(94, 397, data.passName.toUpperCase(), 11, "F2");
  text(276, 397, data.status.toUpperCase(), 11, "F2", [16, 18, 24]);

  line(80, 365, 560, 365, [46, 50, 66], 1);
  label(80, 340, "FECHA DEL EVENTO");
  text(80, 318, data.eventDateFormatted, 16, "F2");
  label(332, 340, "LUGAR");
  wrapPdfText(data.location, 31).slice(0, 2).forEach((part, index) => value(332, 318 - index * 16, part, 12));

  line(80, 282, 560, 282, [46, 50, 66], 1);
  label(80, 257, "TITULAR");
  text(80, 236, data.buyerName, 15, "F2");
  value(80, 218, data.buyerEmail, 10);
  label(332, 257, "COMPRA");
  value(332, 236, data.purchaseDateFormatted || "Fecha no disponible", 12);
  value(332, 218, `Precio: EUR ${Number(data.price || 0).toFixed(2)}`, 11);

  line(80, 190, 560, 190, [46, 50, 66], 1);
  label(80, 165, "INCLUYE");
  wrapPdfText(data.passIncludes, 70).slice(0, 2).forEach((part, index) => value(80, 145 - index * 15, part, 10));

  label(80, 112, "INFORMACION DE ACCESO");
  value(80, 94, "Presenta este PDF y un documento de identidad. Entrada personal e intransferible.", 9);
  value(80, 80, "Valida solo para la fecha y recinto indicados. Sujeta a control de seguridad y aforo.", 9);

  rect(632, 430, 126, 38, [247, 203, 82]);
  text(648, 453, "CODIGO", 9, "F2", [16, 18, 24]);
  text(648, 439, data.code, 10, "F2", [16, 18, 24]);
  line(632, 414, 758, 414, [46, 50, 66], 1);

  label(648, 386, "ESCANEAR");
  const hashSource = `${data.code}${data.eventName}${data.passName}`;
  let hash = 0;
  for(let i = 0; i < hashSource.length; i++) hash = (hash * 31 + hashSource.charCodeAt(i)) >>> 0;
  rect(648, 232, 112, 112, [236, 239, 248]);
  for(let row = 0; row < 15; row++){
    for(let col = 0; col < 15; col++){
      const finder = (row < 4 && col < 4) || (row < 4 && col > 10) || (row > 10 && col < 4);
      const on = finder || ((hash + row * 17 + col * 29 + row * col) % 5 < 2);
      if(on) rect(660 + col * 6, 323 - row * 6, 5, 5, finder ? [247, 203, 82] : [16, 18, 24]);
    }
  }

  line(632, 200, 758, 200, [46, 50, 66], 1);
  label(648, 174, "ORGANIZA");
  text(648, 153, data.organizer, 16, "F2");
  value(648, 126, "Entrada digital", 10);
  value(648, 110, "No duplicar", 10);

  const content = stream.join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((obj, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach(offset => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return pdf;
}

function downloadTicketPdf(ticket){
  const data = getTicketDisplayData(ticket);
  const pdf = makeTicketPdf(ticket);
  const blob = new Blob([pdf], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const cleanName = pdfSafe(`${data.eventName}-${data.passName}-${data.code}`).replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
  link.href = url;
  link.download = `${cleanName || "entrada-subsonic"}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* -------------------- UI: Navigation -------------------- */
function renderNav(){
  const nav = $("#navlinks");
  if(!nav) return;

  const s = getSession();
  let links = [];

  if (s && s.role === 'admin') {
    // Admin-specific navigation
    links = [
      { href: `${basePath}admin/edit-event.html`, label: "Eventos" },
      { href: `${basePath}admin/manage-products.html`, label: "Tienda" },
      { href: `${basePath}admin/manage-spaces.html`, label: "Espacios" },
      { href: `${basePath}admin/manage-users.html`, label: "Usuarios" },
      { href: "#", label: "Cerrar sesión", action: "logout" }
    ];
  } else {
    // Default navigation for public and other roles
    links = [
      { href: `${basePath}events/events.html`, label: "Eventos" },
      { href: `${basePath}store/store.html`, label: "Tienda" },
      { href: `${basePath}help/help.html`, label: "Ayuda" },
    ];
    const cartCount = (window.store?.loadCart?.() || []).reduce((a,i)=>a+(i.qty||0),0);
    links.push({ href: `${basePath}store/cart.html`, label: `Carrito (${cartCount})`, id: "navCartLink" });

    if(!s){
      links.push({ href:`${basePath}auth/login.html`, label:"Mi cuenta" });
    } else if(s.role === "client"){
      links.push({ href:`${basePath}client/dashboard.html`, label:"Mi Cuenta" });
      links.push({ href:`${basePath}client/tickets.html`, label:"Mis Entradas" });
      links.push({ href:`${basePath}client/orders.html`, label:"Mis Pedidos" });
      links.push({ href:`${basePath}client/dashboard.html`, label: `${s.name || "Cliente"}` });
      links.push({ href:"#", label:"Cerrar sesión", action:"logout" });
    } else if(s.role === "provider"){
      links.push({ href:`${basePath}spaces/provider-spaces.html`, label:"Espacios" });
      links.push({ href:"#", label: `${s.name || "Proveedor"}`, action:"noop" });
      links.push({ href:"#", label:"Cerrar sesión", action:"logout" });
    }
  }

  nav.innerHTML = "";
  links.forEach(l=>{
    const a = document.createElement("a");
    a.href = l.href;
    a.textContent = l.label;

    if(l.action === "logout"){
      a.href = "#";
      a.addEventListener("click", async (e)=>{
        e.preventDefault();
        clearSession();
        if (_firebaseInitialised()) {
          try { await firebase.auth().signOut(); } catch(_) {}
        }
        window.location.href = basePath + "index.html";
      });
    }

    if(l.action === "noop"){
      a.addEventListener("click", (e) => e.preventDefault());
    }

    nav.appendChild(a);
    // attach id attribute if present in link descriptor
    if(l.id) a.id = l.id;
  });
}

/* =========================================================
Pages
   ========================================================= */

function pageHome(){
  renderNav();

  const featured = $("#featuredEvents");
  if(featured){
    featured.innerHTML = "";
      DB.events.slice(0, 3).forEach(ev => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <div class="badge">${formatDate(ev.date)} • ${ev.city} • ${ev.venue}</div>
        <h3 class="h-title" style="margin:10px 0 6px 0">${ev.name}</h3>
        <p class="small">${ev.desc}</p>
        <div class="right">
          <a class="btn secondary" href="${basePath}events/event.html?id=${ev.id}">Ver detalle</a>
        </div>
      `;
      featured.appendChild(card);
    });
  }

  const form = $("#homeSearchForm");
  if(form && !form.dataset.bound){
    form.dataset.bound = "1";
    form.addEventListener("submit",(e)=>{
      e.preventDefault();
      const q = ($("#q")?.value || "").trim();
      const date = $("#date")?.value || "";
      const url = new URL(window.location.origin + "/events/events.html");
      if(q) url.searchParams.set("q", q);
      if(date) url.searchParams.set("date", date);
      window.location.href = url.pathname + url.search;
    });
  }
}

function pageEvents(){
  renderNav();

  const list = $("#eventList");
  if(!list) return;

  const q = (getQueryParam("q") || "").toLowerCase();
  const date = getQueryParam("date") || "";

    const filtered = DB.events.filter(ev => {
    const okQ = !q || ev.name.toLowerCase().includes(q);
    const okDate = !date || ev.date === date;
    return okQ && okDate;
  });

  const filterQ = $("#filterQ");
  const filterDate = $("#filterDate");

  if(filterQ) filterQ.value = getQueryParam("q") || "";
  if(filterDate) filterDate.value = date;

  list.innerHTML = "";
  filtered.forEach(ev=>{
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="badge">${formatDate(ev.date)} • ${ev.city}</div>
      <h3 class="h-title" style="margin:10px 0 6px 0">${ev.name}</h3>
      <p class="small">${ev.desc}</p>
      <div class="right">
        <a class="btn secondary" href="${basePath}events/event.html?id=${ev.id}">Ver detalle</a>
      </div>
    `;
    list.appendChild(card);
  });

  const filtersForm = $("#filtersForm");
  if(filtersForm && !filtersForm.dataset.bound){
    filtersForm.dataset.bound = "1";
    filtersForm.addEventListener("submit",(e)=>{
      e.preventDefault();
      const nq = (filterQ?.value || "").trim();
      const nd = filterDate?.value || "";
      const url = new URL(window.location.href);
      url.searchParams.delete("q");
      url.searchParams.delete("date");
      if(nq) url.searchParams.set("q", nq);
      if(nd) url.searchParams.set("date", nd);
      window.location.href = url.pathname + url.search;
    });
  }
}

function pageEventDetail(){
  renderNav();

  const id = Number(getQueryParam("id"));
  const ev = DB.events.find(e=>e.id === id);
  if(!ev){
    $("#eventDetail").innerHTML = `<div class="card">Evento no encontrado.</div>`;
    return;
  }

  $("#evName").textContent = ev.name;
  $("#evMeta").textContent = `${formatDate(ev.date)} • ${ev.venue} • ${ev.city}`;
  $("#evDesc").textContent = ev.desc;

  const artistWrap = $("#artistList");
  artistWrap.innerHTML = "";
  ev.artists.forEach(aid=>{
    const a = DB.artists.find(x=>x.id === aid);
    if(!a) return;

    const item = document.createElement("div");
    item.className = "card";
    item.innerHTML = `
      <div class="badge">${a.genre}</div>
      <h4 class="h-title" style="margin:10px 0 6px 0">${a.name}</h4>
      <p class="small">${a.bio}</p>
      <div class="right">
        <a class="btn secondary" href="${basePath}events/artist.html?id=${a.id}&eventId=${ev.id}">Ver artista</a>
      </div>
    `;
    artistWrap.appendChild(item);
  });

  const passWrap = $("#passList");
  passWrap.innerHTML = "";
  ev.passes.forEach(p=>{
    const item = document.createElement("div");
    item.className = "card";
    item.innerHTML = `
      <div class="badge">${p.name} • €${p.price}</div>
      <p class="small" style="margin:10px 0">${p.includes}</p>
      <div class="row" style="justify-content:flex-end; gap:8px">
        <a class="btn" href="${basePath}events/pass.html?eventId=${ev.id}&passId=${p.id}">Comprar ahora</a>
        <button class="btn secondary add-to-cart" type="button">Añadir al carrito</button>
      </div>
    `;

    const btn = item.querySelector('.add-to-cart');
    btn.addEventListener('click', ()=>{
      // open modal to choose quantity for event pass
      showPassModal(ev.name, p.name, p.price, { eventId: ev.id, passId: p.id });
    });

    passWrap.appendChild(item);
  });

  $("#spotifyBox").innerHTML = `
    <div class="card">
      <div class="badge">Spotify</div>
      <p class="small">Escucha una selección del festival desde el reproductor integrado.</p>
      <button class="btn secondary" type="button" onclick="alert('Reproducción no disponible en este momento')">Play</button>
    </div>
  `;
}

function pageArtistDetail(){
  renderNav();

  const id = Number(getQueryParam("id"));
  const eventId = getQueryParam("eventId");

  const a = DB.artists.find(x=>x.id === id);
  if(!a){
    $("#artistDetail").innerHTML = `<div class="card">Artista no encontrado.</div>`;
    return;
  }

  $("#arName").textContent = a.name;
  $("#arGenre").textContent = a.genre;
  $("#arBio").textContent = a.bio;

  const tracks = $("#trackList");
  tracks.innerHTML = "";
  a.topTracks.forEach(t=>{
    const row = document.createElement("div");
    row.className = "card";
    row.innerHTML = `
      <div class="row" style="justify-content:space-between">
        <div>${t}</div>
        <button class="btn secondary" type="button">Escuchar</button>
      </div>
    `;
    row.querySelector("button").addEventListener("click", ()=>alert("Reproducción no disponible en este momento"));
    tracks.appendChild(row);
  });

  const back = $("#backToEvent");
  back.href = eventId ? `${basePath}events/event.html?id=${eventId}` : `${basePath}events/events.html`;
}

/* -------------------- Firebase Auth helpers -------------------- */
function _firebaseInitialised() {
  return typeof firebase !== 'undefined' && firebase.auth;
}

/** After successful Firebase sign-in, fetch the user profile from the backend
 *  and store it in localStorage for role-based navigation. */
async function _onFirebaseLogin(firebaseUser, requestedRole = null) {
  const token = await firebaseUser.getIdToken();
  try {
    const payload = { id_token: token };
    if (requestedRole) payload.role = requestedRole;

    const res = await fetch(
      (window.__SUBSONIC_API || '/api') + '/login',
      { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
      }
    );
    if (!res.ok) throw new Error('login failed');
    const profile = await res.json();
    setSession({ id: profile.id, email: profile.email, role: profile.role, name: profile.name || firebaseUser.displayName || profile.email.split('@')[0], idToken: token });
    return profile;
  } catch (err) {
    console.error('Subsonic login error', err);
    return null;
  }
}

function _redirectByRole(role) {
  if (role === 'admin') window.location.href = basePath + 'admin/edit-event.html';
  else if (role === 'provider') window.location.href = basePath + 'spaces/provider-spaces.html';
  else window.location.href = basePath + 'client/dashboard.html';
}

function pageLogin(){
  renderNav();

  const form = $("#loginForm");
  const toast = $("#loginToast");
  if(!form || form.dataset.bound) return;

  form.dataset.bound = "1";

  // Email/password login via Firebase
  form.addEventListener("submit", async (e)=>{
    e.preventDefault();

    const email = ($("#email")?.value || "").trim();
    const password = ($("#password")?.value || "");

    if (!_firebaseInitialised()) {
      // Fallback: fake auth for dev without Firebase SDK
      const name = email.split("@")[0];
      setSession({ email, role: "client", name });
      if(toast){ toast.style.display="block"; toast.textContent="Sesión iniciada (sin Firebase). Redirigiendo…"; }
      setTimeout(()=> _redirectByRole("client"), 450);
      return;
    }

    try {
      const cred = await firebase.auth().signInWithEmailAndPassword(email, password);
      const profile = await _onFirebaseLogin(cred.user);
      if (!profile) {
        if(toast){ toast.style.display="block"; toast.textContent="Error: no se pudo verificar la sesión con el servidor."; }
        return;
      }
      if(toast){ toast.style.display="block"; toast.textContent="Sesión iniciada. Redirigiendo…"; }
      setTimeout(()=> _redirectByRole(profile.role || "client"), 450);
    } catch(err) {
      if(toast){ toast.style.display="block"; toast.textContent="Error: " + err.message; }
    }
  });

  // Google Sign-In button
  const googleBtn = $("#googleSignIn");
  if (googleBtn && !googleBtn.dataset.bound) {
    googleBtn.dataset.bound = "1";
    googleBtn.addEventListener("click", async () => {
      if (!_firebaseInitialised()) return;
      try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const cred = await firebase.auth().signInWithPopup(provider);
        const profile = await _onFirebaseLogin(cred.user);
        if (!profile) {
          if(toast){ toast.style.display="block"; toast.textContent="Error: no se pudo verificar la sesión con el servidor."; }
          return;
        }
        if(toast){ toast.style.display="block"; toast.textContent="Sesión iniciada con Google. Redirigiendo…"; }
        setTimeout(()=> _redirectByRole(profile.role || "client"), 450);
      } catch(err) {
        if(toast){ toast.style.display="block"; toast.textContent="Error: " + err.message; }
      }
    });
  }
}

function pageRegister(){
  renderNav();

  const form = $("#registerForm");
  if(!form || form.dataset.bound) return;

  form.dataset.bound = "1";

  // Email/password register via Firebase
  form.addEventListener("submit", async (e)=>{
    e.preventDefault();

    const name = ($("#regName")?.value || "").trim();
    const email = ($("#regEmail")?.value || "").trim();
    const password = ($("#regPassword")?.value || "");

    const role = ($('input[name="regRole"]:checked')?.value || "client");

    if (!_firebaseInitialised()) {
      alert("Firebase no disponible. Registro no posible.");
      return;
    }

    try {
      const cred = await firebase.auth().createUserWithEmailAndPassword(email, password);
      if (name) await cred.user.updateProfile({ displayName: name });
      const profile = await _onFirebaseLogin(cred.user, role);
      if (profile) {
        _redirectByRole(profile.role || role);
      }
    } catch(err) {
      alert("Error: " + err.message);
    }
  });

  // Google Sign-Up button
  const googleBtn = $("#googleSignUp");
  if (googleBtn && !googleBtn.dataset.bound) {
    googleBtn.dataset.bound = "1";
    googleBtn.addEventListener("click", async () => {
      if (!_firebaseInitialised()) return;
      const role = ($('input[name="regRole"]:checked')?.value || "client");
      try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const cred = await firebase.auth().signInWithPopup(provider);
        const profile = await _onFirebaseLogin(cred.user, role);
        if (profile) {
          _redirectByRole(profile.role || role);
        }
      } catch(err) {
        alert("Error: " + err.message);
      }
    });
  }
}

function pageClientDashboard(){
  renderNav();
  requireRole(["client"]);

  const s = getSession();
  $("#helloClient").textContent = `Bienvenido, ${s.name}`;

  const myTickets = DB.tickets.filter(t=>t.userEmail === s.email);
  $("#ticketsCount").textContent = String(myTickets.length);

  // pedidos (si existe panel)
  const myOrders = (window.store?.loadOrders?.() || []).filter(o=>o.userEmail===s.email);
  const ordersCount = $("#ordersCount");
  if(ordersCount) ordersCount.textContent = String(myOrders.length);
}

function pagePass(){
  renderNav();
  requireRole(["client"]);

  const eventId = Number(getQueryParam("eventId"));
  const passId = Number(getQueryParam("passId"));

  const ev = DB.events.find(e=>e.id === eventId);
  if(!ev){
    $("#passBox").innerHTML = `<div class="card">Evento no encontrado.</div>`;
    return;
  }

  const pass = ev.passes.find(p=>p.id === passId) || ev.passes[0];
  $("#pEvent").textContent = ev.name;
  $("#pPass").textContent = `${pass.name} (€${pass.price})`;
  $("#pIncludes").textContent = pass.includes;

  const btn = $("#confirmPurchase");
  if(btn && !btn.dataset.bound){
    btn.dataset.bound = "1";
    btn.addEventListener("click", async ()=>{
      const s = getSession();
      let remoteTicket = null;
      try {
        remoteTicket = await createTicketInApi(eventId, pass.id);
      } catch(error) {
        console.warn("Ticket API fallback:", error);
      }

      const ticket = upsertLocalTicket(remoteTicket || {
        id: Date.now(),
        userEmail: s.email,
        userId: s.id || null,
        eventId,
        passId: pass.id,
        eventName: ev.name,
        passName: pass.name,
        passPrice: pass.price,
        purchaseDate: toLocalISODate(),
        status: "Activa"
      }, s);

      window.location.href = `${basePath}client/purchase-success.html?id=${ticket.id}`;
    });
  }

  $("#backEvent").href = `${basePath}events/event.html?id=${eventId}`;
}

function pagePurchaseSuccess(){
  renderNav();
  requireRole(["client"]);

  const id = Number(getQueryParam("id"));
  const s = getSession();
  const t = DB.tickets.find(x=>x.id === id && x.userEmail === s.email);

  if(!t){
    $("#successBox").innerHTML = `<div class="card">Compra no encontrada.</div>`;
    return;
  }

  const info = getTicketDisplayData(t, s);
  $("#sEvent").textContent = info.eventName;
  $("#sPass").textContent = info.passName;
  $("#sCode").textContent = info.code;
  if($("#sLocation")) $("#sLocation").textContent = info.location;
  if($("#sEventDate")) $("#sEventDate").textContent = info.eventDateFormatted;

  const downloadBtn = $("#downloadSuccessPdf");
  if(downloadBtn && !downloadBtn.dataset.bound){
    downloadBtn.dataset.bound = "1";
    downloadBtn.addEventListener("click", () => downloadTicketPdf(t));
  }

  $("#goTickets").href = `${basePath}client/tickets.html`;
  $("#goEvents").href = `${basePath}events/events.html`;
}

function pageTickets(){
  renderNav();
  requireRole(["client"]);

  const s = getSession();
  const tbody = $("#ticketsTableBody");
  if(!tbody) return;

  const mine = DB.tickets.filter(t=>t.userEmail === s.email);
  tbody.innerHTML = "";

  mine.forEach(t=>{
    const info = getTicketDisplayData(t, s);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${htmlEscape(info.eventName)}</td>
      <td>${htmlEscape(info.passName)}</td>
      <td>${htmlEscape(info.purchaseDateFormatted)}</td>
      <td>${htmlEscape(info.status)}</td>
      <td><a class="btn secondary" href="${basePath}client/ticket.html?id=${t.id}">Ver detalle</a></td>
    `;
    tbody.appendChild(tr);
  });
}

async function pageTicketDetail(){
  renderNav();
  requireRole(["client"]);

  const s = getSession();
  const id = Number(getQueryParam("id"));
  let t = DB.tickets.find(x=>x.id === id && x.userEmail === s.email);

  if(!t){
    try {
      const remoteTicket = await getTicketFromApi(id);
      t = upsertLocalTicket(remoteTicket, s);
    } catch(error) {
      $("#ticketBox").innerHTML = `<div class="card">Entrada no encontrada.</div>`;
      return;
    }
  }

  const info = getTicketDisplayData(t, s);
  $("#tEvent").textContent = info.eventName;
  $("#tPass").textContent = info.passName;
  $("#tDate").textContent = info.purchaseDateFormatted;
  $("#tStatus").textContent = info.status;
  $("#tCode").textContent = info.code;
  if($("#tEventDate")) $("#tEventDate").textContent = info.eventDateFormatted;
  if($("#tLocation")) $("#tLocation").textContent = info.location;
  if($("#tPrice")) $("#tPrice").textContent = info.priceFormatted;

  const btn = $("#cancelTicket");
  const toast = $("#ticketToast");
  if(btn) btn.disabled = (info.status !== "Activa");

  if(btn && !btn.dataset.bound){
    btn.dataset.bound = "1";
    btn.addEventListener("click", ()=>{
      if(btn.disabled) return;
      if(confirm("¿Solicitar cancelación?")){
        t.status = "Cancelada";
        $("#tStatus").textContent = t.status;
        btn.disabled = true;
        window.saveTickets?.();

        if(toast){
          toast.style.display = "block";
          toast.textContent = "Cancelación registrada.";
        }
      }
    });
  }

  const downloadBtn = $("#downloadTicketPdf");
  if(downloadBtn && !downloadBtn.dataset.bound){
    downloadBtn.dataset.bound = "1";
    downloadBtn.addEventListener("click", () => downloadTicketPdf(t));
  }

  // Add to cart from pass page
  const addToCartBtn = $("#addToCartBtn");
  if(addToCartBtn && !addToCartBtn.dataset.bound){
    addToCartBtn.dataset.bound = '1';
    addToCartBtn.addEventListener('click', ()=>{
      const ev = findEventForTicket(t);
      const pass = getPassForTicket(t, ev);
      if(ev && pass) showPassModal(ev.name, pass.name, pass.price, { eventId: ev.id, passId: pass.id });
    });
  }

  $("#backTickets").href = `${basePath}client/tickets.html`;
}

function pageProfile(){
  renderNav();
  requireRole(["client"]);

  if ($("#name") && $("#email")) {
    return;
  }

  const s = getSession();
  const nameInput = $("#pName");
  const emailInput = $("#pEmail");
  if (!nameInput || !emailInput) {
    return;
  }

  nameInput.value = s.name || "";
  emailInput.value = s.email || "";

  const form = $("#profileForm");
  if(form && !form.dataset.bound){
    form.dataset.bound = "1";
    form.addEventListener("submit",(e)=>{
      e.preventDefault();
      s.name = (nameInput.value || "").trim() || s.name;
      setSession(s);
      alert("Cambios guardados.");
      window.location.href = basePath + "client/dashboard.html";
    });
  }

  const backDash = $("#backDash");
  if (backDash) backDash.href = `${basePath}client/dashboard.html`;
}

function pageProviderSpaces(){
  renderNav();
  requireRole(["provider"]);

  const s = getSession();
  $("#helloProvider").textContent = `Panel Proveedor: ${s.name}`;

  const form = $("#spaceFiltersForm");
  const list = $("#spacesList");
  const sel = $("#spEvent");

  if(sel && !sel.dataset.filled){
    sel.dataset.filled = "1";
    DB.events.forEach(ev=>{
      const opt = document.createElement("option");
      opt.value = ev.id;
      opt.textContent = ev.name;
      sel.appendChild(opt);
    });
  }

  function render(){
    const type = $("#spType").value;
    const status = $("#spStatus").value;
    const eventId = Number($("#spEvent").value) || 0;

    const filtered = DB.spaces.filter(sp=>{
      const okType = !type || sp.type === type;
      const okStatus = !status || sp.status === status;
      const okEvent = !eventId || sp.eventId === eventId;
      return okType && okStatus && okEvent;
    });

    list.innerHTML = "";
    filtered.forEach(sp=>{
      const ev = DB.events.find(e=>e.id === sp.eventId);
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <div class="badge">${sp.type} • ${sp.size} • €${sp.pricePerDay}/día</div>
        <h3 class="h-title" style="margin:10px 0 6px 0">${sp.location}</h3>
        <p class="small">
          Evento: <strong>${ev ? ev.name : "—"}</strong><br/>
          Estado: <strong style="color:${sp.status==="Disponible" ? "var(--ok)" : "var(--warn)"}">${sp.status}</strong><br/>
          Servicios: ${sp.services}
        </p>
        <div class="right">
          <a class="btn secondary" href="${basePath}spaces/space.html?id=${sp.id}">Ver ficha</a>
        </div>
      `;
      list.appendChild(card);
    });
  }

  if(form && !form.dataset.bound){
    form.dataset.bound = "1";
    form.addEventListener("submit",(e)=>{
      e.preventDefault();
      render();
    });
  }

  render();
}

function pageSpaceDetail(){
  renderNav();
  requireRole(["provider"]);

  const id = Number(getQueryParam("id"));
  const sp = DB.spaces.find(x=>x.id === id);

  if(!sp){
    $("#spaceBox").innerHTML = `<div class="card">Espacio no encontrado.</div>`;
    return;
  }

  const ev = DB.events.find(e=>e.id === sp.eventId);

  $("#spTitle").textContent = `${sp.type} — ${sp.location}`;
  $("#spMeta").textContent = `${ev ? ev.name : "Evento"} • ${sp.size} • €${sp.pricePerDay}/día`;
  $("#spServices").textContent = sp.services;
  $("#spNotes").textContent = sp.notes;
  $("#spStatus").textContent = sp.status;

  const btn = $("#goRequest");
  btn.href = `${basePath}spaces/space-request.html?id=${sp.id}`;
  btn.textContent = sp.status === "Disponible" ? "Solicitar alquiler" : "No disponible";
  btn.style.pointerEvents = sp.status === "Disponible" ? "auto" : "none";
  btn.classList.toggle("secondary", sp.status !== "Disponible");

  $("#backSpaces").href = `${basePath}spaces/provider-spaces.html`;
}

function pageSpaceRequest(){
  renderNav();
  requireRole(["provider"]);

  const id = Number(getQueryParam("id"));
  const sp = DB.spaces.find(x=>x.id === id);

  if(!sp){
    $("#reqBox").innerHTML = `<div class="card">Espacio no encontrado.</div>`;
    return;
  }

  $("#reqSpace").textContent = `${sp.type} — ${sp.location} (${sp.size})`;
  $("#reqPrice").textContent = `€${sp.pricePerDay}/día`;

  const form = $("#requestForm");
  if(form && !form.dataset.bound){
    form.dataset.bound = "1";
    form.addEventListener("submit",(e)=>{
      e.preventDefault();
      alert("Solicitud enviada.");
      window.location.href = basePath + "spaces/provider-spaces.html";
    });
  }

  $("#backSpace").href = `${basePath}spaces/space.html?id=${sp.id}`;
}

/* ============================
   STORE / CART / ORDERS / HELP
   ============================ */

function pageStore(){
  renderNav();

  const grid = $("#productGrid");
  if(!grid) return;

  const cat = getQueryParam("cat") || "";
  const filtered = DB.products.filter(p => !cat || p.category === cat || p.gender === cat);

  // New store layout: large visual cards inspired by Tomorrowland
  grid.classList.remove('grid-3');
  grid.classList.add('store-grid');
  grid.innerHTML = "";

  filtered.forEach(p=>{
    const card = document.createElement("article");
    card.className = "store-card card";
    const img = (p.images && p.images.length) ? p.images[0] : '../fotos_principales/principal.jpg';
    card.innerHTML = `
      <div class="store-media" style="background-image:url('${img}')"></div>
      <div class="store-overlay">
        <div>
          <div class="badge">${p.category} • ${p.gender}</div>
          <h3 class="h-title">${p.name}</h3>
          <p class="small">${p.desc}</p>
        </div>
        <div class="store-actions">
          <strong class="price">${money(p.price)}</strong>
          <div class="row">
            <a class="btn" href="${basePath}store/product.html?id=${p.id}">Ver</a>
            <button class="btn secondary add-quick" data-id="${p.id}">Añadir</button>
          </div>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });

  // bind quick add buttons
  grid.querySelectorAll('.add-quick').forEach(b=>{
    if(b.dataset.bound) return;
    b.dataset.bound = '1';
    b.addEventListener('click', ()=>{
      const pid = Number(b.getAttribute('data-id'));
      const prod = DB.products.find(x=>x.id===pid);
      if(!prod) return;
      const cart = window.store.loadCart();
      const key = `${prod.id}_M`;
      const item = cart.find(x=>x.key===key);
      if(item) item.qty += 1; else cart.push({ key, productId:prod.id, size:'M', qty:1 });
      window.store.saveCart(cart);
      const newCount = cart.reduce((a,i)=>a+(i.qty||0),0);
      const badge = $("#cartCount"); if(badge) badge.textContent = String(newCount);
      const navLink = document.getElementById('navCartLink'); if(navLink) navLink.textContent = `Carrito (${newCount})`;
      animateCartLink();
      showToastMini('Añadido al carrito');
    });
  });

  const chips = document.querySelectorAll("[data-cat]");
  chips.forEach(ch=>{
    if(ch.dataset.bound) return;
    ch.dataset.bound = "1";
    ch.addEventListener("click", ()=>{
      const v = ch.getAttribute("data-cat");
      window.location.href = v ? `${basePath}store/store.html?cat=${encodeURIComponent(v)}` : `${basePath}store/store.html`;
    });
  });

  const cart = window.store?.loadCart?.() || [];
  const badge = $("#cartCount");
  if(badge) badge.textContent = String(cart.reduce((a,i)=>a+(i.qty||0),0));
}

function pageProduct(){
  renderNav();

  const id = Number(getQueryParam("id"));
  const p = DB.products.find(x=>x.id===id);
  if(!p){
    $("#productBox").innerHTML = `<div class="card">Producto no encontrado.</div>`;
    return;
  }
  // Enhanced product detail view
  $("#prName").textContent = p.name;
  $("#prDesc").textContent = p.desc;
  $("#prPrice").textContent = money(p.price);

  const main = $("#prMainImg");
  const thumbs = $("#prThumbs");
  if(main) main.src = (p.images && p.images[0]) || '../fotos_principales/principal.jpg';

  if(thumbs){
    thumbs.innerHTML = "";
    p.images.forEach(src=>{
      const b = document.createElement("img");
      b.className = 'thumb-img';
      b.style.width = '84px';
      b.style.height = '84px';
      b.style.objectFit = 'cover';
      b.style.borderRadius = '10px';
      b.style.cursor = 'pointer';
      b.src = src;
      b.addEventListener("click", ()=> { if(main) main.src = src; });
      thumbs.appendChild(b);
    });
  }

  const sel = $("#prSize");
  if(sel){
    sel.innerHTML = "";
    (p.sizes || ['M']).forEach(s=>{
      const opt = document.createElement("option");
      opt.value = s;
      opt.textContent = s;
      sel.appendChild(opt);
    });
  }

  const btn = $("#addToCart");
  if(btn && !btn.dataset.bound){
    btn.dataset.bound="1";
    btn.addEventListener("click", ()=>{
      const size = $("#prSize")?.value || "M";
      const qty = Number($("#prQty")?.value) || 1;

      const cart = window.store.loadCart();
      const key = `${p.id}_${size}`;
      const item = cart.find(x=>x.key===key);

      if(item) item.qty += qty;
      else cart.push({ key, productId:p.id, size, qty });

      window.store.saveCart(cart);
      const newCount = cart.reduce((a,i)=>a+(i.qty||0),0);
      const navLink = document.getElementById('navCartLink'); if(navLink) navLink.textContent = `Carrito (${newCount})`;
      animateCartLink();
      showToastMini("Producto añadido al carrito");
      setTimeout(()=> window.location.href = basePath + "store/cart.html", 700);
    });
  }
}

function pageCart(){
  renderNav();

  const ticketList = $("#ticketCartList");
  const productList = $("#productCartList");
  const emptyState = $("#cartEmptyState");
  const checkoutContent = $("#checkoutContent");
  const checkoutCopy = $("#checkoutCopy");
  const ticketSection = $("#cartTicketsSection");
  const productSection = $("#cartProductsSection");
  const deliveryBlock = $("#deliveryBlock");
  const ticketSubtotalEl = $("#ticketSubtotal");
  const productSubtotalEl = $("#productSubtotal");
  const totalEl = $("#cartTotal");
  const orderCodeEl = $("#cartOrderCode");
  const checkoutNote = $("#checkoutNote");
  if(!ticketList || !productList || !totalEl) return;

  const getCartTotals = (items) => items.reduce((acc, it) => {
    if(it.type === "ticket"){
      const ev = it.eventId ? DB.events.find(x => x.id === Number(it.eventId)) : null;
      const pass = ev && it.passId ? ev.passes.find(p => p.id === Number(it.passId)) : null;
      const price = it.price != null ? Number(it.price) : Number(pass?.price || 0);
      acc.ticketTotal += price * (Number(it.qty) || 0);
      acc.ticketQty += Number(it.qty) || 0;
      return acc;
    }

    if(it.productId){
      const product = DB.products.find(x => x.id === it.productId);
      const price = Number(product?.price || it.price || 0);
      acc.productTotal += price * (Number(it.qty) || 0);
      acc.productQty += Number(it.qty) || 0;
    }

    return acc;
  }, { ticketTotal: 0, productTotal: 0, ticketQty: 0, productQty: 0 });

  const updateCartQty = (index, nextQty) => {
    const nextCart = window.store.loadCart();
    const qty = Math.max(1, Number(nextQty) || 1);
    if(!nextCart[index]) return;
    nextCart[index].qty = qty;
    window.store.saveCart(nextCart);
    pageCart();
  };

  const removeCartItem = (index) => {
    const nextCart = window.store.loadCart();
    nextCart.splice(index, 1);
    window.store.saveCart(nextCart);
    pageCart();
  };

  const attachQtyControls = (row, index, qty) => {
    const input = row.querySelector(".qty-input");
    row.querySelector(".qty-minus")?.addEventListener("click", () => updateCartQty(index, Math.max(1, qty - 1)));
    row.querySelector(".qty-plus")?.addEventListener("click", () => updateCartQty(index, qty + 1));
    input?.addEventListener("change", () => updateCartQty(index, input.value));
    row.querySelector(".remove-item")?.addEventListener("click", () => removeCartItem(index));
  };

  const renderTicketItem = (it, idx) => {
    const ev = it.eventId ? DB.events.find(x => x.id === Number(it.eventId)) : null;
    const pass = ev && it.passId ? ev.passes.find(p => p.id === Number(it.passId)) : null;
    const price = it.price != null ? Number(it.price) : Number(pass?.price || 0);
    const qty = Math.max(1, Number(it.qty) || 1);
    const sub = price * qty;
    const eventTitle = ev ? ev.name : (it.eventName || "Evento Subsonic");
    const passTitle = pass ? pass.name : (it.passName || "Entrada");
    const eventPlace = ev ? `${ev.venue}, ${ev.city}` : "Recinto por confirmar";
    const eventDate = ev?.date ? formatDate(ev.date) : "Fecha por confirmar";
    const row = document.createElement("article");
    row.className = "checkout-item";
    row.innerHTML = `
      <div>
        <div class="badge">${htmlEscape(passTitle)}</div>
        <div class="checkout-item-title">${htmlEscape(eventTitle)}</div>
        <div class="checkout-item-meta">
          <span>${htmlEscape(eventDate)}</span>
          <span>${htmlEscape(eventPlace)}</span>
          <span>${money(price)} unidad</span>
        </div>
      </div>
      <div class="checkout-item-actions">
        <strong>${money(sub)}</strong>
        <div class="qty-control" aria-label="Cantidad de ${htmlEscape(eventTitle)}">
          <button class="qty-minus" type="button" aria-label="Restar entrada">-</button>
          <input class="qty-input" type="number" min="1" value="${qty}" aria-label="Cantidad">
          <button class="qty-plus" type="button" aria-label="Sumar entrada">+</button>
        </div>
        <button class="btn danger remove-item" type="button">Quitar</button>
      </div>
    `;
    attachQtyControls(row, idx, qty);
    ticketList.appendChild(row);
  };

  const renderProductItem = (it, idx) => {
    const product = DB.products.find(x => x.id === it.productId);
    if(!product) return;
    const qty = Math.max(1, Number(it.qty) || 1);
    const price = Number(product.price || it.price || 0);
    const sub = price * qty;
    const row = document.createElement("article");
    row.className = "checkout-item";
    row.innerHTML = `
      <div>
        <div class="badge">Talla ${htmlEscape(it.size || "-")}</div>
        <div class="checkout-item-title">${htmlEscape(product.name)}</div>
        <div class="checkout-item-meta">
          <span>${htmlEscape(product.category || "Merchandising")}</span>
          <span>${money(price)} unidad</span>
          <span>Entrega estimada 2-3 días</span>
        </div>
      </div>
      <div class="checkout-item-actions">
        <strong>${money(sub)}</strong>
        <div class="qty-control" aria-label="Cantidad de ${htmlEscape(product.name)}">
          <button class="qty-minus" type="button" aria-label="Restar producto">-</button>
          <input class="qty-input" type="number" min="1" value="${qty}" aria-label="Cantidad">
          <button class="qty-plus" type="button" aria-label="Sumar producto">+</button>
        </div>
        <button class="btn danger remove-item" type="button">Quitar</button>
      </div>
    `;
    attachQtyControls(row, idx, qty);
    productList.appendChild(row);
  };

  const hydrateDeliveryForm = () => {
    if(!deliveryBlock || deliveryBlock.dataset.hydrated) return;
    deliveryBlock.dataset.hydrated = "1";
    const s = getSession() || {};
    let saved = {};
    try{ saved = JSON.parse(localStorage.getItem("subsonic_checkout_delivery") || "{}"); }catch(e){}
    $("#deliveryName").value = saved.name || s.name || "";
    $("#deliveryPhone").value = saved.phone || "";
    $("#deliveryAddress").value = saved.address || "";
    $("#deliveryCity").value = saved.city || "";
    $("#deliveryZip").value = saved.zip || "";
  };

  const readDeliveryForm = () => ({
    name: ($("#deliveryName")?.value || "").trim(),
    phone: ($("#deliveryPhone")?.value || "").trim(),
    address: ($("#deliveryAddress")?.value || "").trim(),
    city: ($("#deliveryCity")?.value || "").trim(),
    zip: ($("#deliveryZip")?.value || "").trim()
  });

  const cart = window.store.loadCart();
  const ticketsForCart = cart.filter(i => i.type === "ticket");
  const productsForOrder = cart.filter(i => i.productId);
  const totals = getCartTotals(cart);
  const total = totals.ticketTotal + totals.productTotal;
  const hasTickets = ticketsForCart.length > 0;
  const hasProducts = productsForOrder.length > 0;

  if(cart.length === 0){
    if(emptyState) emptyState.hidden = false;
    if(checkoutContent) checkoutContent.hidden = true;
    localStorage.removeItem("subsonic_cart_draft_id");
    return;
  }

  if(emptyState) emptyState.hidden = true;
  if(checkoutContent) checkoutContent.hidden = false;
  if(ticketSection) ticketSection.hidden = !hasTickets;
  if(productSection) productSection.hidden = !hasProducts;
  if(deliveryBlock) deliveryBlock.hidden = !hasProducts;

  ticketList.innerHTML = "";
  productList.innerHTML = "";
  cart.forEach((it, idx) => {
    if(it.type === "ticket") renderTicketItem(it, idx);
    if(it.productId) renderProductItem(it, idx);
  });

  if(checkoutCopy){
    checkoutCopy.textContent = hasTickets && hasProducts
      ? "Recibirás las entradas al instante y el pedido de tienda con entrega estimada."
      : hasTickets
        ? "Tus entradas se guardarán en Mis entradas tras confirmar la compra."
        : "Tu pedido aparecerá en Mis pedidos con seguimiento y entrega estimada.";
  }

  let draftId = localStorage.getItem("subsonic_cart_draft_id");
  if(!draftId){
    draftId = `SUB-${String(Date.now()).slice(-8)}`;
    localStorage.setItem("subsonic_cart_draft_id", draftId);
  }

  if(orderCodeEl) orderCodeEl.textContent = `Pedido ${draftId}`;
  if(ticketSubtotalEl) ticketSubtotalEl.textContent = money(totals.ticketTotal);
  if(productSubtotalEl) productSubtotalEl.textContent = money(totals.productTotal);
  totalEl.textContent = money(total);
  if(checkoutNote){
    checkoutNote.textContent = hasTickets && hasProducts
      ? "Entradas digitales al instante. Envío estándar incluido para tienda."
      : hasTickets
        ? "Las entradas estarán disponibles al instante en tu perfil."
        : "Envío estándar incluido y seguimiento guardado en Mis pedidos.";
  }

  hydrateDeliveryForm();

  document.querySelectorAll(".payment-option").forEach(option => {
    option.onchange = () => {
      document.querySelectorAll(".payment-option").forEach(item => item.classList.toggle("active", item.querySelector("input")?.checked));
    };
  });

  const clearCart = $("#clearCart");
  if(clearCart){
    clearCart.onclick = () => {
      if(confirm("¿Vaciar todo el carrito?")){
        window.store.saveCart([]);
        localStorage.removeItem("subsonic_cart_draft_id");
        pageCart();
      }
    };
  }

  const checkout = $("#checkout");
  if(checkout){
    checkout.onclick = async () => {
      const s = getSession();
      if(!s || s.role !== "client"){
        alert("Necesitas iniciar sesión como Cliente para comprar.");
        window.location.href = basePath + "auth/login.html";
        return;
      }

      const currentCart = window.store.loadCart();
      const currentTotals = getCartTotals(currentCart);
      const currentTotal = currentTotals.ticketTotal + currentTotals.productTotal;
      const currentProducts = currentCart.filter(i => i.productId);
      const currentTickets = currentCart.filter(i => i.type === "ticket");
      if(currentCart.length === 0){
        alert("Carrito vacío.");
        return;
      }

      const delivery = readDeliveryForm();
      if(currentProducts.length && (!delivery.name || !delivery.address || !delivery.city || !delivery.zip)){
        alert("Completa nombre, dirección, ciudad y código postal para enviar el pedido.");
        return;
      }
      if(currentProducts.length){
        localStorage.setItem("subsonic_checkout_delivery", JSON.stringify(delivery));
      }

      const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || "card";
      const proceed = confirm(`Total a pagar: ${money(currentTotal)}\n\n¿Confirmar compra?`);
      if(!proceed) return;

      const orders = window.store.loadOrders();
      const createdOrderIds = [];
      const createdTicketIds = [];
      const apiWarnings = [];

      if(currentProducts.length){
        const oid = Date.now();
        const deliveryDays = randomDeliveryDays();
        const orderTotal = currentProducts.reduce((sum, item) => {
          const product = DB.products.find(p => p.id === item.productId);
          return sum + ((product?.price || 0) * (item.qty || 0));
        }, 0);
        orders.push({
          id: oid,
          userEmail: s.email,
          date: toLocalISODate(),
          eta: toLocalISODate(addDays(new Date(), deliveryDays)),
          deliveryDays,
          trackingCode: `SUBSHOP-${String(oid).slice(-8)}`,
          status: "Preparando pedido",
          total: orderTotal,
          paymentMethod,
          shippingMethod: "Envío estándar",
          deliveryAddress: delivery,
          items: currentProducts
        });
        createdOrderIds.push(oid);
      }

      for(const ti of currentTickets){
        const ev = ti.eventId ? DB.events.find(e => e.id === Number(ti.eventId)) : null;
        const pass = ev && ti.passId ? ev.passes.find(p => p.id === Number(ti.passId)) : null;
        const qty = Math.max(1, Number(ti.qty) || 1);
        for(let i = 0; i < qty; i++){
          let remoteTicket = null;
          if(ti.eventId && ti.passId){
            try {
              remoteTicket = await createTicketInApi(ti.eventId, ti.passId);
            } catch(error) {
              console.warn("Ticket API fallback:", error);
              apiWarnings.push(error.message);
            }
          }

          const localTicket = upsertLocalTicket(remoteTicket || {
            id: Date.now() + Math.floor(Math.random() * 1000) + i,
            userId: s.id || null,
            userEmail: s.email,
            eventId: ti.eventId ? Number(ti.eventId) : null,
            passId: ti.passId ? Number(ti.passId) : null,
            eventName: ev ? ev.name : (ti.eventName || null),
            passName: pass ? pass.name : (ti.passName || "Entrada"),
            passPrice: pass?.price ?? ti.price ?? 0,
            purchaseDate: toLocalISODate(),
            status: "Activa"
          }, s);
          createdTicketIds.push(localTicket.id);
        }
      }

      window.store.saveOrders(orders);
      window.store.saveCart([]);
      window.saveTickets?.();

      const lastPurchase = {
        id: Date.now(),
        userEmail: s.email,
        date: toLocalISODate(),
        total: currentTotal,
        orders: createdOrderIds,
        tickets: createdTicketIds
      };
      try{ localStorage.setItem("subsonic_last_purchase", JSON.stringify(lastPurchase)); }catch(e){}
      localStorage.removeItem("subsonic_cart_draft_id");

      if(apiWarnings.length){
        alert("Compra confirmada: entradas guardadas en este navegador. Cuando haya sesión de servidor válida, también se guardarán en tu perfil online.");
      } else {
        alert("Compra confirmada: entradas y pedidos procesados.");
      }
      window.location.href = `${basePath}client/purchase-summary.html?id=${lastPurchase.id}`;
    };
  }
}

function pageOrders(){
  renderNav();
  requireRole(["client"]);

  const s = getSession();
  const list = $("#ordersList");
  if(!list) return;

  const orders = window.store.loadOrders().filter(o=>o.userEmail===s.email);

  list.innerHTML = "";
  if(orders.length === 0){
    list.innerHTML = `<div class="card">No hay pedidos todavía.</div>`;
    return;
  }

  orders.forEach(o=>{
    const card = document.createElement("div");
    card.className="card";
    card.innerHTML = `
      <div class="badge">📦 Pedido #${o.id}</div>
      <h3 class="h-title" style="margin:10px 0 6px 0">Estado: ${o.status}</h3>
      <p class="small">Fecha: ${formatDate(o.date)} • Entrega estimada: ${formatDate(o.eta)}</p>
      <div class="right">
        <button class="btn secondary" type="button">Reclamar</button>
      </div>
    `;
    card.querySelector("button").addEventListener("click", ()=>{
      alert("Reclamación enviada.");
    });
    list.appendChild(card);
  });
}

function getOrderTotal(order){
  return order.total ?? (order.items || []).reduce((sum, item) => {
    const product = DB.products.find(p => p.id === item.productId);
    return sum + ((product?.price || item.price || 0) * (item.qty || 1));
  }, 0);
}

function renderLocalOrderCard(order){
  const itemsHtml = (order.items || []).map(item => {
    const product = DB.products.find(p => p.id === item.productId);
    const price = product?.price || item.price || 0;
    return `
      <div class="row" style="justify-content:space-between">
        <span class="small">${htmlEscape(product?.name || item.productName || "Producto")} ${item.size ? `- Talla ${htmlEscape(item.size)}` : ""} x ${htmlEscape(item.qty || 1)}</span>
        <strong>${money(price * (item.qty || 1))}</strong>
      </div>
    `;
  }).join("");

  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <div class="badge">Pedido #${htmlEscape(order.id)}</div>
    <p class="small" style="margin:10px 0 6px 0"><strong>Estado:</strong> ${htmlEscape(order.status || "Preparando pedido")}</p>
    <p class="small">Fecha: ${htmlEscape(formatDate(order.date))} - Entrega estimada: ${htmlEscape(formatDate(order.eta))} (${htmlEscape(order.deliveryDays || "2-3")} días)</p>
    <p class="small">Seguimiento: <strong>${htmlEscape(order.trackingCode || `SUBSHOP-${String(order.id).slice(-8)}`)}</strong></p>
    <div class="hr"></div>
    ${itemsHtml || '<p class="small">Sin productos asociados.</p>'}
    <div class="hr"></div>
    <div class="row" style="justify-content:space-between"><strong>Total</strong><strong>${money(getOrderTotal(order))}</strong></div>
    <div class="right">
      <button class="btn secondary" type="button">Reclamar</button>
    </div>
  `;
  card.querySelector("button").addEventListener("click", () => {
    alert("Reclamación enviada.");
  });
  return card;
}

function pageOrdersEnhanced(){
  renderNav();
  requireRole(["client"]);

  const session = getSession();
  const list = $("#ordersList");
  if(!list) return;

  const storedOrders = (window.store?.loadOrders?.() || []).map(normalizeStoreOrder);
  window.store?.saveOrders?.(storedOrders);
  const orders = storedOrders
    .filter(order => order.userEmail === session.email)
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")) || Number(b.id || 0) - Number(a.id || 0));

  list.innerHTML = "";
  if(!orders.length){
    list.innerHTML = `<div class="card">No hay pedidos todavía.</div>`;
    return;
  }

  orders.forEach(order => list.appendChild(renderLocalOrderCard(order)));
}

function pageHelp(){
  renderNav();

  const form = $("#helpForm");
  if(form && !form.dataset.bound){
    form.dataset.bound="1";
    form.addEventListener("submit",(e)=>{
      e.preventDefault();
      alert("Mensaje enviado. Te responderemos por email.");
      form.reset();
    });
  }
}

function pageForgotPassword(){
  renderNav();

  const form = $("#forgotForm");
  if(!form || form.dataset.bound) return;

  form.dataset.bound="1";
  form.addEventListener("submit",(e)=>{
    e.preventDefault();
    alert("Si el correo existe, recibirás instrucciones.");
    window.location.href = basePath + "auth/login.html";
  });
}

/* -------------------- Bootstrap per page -------------------- */
document.addEventListener("DOMContentLoaded", ()=>{
  renderNav();

  const page = document.body.dataset.page;

  const routes = {
    home: pageHome,
    events: pageEvents,
    event: pageEventDetail,
    artist: pageArtistDetail,
    artists: pageArtists,
    search: pageSearch,
    login: pageLogin,
    register: pageRegister,

    // OJO: tu HTML es client_dashboard.html
    clientDash: pageClientDashboard,
    profile: pageProfile,
    pass: pagePass,
    ticketsPurchase: pageTicketsPurchase,
    changePassword: pageChangePassword,
    purchaseSuccess: pagePurchaseSuccess,
    purchaseSummary: pagePurchaseSummaryEnhanced,
    tickets: pageTickets,
    ticket: pageTicketDetail,

    providerSpaces: pageProviderSpaces,
    space: pageSpaceDetail,
    spaceRequest: pageSpaceRequest,

    // Store pages
    store: pageStore,
    product: pageProduct,
    cart: pageCart,
    orders: pageOrdersEnhanced,
    help: pageHelp,
    forgot: pageForgotPassword,

    // Admin
    adminCreateEvent: pageAdminCreateEvent,
    adminEditEvent: pageAdminEditEvent,
    adminEntries: pageAdminEntries,
    adminArtists: pageAdminArtists,
    adminAddSpace: pageAdminAddSpace,
    adminManageSpaces: pageAdminManageSpaces,
    adminAddProduct: pageAdminAddProduct,
    adminEditProduct: pageAdminEditProduct,
  };

  routes[page]?.();
});

/* =========================================================
   Parallax & Hero effects for home page
   ========================================================= */
function initHeroParallax() {
  const heroBg = document.querySelector('.heroTL-bg');
  const heroOverlay = document.querySelector('.heroTL-overlay');
  
  if(!heroBg || !heroOverlay) return;
  
  let scrollPos = 0;
  let ticking = false;
  
  function updateParallax() {
    scrollPos = window.pageYOffset;
    
    // Parallax effect - move background slower than scroll
    if(scrollPos < window.innerHeight) {
      heroBg.style.transform = `translateY(${scrollPos * 0.5}px)`;
    }
    
    // Fade overlay content on scroll
    const fadeStart = window.innerHeight * 0.5;
    const fadeEnd = window.innerHeight * 0.9;
    
    if(scrollPos < fadeStart) {
      heroOverlay.style.opacity = 1;
    } else if(scrollPos > fadeEnd) {
      heroOverlay.style.opacity = 0;
    } else {
      const fadeProgress = (scrollPos - fadeStart) / (fadeEnd - fadeStart);
      heroOverlay.style.opacity = 1 - fadeProgress;
    }
    
    ticking = false;
  }
  
  function onScroll() {
    if(!ticking) {
      window.requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }
  
  window.addEventListener('scroll', onScroll, { passive: true });
  updateParallax(); // Initial call
}

// Initialize parallax when DOM is ready
if(document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHeroParallax);
} else {
  initHeroParallax();
}

/* -------------------- Cart helpers for tickets -------------------- */
function animateCartLink(){
  const el = document.getElementById("navCartLink");
  if(!el) return;
  el.classList.add("bump");
  el.addEventListener("animationend", ()=> el.classList.remove("bump"), { once: true });
}

function addTicketToCart(eventId, passId, qty){
  const cart = window.store.loadCart();
  // Backwards compatible: if eventId is an object (opts), normalize
  if(typeof eventId === 'object' && eventId !== null){
    const opts = eventId;
    const key = opts.key || `ticket_${opts.eventId || opts.eventName}_${opts.passId || opts.passName}`;
    const existing = cart.find(i=>i.key===key && i.type==='ticket');
    if(existing){ existing.qty = (existing.qty||0) + (opts.qty||1); }
    else cart.push({ key, type:'ticket', eventId: opts.eventId || null, eventName: opts.eventName || null, passId: opts.passId || null, passName: opts.passName || null, price: opts.price || null, qty: opts.qty || 1 });
    window.store.saveCart(cart);
    animateCartLink();
    return;
  }

  const key = `ticket_${eventId}_${passId}`;
  const existing = cart.find(i=>i.key===key && i.type==='ticket');
  if(existing){
    existing.qty = (existing.qty || 0) + (qty || 1);
  } else {
    cart.push({ key, type: 'ticket', eventId: eventId || null, passId: passId || null, qty: qty || 1 });
  }
  window.store.saveCart(cart);
  animateCartLink();
}

function addFestivalPassToCart(eventName, passName, price, qty){
  const opts = { eventId: null, eventName: eventName, passId: null, passName: passName, price: price || 0, qty: qty || 1 };
  addTicketToCart(opts);
  // After addTicketToCart runs, it already calls animateCartLink
  // Just update the cart counter and nav text, then animate
  const cart = window.store.loadCart();
  const newCount = cart.reduce((a,i)=>a+(i.qty||0),0);
  const navLink = document.getElementById('navCartLink');
  if(navLink) navLink.textContent = `Carrito (${newCount})`;
  animateCartLink();
}

/* -------------------- UI: Toast & Modal -------------------- */
function showToastMini(msg, timeout = 2200){
  let t = document.querySelector('.toast-mini');
  if(!t){
    t = document.createElement('div');
    t.className = 'toast-mini';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  requestAnimationFrame(()=> t.classList.add('show'));
  if(t._hideTimer) clearTimeout(t._hideTimer);
  t._hideTimer = setTimeout(()=>{
    t.classList.remove('show');
  }, timeout);
}

function showPassModal(eventName, passName, price, meta){
  // meta optional { eventId, passId }
  // create overlay
  let ov = document.querySelector('.modal-overlay');
  if(ov) ov.remove();
  ov = document.createElement('div');
  ov.className = 'modal-overlay';

  const card = document.createElement('div');
  card.className = 'modal-card';
  card.innerHTML = `
    <h3 class="modal-title">${eventName} — ${passName}</h3>
    <div class="modal-note">Precio unitario: ${money(price)}</div>
    <div class="modal-row">
      <label style="margin-right:8px">Cantidad:</label>
      <input class="modal-qty field" type="number" min="1" value="1" />
      <div style="flex:1"></div>
      <button class="btn secondary" id="modalCancel">Cancelar</button>
      <button class="btn" id="modalConfirm">Añadir</button>
    </div>
  `;

  ov.appendChild(card);
  document.body.appendChild(ov);

  const qtyInput = card.querySelector('.modal-qty');
  const cancel = card.querySelector('#modalCancel');
  const confirm = card.querySelector('#modalConfirm');

  function cleanup(){
    ov.remove();
  }

  cancel.addEventListener('click', cleanup);
  ov.addEventListener('click', (e)=>{ if(e.target === ov) cleanup(); });

  confirm.addEventListener('click', ()=>{
    const qty = Math.max(1, Number(qtyInput.value) || 1);
    if(meta && (meta.eventId || meta.passId)){
      addTicketToCart({ eventId: meta.eventId || null, passId: meta.passId || null, qty, price: price, eventName, passName });
    } else {
      addFestivalPassToCart(eventName, passName, price, qty);
    }
    showToastMini(`${qty} × ${passName} añadido${qty>1? 's':''} al carrito`);
    cleanup();
  });
}

function pagePurchaseSummary(){
  renderNav();
  requireRole(["client"]);

  const url = new URL(window.location.href);
  const id = url.searchParams.get('id');
  const raw = localStorage.getItem('subsonic_last_purchase');
  if(!raw){
    document.getElementById('summaryContent').innerHTML = `<div class="card">Resumen no encontrado.</div>`;
    return;
  }

  let summary = null;
  try{ summary = JSON.parse(raw); }catch(e){ summary = null; }
  if(!summary || String(summary.id) !== String(id)){
    document.getElementById('summaryContent').innerHTML = `<div class="card">Resumen no coincide o ha caducado.</div>`;
    return;
  }

  const s = getSession();
  if(!s || s.email !== summary.userEmail){
    document.getElementById('summaryContent').innerHTML = `<div class="card">No autorizado para ver este resumen.</div>`;
    return;
  }

  // Render tickets
  const ticketsHtml = [];
  summary.tickets.forEach(tid=>{
    const t = DB.tickets.find(x=>x.id===tid);
    if(!t) return;
    const ev = t.eventId ? DB.events.find(e=>e.id===t.eventId) : null;
    const title = ev ? ev.name : (t.eventName || 'Evento');
    ticketsHtml.push(`
      <div class="card">
        <div class="badge">${title}</div>
        <h4 class="h-title">${t.passName}</h4>
        <p class="small">Código: <strong>${t.code}</strong> — Fecha compra: ${formatDate(t.purchaseDate)}</p>
      </div>
    `);
  });

  // Render orders (products)
  const orders = window.store.loadOrders() || [];
  const myOrders = orders.filter(o=> summary.orders.includes(o.id));
  const ordersHtml = myOrders.map(o=>{
    const items = (o.items||[]).map(it=>{
      const prod = DB.products.find(p=>p.id===it.productId);
      return `<div class="small">• ${prod ? prod.name : 'Producto'} x ${it.qty}</div>`;
    }).join('');
    return `
      <div class="card">
        <div class="badge">📦 Pedido #${o.id}</div>
        <p class="small">Fecha: ${formatDate(o.date)} - Entrega estimada: ${formatDate(o.eta)}</p>
        ${items}
      </div>
    `;
  }).join('');

  const totalHtml = `<div class="row" style="justify-content:space-between"><strong>Total pagado:</strong><strong>${money(summary.total)}</strong></div>`;

  document.getElementById('summaryContent').innerHTML = `
    <h3 class="h-title">Entradas</h3>
    ${ticketsHtml.join('') || '<div class="card">No hay entradas en esta compra.</div>'}
    <div class="hr"></div>
    <h3 class="h-title">Pedidos</h3>
    ${ordersHtml || '<div class="card">No hay pedidos de productos en esta compra.</div>'}
    <div class="hr"></div>
    ${totalHtml}
  `;

}

function pagePurchaseSummaryEnhanced(){
  renderNav();
  requireRole(["client"]);

  const url = new URL(window.location.href);
  const id = url.searchParams.get("id");
  const raw = localStorage.getItem("subsonic_last_purchase");
  const target = document.getElementById("summaryContent");
  if(!target) return;

  if(!raw){
    target.innerHTML = `<div class="card">Resumen no encontrado.</div>`;
    return;
  }

  let summary = null;
  try{ summary = JSON.parse(raw); }catch(e){ summary = null; }
  if(!summary || String(summary.id) !== String(id)){
    target.innerHTML = `<div class="card">Resumen no coincide o ha caducado.</div>`;
    return;
  }

  const s = getSession();
  if(!s || s.email !== summary.userEmail){
    target.innerHTML = `<div class="card">No autorizado para ver este resumen.</div>`;
    return;
  }

  const ticketCards = (summary.tickets || []).map(tid => {
    const ticket = DB.tickets.find(t => String(t.id) === String(tid));
    if(!ticket) return "";
    const info = getTicketDisplayData(ticket, s);
    return `
      <div class="card">
        <div class="badge">${htmlEscape(info.eventName)}</div>
        <h4 class="h-title">${htmlEscape(info.passName)}</h4>
        <p class="small">Lugar: ${htmlEscape(info.location)}</p>
        <p class="small">Fecha evento: ${htmlEscape(info.eventDateFormatted)} - Fecha compra: ${htmlEscape(info.purchaseDateFormatted)}</p>
        <p class="small">Codigo: <strong>${htmlEscape(info.code)}</strong></p>
        <div class="right" style="margin-top:10px">
          <button class="btn secondary download-ticket-pdf" type="button" data-ticket-id="${htmlEscape(ticket.id)}">Descargar PDF</button>
        </div>
      </div>
    `;
  }).join("");

  const orders = (window.store.loadOrders() || []).map(normalizeStoreOrder);
  window.store.saveOrders?.(orders);
  const myOrders = orders.filter(order => (summary.orders || []).includes(order.id));
  const hasTickets = Boolean(ticketCards);
  const hasOrders = myOrders.length > 0;
  const title = document.querySelector('body[data-page="purchaseSummary"] .h-title');
  const intro = document.querySelector('body[data-page="purchaseSummary"] .card > .small');
  const primaryButton = document.getElementById("viewTicketsBtn");

  if(title){
    title.textContent = hasOrders && !hasTickets ? "Pedido completado!" : "Compra completada!";
  }
  if(intro){
    intro.textContent = hasOrders && !hasTickets
      ? "Tu pedido de tienda se ha guardado en Mis pedidos con seguimiento y entrega estimada."
      : "Aqui tienes los detalles de tu transaccion. Puedes descargar cada entrada en PDF.";
  }
  if(primaryButton){
    primaryButton.href = hasOrders && !hasTickets ? "orders.html" : "tickets.html";
    primaryButton.textContent = hasOrders && !hasTickets ? "Ver mis pedidos" : "Ver mis entradas";
  }

  const orderCards = myOrders.map(order => {
    const items = (order.items || []).map(item => {
      const prod = DB.products.find(p => p.id === item.productId);
      const price = prod?.price || item.price || 0;
      return `
        <div class="row" style="justify-content:space-between">
          <span class="small">${htmlEscape(prod ? prod.name : "Producto")} ${item.size ? `- Talla ${htmlEscape(item.size)}` : ""} x ${htmlEscape(item.qty || 1)}</span>
          <strong>${money(price * (item.qty || 1))}</strong>
        </div>
      `;
    }).join("");
    const orderTotal = order.total ?? (order.items || []).reduce((sum, item) => {
      const prod = DB.products.find(p => p.id === item.productId);
      return sum + ((prod?.price || item.price || 0) * (item.qty || 1));
    }, 0);
    return `
      <div class="card">
        <div class="badge">Pedido #${htmlEscape(order.id)}</div>
        <p class="small" style="margin:10px 0 6px 0"><strong>Estado:</strong> ${htmlEscape(order.status || "Preparando pedido")}</p>
        <p class="small">Fecha: ${htmlEscape(formatDate(order.date))} - Entrega estimada: ${htmlEscape(formatDate(order.eta))} (${htmlEscape(order.deliveryDays || "2-3")} días)</p>
        <p class="small">Seguimiento: <strong>${htmlEscape(order.trackingCode || `SUBSHOP-${String(order.id).slice(-8)}`)}</strong></p>
        <div class="hr"></div>
        ${items}
        <div class="hr"></div>
        <div class="row" style="justify-content:space-between"><strong>Total pedido</strong><strong>${money(orderTotal)}</strong></div>
      </div>
    `;
  }).join("");

  target.innerHTML = `
    ${hasTickets ? `<h3 class="h-title">Entradas</h3>${ticketCards}` : ""}
    ${hasTickets && hasOrders ? '<div class="hr"></div>' : ""}
    ${hasOrders ? `<h3 class="h-title">Pedido de tienda</h3>${orderCards}` : ""}
    ${!hasTickets && !hasOrders ? '<div class="card">No hay elementos en esta compra.</div>' : ""}
    <div class="hr"></div>
    <div class="row" style="justify-content:space-between"><strong>Total pagado:</strong><strong>${money(summary.total)}</strong></div>
  `;

  document.querySelectorAll(".download-ticket-pdf").forEach(button => {
    if(button.dataset.bound) return;
    button.dataset.bound = "1";
    button.addEventListener("click", () => {
      const ticket = DB.tickets.find(t => String(t.id) === String(button.dataset.ticketId));
      if(ticket) downloadTicketPdf(ticket);
    });
  });
}

/* =========================================================
   Additional pages: Artists, Search, Tickets Purchase, Change Password, Admin helpers
   ========================================================= */

function pageArtists(){
  renderNav();
  const grid = $('#artistsGrid');
  if(!grid) return;
  grid.innerHTML = '';
  DB.artists.forEach(a=>{
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="badge">${a.genre}</div>
      <h4 class="h-title" style="margin:10px 0 6px 0">${a.name}</h4>
      <p class="small">${a.bio}</p>
      <div class="right">
        <a class="btn secondary" href="${basePath}events/artist.html?id=${a.id}">Ver</a>
      </div>
    `;
    grid.appendChild(card);
  });
}

function pageSearch(){
  renderNav();
  const input = $('#searchInput');
  const results = $('#searchResults');
  if(!results) return;
  function run(){
    const q = (input?.value||'').trim().toLowerCase();
    const filters = Array.from(document.querySelectorAll('[data-filter]:checked')).map(x=>x.getAttribute('data-filter'));
    results.innerHTML = '';
    if(!q && filters.length===0){ results.innerHTML = '<div class="card small">Introduce términos de búsqueda o aplica filtros.</div>'; return; }

    const items = [];
    if(filters.length===0 || filters.includes('event')){
      DB.events.forEach(ev=>{ if(ev.name.toLowerCase().includes(q) || ev.desc.toLowerCase().includes(q)) items.push({type:'event', data:ev}); });
    }
    if(filters.length===0 || filters.includes('artist')){
      DB.artists.forEach(a=>{ if(a.name.toLowerCase().includes(q) || a.bio.toLowerCase().includes(q)) items.push({type:'artist', data:a}); });
    }
    if(filters.length===0 || filters.includes('product')){
      DB.products.forEach(p=>{ if(p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)) items.push({type:'product', data:p}); });
    }

    if(items.length===0){ results.innerHTML = '<div class="card">No se encontraron resultados.</div>'; return; }

    items.forEach(it=>{
      const el = document.createElement('div'); el.className='card';
      if(it.type==='event'){
        el.innerHTML = `<div class="badge">${formatDate(it.data.date)}</div><h4 class="h-title">${it.data.name}</h4><p class="small">${it.data.desc}</p><div class="right"><a class="btn secondary" href="${basePath}events/event.html?id=${it.data.id}">Ver</a></div>`;
      } else if(it.type==='artist'){
        el.innerHTML = `<div class="badge">${it.data.genre}</div><h4 class="h-title">${it.data.name}</h4><p class="small">${it.data.bio}</p><div class="right"><a class="btn secondary" href="${basePath}events/artist.html?id=${it.data.id}">Ver</a></div>`;
      } else {
        el.innerHTML = `<div class="badge">${it.data.category}</div><h4 class="h-title">${it.data.name}</h4><p class="small">${it.data.desc}</p><div class="right"><a class="btn secondary" href="${basePath}store/product.html?id=${it.data.id}">Ver</a></div>`;
      }
      results.appendChild(el);
    });
  }

  if(input && !input.dataset.bound){ input.dataset.bound='1'; input.addEventListener('input', run); }
  const checkboxes = document.querySelectorAll('[data-filter]');
  checkboxes.forEach(cb=>{ if(cb.dataset.bound) return; cb.dataset.bound='1'; cb.addEventListener('change', run); });
}

function pageTicketsPurchase(){
  renderNav();
  const id = Number(getQueryParam('id') || getQueryParam('eventId'));
  const selectedPassId = Number(getQueryParam('passId')) || 0;
  const ev = DB.events.find(e=>e.id===id) || DB.events[0];
  if(!ev) return;
  const img = $('#evImage'); if(img) img.src = ev.image || '../fotos_principales/principal.jpg';
  const title = $('#evTitle'); if(title) title.textContent = ev.name;
  const info = $('#evInfo'); if(info) info.textContent = `${formatDate(ev.date)} • ${ev.venue} • ${ev.city}`;

  const passes = selectedPassId
    ? [...ev.passes].sort((a, b) => (b.id === selectedPassId) - (a.id === selectedPassId))
    : ev.passes;

  const pkgs = $('#ticketPackages'); if(pkgs){ pkgs.innerHTML=''; passes.forEach(p=>{
    const div = document.createElement('div'); div.className='card';
    div.innerHTML = `
      <div class="badge">${p.name} • ${money(p.price)}</div>
      <p class="small">${p.includes}</p>
      <div class="row" style="justify-content:flex-end; gap:8px">
        <input type="number" min="1" value="1" class="field ticket-qty" style="width:84px" />
        <button class="btn" data-pass="${p.id}">Añadir al carrito</button>
      </div>
    `;
    const btn = div.querySelector('button');
    btn.addEventListener('click', ()=>{
      const qty = Number(div.querySelector('.ticket-qty').value) || 1;
      addTicketToCart({ eventId: ev.id, passId: p.id, qty, price: p.price, eventName: ev.name, passName: p.name });
      showToastMini(`${qty} × ${p.name} añadido al carrito`);
      renderNav();
    });
    pkgs.appendChild(div);
  }); }
}

function pageChangePassword(){
  renderNav();
  const btn = $('#sendReset');
  if(!btn) return;
  if(btn.dataset.bound) return; btn.dataset.bound='1';
  btn.addEventListener('click', ()=>{
    const email = ($('#cpEmail')?.value||'').trim();
    if(!email) return alert('Introduce un correo.');
    alert('Si el correo existe, recibirás instrucciones.');
    window.location.href = basePath + 'auth/login.html';
  });
}

/* ---------------- Admin lightweight pages ---------------- */
function pageAdminCreateEvent(){
  requireRole(['admin']);
  renderNav();
  const f = $('#createEventForm');
  if(!f) return;

  const passesContainer = $('#adminEntryList');
  const artistsContainer = $('#adminArtistList');

  const eventId = Number(getQueryParam('id')) || 0;
  let ev = eventId ? DB.events.find(x=>x.id===eventId) : null;

  // Populate form when editing
  if(ev){
    f.elements['name'].value = ev.name || '';
    f.elements['date'].value = ev.date ? `${ev.date}T00:00` : '';
    f.elements['location'].value = ev.venue || '';
    f.elements['images'].value = ev.image || '';
  }

  function renderPasses(){
    if(!passesContainer) return;
    passesContainer.innerHTML = '';
    const list = (ev && ev.passes) ? ev.passes.slice() : [];
    list.forEach(p=>{
      const d = document.createElement('div'); d.className='card';
      d.innerHTML = `<div class="badge">${p.name} • ${money(p.price)}</div><p class="small">${p.includes||''}</p><div class="right"><button class="btn danger btn-del-pass" data-id="${p.id}">Eliminar</button></div>`;
      d.querySelector('.btn-del-pass').addEventListener('click', ()=>{
        if(!confirm('Eliminar tipo de entrada?')) return;
        ev.passes = (ev.passes || []).filter(x=>x.id !== p.id);
        window.saveDB?.();
        renderPasses();
      });
      passesContainer.appendChild(d);
    });

    const addCard = document.createElement('div'); addCard.className='card';
    addCard.innerHTML = `
      <h4 class="h-title">Añadir tipo de entrada</h4>
      <div class="field"><label>Nombre</label><input id="newPassName" /></div>
      <div class="field"><label>Precio</label><input id="newPassPrice" type="number" step="0.01" /></div>
      <div class="field"><label>Incluye</label><input id="newPassIncludes" /></div>
      <div class="right"><button class="btn" id="addPassBtn">Añadir</button></div>
    `;
    passesContainer.appendChild(addCard);
    const addBtn = addCard.querySelector('#addPassBtn');
    addBtn.addEventListener('click', ()=>{
      const name = (document.getElementById('newPassName')?.value||'').trim();
      const price = Number(document.getElementById('newPassPrice')?.value||0);
      const includes = (document.getElementById('newPassIncludes')?.value||'').trim();
      if(!name) return alert('Nombre de entrada requerido');
      ev = ev || { id: Date.now(), name:'(temporal)', date:'', venue:'', city:'', desc:'', image:'', artists:[], passes:[] };
      ev.passes = ev.passes || [];
      ev.passes.push({ id: Date.now()+Math.floor(Math.random()*999), name, price, includes });
      window.saveDB?.();
      renderPasses();
    });
  }

  function renderArtists(){
    if(!artistsContainer) return;
    artistsContainer.innerHTML = '';
    // If editing an event, show only artists linked to that event.
    const list = (ev && ev.artists && ev.artists.length > 0)
      ? DB.artists.filter(a => ev.artists.includes(a.id))
      : (DB.artists || []);
    const wrap = document.createElement('div'); wrap.className='grid grid-2';
    list.forEach(a=>{
      const item = document.createElement('label'); item.className='card';
      const checked = ev && ev.artists && ev.artists.includes(a.id);
      item.innerHTML = `<input type="checkbox" class="artist-link" data-id="${a.id}" ${checked? 'checked':''}/> <strong>${a.name}</strong><div class="small">${a.genre}</div>`;
      wrap.appendChild(item);
    });
    artistsContainer.appendChild(wrap);

    const addCard = document.createElement('div'); addCard.className='card';
    addCard.innerHTML = `
      <h4 class="h-title">Añadir artista</h4>
      <div class="field"><label>Nombre</label><input id="newArtistName" /></div>
      <div class="field"><label>Foto URL</label><input id="newArtistPhoto" /></div>
      <div class="field"><label>Spotify / Link</label><input id="newArtistSpotify" /></div>
      <div class="field"><label>Biografía</label><input id="newArtistBio" /></div>
      <div class="right"><button class="btn" id="addArtistInline">Añadir artista</button></div>
    `;
    artistsContainer.appendChild(addCard);
    addCard.querySelector('#addArtistInline').addEventListener('click', ()=>{
      const name = (document.getElementById('newArtistName')?.value||'').trim();
      const photo = (document.getElementById('newArtistPhoto')?.value||'').trim();
      const spotify = (document.getElementById('newArtistSpotify')?.value||'').trim();
      const bio = (document.getElementById('newArtistBio')?.value||'').trim();
      if(!name) return alert('Nombre artista requerido');
      const aid = Date.now()+Math.floor(Math.random()*999);
      DB.artists.push({ id: aid, name, genre:'', bio, topTracks:[], image: photo||'', spotify: spotify||'' });
      ev = ev || { id: Date.now(), name:'(temporal)', date:'', venue:'', city:'', desc:'', image:'', artists:[], passes:[] };
      ev.artists = ev.artists || [];
      ev.artists.push(aid);
      window.saveDB?.();
      renderArtists();
    });
  }

  renderPasses();
  renderArtists();

  if(!f.dataset.bound){
    f.dataset.bound = '1';
    f.addEventListener('submit', e=>{
      e.preventDefault();
      const fm = new FormData(f);
      const name = (fm.get('name')||'').trim();
      const dateVal = fm.get('date') || '';
      const date = dateVal ? dateVal.split('T')[0] : '';
      const location = (fm.get('location')||'').trim();
      const images = (fm.get('images')||'').split(',').map(s=>s.trim()).filter(Boolean);
      if(!name) return alert('Nombre del evento requerido');

      if(ev){
        ev.name = name;
        ev.date = date;
        ev.venue = location;
        ev.image = images[0]||ev.image||'';
        const checked = Array.from(document.querySelectorAll('.artist-link:checked')).map(x=>Number(x.getAttribute('data-id')));
        ev.artists = checked;
      } else {
        const id = Date.now();
        ev = { id, name, date, venue: location, city:'', desc:'(Creado admin)', image: images[0]||'', artists: [], passes: [] };
        const checked = Array.from(document.querySelectorAll('.artist-link:checked')).map(x=>Number(x.getAttribute('data-id')));
        ev.artists = checked;
        DB.events.push(ev);
      }

      window.saveDB?.();
      alert('Evento guardado');
      window.location.href = basePath + 'admin/edit-event.html';
    });
  }
}

function pageAdminEditEvent(){
  requireRole(['admin']);
  renderNav();
  const out = $('#adminEventsList');
  if(!out) return; out.innerHTML = '';
  if(!DB.events || DB.events.length === 0){
    out.innerHTML = '<div class="card">No hay eventos.</div>';
    return;
  }

  DB.events.forEach(ev=>{
    const d = document.createElement('div');
    d.className='card';
    // build artist list for this event
    const artistNames = (ev.artists||[]).map(id=>{
      const a = DB.artists.find(x=>x.id===id);
      return a ? a.name : null;
    }).filter(Boolean).join(', ');

    d.innerHTML = `
      <div class="badge">${formatDate(ev.date)}</div>
      <h4 class="h-title">${ev.name}</h4>
      <p class="small">${ev.desc || ''}</p>
      ${artistNames ? `<p class="small"><strong>Artistas:</strong> ${artistNames}</p>` : ''}
      <div class="right">
        <a class="btn secondary" href="${basePath}admin/create-event.html?id=${ev.id}">Editar</a>
        <button class="btn danger btn-del-evt" data-id="${ev.id}">Eliminar</button>
      </div>
    `;
    d.querySelector('.btn-del-evt').addEventListener('click', ()=>{
      if(!confirm('Eliminar evento permanentemente?')) return;
      const idx = DB.events.findIndex(x=>x.id === ev.id);
      if(idx >= 0){ DB.events.splice(idx,1); window.saveDB?.(); pageAdminEditEvent(); }
    });
    out.appendChild(d);
  });
}

function pageAdminEntries(){
  requireRole(['admin']);
  renderNav();
  const f = $('#addEntryForm');
  if(!f) return;
  if(f.dataset.bound) return;
  f.dataset.bound='1';
  f.addEventListener('submit', e=>{
    e.preventDefault();
    const fm=new FormData(f);
    const eventId = Number(fm.get('eventId'));
    const name=fm.get('name');
    const price=Number(fm.get('price')||0);
    const stock=Number(fm.get('stock')||0);
    const ev = DB.events.find(x=>x.id===eventId);
    if(ev){
      ev.passes = ev.passes || [];
      ev.passes.push({ id: Date.now(), name, price, includes: 'Entrada admin' });
      window.saveDB?.();
      alert('Tipo de entrada añadido');
      window.location.href= basePath + 'admin/edit-event.html';
    } else alert('Evento no encontrado');
  });
}

function pageAdminArtists(){
  requireRole(['admin']);
  renderNav();
  const f = $('#addArtistForm');
  const list = $('#adminArtistsList');
  if(list) list.innerHTML='';
  // render existing artists
    (DB.artists || []).forEach(a=>{
    if(!list) return;
    const d = document.createElement('div'); d.className='card';
    d.innerHTML = `<div class="badge">${a.genre||''}</div><h4 class="h-title">${a.name}</h4><p class="small">${a.bio||''}</p>`;
    list.appendChild(d);
  });

  if(!f) return;
  if(!f.dataset.bound){
    f.dataset.bound='1';
    f.addEventListener('submit', e=>{
      e.preventDefault();
      const fm=new FormData(f);
      const name=fm.get('name');
      const photo=fm.get('photo');
      const bio=fm.get('bio');
      const spotify=fm.get('spotify');
      DB.artists.push({ id: Date.now(), name, genre:'', bio, topTracks:[], image: photo||'', spotify: spotify||'' });
      window.saveDB?.();
      alert('Artista añadido');
      window.location.href= basePath + 'admin/artists.html';
    });
  }
}

function pageAdminAddSpace(){
  requireRole(['admin']);
  renderNav();
  const f = $('#addSpaceForm'); if(!f) return; if(f.dataset.bound) return; f.dataset.bound='1'; f.addEventListener('submit', e=>{ e.preventDefault(); const fm=new FormData(f); const name=fm.get('name'); const desc=fm.get('desc'); const price=Number(fm.get('price')||0); const image=fm.get('image'); DB.spaces.push({ id: Date.now(), eventId: null, type:name, size:'', location:desc, pricePerDay: price, status:'Disponible', services:'', notes:'', }); window.saveDB?.(); alert('Espacio añadido'); window.location.href= basePath + 'admin/manage-spaces.html'; }); }

function pageAdminManageSpaces(){
  requireRole(['admin']);
  renderNav();
  const list = $('#adminSpacesList'); if(!list) return; list.innerHTML=''; DB.spaces.forEach(sp=>{ const d=document.createElement('div'); d.className='card'; d.innerHTML=`<div class="badge">${sp.type} • €${sp.pricePerDay}</div><h4 class="h-title">${sp.location}</h4><p class="small">Estado: ${sp.status}</p>`; list.appendChild(d); }); }

function pageAdminAddProduct(){
  requireRole(['admin']);
  renderNav();
  const f=$('#addProductForm'); if(!f) return; if(f.dataset.bound) return; f.dataset.bound='1'; f.addEventListener('submit', e=>{ e.preventDefault(); const fm=new FormData(f); const name=fm.get('name'); const sizes=(fm.get('sizes')||'').split(',').map(s=>s.trim()).filter(Boolean); const price=Number(fm.get('price')||0); const images=(fm.get('images')||'').split(',').map(s=>s.trim()).filter(Boolean); DB.products.push({ id: Date.now(), name, price, category:'Nuevo', gender:'Unisex', sizes, desc:'Producto de tienda', images }); window.saveDB?.(); alert('Producto añadido'); window.location.href= basePath + 'admin/edit-product.html'; }); }

function pageAdminEditProduct(){
  requireRole(['admin']);
  renderNav();
  const out = $('#adminProductsList'); if(!out) return; out.innerHTML='';
  (DB.products || []).forEach(p=>{
    const d=document.createElement('div'); d.className='card';
    d.innerHTML=`<div class="badge">${p.category}</div><h4 class="h-title">${p.name}</h4><p class="small">${money(p.price)}</p><div class="right"><button class="btn danger btn-del-prod" data-id="${p.id}">Eliminar</button></div>`;
    d.querySelector('.btn-del-prod').addEventListener('click', ()=>{
      if(!confirm('Eliminar producto?')) return;
      const idx = DB.products.findIndex(x=>x.id===p.id);
      if(idx>=0){ DB.products.splice(idx,1); window.saveDB?.(); pageAdminEditProduct(); }
    });
    out.appendChild(d);
  });
}

/* =========================================================
   ARTIST MODAL / PLAYER
   ========================================================= */

// Sample artist data structure (ready for Spotify API)
const ARTIST_TRACKS = {
  'Amelie Lens': {
    imageUrl: '../fotos_artistas/amelie-lens.jpg',
    tracks: [
      { title: 'Untamed', artist: 'Amelie Lens', duration: '3:45' },
      { title: 'Emergence', artist: 'Amelie Lens', duration: '4:12' },
      { title: 'Consciousness', artist: 'Amelie Lens', duration: '3:58' }
    ]
  },
  'John Digweed': {
    imageUrl: '../fotos_artistas/john-digweed.jpg',
    tracks: [
      { title: 'Rhythmic Injection', artist: 'John Digweed', duration: '4:00' },
      { title: 'Progression', artist: 'John Digweed', duration: '3:52' }
    ]
  },
  'Charlotte de Witte': {
    imageUrl: '../fotos_artistas/charlotte-de-witte.jpg',
    tracks: [
      { title: 'Core Motion', artist: 'Charlotte de Witte', duration: '4:15' }
    ]
  },
  'David Guetta': {
    imageUrl: '../fotos_artistas/david-guetta.jpg',
    tracks: [
      { title: 'Future Track', artist: 'David Guetta', duration: '3:30' }
    ]
  },
  'Ólafur Arnalds': {
    imageUrl: '../fotos_artistas/olafur-arnalds.jpg',
    tracks: [
      { title: 'Ethereal Moment', artist: 'Ólafur Arnalds', duration: '4:45' }
    ]
  },
  'Deadmau5': {
    imageUrl: '../fotos_artistas/deadmau5.jpg',
    tracks: [
      { title: 'While 1 < 2', artist: 'Deadmau5', duration: '4:10' }
    ]
  },
  'Sasha': {
    imageUrl: '../fotos_artistas/sasha.jpg',
    tracks: [
      { title: 'Freedom', artist: 'Sasha', duration: '3:55' }
    ]
  },
  'Adam Beyer': {
    imageUrl: '../fotos_artistas/adam-beyer.jpg',
    tracks: [
      { title: 'Rave', artist: 'Adam Beyer', duration: '4:20' }
    ]
  },
  'Disclosure': {
    imageUrl: '../fotos_artistas/disclosure.jpg',
    tracks: [
      { title: 'Latch', artist: 'Disclosure', duration: '3:28' }
    ]
  },
  'Jon Hopkins': {
    imageUrl: '../fotos_artistas/jon-hopkins.jpg',
    tracks: [
      { title: 'Emerald Rush', artist: 'Jon Hopkins', duration: '4:30' }
    ]
  },
  'Richie Hawtin': {
    imageUrl: '../fotos_artistas/richie-hawtin.jpg',
    tracks: [
      { title: 'Plastikman', artist: 'Richie Hawtin', duration: '4:50' }
    ]
  },
  'Tale of Us': {
    imageUrl: '../fotos_artistas/tale-of-us.jpg',
    tracks: [
      { title: 'Such a Lonely Day', artist: 'Tale of Us', duration: '4:05' }
    ]
  },
  'Ben Klock': {
    imageUrl: '../fotos_artistas/ben-klock.jpg',
    tracks: [
      { title: 'Techno Sound', artist: 'Ben Klock', duration: '4:25' }
    ]
  },
  'Fisher': {
    imageUrl: '../fotos_artistas/fisher.jpg',
    tracks: [
      { title: 'Losing It', artist: 'Fisher', duration: '3:40' }
    ]
  }
};

// Fallback function: if artist not in database, create generic entry
function getArtistData(artistName) {
  if (ARTIST_TRACKS[artistName]) {
    return ARTIST_TRACKS[artistName];
  }
  
  // Return generic track if artist not found
  return {
    imageUrl: `../fotos_artistas/${artistName.toLowerCase().replace(/\s+/g, '-')}.jpg`,
    tracks: [
      { title: 'Track 1', artist: artistName, duration: '3:45' },
      { title: 'Track 2', artist: artistName, duration: '4:00' },
      { title: 'Track 3', artist: artistName, duration: '3:50' }
    ]
  };
}

// Initialize artist modal functionality
let artistModalState = {
  isOpen: false,
  currentArtist: null,
  currentTrackIndex: 0,
  isPlaying: false,
  progress: 0
};

function initArtistModal() {
  if (document.querySelector('script[src*="player-modal.js"]')) return;

  const modal = document.getElementById('artistModal');
  if (!modal) return;

  // Close button
  const closeBtn = document.querySelector('.artist-modal-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeArtistModal);
  }

  // Close on overlay click
  const overlay = document.querySelector('.artist-modal-overlay');
  if (overlay) {
    overlay.addEventListener('click', closeArtistModal);
  }

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && artistModalState.isOpen) {
      closeArtistModal();
    }
  });

  // Artist cards click handlers
  const artistCards = document.querySelectorAll('.artist-card');
  artistCards.forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      const artistName = card.querySelector('.artist-name')?.textContent || 'Unknown Artist';
      const stageName = card.querySelector('.artist-stage')?.textContent || 'STAGE';
      openArtistModal(artistName, stageName);
    });
  });

  // Player controls
  const btnPlay = document.getElementById('artistModalBtnPlay');
  const btnPause = document.getElementById('artistModalBtnPause');
  const btnPrev = document.getElementById('artistModalBtnPrev');
  const btnNext = document.getElementById('artistModalBtnNext');

  if (btnPlay) {
    btnPlay.addEventListener('click', togglePlayPause);
  }
  if (btnPause) {
    btnPause.addEventListener('click', togglePlayPause);
  }
  if (btnPrev) {
    btnPrev.addEventListener('click', playPreviousTrack);
  }
  if (btnNext) {
    btnNext.addEventListener('click', playNextTrack);
  }

  // Progress bar click
  const progressBar = document.querySelector('.artist-modal-progress-bar');
  if (progressBar) {
    progressBar.addEventListener('click', (e) => {
      const rect = progressBar.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      updateProgress(percent);
    });
  }
}

function openArtistModal(artistName, stageName) {
  const modal = document.getElementById('artistModal');
  if (!modal) return;

  artistModalState.currentArtist = artistName;
  artistModalState.isOpen = true;
  artistModalState.isPlaying = false;
  artistModalState.currentTrackIndex = 0;
  artistModalState.progress = 0;

  // Update modal with artist data
  const artistData = getArtistData(artistName);
  
  // Set artist info
  document.getElementById('artistModalTitle').textContent = artistName;
  document.getElementById('artistModalStage').textContent = stageName;

  // Set image (with fallback to placeholder)
  const imgElement = document.getElementById('artistModalImg');
  if (artistData && artistData.imageUrl) {
    imgElement.src = artistData.imageUrl;
    // If image fails to load, keep placeholder
    imgElement.onerror = () => {
      imgElement.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"%3E%3Crect fill="%230b0b12" width="256" height="256"/%3E%3Ccircle cx="128" cy="100" r="35" fill="%23666"/%3E%3Cellipse cx="128" cy="200" rx="70" ry="50" fill="%23666"/%3E%3C/svg%3E';
    };
  }

  // Load first track
  updateTrackDisplay();

  // Reset player state
  document.getElementById('artistModalBtnPlay').style.display = 'flex';
  document.getElementById('artistModalBtnPause').style.display = 'none';

  // Show modal
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeArtistModal() {
  const modal = document.getElementById('artistModal');
  if (!modal) return;

  artistModalState.isOpen = false;
  artistModalState.isPlaying = false;
  modal.classList.remove('active');
  document.body.style.overflow = 'auto';
}

function updateTrackDisplay() {
  const artistData = getArtistData(artistModalState.currentArtist);
  if (!artistData) return;

  const track = artistData.tracks[artistModalState.currentTrackIndex] || artistData.tracks[0];
  
  document.getElementById('artistModalTrackTitle').textContent = track.title;
  document.getElementById('artistModalTrackArtist').textContent = track.artist;
  document.getElementById('artistModalTimeEnd').textContent = track.duration;
  document.getElementById('artistModalTimeStart').textContent = '0:00';
  
  // Reset progress
  artistModalState.progress = 0;
  document.getElementById('artistModalProgressFill').style.width = '0%';
}

function togglePlayPause() {
  artistModalState.isPlaying = !artistModalState.isPlaying;
  
  const btnPlay = document.getElementById('artistModalBtnPlay');
  const btnPause = document.getElementById('artistModalBtnPause');
  
  if (artistModalState.isPlaying) {
    btnPlay.style.display = 'none';
    btnPause.style.display = 'flex';
    // Future: Start actual audio playback from Spotify API
  } else {
    btnPlay.style.display = 'flex';
    btnPause.style.display = 'none';
    // Future: Pause audio playback
  }
}

function playNextTrack() {
  const artistData = getArtistData(artistModalState.currentArtist);
  if (!artistData) return;
  
  artistModalState.currentTrackIndex = (artistModalState.currentTrackIndex + 1) % artistData.tracks.length;
  updateTrackDisplay();
  
  // Auto-play next track
  artistModalState.isPlaying = true;
  document.getElementById('artistModalBtnPlay').style.display = 'none';
  document.getElementById('artistModalBtnPause').style.display = 'flex';
}

function playPreviousTrack() {
  const artistData = getArtistData(artistModalState.currentArtist);
  if (!artistData) return;
  
  artistModalState.currentTrackIndex = (artistModalState.currentTrackIndex - 1 + artistData.tracks.length) % artistData.tracks.length;
  updateTrackDisplay();
  
  // Auto-play previous track
  artistModalState.isPlaying = true;
  document.getElementById('artistModalBtnPlay').style.display = 'none';
  document.getElementById('artistModalBtnPause').style.display = 'flex';
}

function updateProgress(percent) {
  artistModalState.progress = Math.max(0, Math.min(1, percent));
  document.getElementById('artistModalProgressFill').style.width = (artistModalState.progress * 100) + '%';
  
  // Future: Seek audio to this position
  console.log('Seek to:', Math.floor(artistModalState.progress * 100) + '%');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initArtistModal();
});
