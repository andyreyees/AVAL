export const $ = (s, el = document) => el.querySelector(s);
export const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const short = h => h.slice(0, 8) + "…" + h.slice(-6);
export const fmtDate = ts => new Date(Number(ts) * 1000).toLocaleDateString("es-CR", { year: "numeric", month: "long", day: "numeric" });
export const isHash = h => /^0x[0-9a-fA-F]{64}$/.test(h);
export const linkFor = h => `${location.origin}${location.pathname}#/verificar/${h}`;
export const errMsg = e => e.reason || e.shortMessage || e.message || "Algo salió mal";

export async function hashFile(file) {
  const buf = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return "0x" + [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

export function toast(msg, type = "") {
  const t = document.createElement("div");
  t.className = "toast " + type; t.textContent = msg; t.setAttribute("role", "status");
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

export async function copy(text) {
  try { await navigator.clipboard.writeText(text); toast("Enlace copiado"); } catch { toast("No se pudo copiar", "err"); }
}

export function dropzone(el, { multiple = false, onFiles }) {
  const input = Object.assign(document.createElement("input"), { type: "file", multiple, hidden: true });
  el.appendChild(input);
  el.tabIndex = 0; el.setAttribute("role", "button");
  el.onclick = () => input.click();
  el.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.click(); } };
  input.onchange = () => onFiles([...input.files]);
  ["dragenter", "dragover"].forEach(ev => el.addEventListener(ev, e => { e.preventDefault(); el.classList.add("over"); }));
  ["dragleave", "drop"].forEach(ev => el.addEventListener(ev, () => el.classList.remove("over")));
  el.addEventListener("drop", e => { e.preventDefault(); onFiles([...e.dataTransfer.files]); });
}
