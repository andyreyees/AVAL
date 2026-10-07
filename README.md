# Aval – Títulos y certificaciones en blockchain

En la cadena solo se guarda el hash SHA-256 de cada documento. Las instituciones autorizadas emiten y revocan; cualquiera verifica.

## Correrlo en local (3 terminales)
```
npm install
npm run node           # 1) blockchain local
npm run deploy:local   # 2) despliega y genera frontend/js/config.js
npm run web            # 3) sirve el frontend (necesita servidor por usar módulos JS)
```
MetaMask: agregue la red `http://127.0.0.1:8545` (chainId 31337) e importe la llave de la cuenta #0 de `hardhat node`. Esa cuenta es administrador e institución "ULACIT (demo)".

Pruebas del contrato: `npm test`

## Estructura del frontend
- `index.html` · `css/styles.css`
- `js/`: `config.js` (generado), `abi.js`, `chain.js` (billetera/contrato), `utils.js`, `verify.js`, `issue.js`, `registry.js`, `admin.js`, `app.js` (rutas)

## Demo
1. Emitir: suba un PDF → emitido, con QR y enlace.
2. Verificar: el mismo PDF → válido. Cambie una letra → no encontrado.
3. Mis emisiones: revoque → "Revocado".
4. Instituciones (administrador): autorice otra billetera.

## Sepolia
Copie `.env.example` a `.env` y use `npm run deploy:sepolia`.

## Roles y confianza
- **Verificador:** no necesita cuenta. Sube el PDF o escanea el QR.
- **Institución:** conecta su billetera, pide acceso (nombre + dominio) y publica un TXT en `_aval.<dominio>` con `aval-verify=<su billetera>`.
- **Administrador (quien despliega el contrato):** revisa y aprueba o rechaza. Puede suspender una institución; sus documentos pasan a mostrarse como "no autorizada".
- **Modo demo (por defecto):** la prueba de dominio se simula y sale "comprobado (demo)". Para usar el DNS real, despliegue con `DEMO=false` o ponga `demo: false` en `frontend/js/config.js`.
- Con demo apagado, el DNS solo sale "comprobado" con un dominio que usted controle; cree el TXT en su propio dominio y use ese dominio al solicitar acceso.
