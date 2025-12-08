import React, { useState } from "react"
import { navigate } from "gatsby"
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material"
import {
  SupervisorAccount as SupervisorIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  WhatsApp as WhatsAppIcon,
} from "@mui/icons-material"

export default function SuperAdminMenu({ isSuperAdmin, handleLogout }) {
  const [anchorEl, setAnchorEl] = useState(null)

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleNavigate = (path) => {
    navigate(path)
    handleMenuClose()
  }

  if (!isSuperAdmin) return null

  return (
    <>
      <Button
        color="inherit"
        onClick={handleMenuOpen}
        startIcon={<SupervisorIcon />}
        sx={{
          textTransform: "none",
          borderRadius: 2,
          px: 2,
          py: 1,
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.2)",
          },
        }}
      >
        Admin Panel
      </Button>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 8,
          sx: {
            mt: 1.5,
            minWidth: 220,
            borderRadius: 2,
            "& .MuiMenuItem-root": {
              px: 2,
              py: 1,
              borderRadius: 1,
              mx: 1,
              mb: 0.5,
              "&:hover": {
                backgroundColor: "rgba(25, 118, 210, 0.08)",
              },
            },
          },
        }}
      >
        <MenuItem onClick={() => handleNavigate("/admin/dashboard")}>
          <ListItemIcon>
            <DashboardIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText primary="Admin Dashboard" />
        </MenuItem>
        
        <MenuItem onClick={() => handleNavigate("/admin/role-management")}>
          <ListItemIcon>
            <PeopleIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText primary="Officer Management" />
        </MenuItem>
        
        <MenuItem onClick={() => handleNavigate("/admin/whatsapp-bot")}>
          <ListItemIcon>
            <WhatsAppIcon fontSize="small" sx={{ color: '#25D366' }} />
          </ListItemIcon>
          <ListItemText primary="WhatsApp Bot" />
        </MenuItem>
        
        <Divider sx={{ my: 1 }} />
        
        <MenuItem onClick={() => handleNavigate("/admin/system-settings")}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" color="secondary" />
          </ListItemIcon>
          <ListItemText primary="System Settings" />
        </MenuItem>
        
        <Divider sx={{ my: 1 }} />
        
        <MenuItem 
          onClick={() => {
            handleLogout()
            handleMenuClose()
          }}
          sx={{
            color: "#f44336",
            "&:hover": {
              backgroundColor: "rgba(244, 67, 54, 0.1)",
            },
          }}
        >
          <ListItemIcon>
            <LogoutIcon fontSize="small" sx={{ color: "#f44336" }} />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </MenuItem>
      </Menu>
    </>
  )
}
