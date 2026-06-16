import * as XLSX from 'xlsx'
import dayjs from 'dayjs'
import type { Insumo } from '../../../services/insumoService'

type FilaCatalogo = {
  CODIGO: string
  NOMBRE: string
  PRECIO: number | ''
}

export const exportCatalogoInsumosToExcel = (insumos: Insumo[]): void => {
  const ordenados = [...insumos].sort((a, b) =>
    a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
  )

  const filas: FilaCatalogo[] = ordenados.map((insumo) => ({
    CODIGO: insumo.codigo ?? '',
    NOMBRE: insumo.nombre,
    PRECIO: insumo.precio_unitario != null ? Number(insumo.precio_unitario) : '',
  }))

  const ws = XLSX.utils.json_to_sheet(filas, {
    header: ['CODIGO', 'NOMBRE', 'PRECIO'],
  })

  ws['!cols'] = [{ wch: 14 }, { wch: 50 }, { wch: 14 }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Catálogo')

  const fileName = `catalogo_insumos_${dayjs().format('YYYY-MM-DD')}.xlsx`
  XLSX.writeFile(wb, fileName)
}
