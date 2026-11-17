/// <reference types="cypress" />

// QA E2E - HU-14 Detección de profilaxis vencidas y re-agendamiento (Sprint 3 / Retorno de Pacientes)
// Escenario crítico del Plan SQAP: "el sistema detecta profilaxis con 6 meses o más de antigüedad".

const profilaxisVencidasMock = [
  {
    patient: {
      id: '11111111-1111-4111-8111-111111111111',
      nombre: 'Carlos Mendoza',
      telefono: '71234567',
    },
    ultima_profilaxis: '2026-03-01T10:00:00.000Z',
    fecha_vencimiento: '2026-09-01T10:00:00.000Z',
    dias_atraso: 63,
    reagendado: false,
    proxima_cita: null,
  },
  {
    patient: {
      id: '22222222-2222-4222-8222-222222222222',
      nombre: 'Ana María Quispe',
      telefono: '72345678',
    },
    ultima_profilaxis: '2026-04-15T10:00:00.000Z',
    fecha_vencimiento: '2026-10-15T10:00:00.000Z',
    dias_atraso: 19,
    reagendado: true,
    proxima_cita: '2026-11-20T09:00:00.000Z',
  },
];

const retornoMensualMock = {
  mes: '2026-11',
  total: 0,
  ingreso_estimado_total: 0,
  pacientes: [],
};

describe('QA E2E - HU-14 Retorno de Pacientes (Profilaxis Vencida)', () => {
  beforeEach(() => {
    cy.clock(new Date('2026-11-03T12:00:00.000Z').getTime(), ['Date']);
    cy.intercept('GET', '**/api/auth/me', { statusCode: 200, body: { id: 'u-1', email: 'odontologo@test.com' } });
    cy.intercept('GET', '**/api/recall/profilaxis-vencidas', {
      statusCode: 200,
      body: profilaxisVencidasMock,
    }).as('getVencidas');
    cy.intercept('GET', '**/api/recall/retorno-mensual*', {
      statusCode: 200,
      body: retornoMensualMock,
    }).as('getRetornoMensual');
    cy.intercept('POST', '**/api/appointments', {
      statusCode: 201,
      body: {
        id: 'appt-new',
        patient_id: '11111111-1111-4111-8111-111111111111',
        motivo: 'Profilaxis y destartraje dental',
        fecha_inicio: '2026-11-04T09:00:00.000Z',
        fecha_fin: '2026-11-04T09:30:00.000Z',
        estado: 'PROGRAMADA',
      },
    }).as('crearCita');

    // Iniciar con sesión autenticada
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem('dental_auth_token', 'token-de-prueba-hu14');
        win.localStorage.setItem(
          'dental_auth_user',
          JSON.stringify({
            id: 'u-1',
            email: 'odontologo@test.com',
            nombre: 'Dr. QA',
            especialidad: 'Odontología General',
            rol: 'ODONTOLOGO',
          })
        );
      },
    });

    // Navegar a la pestaña Retorno de Pacientes
    cy.contains('button', 'Retorno de Pacientes').click();
    cy.wait(['@getVencidas', '@getRetornoMensual']);
  });

  it('CP-14-E2E-01: muestra la lista de profilaxis vencidas con días de atraso', () => {
    cy.contains('Profilaxis vencida (6+ meses)').should('be.visible');
    cy.contains('Carlos Mendoza').should('be.visible');
    cy.contains('Ana María Quispe').should('be.visible');
    cy.contains('63 días').should('be.visible');
    cy.contains('19 días').should('be.visible');
  });

  it('CP-14-E2E-02: paciente reagendado muestra "Ya reagendado" sin botón de agendar', () => {
    // Ana María ya está reagendada
    cy.contains('tr', 'Ana María Quispe').within(() => {
      cy.contains(/Ya reagendado/i).should('be.visible');
      cy.contains('button', 'Agendar profilaxis').should('not.exist');
    });
  });

  it('CP-14-E2E-03: paciente no reagendado permite abrir modal y registrar cita con motivo de profilaxis', () => {
    // Carlos Mendoza no está reagendado
    cy.contains('tr', 'Carlos Mendoza').within(() => {
      cy.contains('button', 'Agendar profilaxis').click();
    });

    // El modal debe abrirse con los datos prellenados
    cy.contains('Agendar Profilaxis Preventiva').should('be.visible');
    cy.get('input[value="Carlos Mendoza"]').should('be.visible');
    cy.get('input[value="Profilaxis y destartraje dental"]').should('be.visible');
    cy.get('input[value="30 minutos"]').should('be.visible');

    // Confirmar cita
    cy.contains('button', 'Confirmar Cita').click();

    // Validar el payload del POST enviado a la API
    cy.wait('@crearCita').its('request.body').should((body) => {
      expect(body.patient_id).to.equal('11111111-1111-4111-8111-111111111111');
      expect(body.motivo).to.equal('Profilaxis y destartraje dental');
      expect(body.duracion_minutos).to.equal(30);
    });
  });
});
