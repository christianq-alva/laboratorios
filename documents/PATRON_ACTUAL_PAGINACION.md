# Patrón Actual de Paginación - Frontend

## Descripción General

El sistema implementa **paginación en cliente (client-side pagination)** en todas las tablas del frontend. Esto significa que:

- Los datos completos (o filtrados por API) se cargan una vez desde el backend
- La paginación se realiza en el navegador usando el método `slice()` de JavaScript
- No se envían parámetros `page`, `limit` u `offset` a la API
- El componente `TablePagination` de Material-UI maneja la UI de paginación

## Componentes con Paginación Implementada

### Tablas Principales
1. **IncidenciasTable** (`src/components/Incidencias/IncidenciasTable.tsx`)
2. **EquiposTable** (`src/components/Equipos/EquiposTable.tsx`)
3. **HorariosTable** (`src/components/Horarios/HorariosTable.tsx`)
4. **InventarioTable** (`src/components/Insumos/InventarioTable.tsx`)
5. **CatalogoInsumosTable** (`src/components/Configuracion/Insumos/CatalogoInsumosTable.tsx`)
6. **LaboratoriosTable** (`src/components/Configuracion/Laboratorios/LaboratoriosTable.tsx`)
7. **DocentesTable** (`src/components/Configuracion/Docentes/DocentesTable.tsx`)
8. **UsuariosTable** (`src/components/Configuracion/Usuarios/UsuariosTable.tsx`)
9. **UnidadesTable** (`src/components/Configuracion/Unidades/UnidadesTable.tsx`)
10. **TiposEquipoTable** (`src/components/Configuracion/TipoEquipo/TiposEquipoTable.tsx`)
11. **EscuelasTable** (`src/components/Configuracion/Escuela/EscuelasTable.tsx`)

### Componentes de Actividad
12. **ActividadHorarios** (`src/components/Horarios/ActividadHorarios.tsx`)
13. **ActividadEquipos** (`src/components/Equipos/ActividadEquipos.tsx`)
14. **ActividadInsumos** (`src/components/Insumos/ActividadInsumos.tsx`)
15. **DetalleMovimientosModal** (`src/components/Insumos/DetalleMovimientosModal.tsx`)

## Estructura Común del Patrón

### 1. Estados de Paginación

```typescript
// Paginación
const [page, setPage] = useState(0)
const [rowsPerPage, setRowsPerPage] = useState(10)
```

- `page`: Página actual (índice base 0)
- `rowsPerPage`: Número de filas por página (por defecto 10)

### 2. Funciones de Manejo de Paginación

```typescript
// Funciones para manejar la paginación
const handleChangePage = (_event: unknown, newPage: number) => {
  setPage(newPage)
}

const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
  setRowsPerPage(parseInt(event.target.value, 10))
  setPage(0) // Resetear a la primera página cuando cambia el tamaño
}
```

### 3. Cálculo de Datos Paginados

```typescript
// Calcular los items a mostrar según la página actual
const paginatedItems = filteredItems.slice(
  page * rowsPerPage,
  page * rowsPerPage + rowsPerPage
)
```

**Nota importante**: Se usa la lista **filtrada** (`filteredItems`) si hay filtros en cliente, o la lista completa si los filtros se aplican en el backend.

### 4. Reset de Página

La página debe resetearse a 0 cuando:
- Cambian los filtros
- Cambia el término de búsqueda
- Se recargan los datos desde la API

```typescript
// Ejemplo: Reset al cambiar búsqueda
<TextField
  value={searchTerm}
  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setPage(0) // Resetear a la primera página
  }}
/>

// Ejemplo: Reset al cambiar filtros
// Opción 1: Reset en el useEffect antes de llamar la función
useEffect(() => {
  setPage(0)
  fetchData()
}, [filters])

// Opción 2: Reset dentro de la función de carga (si se llama desde múltiples lugares)
const loadData = async () => {
  setLoading(true)
  setError(null)
  setPage(0) // Resetear página al cargar datos
  // ... resto del código
}

// Ejemplo: Reset al limpiar filtros
const handleClearFilters = () => {
  setFilters({ /* valores por defecto */ })
  setPage(0)
}
```

### 5. Componente TablePagination

```typescript
import { TablePagination } from '@mui/material'

// Dentro del TableContainer, después del Table
<TablePagination
  rowsPerPageOptions={[5, 10, 25, 50]}
  component="div"
  count={filteredItems.length}  // Total de items (filtrados o completos)
  rowsPerPage={rowsPerPage}
  page={page}
  onPageChange={handleChangePage}
  onRowsPerPageChange={handleChangeRowsPerPage}
  labelRowsPerPage="Filas por página:"
  labelDisplayedRows={({ from, to, count }) =>
    `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
  }
/>
```

**Propiedades importantes**:
- `count`: Debe ser el total de items en la lista (filtrada si aplica). Puede ser un valor directo (`filteredItems.length`) o una función que lo calcule (`getTotalCount()`)
- `rowsPerPageOptions`: Opciones estándar [5, 10, 25, 50]
- `labelRowsPerPage`: Texto en español
- `labelDisplayedRows`: Formato personalizado del rango mostrado. Formato estándar: `` `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}` ``. Puede personalizarse agregando el tipo de entidad (ej: "insumos" en `InventarioTable`)

**Ejemplo con función auxiliar** (usado en `InventarioTable`):
```typescript
const getTotalCount = () => {
  return filteredInsumos.length
}

<TablePagination
  count={getTotalCount()}
  // ...
/>
```

### 6. Renderizado de Datos

```typescript
// Usar la lista paginada en lugar de la lista completa/filtrada
{paginatedItems.map((item) => (
  <TableRow key={item.id}>
    {/* Contenido de la fila */}
  </TableRow>
))}
```

## Ejemplo Completo

```typescript
import React, { useState, useEffect } from 'react'
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  TextField,
} from '@mui/material'

export const MiTabla: React.FC = () => {
  const [items, setItems] = useState<Item[]>([])
  const [filteredItems, setFilteredItems] = useState<Item[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  
  // Paginación
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // Cargar datos
  useEffect(() => {
    loadData()
  }, [])

  // Aplicar filtros
  useEffect(() => {
    let filtered = items
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(item =>
        item.nombre.toLowerCase().includes(searchLower)
      )
    }
    setFilteredItems(filtered)
    setPage(0) // Resetear página al filtrar
  }, [items, searchTerm])

  // Nota: También se puede resetear en el onChange del TextField
  // Ambas formas son válidas, pero resetear en el useEffect asegura
  // que siempre se resetee cuando cambian los datos base o el término

  // Funciones de paginación
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  // Calcular items paginados
  const paginatedItems = filteredItems.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  )

  return (
    <Box>
      {/* Búsqueda */}
      <TextField
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value)
          setPage(0)
        }}
      />

      {/* Tabla */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.nombre}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {/* Paginación */}
        {filteredItems.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredItems.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
            }
          />
        )}
      </TableContainer>
    </Box>
  )
}
```

## Casos Especiales

### Tablas con Filtros en Backend

Cuando los filtros se aplican en el backend (ej: `HorariosTable`, `EquiposTable`), la lista ya viene filtrada desde la API:

```typescript
// Los filtros se envían al backend
const fetchHorarios = async () => {
  const result = await execute(() => horarioService.getAll(filters))
  setHorarios(result.data.data || []) // Ya viene filtrado
}

// Reset de página cuando cambian los filtros (en useEffect)
useEffect(() => {
  setPage(0)
  fetchHorarios()
}, [filters])

// La paginación se aplica sobre la lista filtrada
const paginatedHorarios = horarios.slice(
  page * rowsPerPage,
  page * rowsPerPage + rowsPerPage
)

// El count es el total de la lista filtrada
<TablePagination
  count={horarios.length}  // Lista ya filtrada desde API
  // ...
/>
```

**Nota**: En este caso, el reset de página se hace en el `useEffect` que detecta cambios en los filtros, antes de llamar a la función que carga los datos.

### Tablas con Filtros en Cliente

Cuando los filtros se aplican en el cliente (ej: `InventarioTable`, `CatalogoInsumosTable`):

```typescript
// Se mantiene la lista completa y una lista filtrada
const [items, setItems] = useState<Item[]>([])
const [filteredItems, setFilteredItems] = useState<Item[]>([])

// Los filtros se aplican en useEffect
useEffect(() => {
  let filtered = items
  // Aplicar filtros...
  setFilteredItems(filtered)
  setPage(0) // Resetear página
}, [items, filters])

// La paginación se aplica sobre filteredItems
const paginatedItems = filteredItems.slice(...)

// El count es filteredItems.length
<TablePagination count={filteredItems.length} />
```

### Componentes de Actividad (Modales)

Los componentes de actividad (`ActividadHorarios`, `ActividadEquipos`, `ActividadInsumos`) son modales que cargan datos cuando se abren:

```typescript
const loadActividad = async () => {
  setLoading(true)
  setError(null)
  setPage(0) // Resetear página al cargar

  const result = await execute(() => servicio.getActividad(filters))
  setActividad(result.data.data)
  setLoading(false)
}

// Resetear página al aplicar filtros
const handleApplyFilters = () => {
  loadActividad() // loadActividad ya resetea la página internamente
}

// Resetear página al limpiar filtros
const handleClearFilters = () => {
  setFilters({ /* valores por defecto */ })
  setPage(0) // También resetear aquí para consistencia
}
```

**Nota**: En estos componentes, el reset de página se hace dentro de `loadActividad()` porque esta función se llama desde múltiples lugares (apertura del modal, aplicar filtros, actualizar).

**Variación**: En `DetalleMovimientosModal`, el reset se hace en el `useEffect` después de cargar los datos:

```typescript
useEffect(() => {
  if (open && insumo) {
    loadMovimientos()
    setPage(0) // Reset después de cargar
  }
}, [open, insumo, loadMovimientos])
```

Ambos patrones son válidos; elige el que mejor se adapte a tu caso de uso.

## Buenas Prácticas

1. **Siempre resetear página al filtrar**: Cuando cambian filtros o búsqueda, resetear `page` a 0
2. **Usar lista filtrada para paginación**: Si hay filtros en cliente, paginar sobre `filteredItems`, no sobre `items`
3. **Count correcto**: El `count` del `TablePagination` debe ser el total de items que se están paginando
4. **Opciones consistentes**: Usar siempre `rowsPerPageOptions={[5, 10, 25, 50]}`
5. **Labels en español**: Usar `labelRowsPerPage="Filas por página:"`
6. **Condicional para TablePagination**: Solo mostrar si hay items (`{filteredItems.length > 0 && <TablePagination ... />}`)

## Consideraciones de Rendimiento

### Ventajas
- ✅ Respuesta inmediata al cambiar de página (sin llamadas a API)
- ✅ Funciona offline una vez cargados los datos
- ✅ Menor carga en el servidor

### Limitaciones
- ⚠️ Todos los datos deben cargarse en memoria
- ⚠️ Puede ser lento con listas muy grandes (>1000 items)
- ⚠️ No escalable para grandes volúmenes de datos

### Cuándo Considerar Paginación en Servidor

Si una tabla tiene potencial de crecer mucho (>500-1000 registros), considerar migrar a paginación en servidor:
- Enviar `page` y `limit` al backend
- El backend devuelve solo los registros de la página solicitada
- El backend devuelve el `total` de registros para el `count`

## Checklist de Implementación

Al agregar paginación a una nueva tabla:

- [ ] Importar `TablePagination` de `@mui/material`
- [ ] Agregar estados `page` y `rowsPerPage`
- [ ] Crear funciones `handleChangePage` y `handleChangeRowsPerPage`
- [ ] Calcular lista paginada con `slice()`
- [ ] Resetear `page` a 0 cuando cambian filtros/búsqueda
- [ ] Usar lista paginada en el `map()` del `TableBody`
- [ ] Agregar `TablePagination` dentro del `TableContainer`
- [ ] Configurar `count` con el total correcto (filtrado si aplica)
- [ ] Usar opciones estándar `[5, 10, 25, 50]`
- [ ] Agregar labels en español

## Referencias

- Componentes de ejemplo:
  - `src/components/Incidencias/IncidenciasTable.tsx` (filtros en cliente)
  - `src/components/Horarios/HorariosTable.tsx` (filtros en backend)
  - `src/components/Horarios/ActividadHorarios.tsx` (modal con actividad)

- Documentación Material-UI: https://mui.com/material-ui/react-pagination/#table-pagination
