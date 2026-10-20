/// <reference types="cypress" />

// QA E2E - HU-08 Alerta roja bloqueante de extracción (Sprint 2)
// Escenario crítico del Plan SQAP: "intentar agendar una extracción sin
// exámenes dispara la alerta roja bloqueante". Si falla: defecto S1.

const pacientes = [
  { id: 'p-sin', nombre: 'Ana Sin Examenes', examenes_sangre_validados: false },
  { id: 'p-con', nombre: 'Carlos Con Examenes', examenes_sangre_validados: true },
];

const abrirModalAgendar = () => {
  cy.contains('button', 'Agenda Diaria').click();
  cy.contains('button', 'Agendar Cita').click();
  cy.contains('Agendar Nueva Cita').should('be.visible');
};

describe('QA E2E - HU-08 Alerta roja bloqueante', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/patients*', { statusCode: 200, body: pacientes });
    cy.intercept('GET', '**/api/appointments*', { statusCode: 200, body: [] });
    cy.intercept('GET', '**/api/auth/me', { statusCode: 200, body: { id: 'u-1' } });
    cy.intercept('POST', '**/api/appointments', { statusCode: 201, body: { id: 'appt-1' } }).as('crearCita');

    // Sesión iniciada (necesario cuando HU-01 esté integrada en develop)
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem('dental_auth_token', 'token-de-prueba');
        win.localStorage.setItem(
          'dental_auth_user',
          JSON.stringify({ id: 'u-1', email: 'qa@test.com', nombre: 'QA', especialidad: 'QA', rol: 'ODONTOLOGO' })
        );
      },
    });
    abrirModalAgendar();
  });

  it('CP-08-E2E-01: extracción sin exámenes muestra la alerta roja y bloquea el agendamiento', () => {
    cy.get('select').select('p-sin');
    cy.get('input[placeholder^="Ej: Extracción"]').clear().type('Extracción de tercer molar');

    cy.contains('Alerta Roja Bloqueante de Seguridad Clínica').should('be.visible');
    cy.get('button[type="submit"]').should('be.disabled');
    cy.get('@crearCita.all').should('have.length', 0);
  });

  it('CP-08-E2E-02: extracción con exámenes validados se puede agendar', () => {
    cy.get('select').select('p-con');
    cy.get('input[placeholder^="Ej: Extracción"]').clear().type('Extracción de tercer molar');

    cy.contains('Alerta Roja Bloqueante de Seguridad Clínica').should('not.exist');
    cy.get('button[type="submit"]').should('not.be.disabled');
  });

  // Sinónimos de extracción: todos deben bloquear (hoy fallan -> defecto S1)
  ['Exodoncia pieza 38', 'Procedimiento quirúrgico', 'Sacar muela del juicio'].forEach((motivo) => {
    it(`CP-08-E2E-03: "${motivo}" sin exámenes también muestra la alerta`, () => {
      cy.get('select').select('p-sin');
      cy.get('input[placeholder^="Ej: Extracción"]').clear().type(motivo);

      cy.contains('Alerta Roja Bloqueante de Seguridad Clínica').should('be.visible');
      cy.get('button[type="submit"]').should('be.disabled');
    });
  });
});
