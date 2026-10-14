import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppointmentService } from '../../src/services/appointment.service';

const mockPrisma = {
  appointment: {
    findMany: vi.fn(),
  },
} as any;

describe('QA Unit Tests: AppointmentService (HU-04)', () => {
  let service: AppointmentService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AppointmentService(mockPrisma);
  });

  it('debe llamar a findMany con el rango correcto, orderBy fecha_inicio asc e include del paciente', async () => {
    const mockAppointments = [
      {
        id: 'appt-1',
        patient_id: 'p-1',
        motivo: 'Limpieza dental',
        fecha_inicio: new Date('2026-10-13T13:00:00.000Z'),
        fecha_fin: new Date('2026-10-13T13:45:00.000Z'),
        estado: 'PROGRAMADA',
        patient: {
          id: 'p-1',
          nombre: 'Lucía Méndez',
        },
      },
    ];

    mockPrisma.appointment.findMany.mockResolvedValue(mockAppointments);

    const result = await service.getDailyAppointments('2026-10-13');

    expect(result).toEqual(mockAppointments);
    expect(mockPrisma.appointment.findMany).toHaveBeenCalledOnce();
    expect(mockPrisma.appointment.findMany).toHaveBeenCalledWith({
      where: {
        fecha_inicio: {
          gte: new Date('2026-10-13T04:00:00.000Z'),
          lt: new Date('2026-10-14T04:00:00.000Z'),
        },
      },
      include: {
        patient: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: {
        fecha_inicio: 'asc',
      },
    });
  });

  it('debe consultar con el rango del día actual en La Paz si no se especifica fecha', async () => {
    mockPrisma.appointment.findMany.mockResolvedValue([]);

    const result = await service.getDailyAppointments();

    expect(result).toEqual([]);
    expect(mockPrisma.appointment.findMany).toHaveBeenCalledOnce();
    const callArgs = mockPrisma.appointment.findMany.mock.calls[0][0];
    expect(callArgs.where.fecha_inicio.gte).toBeInstanceOf(Date);
    expect(callArgs.where.fecha_inicio.lt).toBeInstanceOf(Date);
    expect(callArgs.orderBy).toEqual({ fecha_inicio: 'asc' });
    expect(callArgs.include).toEqual({
      patient: {
        select: {
          id: true,
          nombre: true,
        },
      },
    });
  });
});
