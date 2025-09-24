import React from 'react'
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { Box, Typography, Card, CardContent } from '@mui/material'
import { formatearNumero, obtenerColoresGrafico } from '../../../services/reporteService'

interface PieChartProps {
  data: any[]
  title: string
  nameKey: string
  valueKey: string
  height?: number
  showLegend?: boolean
  colors?: string[]
  formatTooltip?: (value: any, name: string) => [string, string]
}

const PieChart: React.FC<PieChartProps> = ({
  data,
  title,
  nameKey,
  valueKey,
  height = 300,
  showLegend = true,
  colors,
  formatTooltip
}) => {
  const chartColors = colors || obtenerColoresGrafico(data.length)

  const defaultFormatTooltip = (value: any, name: string) => [
    formatearNumero(value),
    name
  ]

  const renderCustomLabel = (entry: any) => {
    const total = data.reduce((sum, item) => sum + item[valueKey], 0)
    const percent = ((entry[valueKey] / total) * 100).toFixed(1)
    return `${percent}%`
  }

  return (
    <Card elevation={2} sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <Box sx={{ width: '100%', height: height }}>
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey={valueKey}
                nameKey={nameKey}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={formatTooltip || defaultFormatTooltip}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              />
              {showLegend && (
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  wrapperStyle={{ fontSize: '12px' }}
                />
              )}
            </RechartsPieChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  )
}

export default PieChart
