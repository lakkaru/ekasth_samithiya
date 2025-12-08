import React from 'react'

import {
//   AppBar,
  Box,
//   Toolbar,
  Typography,
//   Button,
//   Menu,
//   MenuItem,
//   IconButton,
//   Divider,
  Chip,
  Avatar,
//   Badge,
  Paper,
//   Accordion,
//   AccordionSummary,
//   AccordionDetails,
} from "@mui/material"
// import {
//   Menu as MenuIcon,
//   Person as PersonIcon,
//   AccountBalance as AccountBalanceIcon,
//   Groups as GroupsIcon,
//   Payment as PaymentIcon,
//   MonetizationOn as MonetizationOnIcon,
//   Assessment as AssessmentIcon,
//   Settings as SettingsIcon,
//   Logout as LogoutIcon,
//   Home as HomeIcon,
//   Edit as EditIcon,
//   ExpandMore as ExpandMoreIcon,
// } from "@mui/icons-material"

export default function WelcomeMessage({memberName = "සාමාජික", memberId = "00", isAuthenticated = false}) {
  return (
    <Paper
        elevation={2}
        sx={{
          width: "100%",
          maxWidth: "1024px",
          margin: "0 auto",
          padding: "8px 16px",
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          borderRadius: 0,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          minHeight: 48,
        }}
      >
        {isAuthenticated && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ width: 28, height: 28, bgcolor: '#667eea', fontSize: '0.75rem' }}>
              {memberName.charAt(0).toUpperCase()}
            </Avatar>
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 'bold', 
                color: '#333',
                lineHeight: 1.2
              }}
            >
              ආයුබෝවන්, {memberName} <span style={{ color: '#666', fontSize: '0.75rem', fontWeight: 'normal' }}>#{memberId}</span>
            </Typography>
          </Box>
        )}
        {!isAuthenticated && (
          <Typography variant="body2" color="textSecondary">
            කරුණාකර පිවිසෙන්න
          </Typography>
        )}
        <Chip 
          label={`${new Date().toLocaleDateString('si-LK', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}`}
          size="small"
          sx={{
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            color: '#667eea',
            fontWeight: 'bold'
          }}
        />
      </Paper>
  )
}
