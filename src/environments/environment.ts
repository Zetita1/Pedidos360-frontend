/**
 * Configuracion de desarrollo. Los identificadores de Microsoft Entra External ID son
 * valores de ejemplo: reemplazalos por los de tu tenant externo antes de ejecutar.
 *
 * En produccion este archivo se sustituye por environment.production.ts (ver angular.json).
 */

/** Subdominio del tenant externo (CIAM), sin el sufijo .ciamlogin.com */
const TENANT_SUBDOMINIO = 'pedidos360duocuc';

/** Directory (tenant) ID del tenant externo */
const TENANT_ID = '9d265688-dbb5-4a46-9b9a-8f6765928aa0';

export const environment = {
  production: false,

  /** Registro de aplicacion SPA en Microsoft Entra External ID. */
  msal: {
    clientId: '4763762f-79ea-47ad-9966-bda5e049df68',
    tenantId: TENANT_ID,

    /**
     * En un tenant externo la autoridad SIEMPRE es <subdominio>.ciamlogin.com; usar
     * login.microsoftonline.com es el error mas comun al migrar desde un tenant de trabajo.
     */
    authority: `https://${TENANT_SUBDOMINIO}.ciamlogin.com/${TENANT_ID}`,

    /** MSAL exige declarar los dominios de autoridad que no son los de Microsoft publico. */
    knownAuthorities: [`${TENANT_SUBDOMINIO}.ciamlogin.com`],

    redirectUri: 'http://localhost:4200',
    postLogoutRedirectUri: 'http://localhost:4200/login',
  },

  /**
   * Scopes expuestos por el registro de aplicacion de la API. Son los que se piden al IDaaS
   * y los que el API Gateway y el backend validan en el claim scp.
   */
  apiScopes: [
    'api://pedidos360-api/Pedidos.Read',
    'api://pedidos360-api/Pedidos.Write',
  ],

  /**
   * Origen del AWS API Gateway. Todo el trafico del SPA pasa por el gateway, que valida
   * el JWT y enruta a los microservicios en EC2.
   *
   * Para trabajar sin AWS, dejarlo vacio (''): las llamadas salen relativas y el proxy de
   * ng serve (proxy.conf.json) las reparte a los microservicios locales.
   */
  apiBaseUrl: 'https://j9w6eomnw5.execute-api.us-east-1.amazonaws.com',

  /**
   * Rutas publicadas en el API Gateway. Cada recurso va a su microservicio duenio; el BFF
   * queda para las vistas agregadas (tablero) y la identidad (perfil).
   */
  rutas: {
    bff: '/api/bff',
    pedidos: '/api/v1/pedidos',
    productos: '/api/v1/productos',
    clientes: '/api/v1/clientes',
  },
};
