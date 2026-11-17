/// <reference types="cypress" />

// QA E2E - HU-10 Historial cronológico de tratamientos (Sprint 3)
// Escenario crítico SQAP: "el historial cronológico de tratamientos se lista en orden
// por paciente". El backend se simula con cy.intercept.

const ana = {
  id: '11111111-1111-4111-8111-111111111111',
  nombre: 'Ana Prueba',
  telefono: '70000001',
  edad: 34,
  examenes_sangre_validados: false,
  created_at: '2026-08-01T12:00:00.000Z',
  updated_at: '2026-08-01T12:00:00.000Z',
};

const luis = {
  ...ana,
  id: '22222222-2222-4222-8222-222222222222',
  nombre: 'Luis Prueba',
  telefono: '70000002',
  edad: 51,
};

const tratamientosAna = [
  { id: 'c-3', fecha: '2026-10-15T14:00:00.000Z', procedimiento: 'Endodoncia', duracion_minutos: 90 },
  { id: 'c-2', fecha: '2026-09-20T14:00:00.000Z', procedimiento: 'Obturación', duracion_minutos: 45 },
  { id: 'c-1', fecha: '2026-08-01T14:00:00.000Z', procedimiento: 'Limpieza dental', duracion_minutos: 30 },
];

const historial = (paciente: typeof ana, tratamientos: object[]) => ({
  patient: { id: paciente.id, nombre: paciente.nombre, edad: paciente.edad, telefono: paciente.telefono },
  total: tratamientos.length,
  tratamientos,
});

const iniciarSesionYAbrirHistorial = () => {
  cy.intercept('GET', '**/api/auth/me', { statusCode: 200, body: { id: 'u-1' } });
  cy.intercept('GET', '**/api/patients*', { statusCode: 200, body: [ana, luis] }).as('pacientes');

  cy.visit('/', {
    onBeforeLoad(win) {
      win.localStorage.setItem('dental_auth_token', 'token-de-prueba');
      win.localStorage.setItem(
        'dental_auth_user',
        JSON.stringify({ id: 'u-1', email: 'qa@test.com', nombre: 'QA', especialidad: 'QA', rol: 'ODONTOLOGO' })
      );
    },
  });
  cy.contains('button', 'Historial Clínico').click();
  cy.wait('@pacientes');
};

describe('QA E2E - HU-10 Historial de tratamientos', () => {
  it('CP-10-E2E-01: al seleccionar un paciente se ve su línea de tiempo, más reciente arriba', () => {
    iniciarSesionYAbrirHistorial();
    cy.intercept('GET', `**/api/patients/${ana.id}/history?orden=desc`, {
      statusCode: 200,
      body: historial(ana, tratamientosAna),
    }).as('historialDesc');

    cy.contains('button', 'Ana Prueba').click();
    cy.wait('@historialDesc');

    cy.contains('Historial Clínico: Ana Prueba').should('be.visible');
    cy.contains('3 tratamientos').should('exist');
    cy.get('[data-testid="tratamiento-item"]').should('have.length', 3);
    cy.get('[data-testid="tratamiento-item"]').eq(0).should('contain', 'Endodoncia').and('contain', '90 min');
    cy.get('[data-testid="tratamiento-item"]').eq(1).should('contain', 'Obturación');
    cy.get('[data-testid="tratamiento-item"]').eq(2).should('contain', 'Limpieza dental');
  });

  it('CP-10-E2E-02: el selector de orden pide orden ascendente y muestra el más antiguo arriba', () => {
    iniciarSesionYAbrirHistorial();
    cy.intercept('GET', `**/api/patients/${ana.id}/history?orden=desc`, {
      statusCode: 200,
      body: historial(ana, tratamientosAna),
    }).as('historialDesc');
    cy.intercept('GET', `**/api/patients/${ana.id}/history?orden=asc`, {
      statusCode: 200,
      body: historial(ana, [...tratamientosAna].reverse()),
    }).as('historialAsc');

    cy.contains('button', 'Ana Prueba').click();
    cy.wait('@historialDesc');
    cy.get('#orden-historial').select('asc');
    cy.wait('@historialAsc');

    cy.get('[data-testid="tratamiento-item"]').first().should('contain', 'Limpieza dental');
    cy.get('[data-testid="tratamiento-item"]').last().should('contain', 'Endodoncia');
  });

  it('CP-10-E2E-03: paciente sin tratamientos muestra el estado vacío', () => {
    iniciarSesionYAbrirHistorial();
    cy.intercept('GET', `**/api/patients/${luis.id}/history?orden=desc`, {
      statusCode: 200,
      body: historial(luis, []),
    }).as('historialVacio');

    cy.contains('button', 'Luis Prueba').click();
    cy.wait('@historialVacio');

    cy.contains('Sin tratamientos registrados').should('be.visible');
    cy.get('[data-testid="tratamiento-item"]').should('not.exist');
  });

  it('CP-10-E2E-04: al cambiar de paciente no se mezclan los tratamientos', () => {
    iniciarSesionYAbrirHistorial();
    cy.intercept('GET', `**/api/patients/${ana.id}/history?orden=desc`, {
      statusCode: 200,
      body: historial(ana, tratamientosAna),
    }).as('historialAna');
    cy.intercept('GET', `**/api/patients/${luis.id}/history?orden=desc`, {
      statusCode: 200,
      body: historial(luis, []),
    }).as('historialLuis');

    cy.contains('button', 'Ana Prueba').click();
    cy.wait('@historialAna');
    cy.contains('button', 'Luis Prueba').click();
    cy.wait('@historialLuis');

    cy.contains('Historial Clínico: Luis Prueba').should('be.visible');
    cy.contains('Endodoncia').should('not.exist');
    cy.contains('Sin tratamientos registrados').should('be.visible');
  });
});
