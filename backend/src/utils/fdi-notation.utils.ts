/**
 * Utilidades de Nomenclatura Rápida Odontológica (HU-09)
 * Estándares: ISO 3950 (FDI de dos dígitos), CIE-10 (K00-K14) y SNODENT.
 */

export interface ToothInfo {
  fdi: number;
  nombre: string;
  cuadrante: string;
  tipo: 'PERMANENTE' | 'TEMPORAL';
}

const TOOTH_NAMES: Record<number, string> = {
  1: 'Incisivo Central',
  2: 'Incisivo Lateral',
  3: 'Canino',
  4: 'Primer Premolar',
  5: 'Segundo Premolar',
  6: 'Primer Molar',
  7: 'Segundo Molar',
  8: 'Tercer Molar',
};

const TEMPORAL_NAMES: Record<number, string> = {
  1: 'Incisivo Central Temporal',
  2: 'Incisivo Lateral Temporal',
  3: 'Canino Temporal',
  4: 'Primer Molar Temporal',
  5: 'Segundo Molar Temporal',
};

export const FDI_TEETH: Record<number, ToothInfo> = {};

// Cuadrantes permanentes (1 al 4)
const QUADRANT_NAMES_PERM: Record<number, string> = {
  1: 'Superior Derecho',
  2: 'Superior Izquierdo',
  3: 'Inferior Izquierdo',
  4: 'Inferior Derecho',
};

for (let q = 1; q <= 4; q++) {
  for (let p = 1; p <= 8; p++) {
    const fdi = q * 10 + p;
    FDI_TEETH[fdi] = {
      fdi,
      nombre: `${TOOTH_NAMES[p]} ${QUADRANT_NAMES_PERM[q]}`,
      cuadrante: QUADRANT_NAMES_PERM[q],
      tipo: 'PERMANENTE',
    };
  }
}

// Cuadrantes temporales (5 al 8)
const QUADRANT_NAMES_TEMP: Record<number, string> = {
  5: 'Superior Derecho Temporal',
  6: 'Superior Izquierdo Temporal',
  7: 'Inferior Izquierdo Temporal',
  8: 'Inferior Derecho Temporal',
};

for (let q = 5; q <= 8; q++) {
  for (let p = 1; p <= 5; p++) {
    const fdi = q * 10 + p;
    FDI_TEETH[fdi] = {
      fdi,
      nombre: `${TEMPORAL_NAMES[p]} ${QUADRANT_NAMES_TEMP[q]}`,
      cuadrante: QUADRANT_NAMES_TEMP[q],
      tipo: 'TEMPORAL',
    };
  }
}

export const DENTAL_SURFACES: Record<string, string> = {
  O: 'Oclusal',
  M: 'Mesial',
  D: 'Distal',
  V: 'Vestibular',
  B: 'Bucal',
  P: 'Palatino',
  L: 'Lingual',
  I: 'Incisal',
};

export const CIE10_CATALOG: Record<string, { code: string; label: string }> = {
  CARIES: { code: 'K02.9', label: 'Caries dental' },
  CARIES_ESMALTE: { code: 'K02.0', label: 'Caries limitada al esmalte' },
  CARIES_DENTINA: { code: 'K02.1', label: 'Caries de la dentina' },
  PULPITIS: { code: 'K04.0', label: 'Pulpitis' },
  NECROSIS: { code: 'K04.1', label: 'Necrosis de la pulpa' },
  PERIODONTITIS_APICAL: { code: 'K04.4', label: 'Periodontitis apical' },
  GINGIVITIS: { code: 'K05.1', label: 'Gingivitis' },
  PERIODONTITIS: { code: 'K05.3', label: 'Periodontitis crónica' },
  EXTRACCION: { code: 'K08.1', label: 'Pérdida/Extracción dental' },
  FRACTURA: { code: 'S02.5', label: 'Fractura dental' },
};

export interface ParsedTreatment {
  raw: string;
  pieza_fdi: number | null;
  diente_nombre: string | null;
  cuadrante: string | null;
  superficie: string | null;
  superficies_detalle: string[];
  diagnostico: string | null;
  cie10: string | null;
  procedimiento: string;
  duracion_minutos: number;
  descripcion_clinica: string;
}

/**
 * Convierte notación cuadrante-letra (ej. 1A, 2D, 3F, 4H) o número FDI (11-48, 51-85) a código FDI.
 */
export function resolveFdiTooth(token: string): number | null {
  const clean = token.toUpperCase().replace(/[()[\].,-]/g, '').trim();
  // 1. Direct 2-digit FDI number
  const num = parseInt(clean, 10);
  if (!isNaN(num) && FDI_TEETH[num]) {
    return num;
  }

  // 2. Format 1A, 2A, 1B etc. (A=1, B=2, C=3, D=4, E=5, F=6, G=7, H=8)
  const letterMatch = clean.match(/^([1-8])([A-H])$/);
  if (letterMatch) {
    const quadrant = parseInt(letterMatch[1], 10);
    const letterCode = letterMatch[2].charCodeAt(0) - 64; // A -> 1, B -> 2...
    const calculatedFdi = quadrant * 10 + letterCode;
    if (FDI_TEETH[calculatedFdi]) {
      return calculatedFdi;
    }
  }

  return null;
}

/**
 * Analiza un conjunto de caracteres para determinar si representa superficies dentales válidas.
 * Ejemplos: OD, MOD, O, V, P, L, MO, DO, B, MODV.
 */
export function parseSurfaces(token: string): { code: string; nombres: string[] } | null {
  const clean = token.toUpperCase().replace(/[()[\].,-]/g, '').trim();
  if (!clean || clean.length > 5) return null;

  // Letras válidas para superficies dentales
  const validLetters = ['O', 'M', 'D', 'V', 'B', 'P', 'L', 'I'];
  const chars = clean.split('');
  const allValid = chars.every((c) => validLetters.includes(c));
  if (!allValid) return null;

  // Evitar falsos positivos con palabras cortas si no parecen caras dentales
  const uniqueChars = Array.from(new Set(chars));
  const nombres = uniqueChars.map((c) => DENTAL_SURFACES[c] || c);
  return {
    code: clean,
    nombres,
  };
}

/**
 * Parsea una entrada de nomenclatura rápida (HU-09).
 * Ejemplos:
 * - "11 Caries"
 * - "1A Caries"
 * - "24 OD Resina"
 * - "36 MOD Amalgama"
 * - "48 Exodoncia"
 * - "16 Endodoncia"
 */
export function parseQuickTreatment(rawInput: string): ParsedTreatment {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return {
      raw: '',
      pieza_fdi: null,
      diente_nombre: null,
      cuadrante: null,
      superficie: null,
      superficies_detalle: [],
      diagnostico: null,
      cie10: null,
      procedimiento: 'Atención odontológica general',
      duracion_minutos: 30,
      descripcion_clinica: 'Atención odontológica general',
    };
  }

  const tokens = trimmed.split(/\s+/);
  let piezaFdi: number | null = null;
  let superficie: string | null = null;
  let superficiesDetalle: string[] = [];
  const remainingTokens: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    // Intentar reconocer pieza dental si aún no se ha detectado
    if (piezaFdi === null) {
      const tooth = resolveFdiTooth(token);
      if (tooth !== null) {
        piezaFdi = tooth;
        continue;
      }
    }

    // Intentar reconocer superficie si ya hay pieza o parece superficie (letras O,M,D,V,P,L)
    const stripped = token.replace(/[()[\].,-]/g, '');
    if (superficie === null && /^[OMDVBPLIomdvbpli]{1,5}$/.test(stripped) && stripped.length <= 4) {
      const parsedSurf = parseSurfaces(token);
      if (parsedSurf) {
        superficie = parsedSurf.code;
        superficiesDetalle = parsedSurf.nombres;
        continue;
      }
    }

    remainingTokens.push(token);
  }

  const actionText = remainingTokens.join(' ');
  const toothInfo = piezaFdi !== null ? FDI_TEETH[piezaFdi] : null;

  // Identificar diagnóstico y CIE-10
  let cie10: string | null = null;
  let diagnostico: string | null = null;
  let procedimiento = actionText || 'Consulta odontológica';
  let duracionMinutos = 30;

  const lowerAction = actionText.toLowerCase();

  if (/caries/i.test(lowerAction)) {
    cie10 = superficie ? CIE10_CATALOG.CARIES_DENTINA.code : CIE10_CATALOG.CARIES.code;
    diagnostico = 'Caries dental';
    if (!/resina|amalgama|obturaci|restauraci/i.test(lowerAction)) {
      procedimiento = `Obturación de caries${superficie ? ` (${superficie})` : ''}`;
    }
    duracionMinutos = superficie && superficie.length > 2 ? 45 : 30;
  }

  if (/resina/i.test(lowerAction)) {
    procedimiento = `Restauración con resina compuesta${superficie ? ` (${superficie})` : ''}`;
    if (!cie10) {
      cie10 = CIE10_CATALOG.CARIES_DENTINA.code;
      diagnostico = 'Caries dental / Cavidad';
    }
    duracionMinutos = superficie && superficie.length > 2 ? 45 : 30;
  }

  if (/amalgama/i.test(lowerAction)) {
    procedimiento = `Restauración con amalgama de plata${superficie ? ` (${superficie})` : ''}`;
    if (!cie10) {
      cie10 = CIE10_CATALOG.CARIES_DENTINA.code;
      diagnostico = 'Caries dental';
    }
    duracionMinutos = 45;
  }

  if (/endodoncia|conducto/i.test(lowerAction)) {
    cie10 = CIE10_CATALOG.PULPITIS.code;
    diagnostico = 'Pulpitis irreversible / Necrosis';
    procedimiento = 'Tratamiento de conducto (Endodoncia)';
    duracionMinutos = 60;
  }

  if (/extracc|exodoncia|cirug|quir[uú]rg/i.test(lowerAction)) {
    cie10 = CIE10_CATALOG.EXTRACCION.code;
    diagnostico = 'Indicación de exodoncia';
    procedimiento = 'Exodoncia dental';
    duracionMinutos = 60;
  }

  if (/profilaxis|limpieza|tartrectom/i.test(lowerAction)) {
    cie10 = CIE10_CATALOG.GINGIVITIS.code;
    diagnostico = 'Gingivitis marginal';
    procedimiento = 'Profilaxis y destartraje dental';
    duracionMinutos = 30;
  }

  if (/sellante/i.test(lowerAction)) {
    procedimiento = `Aplicación de sellante de fosas y fisuras${superficie ? ` (${superficie})` : ''}`;
    duracionMinutos = 30;
  }

  // Generar descripción clínica estándar
  const parts: string[] = [];
  if (toothInfo) {
    const surfText = superficie ? ` [${superficie}]` : '';
    parts.push(`Pieza ${toothInfo.fdi}${surfText} (${toothInfo.nombre})`);
  } else if (superficie) {
    parts.push(`Superficie [${superficie}]`);
  }

  parts.push(procedimiento);

  if (cie10) {
    parts.push(`(CIE-10: ${cie10})`);
  }

  const descripcionClinica = parts.join(' - ');

  return {
    raw: trimmed,
    pieza_fdi: piezaFdi,
    diente_nombre: toothInfo ? toothInfo.nombre : null,
    cuadrante: toothInfo ? toothInfo.cuadrante : null,
    superficie,
    superficies_detalle: superficiesDetalle,
    diagnostico,
    cie10,
    procedimiento,
    duracion_minutos: duracionMinutos,
    descripcion_clinica: descripcionClinica,
  };
}
