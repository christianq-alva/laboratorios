import dayjs from 'dayjs'
import 'dayjs/locale/es'
import type { Granularidad } from '../../services/reporteService'

// Paleta compartida por las gráficas de reportes
export const CHART_COLORS = [
  '#1565C0', '#2E7D32', '#F57C00', '#6A1B9A',
  '#00838F', '#AD1457', '#558B2F', '#E65100',
]

// ── Formatters ──
export const formatS = (val: number | string) => `S/. ${Number(val).toFixed(2)}`
export const formatFecha = (f: string) => dayjs(f).format('DD/MM/YYYY')
export const formatHora = (f: string) => dayjs(f).format('HH:mm')
export const formatHoras = (h: number) => `${Number(h).toFixed(1)} h`

export const currentMonth = () => dayjs().format('YYYY-MM')
export const firstMonthOfYear = () => `${dayjs().year()}-01`

export const formatPeriodo = (periodo: string, g: Granularidad) => {
  const d = dayjs(periodo)
  if (g === 'dia') return d.format('DD/MM')
  if (g === 'semana') return `${d.format('DD/MM')}–${d.add(6, 'day').format('DD/MM')}`
  return d.locale('es').format('MMM YYYY')
}
