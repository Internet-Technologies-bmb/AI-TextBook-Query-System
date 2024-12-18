import React from 'react';
import { AppBar, Toolbar, Typography, Box, Button } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';

const AppBarComponent = ({ handleLogout }) => {
  return (
    <AppBar position="static">
      <Toolbar sx={{ justifyContent: 'space-between', backgroundColor: '#252525' }}>
        <Typography variant="h6">AI TextBook Query System</Typography>
        <Box>
          <Button component={Link} to="/home" color="inherit">Home</Button>
          <Button component={Link} to="/chat" color="inherit">Chat</Button>
          <Button component={Link} to="/groq" color="inherit">Groq</Button>
          <Button onClick={handleLogout} color="inherit">Logout</Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default AppBarComponent;
