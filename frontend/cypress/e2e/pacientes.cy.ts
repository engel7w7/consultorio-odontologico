declare const describe: (title: string, fn: () => void) => void;
declare const it: (title: string, fn: () => void) => void;
declare const beforeEach: (fn: () => void) => void;
declare const cy: any;

const usuarioPrueba = {
  id: 'u-1',
  email: 'odontologo@test.com',
  nombre: 'Dr. Roberto Mendoza',
  especialidad: 'Ortodoncia y Cirugía Oral',
  rol: 'ODONTOLOGO',
};

const pacienteExistente = {
  id: 'p-legacy',
  nombre: 'jo',
  telefono: '123',
  edad: 0,
  examenes_sangre_validados: false,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

const campo = (label: string) => cy.contains('label', label).parent().find('input');

describe('QA E2E Tests - Sprint 1 (HU-02 y HU-07)', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/auth/me', { statusCode: 200, body: usuarioPrueba });
    cy.intercept('GET', '**/api/patients', { statusCode: 200, body: [pacienteExistente] }).as('getPatients');
    cy.visit('http://localhost:5173/', {
      onBeforeLoad(win: Window) {
        win.localStorage.setItem('dental_auth_token', 'fake-jwt-token-pacientes');
        win.localStorage.setItem('dental_auth_user', JSON.stringify(usuarioPrueba));
      },
    });
  });

  it('HU-02: El paciente registrado queda disponible en el directorio', () => {
    cy.contains('button', /Directorio de Pacientes|HU-02: Registro de Paciente/).click();

    cy.intercept('POST', 'http://localhost:3000/api/patients', {
      statusCode: 200,
      body: { id: '1', nombre: 'Ana García', telefono: '77712345', edad: 28 },
    }).as('createPatient');

    cy.contains('button', 'Nuevo paciente').click();
    cy.get('[role="dialog"]').should('be.visible');

    campo('Nombre Completo').type('Ana García');
    campo('Teléfono de Contacto').type('77712345');
    campo('Edad').type('28');

    cy.contains('button', 'Guardar en Directorio').click();

    cy.wait('@createPatient').its('request.body').should('deep.equal', {
      nombre: 'Ana García',
      telefono: '77712345',
      edad: 28,
    });
    cy.contains('Paciente registrado exitosamente en el sistema').should('be.visible');
    cy.get('[role="dialog"]').should('not.exist');
    cy.contains('p', /^Ana García$/).should('be.visible');
  });

  it('HU-02: El formulario de registro se abre en un modal y enfoca el primer campo', () => {
    cy.contains('label', 'Nombre Completo').should('not.exist');
    cy.contains('h2', 'Pacientes').should('be.visible');

    cy.contains('button', 'Nuevo paciente').click();
    cy.get('[role="dialog"]').should('be.visible');
    campo('Nombre Completo').should('have.focus');
  });

  it('HU-02: El modal se cierra con Esc, con Cancelar y con clic afuera', () => {
    cy.contains('button', 'Nuevo paciente').click();
    cy.get('body').type('{esc}');
    cy.get('[role="dialog"]').should('not.exist');

    cy.contains('button', 'Nuevo paciente').click();
    cy.contains('button', 'Cancelar').click();
    cy.get('[role="dialog"]').should('not.exist');

    cy.contains('button', 'Nuevo paciente').click();
    cy.get('[role="dialog"]').parent().click('topLeft');
    cy.get('[role="dialog"]').should('not.exist');
  });

  it('HU-02: Muestra errores de validación y no envía datos inválidos', () => {
    cy.intercept('POST', 'http://localhost:3000/api/patients', cy.spy().as('createPatientSpy'));

    cy.contains('button', 'Nuevo paciente').click();
    cy.contains('button', 'Guardar en Directorio').click();

    cy.contains('El nombre es obligatorio').should('be.visible');
    cy.contains('El teléfono es obligatorio').should('be.visible');
    cy.contains('La edad es obligatoria').should('be.visible');

    campo('Nombre Completo').type('An').blur();
    cy.contains('El nombre debe tener al menos 3 caracteres').should('be.visible');
    campo('Nombre Completo').clear().type('Ana 123').blur();
    cy.contains('El nombre solo puede contener letras y espacios').should('be.visible');

    campo('Teléfono de Contacto').type('7771234').blur();
    cy.contains('El teléfono debe tener exactamente 8 dígitos numéricos').should('be.visible');
    campo('Teléfono de Contacto').clear().type('7771234a').blur();
    cy.contains('El teléfono debe tener exactamente 8 dígitos numéricos').should('be.visible');

    campo('Edad').type('111').blur();
    cy.contains('La edad debe ser un número entero entre 1 y 110').should('be.visible');
    campo('Edad').clear().type('0').blur();
    cy.contains('La edad debe ser un número entero entre 1 y 110').should('be.visible');

    cy.contains('button', 'Guardar en Directorio').click();
    cy.get('@createPatientSpy').should('not.have.been.called');
    cy.get('[role="dialog"]').should('be.visible');
  });

  it('HU-02: Capitaliza el nombre al guardar', () => {
    cy.intercept('POST', 'http://localhost:3000/api/patients', {
      statusCode: 201,
      body: { id: '2', nombre: 'María José Pérez', telefono: '71234567', edad: 40 },
    }).as('createPatient');

    cy.contains('button', 'Nuevo paciente').click();
    campo('Nombre Completo').type('  maría   josé PÉREZ ');
    campo('Teléfono de Contacto').type('71234567');
    campo('Edad').type('40');
    cy.contains('button', 'Guardar en Directorio').click();

    cy.wait('@createPatient').its('request.body.nombre').should('equal', 'María José Pérez');
  });

  it('HU-02: Si el backend responde con error, el modal sigue abierto y conserva los datos', () => {
    cy.intercept('POST', 'http://localhost:3000/api/patients', {
      statusCode: 500,
      body: { error: 'Error interno del servidor' },
    }).as('createPatient');

    cy.contains('button', 'Nuevo paciente').click();
    campo('Nombre Completo').type('Ana García');
    campo('Teléfono de Contacto').type('77712345');
    campo('Edad').type('28');
    cy.contains('button', 'Guardar en Directorio').click();

    cy.wait('@createPatient');
    cy.get('[role="dialog"]').should('be.visible').contains('Error interno del servidor');
    campo('Nombre Completo').should('have.value', 'Ana García');
    campo('Teléfono de Contacto').should('have.value', '77712345');
    campo('Edad').should('have.value', '28');
  });

  it('HU-02: Los pacientes existentes con datos inválidos siguen visibles en el directorio', () => {
    cy.wait('@getPatients');
    cy.contains('p', /^jo$/).should('be.visible');
    cy.contains('span', /^123$/).should('be.visible');
    cy.contains('span', /^0 años$/).should('be.visible');
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
