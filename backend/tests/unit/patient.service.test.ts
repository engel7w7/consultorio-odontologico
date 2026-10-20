import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PatientService } from '../../src/services/patient.service.js';

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

  it('HU-02: debe registrar un paciente con examenes en false por defecto', async () => {
    const input = {
      nombre: 'Carlos Mendoza',
      telefono: '78912345',
      edad: 35,
      examenes_sangre_validados: false
    };

    mockPrisma.patient.create.mockResolvedValue({
      id: 'uuid-1',
      ...input,
    });

    const res = await service.createPatient(input);
    expect(res.id).toBe('uuid-1');
    expect(res.examenes_sangre_validados).toBe(false);
    expect(mockPrisma.patient.create).toHaveBeenCalledOnce();
  });

  it('HU-02: debe registrar un paciente cuando examenes_sangre_validados no es enviado', async () => {
    const input = {
      nombre: 'Lucía Méndez',
      telefono: '76543210',
      edad: 25,
    };

    mockPrisma.patient.create.mockResolvedValue({
      id: 'uuid-2',
      ...input,
      examenes_sangre_validados: false,
    });

    const res = await service.createPatient(input);
    expect(res.examenes_sangre_validados).toBe(false);
    expect(mockPrisma.patient.create).toHaveBeenCalledWith({
      data: {
        nombre: 'Lucía Méndez',
        telefono: '76543210',
        edad: 25,
        examenes_sangre_validados: false,
      },
    });
  });

  it('HU-02: debe listar el directorio de pacientes ordenados por fecha', async () => {
    mockPrisma.patient.findMany.mockResolvedValue([
      { id: '1', nombre: 'Ana' },
      { id: '2', nombre: 'Juan' },
    ]);
    const list = await service.getAllPatients();
    expect(list).toHaveLength(2);
  });

  it('HU-12: debe buscar por nombre o teléfono sin distinguir mayúsculas', async () => {
    mockPrisma.patient.findMany.mockResolvedValue([]);

    await service.getAllPatients('  lucía ');

    expect(mockPrisma.patient.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { nombre: { contains: 'lucía', mode: 'insensitive' } },
          { telefono: { contains: 'lucía' } },
        ],
      },
      orderBy: { created_at: 'desc' },
      include: { antecedente_medico: true },
    });
  });

  it('HU-12: debe listar todos los pacientes cuando no se envía búsqueda', async () => {
    mockPrisma.patient.findMany.mockResolvedValue([]);

    await service.getAllPatients();

    expect(mockPrisma.patient.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { created_at: 'desc' },
      include: { antecedente_medico: true },
    });
  });

  it('HU-07: debe actualizar estado a true otorgando luz verde medica', async () => {
    mockPrisma.patient.findUnique.mockResolvedValue({ id: 'uuid-1', examenes_sangre_validados: false });
    mockPrisma.patient.update.mockResolvedValue({ id: 'uuid-1', examenes_sangre_validados: true });
    const updated = await service.setBloodExamValidation('uuid-1', true);
    expect(updated.examenes_sangre_validados).toBe(true);
    expect(mockPrisma.patient.update).toHaveBeenCalledWith({
      where: { id: 'uuid-1' },
      data: expect.objectContaining({ examenes_sangre_validados: true }),
    });
  });

  it('HU-07: debe registrar validacion con evidencia de estudio escaneado y parametros', async () => {
    mockPrisma.patient.findUnique.mockResolvedValue({ id: 'uuid-1', examenes_sangre_validados: false });
    mockPrisma.patient.update.mockResolvedValue({
      id: 'uuid-1',
      examenes_sangre_validados: true,
      evidencia_archivo_nombre: 'hemograma.pdf',
      evidencia_archivo_url: 'data:application/pdf;base64,...',
      parametros_hematologicos: 'Plaquetas: 250000, INR: 1.0',
    });

    const updated = await service.setBloodExamValidation('uuid-1', true, {
      evidencia_archivo_nombre: 'hemograma.pdf',
      evidencia_archivo_url: 'data:application/pdf;base64,...',
      parametros_hematologicos: 'Plaquetas: 250000, INR: 1.0',
    });

    expect(updated.examenes_sangre_validados).toBe(true);
    expect(mockPrisma.patient.update).toHaveBeenCalledWith({
      where: { id: 'uuid-1' },
      data: expect.objectContaining({
        examenes_sangre_validados: true,
        evidencia_archivo_nombre: 'hemograma.pdf',
      }),
    });
  });

  it('HU-07: debe filtrar por busqueda, estado y ordenar alfabeticamente', async () => {
    mockPrisma.patient.findMany.mockResolvedValue([
      { id: '1', nombre: 'Ana Maria' },
      { id: '2', nombre: 'Carlos' },
    ]);

    const res = await service.getAllPatients({ search: 'Ana', status: 'validated', order: 'asc' });
    expect(res).toHaveLength(2);
    expect(mockPrisma.patient.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { nombre: { contains: 'Ana', mode: 'insensitive' } },
          { telefono: { contains: 'Ana' } },
        ],
        examenes_sangre_validados: true,
      },
      orderBy: { nombre: 'asc' },
      include: { antecedente_medico: true },
    });
  });

  it('HU-07: debe filtrar por estado pending y ordenar desc', async () => {
    mockPrisma.patient.findMany.mockResolvedValue([]);
    await service.getAllPatients({ status: 'pending', order: 'desc' });
    expect(mockPrisma.patient.findMany).toHaveBeenCalledWith({
      where: {
        examenes_sangre_validados: false,
      },
      orderBy: { nombre: 'desc' },
      include: { antecedente_medico: true },
    });
  });

  it('HU-07: debe lanzar error si el paciente no existe al validar', async () => {
    mockPrisma.patient.findUnique.mockResolvedValue(null);
    await expect(service.setBloodExamValidation('inexistente', true)).rejects.toThrow(
      'Paciente no encontrado'
    );
  });

  it('HU-07: debe obtener un paciente por id mediante getPatientById', async () => {
    mockPrisma.patient.findUnique.mockResolvedValue({ id: 'uuid-1', nombre: 'Carlos' });
    const res = await service.getPatientById('uuid-1');
    expect(res?.nombre).toBe('Carlos');
    expect(mockPrisma.patient.findUnique).toHaveBeenCalledWith({
      where: { id: 'uuid-1' },
      include: { antecedente_medico: true },
    });
  });

  it('HU-03: debe calcular correctamente el flag tieneAntecedentesCriticos', async () => {
    mockPrisma.patient.findMany.mockResolvedValue([
      {
        id: '1',
        nombre: 'Paciente Crítico',
        antecedente_medico: {
          tiene_diabetes: true,
          tipo_diabetes: 'TIPO_2',
          alergias: ['Penicilina'],
          tiene_hipertension: false,
          tiene_cardiopatia: false,
          toma_anticoagulantes: false,
          esta_embarazada: false,
        },
      },
      {
        id: '2',
        nombre: 'Paciente Sin Antecedentes',
        antecedente_medico: null,
      },
      {
        id: '3',
        nombre: 'Paciente Sin Críticos',
        antecedente_medico: {
          tiene_diabetes: false,
          tipo_diabetes: null,
          alergias: [],
          tiene_hipertension: false,
          tiene_cardiopatia: false,
          toma_anticoagulantes: false,
          esta_embarazada: false,
        },
      },
    ]);

    const res = await service.getAllPatients();
    expect(res).toHaveLength(3);
    expect(res[0].tieneAntecedentesCriticos).toBe(true);
    expect(res[0].alertas_criticas).toEqual(['Alergia: Penicilina', 'Diabetes tipo 2']);
    expect(res[1].tieneAntecedentesCriticos).toBe(false);
    expect(res[1].tiene_antecedentes).toBe(false);
    expect(res[2].tieneAntecedentesCriticos).toBe(false);
    expect(res[2].tiene_antecedentes).toBe(true);
  });
});