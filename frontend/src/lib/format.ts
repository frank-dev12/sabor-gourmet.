const moneda = new Intl.NumberFormat("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function formatMoney(valor: number): string {
  return `$ ${moneda.format(valor)}`;
}

// Las fechas del backend son LocalDateTime sin zona ("2026-12-20T20:00:00"): se tratan como texto
// para no introducir desfases de zona horaria al convertirlas a Date.

export function formatHora(fechaHora: string): string {
  return fechaHora.slice(11, 16);
}

export function formatFechaHora(fechaHora: string): string {
  const [anio, mes, dia] = fechaHora.slice(0, 10).split("-");
  return `${dia}/${mes}/${anio} ${formatHora(fechaHora)}`;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toLocalDateTime(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

export function hoyISO(): string {
  return toLocalDateTime(new Date()).slice(0, 10);
}

/** Combina fecha (YYYY-MM-DD) y hora (HH:mm) y devuelve inicio/fin como LocalDateTime; el fin puede pasar al día siguiente. */
export function rangoHorario(fecha: string, hora: string, duracionMin: number): { inicio: string; fin: string } {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  const [hh, mm] = hora.split(":").map(Number);
  const inicio = new Date(anio, mes - 1, dia, hh, mm);
  const fin = new Date(inicio.getTime() + duracionMin * 60_000);
  return { inicio: toLocalDateTime(inicio), fin: toLocalDateTime(fin) };
}
