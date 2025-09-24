import React from 'react'
import { Card, CardContent, Typography, Box, Avatar } from '@mui/material'
import { formatearNumero } from '../../../services/reporteService'

interface MetricCardProps {
  title: string
  value: number | string
  icon?: React.ReactNode
  color?: string
  subtitle?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  format?: 'number' | 'currency' | 'percentage' | 'text'
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  color = '#1976d2',
  subtitle,
  trend,
  format = 'number'
}) => {
  const formatValue = (val: number | string) => {
    if (typeof val === 'string') return val
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('es-ES', {
          style: 'currency',
          currency: 'PEN'
        }).format(val)
      case 'percentage':
        return new Intl.NumberFormat('es-ES', {
          style: 'percent',
          minimumFractionDigits: 1,
          maximumFractionDigits: 1
        }).format(val / 100)
      case 'number':
        return formatearNumero(val)
      default:
        return val.toString()
    }
  }

  return (
    <Card 
      elevation={2} 
      sx={{ 
        height: '100%',
        background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
        border: `1px solid ${color}20`,
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
        }
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography 
            variant="subtitle2" 
            color="text.secondary" 
            sx={{ fontWeight: 500, fontSize: '0.875rem' }}
          >
            {title}
          </Typography>
          {icon && (
            <Avatar 
              sx={{ 
                bgcolor: color, 
                width: 40, 
                height: 40,
                '& svg': { fontSize: '1.2rem' }
              }}
            >
              {icon}
            </Avatar>
          )}
        </Box>
        
        <Typography 
          variant="h4" 
          component="div" 
          sx={{ 
            fontWeight: 700,
            color: color,
            mb: subtitle || trend ? 1 : 0,
            fontSize: { xs: '1.5rem', sm: '2rem' }
          }}
        >
          {formatValue(value)}
        </Typography>
        
        {subtitle && (
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ fontSize: '0.75rem' }}
          >
            {subtitle}
          </Typography>
        )}
        
        {trend && (
          <Box display="flex" alignItems="center" mt={1}>
            <Typography
              variant="body2"
              sx={{
                color: trend.isPositive ? '#4caf50' : '#f44336',
                fontWeight: 600,
                fontSize: '0.75rem'
              }}
            >
              {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default MetricCard
