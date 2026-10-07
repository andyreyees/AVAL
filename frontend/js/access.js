import { $, esc, toast, errMsg } from "./utils.js";
import { state, writer, connect, refresh } from "./chain.js";
import { dnsRecord, DEMO } from "./dns.js";

const STEPS = `<ol class="steps">
  <li><div><strong>Conecte su billetera</strong><br><span class="muted">Será la llave oficial de su institución.</span></div></li>
  <li><div><strong>Solicite acceso</strong><br><span class="muted">Nombre y dominio web oficial.</span></div></li>
  <li><div><strong>Demuestre que el dominio es suyo</strong><br><span class="muted">Un registro DNS que cualquiera puede comprobar.</span></div></li>
  <li><div><strong>Aval revisa y aprueba</strong><br><span class="muted">Sin aprobación no se puede emitir.</span></div></li></ol>`;

export function render(el) {
  const head = "<h1>Acceso para instituciones</h1>";
  if (!state.address) {
    el.innerHTML = `${head}<p class="sub">Universidades, colegios y centros de formación pueden emitir documentos verificables. Cada institución se revisa antes de emitir, para que nadie pueda hacerse pasar por otra.</p>${STEPS}<button class="btn" id="c">Conectar billetera</button>`;
    return $("#c", el).onclick = () => connect().catch(e => toast(errMsg(e), "err"));
  }
  if (state.status === 2) {
    el.innerHTML = `${head}<div class="result ok"><div class="seal"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div><h2>${esc(state.name)} está aprobada</h2><p>Ya puede emitir y revocar documentos.</p><a class="btn" href="#/emitir">Emitir documentos</a></div>`;
    return;
  }
  if (state.status === 1) {
    el.innerHTML = `${head}<div class="result warn"><div class="seal"><svg viewBox="0 0 24 24"><path d="M12 7v6M12 17v.01"/></svg></div><h2>Solicitud en revisión</h2><p>${esc(state.name)} · ${esc(state.domain)}</p>
      ${DEMO ? "<p>Modo demo: la prueba de dominio se simula, no necesita crear nada. El administrador puede aprobar su solicitud.</p>" : "<p>Para acelerar la aprobación, cree este registro TXT en su DNS:</p>"}
      <p class="muted">Nombre: <code>_aval.${esc(state.domain)}</code></p><div class="rec">${dnsRecord(state.address)}</div></div>`;
    return;
  }
  el.innerHTML = `${head}<p class="sub">${state.status === 3 ? "Su solicitud anterior no fue aprobada o fue suspendida. Puede enviar una nueva." : "Cuéntenos quién es su institución."}</p>
    <form id="f"><label for="n">Nombre de la institución</label><input id="n" required placeholder="Universidad Latinoamericana de Ciencia y Tecnología">
    <label for="d" style="margin-top:14px">Dominio web oficial</label><input id="d" required placeholder="ulacit.ac.cr">
    <button class="btn" style="margin-top:18px">Enviar solicitud</button></form>`;
  $("#f", el).onsubmit = async e => {
    e.preventDefault();
    try {
      const d = $("#d", el).value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
      await (await writer().requestAccess($("#n", el).value.trim(), d)).wait();
      toast("Solicitud enviada"); await refresh();
    } catch (err) { toast(errMsg(err), "err"); }
  };
}
