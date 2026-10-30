const BOLIVIA_COUNTRY_CODE = '591';

export function normalizeWhatsAppPhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;

  const withoutInternationalPrefix = digits.startsWith('00')
    ? digits.slice(2)
    : digits;
  const normalized = withoutInternationalPrefix.startsWith(BOLIVIA_COUNTRY_CODE)
    ? withoutInternationalPrefix
    : withoutInternationalPrefix.length === 8
      ? `${BOLIVIA_COUNTRY_CODE}${withoutInternationalPrefix}`
      : null;

  return normalized && normalized.length >= 11 ? normalized : null;
}

export function buildWhatsAppReminderUrl(
  phone: string,
  patientName: string,
  start: string,
  motivo: string
): string | null {
  const normalizedPhone = normalizeWhatsAppPhone(phone);
  if (!normalizedPhone) return null;

  const date = new Intl.DateTimeFormat('es-BO', {
    timeZone: 'America/La_Paz',
    dateStyle: 'long',
  }).format(new Date(start));
  const time = new Intl.DateTimeFormat('es-BO', {
    timeZone: 'America/La_Paz',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(start));
  const message = `Hola ${patientName}, le recordamos su cita odontológica el ${date} a las ${time}. Motivo: ${motivo}.`;

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}
