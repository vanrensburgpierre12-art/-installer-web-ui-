import React from 'react';
import { Box, CircularProgress, Typography, Fade } from '@mui/material';
import { DirectionsCar as CarIcon } from '@mui/icons-material';

interface LoadingSpinnerProps {
  message?: string;
  size?: number;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Loading...', 
  size = 40 
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '200px',
        gap: 2,
      }}
    >
      <Fade in timeout={500}>
        <Box sx={{ position: 'relative' }}>
          <CircularProgress
            size={size}
            thickness={4}
            sx={{
              color: 'primary.main',
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round',
              },
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <CarIcon 
              sx={{ 
                fontSize: size * 0.4, 
                color: 'primary.main',
                animation: 'pulse 2s infinite',
                '@keyframes pulse': {
                  '0%': { opacity: 0.5 },
                  '50%': { opacity: 1 },
                  '100%': { opacity: 0.5 },
                },
              }} 
            />
          </Box>
        </Box>
      </Fade>
      <Fade in timeout={800}>
        <Typography variant="body1" color="text.secondary" fontWeight="500">
          {message}
        </Typography>
      </Fade>
    </Box>
  );
};

export default LoadingSpinner;