import * as XLSX from 'xlsx'
import dayjs from 'dayjs'
import type { Insumo } from '../../../services/insumoService'

type FilaCatalogo = {
  CODIGO: string
  NOMBRE: string
  PRESENTACION: string
  UNIDAD: string
  PRECIO: number | ''
  CANTIDAD_POR_PRESENTACION: number | ''
}

export const exportCatalogoInsumosToExcel = (insumos: Insumo[]): void => {
  const ordenados = [...insumos].sort((a, b) =>
    a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
  )

  const filas: FilaCatalogo[] = ordenados.map((insumo) => ({
    CODIGO: insumo.codigo ?? '',
    NOMBRE: insumo.nombre,
    PRESENTACION: insumo.presentacion ?? '',
    UNIDAD: insumo.unidad_simbolo ?? '',
    PRECIO: insumo.precio_unitario != null ? Number(insumo.precio_unitario) : '',
    CANTIDAD_POR_PRESENTACION:
      insumo.cantidad_por_presentacion != null ? Number(insumo.cantidad_por_presentacion) : '',
  }))

  const ws = XLSX.utils.json_to_sheet(filas, {
    header: ['CODIGO', 'NOMBRE', 'PRESENTACION', 'UNIDAD', 'PRECIO', 'CANTIDAD_POR_PRESENTACION'],
  })

  ws['!cols'] = [{ wch: 14 }, { wch: 50 }, { wch: 24 }, { wch: 10 }, { wch: 14 }, { wch: 26 }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Catálogo')

  const fileName = `catalogo_insumos_${dayjs().format('YYYY-MM-DD')}.xlsx`
  XLSX.writeFile(wb, fileName)
}
