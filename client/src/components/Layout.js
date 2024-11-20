import React from 'react';
import MiniDrawer from './MiniDrawer';
import Box from '@mui/material/Box';

const Layout = ({ children }) => {
  return (
    <Box sx={{ display: 'flex' }}>
      {/* Sidebar/Drawer */}
      <MiniDrawer />
      
      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
