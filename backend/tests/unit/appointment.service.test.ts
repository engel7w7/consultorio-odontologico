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

  describe('createAppointment (HU-08)', () => {
    it('crea exitosamente una cita regular cuando el motivo no es de extracción', async () => {
      mockPrisma.patient = {
        findUnique: vi.fn().mockResolvedValue({
          id: 'p-1',
          nombre: 'Juan Pérez',
          examenes_sangre_validados: false,
        }),
      };
      mockPrisma.appointment.create = vi.fn().mockResolvedValue({
        id: 'appt-1',
        patient_id: 'p-1',
        motivo: 'Limpieza y profilaxis',
        fecha_inicio: new Date('2026-10-15T14:00:00Z'),
        fecha_fin: new Date('2026-10-15T14:30:00Z'),
        estado: 'PROGRAMADA',
      });

      const res = await service.createAppointment({
        patient_id: 'p-1',
        motivo: 'Limpieza y profilaxis',
        fecha_inicio: '2026-10-15T14:00:00Z',
        fecha_fin: '2026-10-15T14:30:00Z',
      });

      expect(res.id).toBe('appt-1');
      expect(mockPrisma.appointment.create).toHaveBeenCalledOnce();
    });

    it('crea exitosamente una extracción si el paciente tiene exámenes de sangre validados', async () => {
      mockPrisma.patient = {
        findUnique: vi.fn().mockResolvedValue({
          id: 'p-1',
          nombre: 'Juan Pérez',
          examenes_sangre_validados: true,
        }),
      };
      mockPrisma.appointment.create = vi.fn().mockResolvedValue({
        id: 'appt-2',
        patient_id: 'p-1',
        motivo: 'Extracción de tercer molar',
        fecha_inicio: new Date('2026-10-15T15:00:00Z'),
        fecha_fin: new Date('2026-10-15T16:00:00Z'),
        estado: 'PROGRAMADA',
      });

      const res = await service.createAppointment({
        patient_id: 'p-1',
        motivo: 'Extracción de tercer molar',
        fecha_inicio: '2026-10-15T15:00:00Z',
        fecha_fin: '2026-10-15T16:00:00Z',
      });

      expect(res.id).toBe('appt-2');
      expect(mockPrisma.appointment.create).toHaveBeenCalledOnce();
    });

    it('lanza PATIENT_NOT_FOUND si el paciente no existe', async () => {
      mockPrisma.patient = {
        findUnique: vi.fn().mockResolvedValue(null),
      };

      await expect(
        service.createAppointment({
          patient_id: 'no-existe',
          motivo: 'Consulta general',
          fecha_inicio: '2026-10-15T15:00:00Z',
          fecha_fin: '2026-10-15T16:00:00Z',
        })
      ).rejects.toMatchObject({
        code: 'PATIENT_NOT_FOUND',
      });
    });

    it('lanza START_TIME_MUST_BE_BEFORE_END_TIME si fecha_inicio >= fecha_fin', async () => {
      mockPrisma.patient = {
        findUnique: vi.fn().mockResolvedValue({
          id: 'p-1',
          nombre: 'Juan Pérez',
          examenes_sangre_validados: true,
        }),
      };

      await expect(
        service.createAppointment({
          patient_id: 'p-1',
          motivo: 'Consulta',
          fecha_inicio: '2026-10-15T16:00:00Z',
          fecha_fin: '2026-10-15T15:00:00Z',
        })
      ).rejects.toMatchObject({
        code: 'START_TIME_MUST_BE_BEFORE_END_TIME',
      });
    });

    it.each([
      'Extracción de pieza 18',
      'Exodoncia simple',
      'Cirugía periodontal',
      'Procedimiento quirúrgico complejo',
      'Extraccion de muela de juicio',
      'Cirugia de molar incluido',
    ])('lanza EXTRACTION_BLOOD_EXAMS_REQUIRED para procedimiento "%s" si no tiene exámenes validados', async (motivo) => {
      mockPrisma.patient = {
        findUnique: vi.fn().mockResolvedValue({
          id: 'p-1',
          nombre: 'Juan Pérez',
          examenes_sangre_validados: false,
        }),
      };

      await expect(
        service.createAppointment({
          patient_id: 'p-1',
          motivo,
          fecha_inicio: '2026-10-15T15:00:00Z',
          fecha_fin: '2026-10-15T16:00:00Z',
        })
      ).rejects.toMatchObject({
        code: 'EXTRACTION_BLOOD_EXAMS_REQUIRED',
      });
    });
  });
});
