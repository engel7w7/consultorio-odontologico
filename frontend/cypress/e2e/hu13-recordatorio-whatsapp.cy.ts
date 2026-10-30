/// <reference types="cypress" />

// QA E2E - HU-13 Recordatorio de cita por WhatsApp (Sprint 2)
// Criterio SQAP: En la agenda diaria, el odontólogo dispone de un acceso directo para enviar recordatorios por WhatsApp.

const pacienteConTelefono = {
  id: 'p-1',
  nombre: 'Carlos Gutierrez',
  telefono: '76543210',
  edad: 32,
  examenes_sangre_validados: true,
};

const pacienteSinTelefono = {
  id: 'p-2',
  nombre: 'Elena Ramos',
  telefono: '',
  edad: 45,
  examenes_sangre_validados: false,
};

const citaConWhatsapp = {
  id: 'c-1',
  patient_id: pacienteConTelefono.id,
  motivo: 'Limpieza dental',
  fecha_inicio: '2026-10-30T09:00:00.000Z',
  fecha_fin: '2026-10-30T09:45:00.000Z',
  estado: 'PROGRAMADA',
  patient: pacienteConTelefono,
};

const citaSinWhatsapp = {
  id: 'c-2',
  patient_id: pacienteSinTelefono.id,
  motivo: 'Control de brackets',
  fecha_inicio: '2026-10-30T10:00:00.000Z',
  fecha_fin: '2026-10-30T10:45:00.000Z',
  estado: 'PROGRAMADA',
  patient: pacienteSinTelefono,
};

const iniciarSesionYIrAgenda = () => {
  cy.intercept('GET', '**/api/auth/me', { statusCode: 200, body: { id: 'u-1' } });
  cy.intercept('GET', '**/api/patients*', { statusCode: 200, body: [pacienteConTelefono, pacienteSinTelefono] });
  cy.intercept('GET', '**/api/appointments*', {
    statusCode: 200,
    body: [citaConWhatsapp, citaSinWhatsapp],
  }).as('citas');

  cy.visit('/', {
    onBeforeLoad(win) {
      win.localStorage.setItem('dental_auth_token', 'token-qa-hu13');
      win.localStorage.setItem(
        'dental_auth_user',
        JSON.stringify({ id: 'u-1', email: 'doctor@consultorio.com', nombre: 'Doctor QA', rol: 'ODONTOLOGO' })
      );
    },
  });

  cy.contains('button', 'Agenda Diaria').click();
  cy.wait('@citas');
};

describe('QA E2E - HU-13 Recordatorio de cita por WhatsApp', () => {
  it('CP-13-E2E-01: cita con paciente y telefono valido muestra el enlace a wa.me con prefijo boliviano 591', () => {
    iniciarSesionYIrAgenda();

    cy.get(`a[aria-label="Enviar recordatorio de WhatsApp a ${pacienteConTelefono.nombre}"]`)
      .should('be.visible')
      .should('have.attr', 'target', '_blank')
      .should('have.attr', 'rel', 'noopener noreferrer')
      .and('have.attr', 'href')
      .and('include', 'https://wa.me/59176543210');
  });

  it('CP-13-E2E-02: el mensaje codificado incluye el nombre del paciente y el motivo de la cita', () => {
    iniciarSesionYIrAgenda();

    cy.get(`a[aria-label="Enviar recordatorio de WhatsApp a ${pacienteConTelefono.nombre}"]`)
      .invoke('attr', 'href')
      .then((href) => {
        expect(href).to.include('text=');
        const decodedUrl = decodeURIComponent(href || '');
        expect(decodedUrl).to.include(pacienteConTelefono.nombre);
        expect(decodedUrl).to.include('Limpieza dental');
        expect(decodedUrl).to.include('recordamos su cita odontológica');
      });
  });

  it('CP-13-E2E-03: paciente sin telefono registrado no muestra el boton de WhatsApp', () => {
    iniciarSesionYIrAgenda();

    cy.get(`a[aria-label="Enviar recordatorio de WhatsApp a ${pacienteSinTelefono.nombre}"]`)
      .should('not.exist');
  });
});
