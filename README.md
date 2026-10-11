# Aval en Stellar (testnet)

Sin contratos: usa operaciones nativas de Stellar y la billetera Freighter.
- Cada título = una entrada de datos `c:<huella>` en la cuenta de la institución.
- El admin guarda las instituciones aprobadas como entradas `inst:<cuenta>` en su cuenta.
- Pedir acceso = una transacción con `home_domain` + nombre + 1 XLM de prueba al admin (memo `aval-req`).

## Pasos
1. Instale Freighter, cambie a **Testnet** y cree dos cuentas: **Admin** y **Colegio**.
2. Fondee ambas con Friendbot (botón en Freighter cuando la cuenta está sin fondos).
3. Copie la dirección G de **Admin** en `frontend/js/config.js` (campo `admin`).
4. `npm run web` y abra la URL.

## Recorrido
Admin (conectado) emite como "ULACIT (demo)" → verificar en incógnito → Colegio pide acceso → Admin aprueba → Colegio emite → revocar/suspender.

## Límites del prototipo
Una cuenta admite unas 1000 entradas y cada una reserva 0.5 XLM; para producción se usaría Soroban u otra estructura.
Cualquiera puede escribir datos en su propia cuenta, pero Aval solo reconoce como válidas las de instituciones aprobadas.
