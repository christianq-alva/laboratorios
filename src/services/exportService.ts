import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import dayjs from 'dayjs'

export interface ExportOptions {
  filename?: string
  laboratorioNombre?: string
  semanaInicio?: Date
  format?: 'png' | 'pdf'
  includeHeader?: boolean
  quality?: number
}

export const exportService = {
  // Exportar calendario como imagen PNG
  exportAsImage: async (elementId: string, options: ExportOptions = {}) => {
    try {
      const element = document.getElementById(elementId)
      if (!element) {
        throw new Error('Elemento no encontrado')
      }

      console.log('📸 Capturando calendario como imagen...')

      // Configurar opciones de captura
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: options.quality || 2, // Mayor calidad
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: element.scrollWidth,
        height: element.scrollHeight,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      })

      // Generar nombre de archivo
      const fecha = options.semanaInicio ? dayjs(options.semanaInicio).format('DD-MM-YYYY') : dayjs().format('DD-MM-YYYY')
      const laboratorio = options.laboratorioNombre ? options.laboratorioNombre.replace(/[^a-zA-Z0-9]/g, '_') : 'Calendario'
      const filename = options.filename || `${laboratorio}_Semana_${fecha}.png`

      // Descargar imagen
      const link = document.createElement('a')
      link.download = filename
      link.href = canvas.toDataURL('image/png')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      console.log('✅ Imagen descargada:', filename)
      return { success: true, filename }

    } catch (error) {
      console.error('❌ Error al exportar imagen:', error)
      throw new Error('Error al generar imagen del calendario')
    }
  },

  // Exportar calendario como PDF
  exportAsPDF: async (elementId: string, options: ExportOptions = {}) => {
    try {
      const element = document.getElementById(elementId)
      if (!element) {
        throw new Error('Elemento no encontrado')
      }

      console.log('📄 Generando PDF del calendario...')

      // Capturar como canvas primero
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 1.5, // Buena calidad para PDF
        useCORS: true,
        allowTaint: true,
        logging: false
      })

      // Crear PDF
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'landscape', // Horizontal para mejor vista del calendario
        unit: 'mm',
        format: 'a4'
      })

      // Calcular dimensiones para ajustar al PDF
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
      const finalWidth = imgWidth * ratio
      const finalHeight = imgHeight * ratio

      // Centrar imagen en la página
      const x = (pdfWidth - finalWidth) / 2
      const y = (pdfHeight - finalHeight) / 2

      // Agregar header si se solicita
      if (options.includeHeader !== false) {
        pdf.setFontSize(16)
        pdf.setFont('helvetica', 'bold')
        
        const titulo = options.laboratorioNombre 
          ? `Horarios - ${options.laboratorioNombre}`
          : 'Calendario Semanal'
        
        const fecha = options.semanaInicio 
          ? `Semana del ${dayjs(options.semanaInicio).format('DD/MM/YYYY')} al ${dayjs(options.semanaInicio).add(6, 'day').format('DD/MM/YYYY')}`
          : `Generado el ${dayjs().format('DD/MM/YYYY HH:mm')}`

        pdf.text(titulo, pdfWidth / 2, 15, { align: 'center' })
        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'normal')
        pdf.text(fecha, pdfWidth / 2, 25, { align: 'center' })
        
        // Ajustar posición de la imagen para dejar espacio al header
        const adjustedY = y + 15
        const adjustedHeight = finalHeight - 15
        pdf.addImage(imgData, 'PNG', x, adjustedY, finalWidth, adjustedHeight)
      } else {
        pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight)
      }

      // Generar nombre de archivo
      const fecha = options.semanaInicio ? dayjs(options.semanaInicio).format('DD-MM-YYYY') : dayjs().format('DD-MM-YYYY')
      const laboratorio = options.laboratorioNombre ? options.laboratorioNombre.replace(/[^a-zA-Z0-9]/g, '_') : 'Calendario'
      const filename = options.filename || `${laboratorio}_Semana_${fecha}.pdf`

      // Descargar PDF
      pdf.save(filename)

      console.log('✅ PDF descargado:', filename)
      return { success: true, filename }

    } catch (error) {
      console.error('❌ Error al exportar PDF:', error)
      throw new Error('Error al generar PDF del calendario')
    }
  },

  // Preparar elemento para exportación (optimizar estilos)
  prepareForExport: (elementId: string) => {
    const element = document.getElementById(elementId)
    if (!element) return null

    // Guardar estilos originales
    const originalStyles = {
      maxHeight: element.style.maxHeight,
      overflow: element.style.overflow
    }

    // Aplicar estilos para exportación
    element.style.maxHeight = 'none'
    element.style.overflow = 'visible'

    // Asegurar que todas las imágenes estén cargadas
    const images = element.querySelectorAll('img')
    const imagePromises = Array.from(images).map(img => {
      if (img.complete) return Promise.resolve()
      return new Promise((resolve) => {
        img.onload = () => resolve(true)
        img.onerror = () => resolve(true)
      })
    })

    return {
      originalStyles,
      restore: () => {
        element.style.maxHeight = originalStyles.maxHeight
        element.style.overflow = originalStyles.overflow
      },
      imagePromises
    }
  },

  // Generar vista previa antes de exportar
  generatePreview: async (elementId: string): Promise<string> => {
    try {
      const element = document.getElementById(elementId)
      if (!element) {
        throw new Error('Elemento no encontrado')
      }

      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 0.5, // Baja calidad para preview rápido
        useCORS: true,
        allowTaint: true,
        logging: false
      })

      return canvas.toDataURL('image/png')
    } catch (error) {
      console.error('Error al generar preview:', error)
      throw error
    }
  }
}
