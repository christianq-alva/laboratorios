import React from 'react'
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { Box, Typography, Card, CardContent } from '@mui/material'
import { formatearNumero } from '../../../services/reporteService'

interface BarChartProps {
  data: any[]
  title: string
  xKey: string
  yKey: string
  color?: string
  height?: number
  showLegend?: boolean
  formatTooltip?: (value: any, name: string) => [string, string]
}

const BarChart: React.FC<BarChartProps> = ({
  data,
  title,
  xKey,
  yKey,
  color = '#1f77b4',
  height = 300,
  showLegend = true,
  formatTooltip
}) => {
  const defaultFormatTooltip = (value: any, name: string) => [
    formatearNumero(value),
    name
  ]

  return (
    <Card elevation={2} sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <Box sx={{ width: '100%', height: height }}>
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis
                dataKey={xKey}
                tick={{ fontSize: 12 }}
                axisLine={{ stroke: '#bdbdbd' }}
                tickLine={{ stroke: '#bdbdbd' }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                axisLine={{ stroke: '#bdbdbd' }}
                tickLine={{ stroke: '#bdbdbd' }}
                tickFormatter={(value) => formatearNumero(value)}
              />
              <Tooltip
                formatter={formatTooltip || defaultFormatTooltip}
                labelStyle={{ color: '#333' }}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              />
              {showLegend && <Legend />}
              <Bar
                dataKey={yKey}
                fill={color}
                radius={[4, 4, 0, 0]}
                name={yKey.replace(/_/g, ' ').toUpperCase()}
              />
            </RechartsBarChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  )
}

export default BarChart
