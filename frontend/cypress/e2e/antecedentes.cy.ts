export {};
declare const describe: (title: string, fn: () => void) => void;
declare const it: (title: string, fn: () => void) => void;
declare const beforeEach: (fn: () => void) => void;
declare const cy: any;

describe('QA E2E Tests - Sprint 1 (HU-03)', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173/');
  });

  it('HU-03: Los antecedentes médicos críticos se visualizan en la ficha', () => {
    // Espera a que el botón o pestaña de la HU-03 esté disponible y haz clic
    cy.contains('HU-03: Antecedentes Médicos').should('be.visible').click();
    
    // Verifica que los elementos clave de la sección aparezcan en pantalla
    cy.contains('Antecedentes médicos').should('be.visible');
    cy.contains('Paciente').should('be.visible');
  });
});