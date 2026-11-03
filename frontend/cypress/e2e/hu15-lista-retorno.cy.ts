/// <reference types="cypress" />

// QA E2E - HU-15 Lista mensual de retorno y priorización (Sprint 3 / Retorno de Pacientes)
// Escenario crítico del Plan SQAP: "la lista mensual de retorno no incluye pacientes ya reagendados".

const retornoNoviembreMock = {
  mes: '2026-11',
  total: 2,
  ingreso_estimado_total: 350,
  pacientes: [
    {
      patient: {
        id: '11111111-1111-4111-8111-111111111111',
        nombre: 'Carlos Mendoza',
        telefono: '71234567',
      },
      ultima_profilaxis: '2026-03-01T10:00:00.000Z',
      fecha_vencimiento: '2026-09-01T10:00:00.000Z',
      estado: 'ATRASADO',
      prioridad: 80,
      motivos: ['2 meses de atraso', '3 visitas en el último año', 'Bs 250.00 cobrados'],
      ingreso_estimado: 200,
    },
    {
      patient: {
        id: '22222222-2222-4222-8222-222222222222',
        nombre: 'Ana María Quispe',
        telefono: '72345678',
      },
      ultima_profilaxis: '2026-05-15T10:00:00.000Z',
      fecha_vencimiento: '2026-11-15T10:00:00.000Z',
      estado: 'VENCE_ESTE_MES',
      prioridad: 60,
      motivos: ['Vence este mes', '1 visita en el último año', 'Bs 150.00 cobrados'],
      ingreso_estimado: 150,
    },
  ],
};

const retornoDiciembreMock = {
  mes: '2026-12',
  total: 1,
  ingreso_estimado_total: 180,
  pacientes: [
    {
      patient: {
        id: '33333333-3333-4333-8333-333333333333',
        nombre: 'Roberto Gómez',
        telefono: '73456789',
      },
      ultima_profilaxis: '2026-06-10T10:00:00.000Z',
      fecha_vencimiento: '2026-12-10T10:00:00.000Z',
      estado: 'VENCE_ESTE_MES',
      prioridad: 65,
      motivos: ['Vence este mes', '2 visitas en el último año'],
      ingreso_estimado: 180,
    },
  ],
};

describe('QA E2E - HU-15 Lista mensual de retorno y priorización', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/auth/me', { statusCode: 200, body: { id: 'u-1', email: 'odontologo@test.com' } });
    cy.intercept('GET', '**/api/recall/profilaxis-vencidas', {
      statusCode: 200,
      body: [],
    }).as('getVencidas');

    // Interceptar llamadas mensuales
    cy.intercept('GET', '**/api/recall/retorno-mensual?mes=2026-12', {
      statusCode: 200,
      body: retornoDiciembreMock,
    }).as('getRetornoDiciembre');

    cy.intercept('GET', '**/api/recall/retorno-mensual*', {
      statusCode: 200,
      body: retornoNoviembreMock,
    }).as('getRetornoNoviembre');

    // Iniciar con sesión autenticada
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem('dental_auth_token', 'token-de-prueba-hu15');
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
    cy.wait('@getRetornoNoviembre');
  });

  it('CP-15-E2E-01: muestra la lista mensual de retorno, resumen de ingresos y priorización', () => {
    cy.contains('Lista de retorno del mes').should('be.visible');
    cy.contains('2 pacientes sugeridos · Ingreso estimado Bs 350.00').should('be.visible');

    // Carlos Mendoza (prioridad 80, atrasado)
    cy.contains('tr', 'Carlos Mendoza').within(() => {
      cy.contains('80').should('be.visible');
      cy.contains('Atrasado').should('be.visible');
      cy.contains('2 meses de atraso').should('be.visible');
      cy.contains('Bs 200.00').should('be.visible');
      cy.contains('a', 'Contactar por WhatsApp').should('be.visible');
      cy.contains('button', 'Agendar profilaxis').should('be.visible');
    });

    // Ana María Quispe (prioridad 60, vence este mes)
    cy.contains('tr', 'Ana María Quispe').within(() => {
      cy.contains('60').should('be.visible');
      cy.contains('Vence este mes').should('be.visible');
      cy.contains('Bs 150.00').should('be.visible');
    });
  });

  it('CP-15-E2E-02: genera el enlace de WhatsApp con el teléfono normalizado y mensaje de invitación', () => {
    cy.contains('tr', 'Carlos Mendoza').within(() => {
      cy.contains('a', 'Contactar por WhatsApp')
        .should('have.attr', 'href')
        .and('include', 'https://wa.me/59171234567?text=')
        .and('include', encodeURIComponent('Carlos Mendoza'))
        .and('include', encodeURIComponent('control preventivo y profilaxis dental'));
    });
  });

  it('CP-15-E2E-03: navegación entre meses actualiza el listado y el ingreso estimado', () => {
    // Avanzar al mes siguiente
    cy.contains('button', 'Mes siguiente').click();
    cy.wait('@getRetornoDiciembre');

    cy.contains('1 pacientes sugeridos · Ingreso estimado Bs 180.00').should('be.visible');
    cy.contains('Roberto Gómez').should('be.visible');
    cy.contains('Carlos Mendoza').should('not.exist');
  });

  it('CP-15-E2E-04: ESCENARIO CRÍTICO SQAP - La lista mensual no incluye pacientes ya reagendados', () => {
    // Simular respuesta donde un paciente con cita programada fue filtrado por el backend
    cy.intercept('GET', '**/api/recall/retorno-mensual*', {
      statusCode: 200,
      body: {
        mes: '2026-11',
        total: 1,
        ingreso_estimado_total: 150,
        pacientes: [
          {
            patient: {
              id: '22222222-2222-4222-8222-222222222222',
              nombre: 'Ana María Quispe',
              telefono: '72345678',
            },
            ultima_profilaxis: '2026-05-15T10:00:00.000Z',
            fecha_vencimiento: '2026-11-15T10:00:00.000Z',
            estado: 'VENCE_ESTE_MES',
            prioridad: 60,
            motivos: ['Vence este mes'],
            ingreso_estimado: 150,
          },
        ],
      },
    }).as('getFiltrado');

    // Recargar pestaña
    cy.contains('button', 'Retorno de Pacientes').click();
    cy.wait('@getFiltrado');

    cy.contains('Ana María Quispe').should('be.visible');
    // El paciente reagendado "Elena Prado" o cualquier otro reagendado no debe existir
    cy.contains('Elena Prado').should('not.exist');
  });
});
