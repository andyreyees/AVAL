Aval
Verificación de títulos y certificaciones sobre Stellar.
Aval permite que una institución (universidad, colegio, centro de formación) registre la huella digital de un título en la blockchain de Stellar, y que cualquier persona compruebe en segundos si un documento es real, quién lo emitió y si sigue vigente. No hace falta crear una cuenta para verificar.
> Estado: prototipo funcional en la **red de pruebas (testnet)** de Stellar. No usar con dinero real.
> La versión anterior, hecha con Ethereum y Solidity, está en la rama [`ethereum-v1`](../../tree/ethereum-v1).
El problema
Falsificar un título toma minutos, y comprobar uno real depende de escribirle a la institución y esperar. Aval hace que verificar sea inmediato y que alterar un documento deje de pasar desapercibido.
Cómo funciona
La institución sube el documento. El navegador calcula su huella SHA-256; el archivo no sale del equipo.
La huella se registra en la cuenta Stellar de la institución, junto con el tipo de documento y la fecha.
Quien verifica sube el mismo archivo (o abre el enlace del QR). Aval recalcula la huella y la busca en el registro.
Si cambia una sola letra del documento, la huella cambia y el resultado es No encontrado.
Resultados posibles: Título válido, Revocado, Institución no autorizada o No encontrado.
Roles
Rol	Necesita cuenta	Qué hace
Verificador	No	Sube el archivo o abre el enlace y ve el resultado
Institución	Sí (Freighter)	Pide acceso, emite y revoca documentos
Administrador	Sí (Freighter)	Revisa solicitudes, aprueba, rechaza o suspende instituciones
Cómo se evitan las instituciones falsas
La blockchain no puede saber quién es quién; esa confianza se construye aparte:
Una institución nueva solicita acceso con su nombre y su dominio web (guardado como `home_domain` de su cuenta Stellar).
El administrador revisa la solicitud antes de aprobarla.
Con `demo: false`, el dominio se comprueba con el archivo `stellar.toml` de la institución, que debe listar su cuenta.
Aval solo reconoce como válidas las emisiones de instituciones aprobadas. Si una institución es suspendida, sus documentos pasan a mostrarse como Institución no autorizada.
Aval confirma que una institución aprobada registró ese archivo exacto en esa fecha. Que la persona realmente se graduó lo garantiza la institución.
Estructura de datos en Stellar
No se usan contratos inteligentes: se emplean operaciones nativas y entradas de datos de las cuentas.
Dónde	Entrada	Significado
Cuenta de la institución	`c:<huella>`	Documento emitido (`fecha
Cuenta de la institución	`aval:name` y `home_domain`	Nombre y dominio solicitados
Cuenta del administrador	`inst:<cuenta>`	Institución aprobada
Cuenta del administrador	`rej:<cuenta>`	Institución rechazada o suspendida
Transacción de solicitud	Pago de 1 XLM de prueba con memo `aval-req`	Solicitud de acceso
Requisitos
Un navegador con la extensión Freighter
Node.js (versión LTS)
No hay dependencias que instalar: el SDK de Stellar se carga desde un CDN.
Cómo correrlo
Freighter: cambie la red a Test Net y cree dos cuentas, por ejemplo Admin y Colegio. Fondee ambas con el botón de Friendbot.
Configuración: copie la dirección (empieza con `G`) de la cuenta Admin en `frontend/js/config.js`:
```js
   export const CFG = {
     horizon: "https://horizon-testnet.stellar.org",
     admin: "G...",   // cuenta administradora
     demo: true       // true = prueba de dominio simulada
   };
   ```
Servidor local:
```
   npm run web
   ```
Abra la dirección que muestre (normalmente `http://localhost:3000`).
Recorrido de demostración
Con Admin conectada, en Emitir: suba un PDF y emítalo. Aparece un QR y un enlace.
En una ventana de incógnito (sin conectar), Verificar: suba el mismo PDF → Título válido.
Cambie una letra del PDF y súbalo de nuevo → No encontrado.
Cambie a Colegio en Freighter, y en Soy institución envíe una solicitud.
Con Admin, en Administración, apruebe la solicitud.
Con Colegio, emita un documento y revóquelo desde Mis emisiones → Revocado.
Con Admin, suspenda al colegio → sus documentos muestran Institución no autorizada.
Estructura del proyecto
```
frontend/
  index.html
  css/styles.css
  js/
    config.js    configuración (cuenta admin, modo demo)
    chain.js     conexión con Freighter y Stellar
    verify.js    verificación de documentos
    access.js    solicitud de acceso de instituciones
    issue.js     emisión de documentos
    registry.js  historial y revocación
    admin.js     panel del administrador
    dns.js       comprobación de dominio (stellar.toml)
    utils.js     utilidades
    app.js       rutas e interfaz
```
Limitaciones conocidas
Es un prototipo en testnet y no ha pasado por una auditoría de seguridad.
Cada cuenta de Stellar admite alrededor de 1000 entradas de datos, y cada una reserva 0.5 XLM; para una escala real habría que cambiar la estructura (por ejemplo, contratos Soroban o raíces de Merkle).
Cualquiera puede escribir datos en su propia cuenta; solo cuentan las de instituciones aprobadas.
La confianza final descansa en el administrador. A futuro, esa función debería respaldarla una entidad reconocida.
La prueba de dominio está simulada con `demo: true`.
La lista de solicitudes lee los últimos 200 pagos recibidos por la cuenta administradora.
Hoja de ruta
Ahora: emitir, verificar, revocar y aprobar instituciones.
Siguiente: carga masiva y conexión con los sistemas académicos de las instituciones.
Después: comprobación real de dominio, red principal de Stellar y alianzas con entidades reguladoras.
