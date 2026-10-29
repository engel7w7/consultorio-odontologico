import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppointmentService } from '../../src/services/appointment.service.js';
import { PrismaClient } from '@prisma/client';

describe('QA Unit Tests: AppointmentService (HU-04 y HU-08)', () => {
  let service: AppointmentService;
  let mockPrisma: {
    appointment: {
      findMany: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    patient: {
      findUnique: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = {
      appointment: {
        findMany: vi.fn(),
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      patient: {
        findUnique: vi.fn(),
      },
    };
    service = new AppointmentService(mockPrisma as unknown as PrismaClient);
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
            telefono: true,
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
          telefono: true,
        },
      },
    });
  });

  describe('createAppointment (HU-08)', () => {
    it('crea exitosamente una cita regular cuando el motivo no es de extracción', async () => {
      mockPrisma.patient.findUnique.mockResolvedValue({
        id: 'p-1',
        nombre: 'Juan Pérez',
        examenes_sangre_validados: false,
      });

      mockPrisma.appointment.create.mockResolvedValue({
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
      mockPrisma.patient.findUnique.mockResolvedValue({
        id: 'p-1',
        nombre: 'Juan Pérez',
        examenes_sangre_validados: true,
      });
      mockPrisma.appointment.create.mockResolvedValue({
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
      mockPrisma.patient.findUnique.mockResolvedValue(null);

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
      mockPrisma.patient.findUnique.mockResolvedValue({
        id: 'p-1',
        nombre: 'Juan Pérez',
        examenes_sangre_validados: true,
      });

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
      mockPrisma.patient.findUnique.mockResolvedValue({
        id: 'p-1',
        nombre: 'Juan Pérez',
        examenes_sangre_validados: false,
      });

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

    describe('registerPayment (HU-11)', () => {
      it('registra el monto pagado de una cita atendida', async () => {
        mockPrisma.appointment.findUnique.mockResolvedValue({ id: 'appt-1', estado: 'ATENDIDA' });
        mockPrisma.appointment.update.mockResolvedValue({
          id: 'appt-1',
          monto_pagado: 150,
          estado: 'ATENDIDA',
        });

        const result = await service.registerPayment('appt-1', 150);

        expect(result).toEqual({ id: 'appt-1', monto_pagado: 150, estado: 'ATENDIDA' });
        expect(mockPrisma.appointment.update).toHaveBeenCalledWith({
          where: { id: 'appt-1' },
          data: { monto_pagado: 150 },
          include: {
            patient: {
              select: {
                id: true,
                nombre: true,
                telefono: true,
                examenes_sangre_validados: true,
              },
            },
          },
        });
      });

      it('rechaza el cobro si la cita no esta en estado ATENDIDA', async () => {
        mockPrisma.appointment.findUnique.mockResolvedValue({ id: 'appt-1', estado: 'PROGRAMADA' });

        await expect(service.registerPayment('appt-1', 150)).rejects.toThrow(
          'Solo se pueden registrar cobros en citas atendidas'
        );
        expect(mockPrisma.appointment.update).not.toHaveBeenCalled();
      });

      it('rechaza el cobro si la cita no existe', async () => {
        mockPrisma.appointment.findUnique.mockResolvedValue(null);

        await expect(service.registerPayment('inexistente', 50)).rejects.toThrow(
          'Cita no encontrada'
        );
        expect(mockPrisma.appointment.update).not.toHaveBeenCalled();
      });
    });
  });
});
