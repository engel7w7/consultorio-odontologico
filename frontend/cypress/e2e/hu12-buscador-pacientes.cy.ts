/// <reference types="cypress" />

// QA E2E - HU-12 Buscador de pacientes por nombre o teléfono (Sprint 2)
// Escenario crítico SQAP: "la búsqueda retorna al paciente correcto".
// El backend se simula con cy.intercept y filtra como lo haría la API.

const pacientes = [
  { id: 'p-1', nombre: 'Ana María Quispe', telefono: '72345678', edad: 28, examenes_sangre_validados: false },
  { id: 'p-2', nombre: 'Carlos Mendoza', telefono: '73456789', edad: 45, examenes_sangre_validados: true },
];

describe('QA E2E - HU-12 Buscador de pacientes', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/auth/me', { statusCode: 200, body: { id: 'u-1' } });
    cy.intercept('GET', '**/api/appointments*', { statusCode: 200, body: [] });
    cy.intercept('GET', '**/api/patients*', (req) => {
      const q = String(req.query.search ?? '').trim().toLowerCase();
      const body = q
        ? pacientes.filter((p) => p.nombre.toLowerCase().includes(q) || p.telefono.includes(q))
        : pacientes;
      req.reply({ statusCode: 200, body });
    }).as('buscar');

    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem('dental_auth_token', 'token-de-prueba');
        win.localStorage.setItem(
          'dental_auth_user',
          JSON.stringify({ id: 'u-1', email: 'qa@test.com', nombre: 'QA', especialidad: 'QA', rol: 'ODONTOLOGO' })
        );
      },
    });
    cy.contains('button', 'Buscador de Pacientes').click();
    cy.wait('@buscar');
  });

  it('CP-12-E2E-01: buscar por nombre muestra solo al paciente correcto', () => {
    cy.get('#patient-search').type('carlos');

    cy.contains('li', 'Carlos Mendoza').should('be.visible');
    cy.contains('li', 'Ana María Quispe').should('not.exist');
  });

  it('CP-12-E2E-02: buscar por teléfono muestra al paciente correcto', () => {
    cy.get('#patient-search').type('7234');

    cy.contains('li', 'Ana María Quispe').should('be.visible').and('contain', '72345678');
    cy.contains('li', 'Carlos Mendoza').should('not.exist');
  });

  it('CP-12-E2E-03: sin coincidencias muestra "No se encontraron pacientes."', () => {
    cy.get('#patient-search').type('Zzzz');

    cy.contains('No se encontraron pacientes.').should('be.visible');
  });

  it('CP-12-E2E-04: borrar la búsqueda vuelve a mostrar todos los pacientes', () => {
    cy.get('#patient-search').type('carlos');
    cy.contains('li', 'Ana María Quispe').should('not.exist');

    cy.get('#patient-search').clear();

    cy.contains('li', 'Ana María Quispe').should('be.visible');
    cy.contains('li', 'Carlos Mendoza').should('be.visible');
  });

  it('CP-12-E2E-05: si el servidor falla, se muestra el error', () => {
    cy.intercept('GET', '**/api/patients*', {
      statusCode: 500,
      body: { error: 'Error al buscar pacientes' },
    });

    cy.get('#patient-search').type('ana');

    cy.contains('Error al buscar pacientes').should('be.visible');
  });
});
