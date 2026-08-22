(function () {
  const KEY = "filomena_admin_secret";
  const login = document.getElementById("login");
  const app = document.getElementById("app");
  const session = document.getElementById("session");
  const flash = document.getElementById("flash");
  const toastEl = document.getElementById("toast");
  const rowsEl = document.getElementById("rows");
  const countEl = document.getElementById("count");
  const loginError = document.getElementById("login-error");
  const createForm = document.getElementById("create");
  const formTitle = document.getElementById("form-title");
  const formSubmit = document.getElementById("form-submit");
  const formCancel = document.getElementById("form-cancel");
  const WA_COPY_ICON =
    '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="1.5"/><path d="M16 8V6.5A1.5 1.5 0 0 0 14.5 5h-9A1.5 1.5 0 0 0 4 6.5v9A1.5 1.5 0 0 0 5.5 17H8"/></svg>';

  let inviteCache = [];
  let toastTimer = null;

  function secret() {
    return sessionStorage.getItem(KEY) || "";
  }
  function headers() {
    return { "Content-Type": "application/json", "x-admin-secret": secret() };
  }
  function showFlash(msg) {
    flash.hidden = !msg;
    flash.textContent = msg || "";
  }

  function showToast(msg, ok = true) {
    if (toastTimer) clearTimeout(toastTimer);
    toastEl.hidden = false;
    toastEl.textContent = msg;
    toastEl.classList.toggle("toast--err", !ok);
    toastEl.classList.add("is-on");
    toastTimer = setTimeout(() => {
      toastEl.classList.remove("is-on");
      setTimeout(() => {
        toastEl.hidden = true;
      }, 220);
    }, 2200);
  }
  function escapeHtml(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }
  async function api(path, opts = {}) {
    const res = await fetch(path, { ...opts, headers: { ...headers(), ...(opts.headers || {}) } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || res.statusText);
    return data;
  }
  function fmtExpiry(sec) {
    if (!sec) return "—";
    return new Date(Number(sec) * 1000).toLocaleString("es-PE", {
      dateStyle: "short",
      timeStyle: "short",
    });
  }
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try {
        ok = document.execCommand("copy");
      } catch {
        ok = false;
      }
      ta.remove();
      return ok;
    }
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = String(value);
  }

  /** Grupos de 3 con espacios (estilo móvil PE: 999 888 777). */
  function formatPhoneGroups(raw, maxDigits) {
    const max = maxDigits || 15;
    const digits = String(raw || "")
      .replace(/\D/g, "")
      .slice(0, max);
    return digits.replace(/(\d{3})(?=\d)/g, "$1 ").trim();
  }

  function phoneMaxDigits() {
    return createForm.dial.value === "PE" ? 9 : 15;
  }

  function applyPhoneMask(input) {
    const pos = input.selectionStart;
    const before = input.value.slice(0, pos).replace(/\D/g, "").length;
    const formatted = formatPhoneGroups(input.value, phoneMaxDigits());
    input.value = formatted;
    let seen = 0;
    let caret = formatted.length;
    for (let i = 0; i < formatted.length; i++) {
      if (/\d/.test(formatted[i])) seen += 1;
      if (seen >= before) {
        caret = i + 1;
        break;
      }
    }
    input.setSelectionRange(caret, caret);
  }

  function splitPhone(full) {
    const digits = String(full || "").replace(/\D/g, "");
    if (!digits) return { iso: "PE", number: "" };
    const countries = [...(window.COUNTRY_DIALS || [])].sort(
      (a, b) => String(b.dial).length - String(a.dial).length
    );
    for (const c of countries) {
      const dial = String(c.dial).replace(/\D/g, "");
      if (dial && digits.startsWith(dial)) {
        return { iso: c.iso, number: digits.slice(dial.length) };
      }
    }
    return { iso: "PE", number: digits };
  }

  function formatPhoneDisplay(full) {
    if (!full) return "";
    const split = splitPhone(full);
    const local = formatPhoneGroups(split.number, split.iso === "PE" ? 9 : 15);
    const dial = (window.COUNTRY_DIALS || []).find((c) => c.iso === split.iso)?.dial || "";
    return dial ? `+${dial} ${local}`.trim() : local || String(full);
  }

  function digitsPhone(phone) {
    return String(phone || "").replace(/\D/g, "");
  }

  function waInviteMessage(name, inviteUrl) {
    const who = String(name || "").trim() || "invitado";
    return [
      `Hola ${who},`,
      "",
      "Tu cortesía de *Filomena* está lista.",
      "Abre el link, descarga el QR si quieres y acércalo a la cabina para activar tu sesión de fotos.",
      "",
      inviteUrl,
      "",
      "_Analog look. Filomena feel._",
    ].join("\n");
  }

  function waMeUrl(phone, text) {
    const digits = digitsPhone(phone);
    if (!digits) return "";
    return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
  }

  function contactHtml(inv) {
    const lines = [];
    if (inv.email) lines.push(`<div>${escapeHtml(inv.email)}</div>`);
    if (inv.phone) {
      const msg = waInviteMessage(inv.name, inv.url);
      const href = waMeUrl(inv.phone, msg);
      const shown = formatPhoneDisplay(inv.phone);
      const phoneInner = href
        ? `<a class="contact-wa" href="${escapeHtml(href)}" target="_blank" rel="noopener" title="Abrir chat de WhatsApp">${escapeHtml(shown)}</a>`
        : `<span>${escapeHtml(shown)}</span>`;
      lines.push(
        `<div class="contact-wa-row">${phoneInner}<button type="button" class="wa-copy" data-copy-wa="${escapeHtml(inv.token)}" title="Copiar mensaje para WhatsApp" aria-label="Copiar mensaje para WhatsApp de ${escapeHtml(inv.name)}">${WA_COPY_ICON}</button></div>`
      );
    }
    if (!lines.length) lines.push('<div class="muted">Sin contacto</div>');
    return lines.join("");
  }

  function renderKpis(invites) {
    const now = Date.now() / 1000;
    let opened = 0;
    let pending = 0;
    let expired = 0;
    for (const inv of invites || []) {
      const isExpired = inv.expiry && Number(inv.expiry) < now;
      if (isExpired) expired += 1;
      if (inv.opened_at) opened += 1;
      else if (!isExpired) pending += 1;
    }
    setText("kpi-total", (invites || []).length);
    setText("kpi-opened", opened);
    setText("kpi-pending", pending);
    setText("kpi-expired", expired);
  }

  function render(invites) {
    inviteCache = invites || [];
    renderKpis(inviteCache);
    const n = inviteCache.length;
    countEl.textContent = n === 1 ? "1 persona" : n + " personas";
    if (!n) {
      rowsEl.innerHTML = '<tr><td colspan="4" class="muted">Aún no hay invitados.</td></tr>';
      return;
    }
    rowsEl.innerHTML = inviteCache
      .map(
        (inv) => `<tr>
          <td>${escapeHtml(inv.name)}</td>
          <td class="contact-cell">${contactHtml(inv)}</td>
          <td class="muted">${escapeHtml(fmtExpiry(inv.expiry))}</td>
          <td class="actions">
            <button type="button" data-edit="${escapeHtml(inv.token)}">Editar</button>
            <a href="${escapeHtml(inv.url)}" target="_blank" rel="noopener">Abrir</a>
            <button type="button" class="danger" data-del="${escapeHtml(inv.token)}">Eliminar</button>
          </td>
        </tr>`
      )
      .join("");

    rowsEl.querySelectorAll("[data-copy-wa]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const inv = inviteCache.find((i) => i.token === btn.getAttribute("data-copy-wa"));
        if (!inv) return;
        const ok = await copyText(waInviteMessage(inv.name, inv.url));
        showToast(ok ? "Mensaje de WhatsApp copiado." : "No se pudo copiar.", ok);
        if (ok) {
          btn.classList.add("is-done");
          setTimeout(() => btn.classList.remove("is-done"), 1200);
        }
      });
    });
    rowsEl.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const inv = inviteCache.find((i) => i.token === btn.getAttribute("data-edit"));
        if (inv) loadEdit(inv);
      });
    });
    rowsEl.querySelectorAll("[data-del]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!window.confirm("¿Eliminar esta cortesía? El QR dejará de mostrarse (la cabina no se entera sola).")) return;
        api("/api/invites/" + encodeURIComponent(btn.getAttribute("data-del")), { method: "DELETE" })
          .then((data) => {
            if (createForm.edit_token.value === btn.getAttribute("data-del")) resetForm();
            showFlash("Eliminado.");
            render(data.invites || []);
          })
          .catch((err) => showFlash(err.message));
      });
    });
  }

  async function refresh() {
    const data = await api("/api/invites");
    render(data.invites || []);
  }

  function showGate() {
    document.body.classList.add("gate");
    session.hidden = true;
    login.hidden = false;
    app.hidden = true;
    showFlash("");
    loginError.hidden = true;
    login.secret.value = "";
    resetForm();
  }

  function showApp() {
    document.body.classList.remove("gate");
    session.hidden = false;
    login.hidden = true;
    app.hidden = false;
    refresh().catch((err) => showFlash(err.message));
  }

  document.getElementById("logout").addEventListener("click", () => {
    sessionStorage.removeItem(KEY);
    showGate();
  });

  login.addEventListener("submit", async (e) => {
    e.preventDefault();
    const value = login.secret.value.trim();
    sessionStorage.setItem(KEY, value);
    loginError.hidden = true;
    try {
      await api("/api/admin/ping");
      showApp();
    } catch {
      sessionStorage.removeItem(KEY);
      loginError.hidden = false;
      loginError.textContent = "Clave incorrecta.";
    }
  });

  function flagEmoji(iso) {
    if (!iso || iso.length !== 2) return "";
    return String.fromCodePoint(...[...iso.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)));
  }

  function fillDialSelect(select) {
    const countries = window.COUNTRY_DIALS || [];
    const peru = countries.find((c) => c.iso === "PE");
    const rest = countries
      .filter((c) => c.iso !== "PE")
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
    const add = (c, selected) => {
      const opt = document.createElement("option");
      opt.value = c.iso;
      opt.dataset.dial = c.dial;
      opt.textContent = `${flagEmoji(c.iso)} ${c.name} (+${c.dial})`;
      if (selected) opt.selected = true;
      select.appendChild(opt);
    };
    if (peru) add(peru, true);
    if (peru && rest.length) {
      const sep = document.createElement("option");
      sep.disabled = true;
      sep.textContent = "────────";
      select.appendChild(sep);
    }
    rest.forEach((c) => add(c, false));
    select.value = "PE";
  }

  function composePhone(form) {
    const local = form.phone.value.replace(/\D/g, "");
    if (!local) return "";
    const selected = form.dial.selectedOptions[0];
    const prefix = (selected?.dataset.dial || "").replace(/\D/g, "");
    if (!prefix) return "+" + local;
    if (local.startsWith(prefix)) return "+" + local;
    return "+" + prefix + local;
  }

  function channelOf(form) {
    return form.channel?.value || "whatsapp";
  }

  function syncChannel(form) {
    const ch = channelOf(form);
    const wantEmail = ch === "email" || ch === "ambos";
    const wantPhone = ch === "whatsapp" || ch === "ambos";
    const emailField = form.querySelector('[data-field="email"]');
    const phoneField = form.querySelector('[data-field="whatsapp"]');
    emailField.hidden = !wantEmail;
    phoneField.hidden = !wantPhone;
    form.email.required = wantEmail;
    form.phone.required = wantPhone;
    form.email.disabled = !wantEmail;
    form.phone.disabled = !wantPhone;
    form.dial.disabled = !wantPhone;
    if (!wantEmail) form.email.value = "";
    if (!wantPhone) form.phone.value = "";
  }

  function resetForm() {
    const kept = channelOf(createForm);
    createForm.reset();
    createForm.edit_token.value = "";
    createForm.channel.value = kept || "whatsapp";
    createForm.dial.value = "PE";
    formTitle.textContent = "Nueva cortesía";
    formSubmit.textContent = "Crear y generar QR";
    formCancel.hidden = true;
    syncChannel(createForm);
  }

  function loadEdit(inv) {
    createForm.edit_token.value = inv.token;
    createForm.name.value = inv.name || "";
    const hasEmail = Boolean(inv.email);
    const hasPhone = Boolean(inv.phone);
    const mode = hasEmail && hasPhone ? "ambos" : hasEmail ? "email" : "whatsapp";
    createForm.channel.value = mode;
    syncChannel(createForm);
    createForm.email.value = inv.email || "";
    const split = splitPhone(inv.phone);
    createForm.dial.value = split.iso;
    if (![...createForm.dial.options].some((o) => o.value === split.iso)) {
      createForm.dial.value = "PE";
    }
    createForm.phone.value = formatPhoneGroups(split.number, createForm.dial.value === "PE" ? 9 : 15);
    formTitle.textContent = "Editar cortesía";
    formSubmit.textContent = "Guardar cambios";
    formCancel.hidden = false;
    createForm.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  fillDialSelect(createForm.dial);
  createForm.phone.addEventListener("input", () => applyPhoneMask(createForm.phone));
  createForm.dial.addEventListener("change", () => applyPhoneMask(createForm.phone));
  createForm.addEventListener("change", (e) => {
    if (e.target.name === "channel") syncChannel(createForm);
  });
  formCancel.addEventListener("click", resetForm);
  syncChannel(createForm);

  createForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const ch = channelOf(form);
    const wantEmail = ch === "email" || ch === "ambos";
    const wantPhone = ch === "whatsapp" || ch === "ambos";
    const payload = {
      name: form.name.value.trim(),
      email: wantEmail ? form.email.value.trim() : "",
      phone: wantPhone ? composePhone(form) : "",
    };
    const editTok = form.edit_token.value;
    try {
      if (editTok) {
        const data = await api("/api/invites/" + encodeURIComponent(editTok), {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        showFlash("Cortesía actualizada.");
        resetForm();
        render(data.invites || []);
      } else {
        await api("/api/invites", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        showFlash("QR creado. Copia el mensaje de WhatsApp junto al número o ábrelo.");
        resetForm();
        await refresh();
      }
    } catch (err) {
      showFlash(err.message);
    }
  });

  // ponytail: phone mask + channel visibility
  {
    console.assert(formatPhoneGroups("987654321", 9) === "987 654 321", "pe mask");
    console.assert(formatPhoneGroups("98765", 9) === "987 65", "partial mask");
    const cases = [
      ["whatsapp", false, true],
      ["email", true, false],
      ["ambos", true, true],
    ];
    for (const [ch, emailOn, phoneOn] of cases) {
      createForm.channel.value = ch;
      syncChannel(createForm);
      console.assert(createForm.querySelector('[data-field="email"]').hidden === !emailOn, ch + " email");
      console.assert(createForm.querySelector('[data-field="whatsapp"]').hidden === !phoneOn, ch + " phone");
    }
    createForm.channel.value = "whatsapp";
    syncChannel(createForm);
  }

  if (secret()) {
    api("/api/admin/ping")
      .then(showApp)
      .catch(() => sessionStorage.removeItem(KEY));
  }
})();
