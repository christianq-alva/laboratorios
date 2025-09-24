import React from 'react'
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { Box, Typography, Card, CardContent } from '@mui/material'
import { formatearNumero } from '../../../services/reporteService'

interface AreaChartProps {
  data: any[]
  title: string
  xKey: string
  areas: {
    key: string
    name: string
    color: string
    stackId?: string
  }[]
  height?: number
  showLegend?: boolean
  stacked?: boolean
  formatTooltip?: (value: any, name: string) => [string, string]
}

const AreaChart: React.FC<AreaChartProps> = ({
  data,
  title,
  xKey,
  areas,
  height = 300,
  showLegend = true,
  stacked = false,
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
            <RechartsAreaChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <defs>
                {areas.map((area, index) => (
                  <linearGradient key={area.key} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={area.color} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={area.color} stopOpacity={0.1}/>
                  </linearGradient>
                ))}
              </defs>
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
              {areas.map((area, index) => (
                <Area
                  key={area.key}
                  type="monotone"
                  dataKey={area.key}
                  stackId={stacked ? area.stackId || '1' : undefined}
                  stroke={area.color}
                  strokeWidth={2}
                  fill={`url(#gradient-${index})`}
                  name={area.name}
                />
              ))}
            </RechartsAreaChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  )
}

export default AreaChart
