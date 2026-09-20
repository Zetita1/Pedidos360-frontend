# Pedidos360 — Frontend

SPA en **Angular 21** con autenticacion **MSAL / Microsoft Entra External ID**, que consume
los microservicios de Pedidos360 a traves de **AWS API Gateway**.

> DSY1107 Desarrollo Cloud Native I — Evaluaciones Parciales 1 y 2

## Requisitos

- Node.js 20 o superior (probado con Node 22)
- El backend corriendo (ver `../pedidos360-backend`)

## Puesta en marcha

```bash
npm ci --legacy-peer-deps
npm start           # http://localhost:4200
```

> El flag `--legacy-peer-deps` es necesario: npm 10.9 falla al resolver los peers de
> vitest 4 con el error `Cannot read properties of null (reading 'edgesOut')`.

Antes del primer arranque hay que poner los identificadores del tenant externo en
`src/environments/environment.ts`:

```ts
const TENANT_SUBDOMINIO = 'pedidos360';                // el de tu tenant externo
const TENANT_ID = '<Directory (tenant) ID>';

msal: {
  clientId: '<Application (client) ID del registro pedidos360-spa>',
  authority: `https://${TENANT_SUBDOMINIO}.ciamlogin.com/${TENANT_ID}`,
  knownAuthorities: [`${TENANT_SUBDOMINIO}.ciamlogin.com`],
  ...
},
```

En un tenant externo la autoridad es `ciamlogin.com`, **no** `login.microsoftonline.com`, y
`knownAuthorities` es obligatorio.

El paso a paso del registro en Entra ID esta en
[`../docs/01-registro-entra-id.md`](../docs/01-registro-entra-id.md).

## Scripts

| Comando | Que hace |
|---|---|
| `npm start` | servidor de desarrollo en `http://localhost:4200`, con el proxy activo |
| `npm run build` | bundle productivo en `dist/` (reemplaza el environment) |
| `npm run test:ci` | pruebas unitarias sin modo watch |

## Estructura

```
src/app/
├── core/
│   ├── auth/
│   │   ├── msal.config.ts        instancia MSAL, guard config e interceptor config
│   │   ├── auth.service.ts       sesion, roles y scopes leidos de los claims
│   │   └── role.guard.ts         rolGuard(...) e inicioGuard
│   ├── interceptors/
│   │   └── error.interceptor.ts  traduce los Problem Detail del backend
│   ├── models/                   contratos que devuelve la API
│   └── services/                 unico cliente HTTP + cola de avisos
├── features/
│   ├── login/                    ingreso y pantalla de login fallido
│   ├── tablero/                  indicadores agregados por el BFF
│   ├── catalogo/                 listado y alta de productos
│   ├── clientes/                 listado y alta de clientes
│   ├── pedidos/                  listado, alta, detalle y mis pedidos
│   ├── perfil/                   claims del token vs. lo que valida el BFF
│   └── errores/                  403 sin permisos
├── app.routes.ts                 MsalGuard + rolGuard por ruta
└── app.config.ts                 providers de MSAL, HttpClient e inicializacion
```

## Ruteo: las mismas URLs en local y en la nube

El SPA llama a `/api/v1/pedidos`, `/api/v1/productos`, `/api/v1/clientes` y `/api/bff/...`.

- **En la nube** las resuelve el AWS API Gateway, que enruta cada recurso a su microservicio.
- **En desarrollo** las resuelve `proxy.conf.json`, que reparte a los puertos 8081, 8082,
  8083 y 8080 respectivamente.

Por eso `environment.apiBaseUrl` esta vacio en desarrollo y lleva el origen del gateway en
produccion: el codigo del servicio HTTP no cambia entre entornos.

## Como funciona la autenticacion

1. `app.config.ts` registra `MSAL_INSTANCE`, `MSAL_GUARD_CONFIG` y `MSAL_INTERCEPTOR_CONFIG`,
   e inicializa MSAL en un `provideAppInitializer` antes de que arranque el router
   (MSAL v5 exige `initialize()` explicito y procesar el redirect al cargar la pagina).
   MSAL v5 implementa **solo Authorization Code con PKCE**: genera el code verifier, envia
   el `code_challenge` con `S256` y valida `state` y `nonce`.
2. `MsalGuard` protege el arbol de rutas privadas: sin sesion, redirige al IDaaS.
3. `rolGuard([...])` corre despues y revisa el claim `roles` del token; si falta el rol,
   deriva a `/sin-permisos`.
4. `MsalInterceptor` adjunta el access token a toda llamada que coincida con
   `environment.apiBaseUrl` y renueva el token en silencio cuando vence.
5. `AuthService` expone la sesion como signals (`nombre`, `roles`, `scopes`, `esAdmin`,
   `puedeGestionar`) para que las vistas muestren solo lo que corresponde al rol.

Ocultar un boton **no es** un control de seguridad: quien decide es el backend. La vista
**Perfil** lo hace evidente mostrando lado a lado los claims que lee Angular y los que
resuelve el BFF del mismo token.

## Vistas

| Ruta | Roles | Contenido |
|---|---|---|
| `/login` | publica | ingreso con Entra External ID |
| `/tablero` | Admin, Vendedor | indicadores, stock critico y ultimos pedidos |
| `/catalogo` | todos | catalogo con filtros; alta y baja solo para Admin |
| `/clientes` | Admin, Vendedor | cartera de clientes y alta de fichas |
| `/pedidos` | Admin, Vendedor | listado, confirmacion y anulacion |
| `/pedidos/nuevo` | Admin, Vendedor | armado del pedido con totales en vivo |
| `/pedidos/:id` | todos | detalle y transiciones de estado permitidas |
| `/mis-pedidos` | todos | pedidos del usuario autenticado (claim `oid`) |
| `/perfil` | todos | claims, scopes y permisos |
| `/sin-permisos` | publica | 403 explicado |

## Despliegue

`npm run build` genera `dist/pedidos360-frontend/browser`, listo para publicarse en
**S3 + CloudFront**. Antes de construir hay que dejar en
`src/environments/environment.production.ts` la URL del API Gateway y las URIs de redirect
productivas, y registrarlas en el portal de Entra ID.
