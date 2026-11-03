export interface ProfilaxisVencidaItem {
  patient: {
    id: string;
    nombre: string;
    telefono: string;
  };
  ultima_profilaxis: string;
  fecha_vencimiento: string;
  dias_atraso: number;
  reagendado: boolean;
  proxima_cita: string | null;
}
