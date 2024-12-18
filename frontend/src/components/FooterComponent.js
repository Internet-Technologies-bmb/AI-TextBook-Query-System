import React from 'react';
import { Box, Typography } from '@mui/material';

const FooterComponent = () => {
  return (
    <Box
      component="footer"
      sx={{
        position: 'relative',
        bottom: 0,
        width: '100%',
        textAlign: 'center',
        backgroundColor: '#252525',
        padding: '16px 0',
        marginTop: 'auto',
      }}
    >
      <Typography variant="body2" color="white">
        &copy; 2024 AI TextBook Query System. Created by Corleone II
      </Typography>
    </Box>
  );
};

export default FooterComponent;
