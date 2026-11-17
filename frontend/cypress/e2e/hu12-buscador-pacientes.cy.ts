/// <reference types="cypress" />

// QA E2E - HU-12 Buscador de pacientes por nombre o teléfono (Sprint 2)
// Escenario crítico SQAP: "la búsqueda retorna al paciente correcto".
// La búsqueda vive en el Directorio de Pacientes y filtra la lista cargada desde la API.

const pacientes = [
  { id: 'p-1', nombre: 'Ana María Quispe', telefono: '72345678', edad: 28, examenes_sangre_validados: false },
  { id: 'p-2', nombre: 'Carlos Mendoza', telefono: '73456789', edad: 45, examenes_sangre_validados: true },
];

const buscador = () => cy.get('input[aria-label="Buscar por nombre o teléfono"]');

const visitarDirectorio = () => {
  cy.visit('/', {
    onBeforeLoad(win) {
      win.localStorage.setItem('dental_auth_token', 'token-de-prueba');
      win.localStorage.setItem(
        'dental_auth_user',
        JSON.stringify({ id: 'u-1', email: 'qa@test.com', nombre: 'QA', especialidad: 'QA', rol: 'ODONTOLOGO' })
      );
    },
  });
};

describe('QA E2E - HU-12 Buscador de pacientes', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/auth/me', { statusCode: 200, body: { id: 'u-1' } });
    cy.intercept('GET', '**/api/appointments*', { statusCode: 200, body: [] });
  });

  describe('con el directorio cargado', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/api/patients*', { statusCode: 200, body: pacientes }).as('pacientes');
      visitarDirectorio();
      cy.wait('@pacientes');
    });

    it('CP-12-E2E-01: buscar por nombre muestra solo al paciente correcto', () => {
      buscador().type('carlos');

      cy.contains('p', 'Carlos Mendoza').should('be.visible');
      cy.contains('p', 'Ana María Quispe').should('not.exist');
    });

    it('CP-12-E2E-02: buscar por teléfono muestra al paciente correcto', () => {
      buscador().type('7234');

      cy.contains('p', 'Ana María Quispe').should('be.visible');
      cy.contains('72345678').should('be.visible');
      cy.contains('p', 'Carlos Mendoza').should('not.exist');
    });

    it('CP-12-E2E-03: sin coincidencias muestra el mensaje de búsqueda vacía', () => {
      buscador().type('Zzzz');

      cy.contains('No se encontraron pacientes que coincidan con la búsqueda.').should('be.visible');
    });

    it('CP-12-E2E-04: borrar la búsqueda vuelve a mostrar todos los pacientes', () => {
      buscador().type('carlos');
      cy.contains('p', 'Ana María Quispe').should('not.exist');

      buscador().clear();

      cy.contains('p', 'Ana María Quispe').should('be.visible');
      cy.contains('p', 'Carlos Mendoza').should('be.visible');
    });
  });

  it('CP-12-E2E-05: si el servidor falla, se muestra el error', () => {
    cy.intercept('GET', '**/api/patients*', {
      statusCode: 500,
      body: { error: 'Error interno' },
    }).as('pacientes');

    visitarDirectorio();
    cy.wait('@pacientes');

    cy.contains('No se pudo sincronizar el directorio de contactos').should('be.visible');
  });
});
