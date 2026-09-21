/**
 * Configuracion productiva. El SPA se publica en AWS Amplify Hosting y consume la API a traves
 * del AWS API Gateway, que valida el JWT del IDaaS antes de llegar a los servicios en EC2.
 */

/** Subdominio del tenant externo (CIAM), sin el sufijo .ciamlogin.com */
const TENANT_SUBDOMINIO = 'pedidos360duocuc';

/** Directory (tenant) ID del tenant externo */
const TENANT_ID = '9d265688-dbb5-4a46-9b9a-8f6765928aa0';

export const environment = {
  production: true,

  msal: {
    clientId: '4763762f-79ea-47ad-9966-bda5e049df68',
    tenantId: TENANT_ID,
    authority: `https://${TENANT_SUBDOMINIO}.ciamlogin.com/${TENANT_ID}`,
    knownAuthorities: [`${TENANT_SUBDOMINIO}.ciamlogin.com`],
    redirectUri: 'https://main.d1pem9n2nc75cz.amplifyapp.com',
    postLogoutRedirectUri: 'https://main.d1pem9n2nc75cz.amplifyapp.com/login',
  },

  apiScopes: [
    'api://pedidos360-api/Pedidos.Read',
    'api://pedidos360-api/Pedidos.Write',
  ],

  /** Origen del stage del API Gateway (sin barra final). */
  apiBaseUrl: 'https://j9w6eomnw5.execute-api.us-east-1.amazonaws.com',

  rutas: {
    bff: '/api/bff',
    pedidos: '/api/v1/pedidos',
    productos: '/api/v1/productos',
    clientes: '/api/v1/clientes',
  },
};
