import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  PatientHistoryService,
  PatientHistoryError,
  toTratamiento,
} from '../../src/services/patient-history.service.js';

const PATIENT_ID = '11111111-1111-4111-8111-111111111111';

const mockPrisma = {
  patient: {
    findUnique: vi.fn(),
  },
  appointment: {
    findMany: vi.fn(),
  },
} as any;

const paciente = {
  id: PATIENT_ID,
  nombre: 'Ana Prueba',
  edad: 34,
  telefono: '70000001',
  examenes_sangre_validados: false,
};

const cita = (id: string, motivo: string, inicio: string, fin: string) => ({
  id,
  patient_id: PATIENT_ID,
  motivo,
  fecha_inicio: new Date(inicio),
  fecha_fin: new Date(fin),
  estado: 'ATENDIDA',
});

describe('QA Unit Tests: PatientHistoryService (HU-10)', () => {
  let service: PatientHistoryService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PatientHistoryService(mockPrisma);
  });

  describe('toTratamiento', () => {
    it('mapea la cita a tratamiento con procedimiento y duración en minutos', () => {
      const result = toTratamiento(
        cita('c-1', 'Limpieza dental', '2026-10-01T14:00:00.000Z', '2026-10-01T14:45:00.000Z')
      );

      expect(result).toEqual({
        id: 'c-1',
        fecha: new Date('2026-10-01T14:00:00.000Z'),
        procedimiento: 'Limpieza dental',
        duracion_minutos: 45,
      });
    });

    it('nunca devuelve duración negativa si fecha_fin es anterior a fecha_inicio', () => {
      const result = toTratamiento(
        cita('c-1', 'Limpieza', '2026-10-01T15:00:00.000Z', '2026-10-01T14:00:00.000Z')
      );
      expect(result.duracion_minutos).toBe(0);
    });
  });

  describe('getHistory', () => {
    it('devuelve el historial en orden desc por defecto (más reciente primero)', async () => {
      mockPrisma.patient.findUnique.mockResolvedValue(paciente);
      mockPrisma.appointment.findMany.mockResolvedValue([
        cita('c-2', 'Endodoncia', '2026-10-10T14:00:00.000Z', '2026-10-10T15:30:00.000Z'),
        cita('c-1', 'Limpieza dental', '2026-09-01T14:00:00.000Z', '2026-09-01T14:30:00.000Z'),
      ]);

      const result = await service.getHistory(PATIENT_ID);

      expect(mockPrisma.appointment.findMany).toHaveBeenCalledWith({
        where: { patient_id: PATIENT_ID, estado: 'ATENDIDA' },
        orderBy: [{ fecha_inicio: 'desc' }, { id: 'desc' }],
      });
      expect(result.total).toBe(2);
      expect(result.tratamientos.map((t) => t.procedimiento)).toEqual([
        'Endodoncia',
        'Limpieza dental',
      ]);
      expect(result.tratamientos[0].duracion_minutos).toBe(90);
    });

    it('solicita orden asc cuando se indica (más antiguo primero)', async () => {
      mockPrisma.patient.findUnique.mockResolvedValue(paciente);
      mockPrisma.appointment.findMany.mockResolvedValue([]);

      await service.getHistory(PATIENT_ID, 'asc');

      expect(mockPrisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: [{ fecha_inicio: 'asc' }, { id: 'asc' }] })
      );
    });

    it('solo consulta citas ATENDIDAS (excluye PROGRAMADA y CANCELADA)', async () => {
      mockPrisma.patient.findUnique.mockResolvedValue(paciente);
      mockPrisma.appointment.findMany.mockResolvedValue([]);

      await service.getHistory(PATIENT_ID);

      const { where } = mockPrisma.appointment.findMany.mock.calls[0][0];
      expect(where.estado).toBe('ATENDIDA');
    });

    it('filtra por el patient_id solicitado (0 mezcla de datos entre pacientes)', async () => {
      mockPrisma.patient.findUnique.mockResolvedValue(paciente);
      mockPrisma.appointment.findMany.mockResolvedValue([]);

      await service.getHistory(PATIENT_ID);

      expect(mockPrisma.patient.findUnique).toHaveBeenCalledWith({ where: { id: PATIENT_ID } });
      const { where } = mockPrisma.appointment.findMany.mock.calls[0][0];
      expect(where.patient_id).toBe(PATIENT_ID);
    });

    it('devuelve solo los datos públicos del paciente', async () => {
      mockPrisma.patient.findUnique.mockResolvedValue(paciente);
      mockPrisma.appointment.findMany.mockResolvedValue([]);

      const result = await service.getHistory(PATIENT_ID);

      expect(result.patient).toEqual({
        id: PATIENT_ID,
        nombre: 'Ana Prueba',
        edad: 34,
        telefono: '70000001',
      });
    });

    it('devuelve lista vacía y total 0 si el paciente no tiene tratamientos', async () => {
      mockPrisma.patient.findUnique.mockResolvedValue(paciente);
      mockPrisma.appointment.findMany.mockResolvedValue([]);

      const result = await service.getHistory(PATIENT_ID);

      expect(result.total).toBe(0);
      expect(result.tratamientos).toEqual([]);
    });

    it('lanza PatientHistoryError si el paciente no existe y no consulta citas', async () => {
      mockPrisma.patient.findUnique.mockResolvedValue(null);

      const promise = service.getHistory(PATIENT_ID);

      await expect(promise).rejects.toBeInstanceOf(PatientHistoryError);
      await expect(promise).rejects.toMatchObject({
        message: 'Paciente no encontrado',
        code: 'PATIENT_NOT_FOUND',
      });
      expect(mockPrisma.appointment.findMany).not.toHaveBeenCalled();
    });
  });
});
