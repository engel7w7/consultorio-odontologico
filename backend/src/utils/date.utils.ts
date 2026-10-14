/**
 * Utilidades para manejo de fechas y zonas horarias en el Consultorio Odontológico.
 * La zona horaria oficial del consultorio es America/La_Paz (UTC-4, sin horario de verano).
 */

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD según la zona horaria America/La_Paz.
 */
export function getTodayDateStringLaPaz(now: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/La_Paz',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(now);
}

/**
 * Calcula el rango de tiempo [inicio, fin) en UTC para un día completo (00:00:00 a 24:00:00)
 * en la zona horaria America/La_Paz (UTC-4).
 * 
 * Si no se pasa el parámetro `dateStr`, se utiliza el día actual en America/La_Paz.
 * 
 * @param dateStr Fecha en formato 'YYYY-MM-DD' (opcional)
 * @returns Objeto con `{ start: Date, end: Date }` en UTC listos para filtrar en base de datos.
 */
export function getDayRangeUTC(dateStr?: string): { start: Date; end: Date } {
  let targetDate = dateStr;

  if (!targetDate) {
    targetDate = getTodayDateStringLaPaz();
  }

  const [yearStr, monthStr, dayStr] = targetDate.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);

  // Supuesto: Bolivia (America/La_Paz) no tiene horario de verano (DST),
  // por lo que el huso horario se mantiene constante en UTC-4 todo el año
  // y el desfase fijo de +4 horas respecto a UTC es siempre válido.
  // Inicio del día (00:00:00 local) -> 04:00:00 UTC del mismo día.
  const start = new Date(Date.UTC(year, month, day, 4, 0, 0, 0));

  // Fin del día (24:00:00 local = 00:00:00 del día siguiente local) -> 04:00:00 UTC del día siguiente.
  const end = new Date(Date.UTC(year, month, day + 1, 4, 0, 0, 0));

  return { start, end };
}
