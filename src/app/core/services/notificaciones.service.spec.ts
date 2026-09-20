import { TestBed } from '@angular/core/testing';

import { NotificacionesService } from './notificaciones.service';

describe('NotificacionesService', () => {
  let service: NotificacionesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificacionesService);
  });

  it('encola avisos con su tipo', () => {
    service.exito('Pedido creado');
    service.error('Stock insuficiente');

    expect(service.items().map((item) => item.tipo)).toEqual(['exito', 'error']);
  });

  it('permite cerrar un aviso puntual', () => {
    service.info('Mensaje');
    const id = service.items()[0].id;

    service.cerrar(id);

    expect(service.items()).toHaveLength(0);
  });
});
