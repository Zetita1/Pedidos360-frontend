import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';

import { AuthService } from './auth.service';
import { inicioGuard, rolGuard } from './role.guard';

/** Doble de prueba del servicio de sesion: evita depender de MSAL en los tests unitarios. */
class AuthServiceFalso {
  roles: string[] = [];

  tieneAlgunRol(requeridos: string[]): boolean {
    return requeridos.length === 0 || requeridos.some((rol) => this.roles.includes(rol));
  }

  puedeGestionar(): boolean {
    return this.roles.includes('Pedidos.Admin') || this.roles.includes('Pedidos.Vendedor');
  }
}

describe('rolGuard', () => {
  let auth: AuthServiceFalso;

  beforeEach(() => {
    auth = new AuthServiceFalso();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    });
  });

  function ejecutar(guard: ReturnType<typeof rolGuard>) {
    return TestBed.runInInjectionContext(() => guard({} as never, {} as never));
  }

  it('permite el acceso cuando el token trae el rol requerido', () => {
    auth.roles = ['Pedidos.Vendedor'];

    expect(ejecutar(rolGuard(['Pedidos.Admin', 'Pedidos.Vendedor']))).toBe(true);
  });

  it('redirige a /sin-permisos cuando falta el rol', () => {
    auth.roles = ['Pedidos.Cliente'];

    const resultado = ejecutar(rolGuard(['Pedidos.Admin']));

    expect(resultado).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(resultado as UrlTree)).toBe('/sin-permisos');
  });

  it('manda al tablero a quienes gestionan y a mis-pedidos al resto', () => {
    const router = TestBed.inject(Router);

    auth.roles = ['Pedidos.Admin'];
    let destino = TestBed.runInInjectionContext(() => inicioGuard({} as never, {} as never));
    expect(router.serializeUrl(destino as UrlTree)).toBe('/tablero');

    auth.roles = ['Pedidos.Cliente'];
    destino = TestBed.runInInjectionContext(() => inicioGuard({} as never, {} as never));
    expect(router.serializeUrl(destino as UrlTree)).toBe('/mis-pedidos');
  });
});
