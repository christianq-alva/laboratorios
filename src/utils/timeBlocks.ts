// Definición de bloques de tiempo académicos
export interface TimeBlock {
  id: string
  label: string
  start: string
  end: string
  startMinutes: number // Minutos desde medianoche para facilitar comparaciones
  endMinutes: number
}

// Convertir hora string (HH:MM) a minutos desde medianoche
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

// Bloques de tiempo académicos estándar (Lunes a Domingo)
export const TIME_BLOCKS: TimeBlock[] = [
  { id: 'block-1', label: '1ra Hora', start: '07:30', end: '08:20', startMinutes: timeToMinutes('07:30'), endMinutes: timeToMinutes('08:20') },
  { id: 'block-2', label: '2da Hora', start: '08:25', end: '09:15', startMinutes: timeToMinutes('08:25'), endMinutes: timeToMinutes('09:15') },
  { id: 'block-3', label: '3ra Hora', start: '09:20', end: '10:10', startMinutes: timeToMinutes('09:20'), endMinutes: timeToMinutes('10:10') },
  { id: 'block-4', label: '4ta Hora', start: '10:20', end: '11:10', startMinutes: timeToMinutes('10:20'), endMinutes: timeToMinutes('11:10') },
  { id: 'block-5', label: '5ta Hora', start: '11:15', end: '12:05', startMinutes: timeToMinutes('11:15'), endMinutes: timeToMinutes('12:05') },
  { id: 'block-6', label: '6ta Hora', start: '12:10', end: '13:00', startMinutes: timeToMinutes('12:10'), endMinutes: timeToMinutes('13:00') },
  { id: 'block-7', label: '7ma Hora', start: '13:10', end: '14:00', startMinutes: timeToMinutes('13:10'), endMinutes: timeToMinutes('14:00') },
  { id: 'block-8', label: '8va Hora', start: '14:05', end: '14:55', startMinutes: timeToMinutes('14:05'), endMinutes: timeToMinutes('14:55') },
  { id: 'block-9', label: '9na Hora', start: '15:00', end: '15:50', startMinutes: timeToMinutes('15:00'), endMinutes: timeToMinutes('15:50') },
  { id: 'block-10', label: '10ma Hora', start: '16:00', end: '16:50', startMinutes: timeToMinutes('16:00'), endMinutes: timeToMinutes('16:50') },
  { id: 'block-11', label: '11va Hora', start: '16:55', end: '17:45', startMinutes: timeToMinutes('16:55'), endMinutes: timeToMinutes('17:45') },
  { id: 'block-12', label: '12va Hora', start: '17:50', end: '18:40', startMinutes: timeToMinutes('17:50'), endMinutes: timeToMinutes('18:40') },
  { id: 'block-13', label: '13va Hora', start: '18:45', end: '19:35', startMinutes: timeToMinutes('18:45'), endMinutes: timeToMinutes('19:35') },
  { id: 'block-14', label: '14va Hora', start: '19:40', end: '20:30', startMinutes: timeToMinutes('19:40'), endMinutes: timeToMinutes('20:30') },
]

// Función para obtener el label completo de un bloque
export const getBlockLabel = (block: TimeBlock): string => {
  return `${block.label} (${block.start} - ${block.end})`
}

// Función para encontrar bloques que se superponen con un rango de tiempo
export const findOverlappingBlocks = (startTime: string, endTime: string): TimeBlock[] => {
  const startMinutes = timeToMinutes(startTime)
  const endMinutes = timeToMinutes(endTime)
  
  return TIME_BLOCKS.filter(block => {
    // Un bloque se superpone si:
    // - El inicio del bloque está entre el rango
    // - El fin del bloque está entre el rango
    // - El bloque contiene completamente el rango
    return (
      (block.startMinutes >= startMinutes && block.startMinutes < endMinutes) ||
      (block.endMinutes > startMinutes && block.endMinutes <= endMinutes) ||
      (block.startMinutes <= startMinutes && block.endMinutes >= endMinutes)
    )
  })
}

// Función para obtener bloques entre dos bloques (inclusive)
export const getBlocksBetween = (startBlockId: string, endBlockId: string): TimeBlock[] => {
  const startIndex = TIME_BLOCKS.findIndex(b => b.id === startBlockId)
  const endIndex = TIME_BLOCKS.findIndex(b => b.id === endBlockId)
  
  if (startIndex === -1 || endIndex === -1) {
    return []
  }
  
  const fromIndex = Math.min(startIndex, endIndex)
  const toIndex = Math.max(startIndex, endIndex)
  
  return TIME_BLOCKS.slice(fromIndex, toIndex + 1)
}

// Función para formatear un rango de bloques
export const formatBlockRange = (blocks: TimeBlock[]): string => {
  if (blocks.length === 0) return ''
  if (blocks.length === 1) return getBlockLabel(blocks[0])
  
  const first = blocks[0]
  const last = blocks[blocks.length - 1]
  return `${first.start} - ${last.end} (${blocks.length} ${blocks.length === 1 ? 'hora' : 'horas'} académicas)`
}

// Función para combinar fecha con hora de bloque
export const combineDateWithTime = (date: string, time: string): string => {
  // date viene en formato YYYY-MM-DD
  // time viene en formato HH:MM
  return `${date}T${time}:00`
}
