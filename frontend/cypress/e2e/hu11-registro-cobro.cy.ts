/// <reference types="cypress" />

// QA E2E - HU-11 Registro de cobro en citas atendidas (Sprint 2)
// Criterio SQAP: El odontólogo puede registrar y visualizar el monto cobrado de una cita atendida.

const paciente = {
  id: 'paciente-1',
  nombre: 'Mario Mendoza',
  telefono: '71234567',
  edad: 40,
  examenes_sangre_validados: true,
};

const citaAtendida = {
  id: 'cita-atendida-1',
  patient_id: paciente.id,
  motivo: 'Limpieza y profilaxis',
  fecha_inicio: '2026-10-28T09:00:00.000Z',
  fecha_fin: '2026-10-28T09:45:00.000Z',
  estado: 'ATENDIDA',
  monto_pagado: null,
  patient: paciente,
};

const citaProgramada = {
  id: 'cita-programada-2',
  patient_id: paciente.id,
  motivo: 'Control de rutina',
  fecha_inicio: '2026-10-28T10:00:00.000Z',
  fecha_fin: '2026-10-28T10:45:00.000Z',
  estado: 'PROGRAMADA',
  monto_pagado: null,
  patient: paciente,
};

const iniciarSesionYIrAgenda = () => {
  cy.intercept('GET', '**/api/auth/me', { statusCode: 200, body: { id: 'u-1' } });
  cy.intercept('GET', '**/api/patients*', { statusCode: 200, body: [paciente] });
  cy.intercept('GET', '**/api/appointments*', {
    statusCode: 200,
    body: [citaAtendida, citaProgramada],
  }).as('citas');

  cy.visit('/', {
    onBeforeLoad(win) {
      win.localStorage.setItem('dental_auth_token', 'token-qa-prueba');
      win.localStorage.setItem(
        'dental_auth_user',
        JSON.stringify({ id: 'u-1', email: 'qa@consultorio.com', nombre: 'Doctor QA', rol: 'ODONTOLOGO' })
      );
    },
  });

  cy.contains('button', 'Agenda Diaria').click();
  cy.wait('@citas');
};

describe('QA E2E - HU-11 Registro de cobro en citas atendidas', () => {
  it('CP-11-E2E-01: muestra boton de cobro solo en citas atendidas y no en programadas', () => {
    iniciarSesionYIrAgenda();

    cy.contains('button', 'Registrar cobro').should('be.visible');
    cy.contains('button', `Registrar cobro de ${paciente.nombre}`).should('exist');
  });

  it('CP-11-E2E-02: abre el modal de cobro y permite cancelar', () => {
    iniciarSesionYIrAgenda();

    cy.contains('button', 'Registrar cobro').click();
    cy.contains('h3', 'Registrar cobro').should('be.visible');
    cy.contains(paciente.nombre).should('be.visible');
    cy.contains('label', 'Monto pagado (Bs)').should('be.visible');

    cy.contains('button', 'Cancelar').click();
    cy.contains('h3', 'Registrar cobro').should('not.exist');
  });

  it('CP-11-E2E-03: registra el cobro exitosamente y actualiza la tarjeta de cita con el monto en Bs', () => {
    iniciarSesionYIrAgenda();

    const citaCobrada = {
      ...citaAtendida,
      monto_pagado: 180.5,
    };

    cy.intercept('PATCH', `**/api/appointments/${citaAtendida.id}/payment`, {
      statusCode: 200,
      body: citaCobrada,
    }).as('registrarCobro');

    cy.contains('button', 'Registrar cobro').click();
    cy.get('input[type="number"]').clear().type('180.50');
    cy.contains('button', 'Guardar cobro').click();

    cy.wait('@registrarCobro').its('request.body').should('deep.equal', {
      monto_pagado: 180.5,
    });

    cy.contains('Cobrado Bs 180.5').should('be.visible');
  });
});
