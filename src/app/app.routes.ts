import { Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';

import { ROLES } from './core/auth/auth.service';
import { inicioGuard, rolGuard } from './core/auth/role.guard';

/**
 * Rutas de Pedidos360. El MsalGuard exige sesion en el IDaaS y rolGuard exige el rol que
 * viene en el claim {@code roles} del token.
 */
export const routes: Routes = [
  {
    path: 'login',
    title: 'Ingresar | Pedidos360',
    loadComponent: () => import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'login-fallido',
    title: 'No se pudo iniciar sesion | Pedidos360',
    loadComponent: () =>
      import('./features/login/login-fallido.component').then((m) => m.LoginFallidoComponent),
  },
  {
    path: 'sin-permisos',
    title: 'Sin permisos | Pedidos360',
    loadComponent: () =>
      import('./features/errores/sin-permisos.component').then((m) => m.SinPermisosComponent),
  },
  {
    path: '',
    canActivate: [MsalGuard],
    children: [
      {
        path: 'tablero',
        title: 'Tablero | Pedidos360',
        canActivate: [rolGuard([ROLES.admin, ROLES.vendedor])],
        loadComponent: () =>
          import('./features/tablero/tablero.component').then((m) => m.TableroComponent),
      },
      {
        path: 'catalogo',
        title: 'Catalogo | Pedidos360',
        canActivate: [rolGuard([ROLES.admin, ROLES.vendedor, ROLES.cliente])],
        loadComponent: () =>
          import('./features/catalogo/catalogo.component').then((m) => m.CatalogoComponent),
      },
      {
        path: 'clientes',
        title: 'Clientes | Pedidos360',
        canActivate: [rolGuard([ROLES.admin, ROLES.vendedor])],
        loadComponent: () =>
          import('./features/clientes/clientes.component').then((m) => m.ClientesComponent),
      },
      {
        path: 'pedidos',
        title: 'Pedidos | Pedidos360',
        canActivate: [rolGuard([ROLES.admin, ROLES.vendedor])],
        loadComponent: () =>
          import('./features/pedidos/pedidos.component').then((m) => m.PedidosComponent),
      },
      {
        path: 'pedidos/nuevo',
        title: 'Nuevo pedido | Pedidos360',
        canActivate: [rolGuard([ROLES.admin, ROLES.vendedor])],
        loadComponent: () =>
          import('./features/pedidos/pedido-nuevo.component').then((m) => m.PedidoNuevoComponent),
      },
      {
        path: 'pedidos/:id',
        title: 'Detalle del pedido | Pedidos360',
        loadComponent: () =>
          import('./features/pedidos/pedido-detalle.component').then((m) => m.PedidoDetalleComponent),
      },
      {
        path: 'mis-pedidos',
        title: 'Mis pedidos | Pedidos360',
        loadComponent: () =>
          import('./features/pedidos/mis-pedidos.component').then((m) => m.MisPedidosComponent),
      },
      {
        path: 'perfil',
        title: 'Mi perfil | Pedidos360',
        loadComponent: () => import('./features/perfil/perfil.component').then((m) => m.PerfilComponent),
      },
      { path: '', pathMatch: 'full', canActivate: [inicioGuard], children: [] },
    ],
  },
  { path: '**', redirectTo: '' },
];
