declare const describe: (title: string, fn: () => void) => void;
declare const it: (title: string, fn: () => void) => void;
declare const beforeEach: (fn: () => void) => void;
declare const cy: any;

describe('QA E2E Tests - Sprint 1 (HU-02 y HU-07)', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173/');
  });

  it('HU-02: El paciente registrado queda disponible en el directorio', () => {
    cy.contains('button', /Directorio de Pacientes|HU-02: Registro de Paciente/).click();

    cy.intercept('POST', 'http://localhost:3000/api/patients', {
      statusCode: 200,
      body: { id: '1', nombre: 'Ana García', telefono: '77712345', edad: 28 },
    }).as('createPatient');

    cy.contains('label', 'Nombre Completo').parent().find('input').type('Ana García');
    cy.contains('label', 'Teléfono de Contacto').parent().find('input').type('77712345');
    cy.contains('label', 'Edad').parent().find('input').type('28');

    cy.contains('button', 'Guardar en Directorio').click();

    cy.wait('@createPatient').its('request.body').should('deep.equal', {
      nombre: 'Ana García',
      telefono: '77712345',
      edad: 28,
    });
    cy.contains('Paciente registrado exitosamente en el sistema').should('be.visible');
  });

  it('HU-07: La validación de exámenes otorga luz verde médica', () => {
    cy.contains('button', /Validación de Exámenes|HU-07: Validación de Exámenes/).click();

    cy.intercept('PATCH', 'http://localhost:3000/api/patients/sample-patient-id/blood-exams', {
      statusCode: 200,
      body: { examenes_sangre_validados: true },
    }).as('validateBloodExams');

    cy.contains('button', 'Validar Exámenes').click();

    cy.wait('@validateBloodExams').its('request.body').should('deep.equal', {
      examenes_sangre_validados: true,
    });
    cy.contains('● Luz Verde Médica').should('be.visible');
  });
});