import React from "react"
import {
  Box,
  Container,
  Typography,
  Paper,
  Alert,
  IconButton
} from "@mui/material"
import {
  Settings as SettingsIcon,
  ArrowBack as ArrowBackIcon
} from "@mui/icons-material"
import Layout from "../../components/layout"
import { navigate } from "gatsby"
import loadable from "@loadable/component"

const AuthComponent = loadable(() => import("../../components/common/AuthComponent"))

const AdminSettings = () => {
  return (
    <AuthComponent allowedRoles={['super-admin']}>
      <Layout>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          {/* Header */}
          <Paper elevation={2} sx={{ p: 3, mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <Box display="flex" alignItems="center">
              <IconButton 
                onClick={() => navigate('/admin/dashboard')}
                sx={{ color: 'white', mr: 2 }}
              >
                <ArrowBackIcon />
              </IconButton>
              <SettingsIcon sx={{ fontSize: 40, color: 'white', mr: 2 }} />
              <Box>
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                  System Settings
                </Typography>
                <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  Configure system parameters
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Content */}
          <Paper elevation={3} sx={{ p: 4 }}>
            <Alert severity="info">
              <Typography variant="h6" gutterBottom>
                Settings Page Under Development
              </Typography>
              <Typography>
                This page will contain system configuration options such as:
              </Typography>
              <ul>
                <li>Application settings</li>
                <li>Database configuration</li>
                <li>Security settings</li>
                <li>Backup and restore options</li>
                <li>System maintenance</li>
              </ul>
            </Alert>
          </Paper>
        </Container>
      </Layout>
    </AuthComponent>
  )
}

export default AdminSettings
