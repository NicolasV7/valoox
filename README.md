# Tienda de VALORANT — Cloudflare, multiusuario, sesiones selladas

Tu tienda, inventario y bundles desde el celular, sin prender el PC.

- **Nunca se guarda tu contraseña.** Riot autentica dentro de su propia app vía QR.
- Las sesiones viven **cifradas en D1**, con la clave fuera de la base.
- Un Worker, sin build step, sin dependencias npm en runtime.

## Correr

```sh
node --test test/*.ts          # 53 tests, cero dependencias
npx wrangler deploy
```

## Arquitectura

```
public/
  index.html            solo markup: sin <script> ni <style> inline
  app.js                las tres vistas y el flujo de login
  ui.js                 cada nodo del DOM se construye acá. Cero innerHTML
  items.js              nombre e icono de UN ítem (tienda, bundles)
  catalogs.js           los catálogos enteros, cacheados (colección, favoritos)
  inventory.js          la colección: skins, sprays, buddies, cards, títulos, agentes
  favs.js               marcar skins y elegir dónde recibir el aviso
  qr.js                 el encoder de QR, vendorizado (no CDN)
  _headers              CSP y headers de seguridad
src/
  index.ts              rutas, cookie uid, guarda Sec-Fetch-Site
  app/cookie.ts         el uid del navegador: acuñar, leer, validar
  types.ts              las formas que cruzan un borde de módulo
  vault/
    upstream.ts         LA ALLOWLIST DE EGRESO  <- leé esta primero
    http.ts             el unico fetch() a Riot. Aplica la allowlist
    constants.ts        cada string mágico de Riot, con su procedencia
    jar.ts              cookie jar: serializar, absorber, podar   (pura)
    shard.ts            afinidad -> host                          (pura)
    store.ts            storefront JSON -> lo que renderiza la página (pura)
    auth.ts             reauth, entitlements, identify, versión
    storefront.ts       tienda + wallet + adquiridos
    qr.ts               el handshake de 4 pasos de Riot Mobile
    seal.ts             HKDF por usuario + AES-256-GCM
    repo.ts             D1: get / CAS update / delete / prune
    session.ts          lo único que persiste, detrás de un módulo
    owned.ts            entitlements: por tipo, o todo de una
    inventory.ts        la colección completa, agrupada por tipo
    alerts.ts           el chequeo diario de la wishlist y el envío
```

Ningún archivo pasa de 200 líneas. El mayor es `upstream.ts`, con 121.

### Por qué `upstream.ts` es el archivo importante

Es la allowlist de egreso: host, path y método, congelados. Todo request a Riot
pasa por ahí antes de salir. Los endpoints que **cambian estado** —loadout, cola,
party, chat, contratos, compras— simplemente no existen en el código.

Eso convierte «solo lectura» de promesa en propiedad verificable: abrís el archivo,
leés trece reglas, y comprobás que no hay más. `test/upstream.test.ts` intenta
alcanzar seis endpoints de escritura y exige que los seis sean rechazados.

### Por qué el front no tiene `innerHTML`

Los nombres de los ítems vienen de valorant-api.com, una base comunitaria que este
proyecto no controla. Interpolarlos en markup es un XSS almacenado directo a una
página que puede alcanzar una sesión que saltea 2FA. Todo texto va por
`textContent`; solo se setean `src` y `href`, y solo después de verificar el origen.

El encoder de QR está vendorizado en `public/qr.js` en vez de cargarse de cdnjs:
bajo este diseño, un script de terceros en este origen podría llegar a la sesión.
El precedente es polyfill.io. `test/seams.test.ts` falla si vuelve a aparecer un
script externo o un sink de HTML.

La CSP es `default-src 'none'` con `script-src 'self'`. Incluye `worker-src 'none'`
porque **no hereda de forma segura**: con solo `script-src 'self'` se permitiría
registrar un service worker del mismo origen, y un XSS de pestaña se volvería un
punto de apoyo persistente que sobrevive a cerrarla.

`require-trusted-types-for 'script'` va en **Report-Only** por ahora: el encoder
de QR usa `innerHTML` en su ruta de fallback para navegadores viejos. Si la consola
no reporta violaciones tras un login real, se pasa a enforced.

### Qué hace el sellado y qué no

Cloudflare ya cifra D1 en reposo con sus propias claves, así que «cifrado en
reposo» describe la plataforma, no este código.

Lo único que compra `seal.ts` es que **la clave vive fuera de la base**: un token
de D1 filtrado, un bug en una query, una línea de log, un export de Time Travel o
un `.sql` en una laptop robada devuelven ciphertext.

Lo que **no** compra: protección frente a quien pueda desplegar un Worker. Esa
persona lee la clave de `env` en dos líneas. Ese borde es la cuenta de Cloudflare,
no la criptografía — y por eso endurecerla vale más que todo este archivo.

El `additionalData = kid|uid` del AES-GCM es la línea más valiosa: hace que una
confusión de filas **falle cerrada** en vez de abrir en silencio la sesión de otra
persona.

### El interruptor

```sh
npx wrangler secret put JAR_KEY     # pegá 32 bytes nuevos en base64
```

Un comando deja indescifrable todo ciphertext que exista —filas vivas, snapshots
de Time Travel, cualquier export— y funciona aunque D1 esté caído. Deslogea a
todos. `test/rotation.test.ts` prueba la propiedad; el simulacro contra
producción se hace **antes** de que haya usuarios, porque los desconecta.

## Colección y avisos

La colección **no es solo skins**: buddies, sprays, tarjetas, títulos, agentes y
variantes. Un solo request a Riot los trae todos agrupados por tipo — mejor que
recorrer una lista de UUIDs de memoria, que es como el tipo «buddy» terminó
etiquetado como chromas la primera vez.

Los conteos son gratis. Los nombres e imágenes no: los catálogos suman ~6 MB
entre todos, así que **cada categoría baja el suyo recién cuando la abrís**.

Para los avisos, un favorito se guarda como el uuid de **nivel 0** de la skin
(que es el que la tienda ofrece, medido en skins de 1 y de 4 niveles) más su
nombre. Por eso el job diario hace una intersección de conjuntos y nunca necesita
el catálogo de 3,5 MB.

El selector no te ofrece skins que ya tenés: Riot nunca las pone en tu tienda, así
que marcarlas sería una entrada muerta.

### Por qué el aviso no es Web Push

Web Push necesita un service worker, y la CSP tiene `worker-src 'none'` justamente
para que un XSS no pueda plantar uno persistente. En vez de eso el Worker hace POST
a **ntfy** o a un **webhook de Discord**.

Vos das solo el *topic* o el *id/token*, nunca una URL: los hosts están fijos en la
allowlist, si no esa ruta sería un SSRF abierto con la reputación de egreso colgando.

**Medido 2026-09-14:** ntfy.sh limita por IP de origen, y la de Cloudflare es
compartida — un Worker recibe 429 de forma consistente mientras el mismo topic
acepta desde una laptop. Discord limita por webhook y es la vía confiable desde acá.

## Qué se guarda

**D1, tabla `s`, una fila por navegador:**

| columna | qué es |
|---|---|
| `uid` | 16 bytes aleatorios. El único vínculo con una persona, y vive en su navegador |
| `kid` | versión de clave, para rotar sin desloguear |
| `blob` | `{jar, puuid, shard}` sellado. El puuid nunca es columna |
| `ver` | token CAS: dos pestañas refrescando no se pisan |

Un dump crudo de la tabla no revela ninguna identidad de Riot.

**KV: solo cachés.** `version` (pública) y `store:<uid>`, que expira con el propio
temporizador de rotación de la tienda — por eso no hace falta ningún cron.

## Lo que no cambia, y hay que decirlo

**Borrar tu fila revoca nuestro acceso, no la credencial.** El jar sigue funcionando
del lado de Riot hasta que expira solo, y se renueva en cada uso. La única muerte
real es cerrar sesión en todos los dispositivos desde Riot.

**El jar saltea tu 2FA.** Por eso nunca sale de D1 sin descifrar, nunca va al
navegador, y nunca aparece en un log — hay un test que lo verifica mecánicamente.

**Riot no aprueba esto.** Su política lista «online store tracking» y las apps de
uso personal no públicas como casos no aprobados. Cero baneos confirmados
atribuibles a un verificador de solo lectura en ~5 años, pero es su decisión.

## Antes de abrirlo a desconocidos

Tres mediciones contra Riot que deciden si lo que le decís al usuario es verdad:

1. ¿El `ssid` guardado abre `account.riotgames.com`? Decide si una brecha es
   fastidio dentro del juego o exposición de email y teléfono.
2. ¿Cambiar la contraseña de Riot invalida un `ssid` vivo? Es la única revocación
   real que podés ofrecer — si no funciona, esa instrucción es peor que inútil.
3. ¿Riot invalida un `ssid` superado al rotar? Fija tu ventana de exposición.

Más: FIDO2 en la cuenta de Cloudflare, tokens de scope mínimo, el simulacro del
interruptor, y las pantallas de consentimiento.
