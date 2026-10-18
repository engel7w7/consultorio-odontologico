/// <reference types="cypress" />

// QA E2E - HU-01 Login seguro del odontólogo (Sprint 2)
// Escenario crítico del Plan SQAP: "credenciales inválidas no permiten acceso".
// El backend se simula con cy.intercept para que la prueba sea reproducible.

describe('QA E2E - HU-01 Login seguro', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit('/');
  });

  it('CP-01-E2E-01: credenciales inválidas NO permiten el acceso', () => {
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 401,
      body: { error: 'Credenciales inválidas. Verifique su correo o contraseña.' },
    }).as('login');

    cy.get('input[type="email"]').clear().type('odontologo@test.com');
    cy.get('input[type="password"]').clear().type('ClaveIncorrecta');
    cy.contains('button', 'Ingresar al Sistema Clínico').click();
    cy.wait('@login');

    cy.contains(/credenciales inválidas/i).should('be.visible');
    cy.contains('Portal Odontológico Seguro').should('be.visible');
    cy.contains('Agenda Diaria').should('not.exist');
    cy.window().then((win) => {
      expect(win.localStorage.getItem('dental_auth_token')).to.be.null;
    });
  });

  it('CP-01-E2E-02: credenciales válidas permiten el acceso y Salir cierra la sesión', () => {
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: {
        token: 'token-de-prueba',
        user: {
          id: 'u-1',
          email: 'odontologo@test.com',
          nombre: 'Dra. Prueba',
          especialidad: 'Odontología General',
          rol: 'ODONTOLOGO',
        },
      },
    }).as('login');
    cy.intercept('GET', '**/api/**', { statusCode: 200, body: [] });

    cy.get('input[type="email"]').clear().type('odontologo@test.com');
    cy.get('input[type="password"]').clear().type('ClaveSegura#2026');
    cy.contains('button', 'Ingresar al Sistema Clínico').click();
    cy.wait('@login');

    cy.contains('Dra. Prueba').should('be.visible');
    cy.contains('button', 'Salir').click();
    cy.contains('Portal Odontológico Seguro').should('be.visible');
  });

  it('CP-01-E2E-03: el formulario NO debe venir con credenciales precargadas', () => {
    cy.get('input[type="email"]').should('have.value', '');
    cy.get('input[type="password"]').should('have.value', '');
    cy.contains('Doctor123*').should('not.exist');
  });
});
