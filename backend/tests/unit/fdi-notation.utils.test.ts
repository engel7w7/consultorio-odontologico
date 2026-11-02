import { describe, it, expect } from 'vitest';
import {
  resolveFdiTooth,
  parseSurfaces,
  parseQuickTreatment,
  FDI_TEETH,
  DENTAL_SURFACES,
  CIE10_CATALOG,
} from '../../src/utils/fdi-notation.utils.js';

describe('QA Unit Tests: FDI Notation & CIE-10 Utils (HU-09)', () => {
  describe('FDI_TEETH and DENTAL_SURFACES Catalogs', () => {
    it('contiene las 32 piezas permanentes y 20 temporales', () => {
      expect(Object.keys(FDI_TEETH).length).toBe(52);
      expect(FDI_TEETH[11].nombre).toContain('Incisivo Central Superior Derecho');
      expect(FDI_TEETH[51].tipo).toBe('TEMPORAL');
    });

    it('contiene las superficies dentales estándar ISO y clínicas', () => {
      expect(DENTAL_SURFACES.O).toBe('Oclusal');
      expect(DENTAL_SURFACES.M).toBe('Mesial');
      expect(DENTAL_SURFACES.D).toBe('Distal');
      expect(DENTAL_SURFACES.V).toBe('Vestibular');
      expect(DENTAL_SURFACES.B).toBe('Bucal');
      expect(DENTAL_SURFACES.P).toBe('Palatino');
      expect(DENTAL_SURFACES.L).toBe('Lingual');
      expect(DENTAL_SURFACES.I).toBe('Incisal');
    });
  });

  describe('resolveFdiTooth', () => {
    it('resuelve códigos FDI numéricos directos de 2 dígitos', () => {
      expect(resolveFdiTooth('11')).toBe(11);
      expect(resolveFdiTooth('24')).toBe(24);
      expect(resolveFdiTooth('36')).toBe(36);
      expect(resolveFdiTooth('48')).toBe(48);
      expect(resolveFdiTooth('51')).toBe(51);
      expect(resolveFdiTooth('65')).toBe(65);
      expect(resolveFdiTooth('74')).toBe(74);
      expect(resolveFdiTooth('85')).toBe(85);
    });

    it('convierte notación de cuadrante y letra a código FDI (ej. 1A -> 11)', () => {
      expect(resolveFdiTooth('1A')).toBe(11);
      expect(resolveFdiTooth('2D')).toBe(24);
      expect(resolveFdiTooth('1B')).toBe(12);
      expect(resolveFdiTooth('3F')).toBe(36);
      expect(resolveFdiTooth('4H')).toBe(48);
    });

    it('limpia signos de puntuación o corchetes al resolver la pieza', () => {
      expect(resolveFdiTooth('[11]')).toBe(11);
      expect(resolveFdiTooth('(1A)')).toBe(11);
      expect(resolveFdiTooth('24.')).toBe(24);
    });

    it('retorna null para valores no válidos o fuera de rango', () => {
      expect(resolveFdiTooth('99')).toBeNull();
      expect(resolveFdiTooth('00')).toBeNull();
      expect(resolveFdiTooth('1Z')).toBeNull();
      expect(resolveFdiTooth('XYZ')).toBeNull();
      expect(resolveFdiTooth('')).toBeNull();
    });
  });

  describe('parseSurfaces', () => {
    it('reconoce superficies individuales', () => {
      const res = parseSurfaces('O');
      expect(res).toEqual({ code: 'O', nombres: ['Oclusal'] });
    });

    it('reconoce combinaciones compuestas válidas (OD, MOD, MODV)', () => {
      const od = parseSurfaces('OD');
      expect(od?.code).toBe('OD');
      expect(od?.nombres).toEqual(['Oclusal', 'Distal']);

      const mod = parseSurfaces('MOD');
      expect(mod?.code).toBe('MOD');
      expect(mod?.nombres).toEqual(['Mesial', 'Oclusal', 'Distal']);
    });

    it('limpia corchetes y signos en la superficie dental', () => {
      const res = parseSurfaces('[OD]');
      expect(res?.code).toBe('OD');
    });

    it('retorna null para caracteres que no corresponden a superficies dentales', () => {
      expect(parseSurfaces('XYZ')).toBeNull();
      expect(parseSurfaces('K')).toBeNull();
      expect(parseSurfaces('ABCDEF')).toBeNull();
      expect(parseSurfaces('')).toBeNull();
    });
  });

  describe('parseQuickTreatment', () => {
    it('retorna valores por defecto cuando la entrada está vacía', () => {
      const res = parseQuickTreatment('   ');
      expect(res.raw).toBe('');
      expect(res.pieza_fdi).toBeNull();
      expect(res.procedimiento).toBe('Atención odontológica general');
      expect(res.duracion_minutos).toBe(30);
    });

    it('parsea correctamente "11 Caries"', () => {
      const res = parseQuickTreatment('11 Caries');
      expect(res.pieza_fdi).toBe(11);
      expect(res.diente_nombre).toContain('Incisivo Central Superior Derecho');
      expect(res.diagnostico).toBe('Caries dental');
      expect(res.cie10).toBe(CIE10_CATALOG.CARIES.code);
      expect(res.procedimiento).toBe('Obturación de caries');
      expect(res.duracion_minutos).toBe(30);
      expect(res.descripcion_clinica).toContain('Pieza 11');
    });

    it('parsea correctamente "1A Caries" convirtiéndolo a FDI 11', () => {
      const res = parseQuickTreatment('1A Caries');
      expect(res.pieza_fdi).toBe(11);
      expect(res.diagnostico).toBe('Caries dental');
      expect(res.cie10).toBe(CIE10_CATALOG.CARIES.code);
    });

    it('parsea correctamente "24 OD Resina" con superficies y CIE-10 dentina', () => {
      const res = parseQuickTreatment('24 OD Resina');
      expect(res.pieza_fdi).toBe(24);
      expect(res.superficie).toBe('OD');
      expect(res.superficies_detalle).toEqual(['Oclusal', 'Distal']);
      expect(res.cie10).toBe(CIE10_CATALOG.CARIES_DENTINA.code);
      expect(res.procedimiento).toBe('Restauración con resina compuesta (OD)');
      expect(res.duracion_minutos).toBe(30);
    });

    it('parsea "36 MOD Amalgama" y asigna 45 minutos por ser superficie múltiple', () => {
      const res = parseQuickTreatment('36 MOD Amalgama');
      expect(res.pieza_fdi).toBe(36);
      expect(res.superficie).toBe('MOD');
      expect(res.cie10).toBe(CIE10_CATALOG.CARIES_DENTINA.code);
      expect(res.procedimiento).toBe('Restauración con amalgama de plata (MOD)');
      expect(res.duracion_minutos).toBe(45);
    });

    it('asigna 45 minutos a restauraciones con resina en más de 2 superficies', () => {
      const res = parseQuickTreatment('16 MOD Resina');
      expect(res.duracion_minutos).toBe(45);
    });

    it('parsea "16 Endodoncia" asociando CIE-10 K04.0 y 60 minutos', () => {
      const res = parseQuickTreatment('16 Endodoncia');
      expect(res.pieza_fdi).toBe(16);
      expect(res.cie10).toBe(CIE10_CATALOG.PULPITIS.code);
      expect(res.procedimiento).toBe('Tratamiento de conducto (Endodoncia)');
      expect(res.duracion_minutos).toBe(60);
    });

    it('parsea "48 Exodoncia" asociando CIE-10 K08.1 y 60 minutos', () => {
      const res = parseQuickTreatment('48 Exodoncia');
      expect(res.pieza_fdi).toBe(48);
      expect(res.cie10).toBe(CIE10_CATALOG.EXTRACCION.code);
      expect(res.procedimiento).toBe('Exodoncia dental');
      expect(res.duracion_minutos).toBe(60);
    });

    it('parsea profilaxis y limpieza dental asociando CIE-10 K05.1', () => {
      const res = parseQuickTreatment('Limpieza profiláctica');
      expect(res.cie10).toBe(CIE10_CATALOG.GINGIVITIS.code);
      expect(res.procedimiento).toBe('Profilaxis y destartraje dental');
      expect(res.duracion_minutos).toBe(30);
    });

    it('parsea aplicación de sellantes de fosas y fisuras', () => {
      const res = parseQuickTreatment('16 O Sellante');
      expect(res.pieza_fdi).toBe(16);
      expect(res.superficie).toBe('O');
      expect(res.procedimiento).toBe('Aplicación de sellante de fosas y fisuras (O)');
    });

    it('maneja procedimientos sin pieza dental específica pero con superficie', () => {
      const res = parseQuickTreatment('OD Resina');
      expect(res.pieza_fdi).toBeNull();
      expect(res.superficie).toBe('OD');
      expect(res.descripcion_clinica).toContain('Superficie [OD]');
    });

    it('maneja procedimiento general sin nomenclatura reconocida', () => {
      const res = parseQuickTreatment('Consulta regular');
      expect(res.procedimiento).toBe('Consulta regular');
      expect(res.duracion_minutos).toBe(30);
    });
  });
});
