import React from "react"
import { Box, Typography, Button, Divider } from "@mui/material"
import {
  SupervisorAccount as SupervisorIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material"

export default function SuperAdminMobileMenu({ isSuperAdmin, handleMenuItemClick, handleLogout }) {
  if (!isSuperAdmin) return null

  return (
    <>
      <Box sx={{ mb: 2 }}>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: "bold",
            color: "primary.main",
            mb: 1,
            px: 1,
            display: "flex",
            alignItems: "center",
          }}
        >
          <SupervisorIcon sx={{ mr: 1, fontSize: 18 }} />
          SUPER ADMIN PANEL
        </Typography>
        
        <Button
          fullWidth
          variant="outlined"
          startIcon={<DashboardIcon />}
          onClick={() => handleMenuItemClick("/admin/dashboard")}
          sx={{
            justifyContent: "flex-start",
            mb: 1,
            textTransform: "none",
            borderColor: "primary.main",
            color: "primary.main",
            "&:hover": {
              backgroundColor: "primary.50",
            },
          }}
        >
          Admin Dashboard
        </Button>
        
        <Button
          fullWidth
          variant="outlined"
          startIcon={<PeopleIcon />}
          onClick={() => handleMenuItemClick("/admin/role-management")}
          sx={{
            justifyContent: "flex-start",
            mb: 1,
            textTransform: "none",
            borderColor: "primary.main",
            color: "primary.main",
            "&:hover": {
              backgroundColor: "primary.50",
            },
          }}
        >
          Officer Management
        </Button>
        
        <Button
          fullWidth
          variant="outlined"
          startIcon={<SettingsIcon />}
          onClick={() => handleMenuItemClick("/admin/system-settings")}
          sx={{
            justifyContent: "flex-start",
            mb: 1,
            textTransform: "none",
            borderColor: "secondary.main",
            color: "secondary.main",
            "&:hover": {
              backgroundColor: "secondary.50",
            },
          }}
        >
          System Settings
        </Button>
        
        <Button
          fullWidth
          variant="outlined"
          startIcon={<LogoutIcon />}
          onClick={() => {
            handleLogout()
            handleMenuItemClick("/")
          }}
          sx={{
            justifyContent: "flex-start",
            mb: 1,
            textTransform: "none",
            borderColor: "#f44336",
            color: "#f44336",
            "&:hover": {
              backgroundColor: "rgba(244, 67, 54, 0.1)",
            },
          }}
        >
          Logout
        </Button>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
    </>
  )
}
