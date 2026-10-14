export {};
declare const describe: (title: string, fn: () => void) => void;
declare const it: (title: string, fn: () => void) => void;
declare const beforeEach: (fn: () => void) => void;
declare const cy: any;

describe('QA E2E Tests - Sprint 1 (HU-04)', () => {
  beforeEach(() => {
    // Ajusta esta URL a la ruta real de la agenda en tu frontend
    cy.visit('http://localhost:5173/'); 
  });

  it('HU-04: La agenda diaria carga correctamente y muestra citas', () => {
    // Haz que Cypress haga clic en el botón de la HU-04 (ajusta el texto si es distinto)
    cy.contains('button', 'HU-04: Agenda Diaria').click();

    // Verifica que el contenedor de FullCalendar exista (clase .fc)
    cy.get('.fc').should('be.visible'); 
    
    // Verifica visualmente que se cargó
    cy.contains('Agenda').should('be.visible');
  });
});