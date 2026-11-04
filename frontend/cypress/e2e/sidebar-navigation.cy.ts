/// <reference types="cypress" />

describe('Navegación con Sidebar Vertical (feature/frontend-sidebar-nav)', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/auth/me', {
      statusCode: 200,
      body: {
        id: 'u-1',
        email: 'odontologo@test.com',
        nombre: 'Dr. Roberto Mendoza',
        especialidad: 'Ortodoncia y Cirugía Oral',
        rol: 'ODONTOLOGO',
      },
    });

    cy.intercept('GET', '**/api/**', { statusCode: 200, body: [] });

    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem('dental_auth_token', 'fake-jwt-token-sidebar');
        win.localStorage.setItem(
          'dental_auth_user',
          JSON.stringify({
            id: 'u-1',
            email: 'odontologo@test.com',
            nombre: 'Dr. Roberto Mendoza',
            especialidad: 'Ortodoncia y Cirugía Oral',
            rol: 'ODONTOLOGO',
          })
        );
      },
    });
  });

  describe('Escritorio (Desktop >= 768px)', () => {
    beforeEach(() => {
      cy.viewport(1280, 800);
    });

    it('muestra el sidebar vertical fijo con las 6 secciones clínicas y datos del odontólogo', () => {
      cy.get('#sidebar-navigation').should('be.visible');
      cy.get('#sidebar-navigation').within(() => {
        cy.contains('Centro Odontológico').should('be.visible');
        cy.contains('Gestión Clínica').should('be.visible');
      });

      // Las 6 secciones clínicas deben estar presentes
      cy.contains('button', 'Directorio de Pacientes').should('be.visible');
      cy.contains('button', 'Validación de Exámenes').should('be.visible');
      cy.contains('button', 'Agenda Diaria').should('be.visible');
      cy.contains('button', 'Antecedentes Médicos').should('be.visible');
      cy.contains('button', 'Historial Clínico').should('be.visible');
      cy.contains('button', 'Retorno de Pacientes').should('be.visible');

      // Datos del usuario en la parte inferior
      cy.get('#sidebar-navigation').within(() => {
        cy.contains('Dr. Roberto Mendoza').should('be.visible');
        cy.contains('Ortodoncia y Cirugía Oral').should('be.visible');
        cy.contains('button', 'Salir').should('be.visible');
      });
    });

    it('resalta la sección activa con aria-current="page" al navegar entre secciones', () => {
      // Por defecto la pestaña activa es Directorio de Pacientes
      cy.contains('button', 'Directorio de Pacientes').should('have.attr', 'aria-current', 'page');

      // Cambiar a Agenda Diaria
      cy.contains('button', 'Agenda Diaria').click();
      cy.contains('button', 'Agenda Diaria').should('have.attr', 'aria-current', 'page');
      cy.contains('button', 'Directorio de Pacientes').should('not.have.attr', 'aria-current');

      // Cambiar a Retorno de Pacientes
      cy.contains('button', 'Retorno de Pacientes').click();
      cy.contains('button', 'Retorno de Pacientes').should('have.attr', 'aria-current', 'page');
    });

    it('permite colapsar el sidebar a solo íconos y volver a expandirlo', () => {
      const toggleBtn = () => cy.get('button[aria-label="Contraer barra lateral"], button[aria-label="Expandir barra lateral"]');

      // Inicialmente está expandido
      toggleBtn().should('have.attr', 'aria-expanded', 'true');
      cy.contains('Contraer menú').should('be.visible');

      // Colapsar
      toggleBtn().click();
      toggleBtn().should('have.attr', 'aria-expanded', 'false');
      cy.get('#sidebar-navigation').should('have.class', 'md:w-20');

      // Expandir de nuevo
      toggleBtn().click();
      toggleBtn().should('have.attr', 'aria-expanded', 'true');
      cy.get('#sidebar-navigation').should('have.class', 'md:w-64');
    });

    it('permite cerrar sesión desde el botón Salir del sidebar', () => {
      cy.contains('button', 'Salir').click();
      cy.contains('Portal Odontológico Seguro').should('be.visible');
      cy.window().then((win) => {
        expect(win.localStorage.getItem('dental_auth_token')).to.equal(null);
      });
    });
  });

  describe('Dispositivos móviles (< 768px)', () => {
    beforeEach(() => {
      cy.viewport(375, 667); // iPhone SE
    });

    it('oculta el sidebar por defecto y lo abre como drawer con el botón hamburguesa', () => {
      // El sidebar debe estar oculto en móvil inicialmente
      cy.get('#sidebar-navigation').should('have.class', '-translate-x-full');

      // Botón hamburguesa visible en el header móvil
      cy.get('button[aria-label="Abrir menú de navegación"]').should('be.visible').click();

      // El sidebar se abre como drawer
      cy.get('#sidebar-navigation').should('have.class', 'translate-x-0');

      // Cerrar el drawer con el botón de cerrar (X)
      cy.get('button[aria-label="Cerrar menú de navegación"]').should('be.visible').click();
      cy.get('#sidebar-navigation').should('have.class', '-translate-x-full');
    });

    it('cierra el drawer automáticamente al seleccionar una sección clínica', () => {
      cy.get('button[aria-label="Abrir menú de navegación"]').click();
      cy.get('#sidebar-navigation').should('have.class', 'translate-x-0');

      // Seleccionar una sección
      cy.contains('button', 'Agenda Diaria').click();

      // El drawer se cierra automáticamente y la vista cambia
      cy.get('#sidebar-navigation').should('have.class', '-translate-x-full');
    });

    it('cierra el drawer al presionar la tecla Escape', () => {
      cy.get('button[aria-label="Abrir menú de navegación"]').click();
      cy.get('#sidebar-navigation').should('have.class', 'translate-x-0');

      // Presionar Escape
      cy.get('body').type('{esc}');
      cy.get('#sidebar-navigation').should('have.class', '-translate-x-full');
    });
  });
});

