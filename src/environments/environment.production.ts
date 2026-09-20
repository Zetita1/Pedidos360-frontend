/**
 * Configuracion productiva. El SPA se publica en S3 + CloudFront y consume la API a traves
 * del AWS API Gateway, que valida el JWT del IDaaS antes de llegar a los servicios en EC2.
 */

/** Subdominio del tenant externo (CIAM), sin el sufijo .ciamlogin.com */
const TENANT_SUBDOMINIO = 'pedidos360duoc2026';

/** Directory (tenant) ID del tenant externo */
const TENANT_ID = 'PENDIENTE-pegar-el-Id-de-inquilino';

export const environment = {
  production: true,

  msal: {
    clientId: '11111111-1111-1111-1111-111111111111',
    tenantId: TENANT_ID,
    authority: `https://${TENANT_SUBDOMINIO}.ciamlogin.com/${TENANT_ID}`,
    knownAuthorities: [`${TENANT_SUBDOMINIO}.ciamlogin.com`],
    redirectUri: 'https://pedidos360.example.cl',
    postLogoutRedirectUri: 'https://pedidos360.example.cl/login',
  },

  apiScopes: [
    'api://pedidos360-api/Pedidos.Read',
    'api://pedidos360-api/Pedidos.Write',
  ],

  /** Origen del stage del API Gateway (sin barra final). */
  apiBaseUrl: 'https://api.pedidos360.example.cl',

  rutas: {
    bff: '/api/bff',
    pedidos: '/api/v1/pedidos',
    productos: '/api/v1/productos',
    clientes: '/api/v1/clientes',
  },
};
