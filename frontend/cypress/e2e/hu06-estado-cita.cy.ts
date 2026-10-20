/// <reference types="cypress" />

// QA E2E - HU-06 Cambiar estado de cita a Atendida / Cancelada (Sprint 2)
// Escenario crítico SQAP: "el cambio de estado a Atendido o Cancelado se refleja
// sin perder el registro". El backend se simula con cy.intercept.

// Citas de HOY (hora local) para que aparezcan en la agenda del día.
const hoyA = (h: number) => {
  const d = new Date();
  d.setHours(h, 0, 0, 0);
  return d.toISOString();
};

const citaBase = (id: string, nombre: string, h: number) => ({
  id,
  patient_id: `p-${id}`,
  patient: { id: `p-${id}`, nombre },
  motivo: 'Limpieza dental',
  fecha_inicio: hoyA(h),
  fecha_fin: hoyA(h + 1),
  estado: 'PROGRAMADA',
  created_at: hoyA(8),
  updated_at: hoyA(8),
});

const ana = citaBase('a-1', 'Ana Prueba', 10);
const luis = citaBase('a-2', 'Luis Prueba', 12);

const iniciarSesionYAbrirAgenda = (citas: object[]) => {
  cy.intercept('GET', '**/api/auth/me', { statusCode: 200, body: { id: 'u-1' } });
  cy.intercept('GET', '**/api/patients*', { statusCode: 200, body: [] });
  cy.intercept('GET', '**/api/appointments?*', { statusCode: 200, body: citas }).as('agenda');

  cy.visit('/', {
    onBeforeLoad(win) {
      win.localStorage.setItem('dental_auth_token', 'token-de-prueba');
      win.localStorage.setItem(
        'dental_auth_user',
        JSON.stringify({ id: 'u-1', email: 'qa@test.com', nombre: 'QA', especialidad: 'QA', rol: 'ODONTOLOGO' })
      );
    },
  });
  cy.contains('button', 'Agenda Diaria').click();
  cy.wait('@agenda');
};

describe('QA E2E - HU-06 Estado de cita', () => {
  it('CP-06-E2E-01: "Atender" marca la cita como Atendida y la cita sigue en la agenda', () => {
    iniciarSesionYAbrirAgenda([ana, luis]);
    cy.intercept('PATCH', '**/api/appointments/a-1/status', (req) => {
      expect(req.body).to.deep.equal({ estado: 'ATENDIDA' });
      req.reply({ statusCode: 200, body: { ...ana, estado: 'ATENDIDA' } });
    }).as('atender');

    cy.get('button[aria-label="Marcar cita de Ana Prueba como atendida"]').click();
    cy.wait('@atender');

    cy.contains('Ana Prueba').should('exist');
    cy.get('[aria-label="Cita atendida"]').should('be.visible');
    cy.get('button[aria-label="Marcar cita de Ana Prueba como atendida"]').should('not.exist');
    cy.contains(/1 atendida/).should('exist');
  });

  it('CP-06-E2E-02: "Cancelar" marca la cita como Cancelada SIN eliminarla', () => {
    iniciarSesionYAbrirAgenda([ana, luis]);
    cy.intercept('PATCH', '**/api/appointments/a-2/status', (req) => {
      expect(req.body).to.deep.equal({ estado: 'CANCELADA' });
      req.reply({ statusCode: 200, body: { ...luis, estado: 'CANCELADA' } });
    }).as('cancelar');

    cy.get('button[aria-label="Cancelar cita de Luis Prueba"]').click();
    cy.wait('@cancelar');

    cy.contains('div', 'Luis Prueba').should('exist').and('have.class', 'line-through');
    cy.contains(/2 citas/).should('exist');
    cy.contains(/1 cancelada/).should('exist');
  });

  it('CP-06-E2E-03: al recargar, los estados se mantienen (persistencia)', () => {
    iniciarSesionYAbrirAgenda([
      { ...ana, estado: 'ATENDIDA' },
      { ...luis, estado: 'CANCELADA' },
    ]);

    cy.contains(/2 citas · 1 atendida · 1 cancelada/).should('exist');
    cy.get('[aria-label="Cita atendida"]').should('be.visible');
    cy.contains('div', 'Luis Prueba').should('have.class', 'line-through');
    cy.get('button').contains('Atender').should('not.exist');
  });

  it('CP-06-E2E-04: si el servidor falla, la cita queda como estaba y se muestra el error', () => {
    iniciarSesionYAbrirAgenda([ana]);
    cy.intercept('PATCH', '**/api/appointments/a-1/status', {
      statusCode: 500,
      body: { error: 'Error interno al actualizar la cita' },
    }).as('falla');

    cy.get('button[aria-label="Marcar cita de Ana Prueba como atendida"]').click();
    cy.wait('@falla');

    cy.contains('Error interno al actualizar la cita').should('be.visible');
    cy.get('[aria-label="Cita atendida"]').should('not.exist');
    cy.get('button[aria-label="Marcar cita de Ana Prueba como atendida"]').should('exist');
  });
});
