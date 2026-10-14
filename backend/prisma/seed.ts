import { PrismaClient, EstadoCita, TipoDiabetes } from '@prisma/client';
import { getDayRangeUTC, getTodayDateStringLaPaz } from '../src/utils/date.utils.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed para el Consultorio Odontológico...');

  // 1. Obtener pacientes existentes o crear 4 pacientes ficticios si no hay ninguno
  let patients = await prisma.patient.findMany({ take: 4 });

  if (patients.length === 0) {
    console.log('No se encontraron pacientes existentes. Creando pacientes ficticios...');
    patients = await Promise.all([
      prisma.patient.create({
        data: {
          nombre: 'Juan Pérez',
          telefono: '71234567',
          edad: 34,
          examenes_sangre_validados: true,
        },
      }),
      prisma.patient.create({
        data: {
          nombre: 'Ana María Quispe',
          telefono: '72345678',
          edad: 28,
          examenes_sangre_validados: false,
        },
      }),
      prisma.patient.create({
        data: {
          nombre: 'Carlos Mendoza',
          telefono: '73456789',
          edad: 45,
          examenes_sangre_validados: true,
        },
      }),
      prisma.patient.create({
        data: {
          nombre: 'Lucía Fernández',
          telefono: '74567890',
          edad: 22,
          examenes_sangre_validados: false,
        },
      }),
    ]);
  }

  // 2. Sembrar antecedentes médicos ficticios (HU-03).
  // IMPORTANTE: Este bloque DEBE ir ANTES de las citas porque la sección de citas
  // contiene un 'return' temprano por idempotencia si ya existen citas para hoy.
  // Colocar los antecedentes aquí garantiza que siempre se verifiquen y siembren sin ser omitidos.
  console.log('🌱 Sembrando antecedentes médicos ficticios (HU-03)...');
  await prisma.antecedenteMedico.upsert({
    where: { patient_id: patients[0].id },
    update: {},
    create: {
      patient_id: patients[0].id,
      tiene_diabetes: true,
      tipo_diabetes: TipoDiabetes.TIPO_2,
      tiene_hipertension: false,
      tiene_cardiopatia: false,
      toma_anticoagulantes: false,
      esta_embarazada: false,
      alergias: ['Penicilina', 'Látex'],
      medicacion_actual: 'Metformina 850mg c/12h',
      otras_condiciones: null,
    },
  });

  await prisma.antecedenteMedico.upsert({
    where: { patient_id: patients[1 % patients.length].id },
    update: {},
    create: {
      patient_id: patients[1 % patients.length].id,
      tiene_diabetes: false,
      tipo_diabetes: null,
      tiene_hipertension: true,
      tiene_cardiopatia: false,
      toma_anticoagulantes: true,
      esta_embarazada: false,
      alergias: ['Lidocaína'],
      medicacion_actual: 'Warfarina 5mg diario, Enalapril 10mg',
      otras_condiciones: 'Monitoreo de tiempo de sangría previo a procedimientos quirúrgicos',
    },
  });
  console.log('✅ Antecedentes médicos asegurados con éxito.');

  // 3. Obtener fecha actual y rango en UTC según la zona horaria oficial America/La_Paz (UTC-4)
  const todayLaPaz = getTodayDateStringLaPaz();
  const { start, end } = getDayRangeUTC(todayLaPaz);
  console.log(`Fecha de hoy en America/La_Paz (UTC-4): ${todayLaPaz}`);

  // 3. Comprobar si ya existen citas para hoy (idempotencia)
  const existingCount = await prisma.appointment.count({
    where: {
      fecha_inicio: {
        gte: start,
        lt: end,
      },
    },
  });

  if (existingCount > 0) {
    console.log(`ℹ️ Ya existen ${existingCount} citas registradas para hoy (${todayLaPaz}). Omitiendo inserción para mantener idempotencia.`);
    return;
  }

  // 4. Crear 6 citas ficticias para hoy insertadas DESORDENADAS a propósito:
  // - 14:00 (ATENDIDA)
  // - 09:00 (ATENDIDA)
  // - 23:30 (PROGRAMADA) -> Cita nocturna para validar zona horaria America/La_Paz
  // - 11:30 (CANCELADA)
  // - 16:30 (PROGRAMADA)
  // - 08:00 (PROGRAMADA)
  const fakeAppointments = [
    {
      patient_id: patients[0].id,
      motivo: 'Limpieza dental profunda y profilaxis',
      fecha_inicio: new Date(`${todayLaPaz}T14:00:00-04:00`),
      fecha_fin: new Date(`${todayLaPaz}T15:00:00-04:00`),
      estado: EstadoCita.ATENDIDA,
    },
    {
      patient_id: patients[1 % patients.length].id,
      motivo: 'Revisión general y diagnóstico de caries',
      fecha_inicio: new Date(`${todayLaPaz}T09:00:00-04:00`),
      fecha_fin: new Date(`${todayLaPaz}T10:00:00-04:00`),
      estado: EstadoCita.ATENDIDA,
    },
    {
      patient_id: patients[2 % patients.length].id,
      motivo: 'Urgencia odontológica nocturna (dolor agudo)',
      fecha_inicio: new Date(`${todayLaPaz}T23:30:00-04:00`),
      fecha_fin: new Date(`${todayLaPaz}T23:55:00-04:00`),
      estado: EstadoCita.PROGRAMADA,
    },
    {
      patient_id: patients[3 % patients.length].id,
      motivo: 'Extracción de tercer molar (Cancelada por paciente)',
      fecha_inicio: new Date(`${todayLaPaz}T11:30:00-04:00`),
      fecha_fin: new Date(`${todayLaPaz}T12:30:00-04:00`),
      estado: EstadoCita.CANCELADA,
    },
    {
      patient_id: patients[0].id,
      motivo: 'Control y ajuste de ortodoncia (brackets)',
      fecha_inicio: new Date(`${todayLaPaz}T16:30:00-04:00`),
      fecha_fin: new Date(`${todayLaPaz}T17:30:00-04:00`),
      estado: EstadoCita.PROGRAMADA,
    },
    {
      patient_id: patients[1 % patients.length].id,
      motivo: 'Inicio de tratamiento de conducto (Endodoncia)',
      fecha_inicio: new Date(`${todayLaPaz}T08:00:00-04:00`),
      fecha_fin: new Date(`${todayLaPaz}T08:45:00-04:00`),
      estado: EstadoCita.PROGRAMADA,
    },
  ];

  for (const item of fakeAppointments) {
    await prisma.appointment.create({
      data: item,
    });
  }

  console.log('✅ Se insertaron exitosamente 6 citas desordenadas para hoy.');
}

main()
  .catch((e) => {
    console.error('❌ Error ejecutando seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
