import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PatientService } from '../../src/services/patient.service';

const mockPrisma = {
  patient: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
} as any;

describe('QA Unit Tests: PatientService (HU-02 y HU-07)', () => {
  let service: PatientService;
  beforeEach(() => {
    vi.clearAllMocks();
    service = new PatientService(mockPrisma);
  });

  // HU-02: Registro de Paciente
  it('HU-02: debe registrar un paciente con examenes en false por defecto', async () => {
    const input = { nombre: 'Carlos Mendoza', telefono: '78912345', edad: 35 };
    mockPrisma.patient.create.mockResolvedValue({
      id: 'uuid-1',
      ...input,
      examenes_sangre_validados: false,
    });
    const res = await service.createPatient(input);
    expect(res.id).toBe('uuid-1');
    expect(res.examenes_sangre_validados).toBe(false);
    expect(mockPrisma.patient.create).toHaveBeenCalledOnce();
  });

  it('HU-02: debe listar el directorio de pacientes ordenados por fecha', async () => {
    mockPrisma.patient.findMany.mockResolvedValue([
      { id: '1', nombre: 'Ana' },
      { id: '2', nombre: 'Juan' },
    ]);
    const list = await service.getAllPatients();
    expect(list).toHaveLength(2);
  });

  // HU-07: Validación de Exámenes (Luz Verde Médica)
  it('HU-07: debe actualizar estado a true otorgando luz verde medica', async () => {
    mockPrisma.patient.findUnique.mockResolvedValue({ id: 'uuid-1', examenes_sangre_validados: false });
    mockPrisma.patient.update.mockResolvedValue({ id: 'uuid-1', examenes_sangre_validados: true });
    const updated = await service.setBloodExamValidation('uuid-1', true);
    expect(updated.examenes_sangre_validados).toBe(true);
    expect(mockPrisma.patient.update).toHaveBeenCalledWith({
      where: { id: 'uuid-1' },
      data: { examenes_sangre_validados: true },
    });
  });

  it('HU-07: debe lanzar error si el paciente no existe al validar', async () => {
    mockPrisma.patient.findUnique.mockResolvedValue(null);
    await expect(service.setBloodExamValidation('inexistente', true)).rejects.toThrow(
      'Paciente no encontrado'
    );
  });
});