import { domainOk, DEMO } from "./dns.js";
import { $, esc, short, fmtDate, isHash, linkFor, hashFile, copy, dropzone, errMsg } from "./utils.js";
import { reader, configured } from "./chain.js";

const ICON = {
  ok: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  bad: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  warn: '<svg viewBox="0 0 24 24"><path d="M12 7v6M12 17v.01"/></svg>'
};

export function render(el, param) {
  el.innerHTML = `
    <h1>Verifique un título</h1>
    <p class="sub">Suba el documento y lo comparamos con el registro en blockchain. El archivo no sale de su computadora.</p>
    <div class="drop" id="drop"><strong>Suelte el archivo aquí</strong><span>o haga clic para elegirlo</span></div>
    <form class="inline" id="hform"><input id="hin" placeholder="…o pegue la huella (0x…)" aria-label="Huella del documento"><button class="btn">Verificar</button></form>
    <div id="out" aria-live="polite"></div>
    <p class="foot">¿Representa a una institución? <a href="#/institucion">Solicite acceso para emitir</a></p>`;
  const out = $("#out", el);
  dropzone($("#drop", el), { onFiles: async fs => fs[0] && check(await hashFile(fs[0]), out) });
  $("#hform", el).onsubmit = e => { e.preventDefault(); const h = $("#hin", el).value.trim(); isHash(h) ? check(h, out) : show(out, "warn", "Huella no válida", "<p>Debe empezar con 0x y tener 64 caracteres.</p>"); };
  if (param && isHash(param)) check(param, out);
}

function show(out, kind, title, body, h) {
  out.innerHTML = `<section class="result ${kind}"><div class="seal">${ICON[kind]}</div><h2>${title}</h2>${body}
    ${h ? `<button class="btn ghost" id="cp">Copiar enlace de verificación</button>` : ""}</section>`;
  if (h) $("#cp", out).onclick = () => copy(linkFor(h));
}

async function check(h, out) {
  if (!configured()) return show(out, "warn", "Falta configurar", "<p>Despliegue el contrato con <code>npm run deploy:local</code>.</p>");
  show(out, "warn", "Consultando…", "<p>Leyendo el registro.</p>");
  try {
    const r = await reader().verify(h);
    const rows = `<dl><dt>Huella</dt><dd><code>${esc(short(h))}</code></dd>`;
    if (!r.exists) return show(out, "bad", "No encontrado", `<p>Este archivo no está registrado. Puede ser falso o haber sido modificado.</p>${rows}</dl>`, h);
    const dns = r.issuerDomain ? await domainOk(r.issuerDomain, r.issuer) : false;
    const datos = `${rows}<dt>Institución</dt><dd>${esc(r.issuerName || "Desconocida")}</dd>
      <dt>Dominio</dt><dd>${esc(r.issuerDomain)} <span class="pill ${dns ? "ok" : "warn"}">${dns ? "comprobado" + (DEMO ? " (demo)" : "") : "sin comprobar"}</span></dd>
      <dt>Documento</dt><dd>${esc(r.kind)}</dd><dt>Emitido</dt><dd>${fmtDate(r.issuedAt)}</dd></dl>
      <p class="note">Confirma que esta institución registró este archivo exacto en esa fecha.</p>`;
    if (r.revoked) return show(out, "warn", "Revocado", `<p>La institución anuló este documento. Ya no es válido.</p>${datos}`, h);
    if (!r.issuerActive) return show(out, "warn", "Institución no autorizada", `<p>La institución emisora ya no está autorizada en Aval. Confirme el documento directamente con ella.</p>${datos}`, h);
    show(out, "ok", "Título válido", `<p>Emitido por una institución aprobada y sin alteraciones.</p>${datos}`, h);
  } catch (e) { show(out, "bad", "No se pudo consultar", `<p>${esc(errMsg(e))}</p>`); }
}
