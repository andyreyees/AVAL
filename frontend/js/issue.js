import { $, esc, linkFor, hashFile, copy, dropzone, toast, errMsg } from "./utils.js";
import { state, writer, connect } from "./chain.js";

export function render(el) {
  if (!state.address) return gate(el, "Conecte la billetera de su institución para emitir documentos.", true);
  if (!state.active) return gate(el, 'Su institución aún no está aprobada. <a href="#/institucion">Ver estado de la solicitud</a>');
  let files = [];
  el.innerHTML = `
    <h1>Emitir documentos</h1>
    <p class="sub">${esc(state.name)} · Solo se registra la huella de cada archivo, nunca datos personales.</p>
    <label for="kind">Tipo de documento</label>
    <input id="kind" placeholder="Bachillerato en Ingeniería Informática">
    <div class="drop small" id="drop"><strong>Agregue los archivos</strong><span>Puede subir varios a la vez</span></div>
    <ul class="files" id="files"></ul>
    <button class="btn" id="go" disabled>Emitir en blockchain</button>
    <div id="done"></div>`;
  const list = $("#files", el), go = $("#go", el);
  const paint = () => { list.innerHTML = files.map((f, i) => `<li>${esc(f.name)}<button data-i="${i}" aria-label="Quitar">×</button></li>`).join(""); go.disabled = !files.length; };
  list.onclick = e => { if (e.target.dataset.i) { files.splice(e.target.dataset.i, 1); paint(); } };
  dropzone($("#drop", el), { multiple: true, onFiles: fs => { files.push(...fs); paint(); } });
  go.onclick = async () => {
    const kind = $("#kind", el).value.trim();
    if (!kind) return toast("Escriba el tipo de documento", "err");
    go.disabled = true; go.textContent = "Confirme en su billetera…";
    try {
      const hs = await Promise.all(files.map(hashFile));
      const c = writer();
      await (await (hs.length === 1 ? c.issue(hs[0], kind) : c.issueBatch(hs, kind))).wait();
      toast(`${hs.length} documento(s) emitido(s)`);
      $("#done", el).innerHTML = `<h3>Listos para compartir</h3>` + files.map((f, i) => `<div class="item"><div><strong>${esc(f.name)}</strong><br><button class="link" data-h="${hs[i]}">Copiar enlace</button></div><div class="qr" data-h="${hs[i]}"></div></div>`).join("");
      el.querySelectorAll(".qr").forEach(q => new window.QRCode(q, { text: linkFor(q.dataset.h), width: 88, height: 88 }));
      el.querySelectorAll("button[data-h]").forEach(b => b.onclick = () => copy(linkFor(b.dataset.h)));
      files = []; paint();
    } catch (e) { toast(errMsg(e), "err"); }
    go.textContent = "Emitir en blockchain"; go.disabled = !files.length;
  };
}

function gate(el, msg, canConnect) {
  el.innerHTML = `<h1>Emitir documentos</h1><div class="empty"><p>${msg}</p>${canConnect ? '<button class="btn" id="c">Conectar billetera</button>' : ""}</div>`;
  if (canConnect) $("#c", el).onclick = () => connect().catch(e => toast(errMsg(e), "err"));
}
