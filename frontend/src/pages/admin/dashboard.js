import React, { useState, useEffect } from "react"
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid2,
  Button,
  Avatar,
  Chip,
  Paper,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress
} from "@mui/material"
import {
  PersonAdd as PersonAddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  AdminPanelSettings as AdminIcon,
  Visibility as ViewIcon,
  VisibilityOff as VisibilityOffIcon,
  SupervisorAccount as SupervisorIcon
} from "@mui/icons-material"
import Layout from "../../components/layout"
import { navigate } from "gatsby"
import api from "../../utils/api"
import loadable from "@loadable/component"

const AuthComponent = loadable(() => import("../../components/common/AuthComponent"))

const AdminDashboard = () => {
  const [officers, setOfficers] = useState([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [dialogType, setDialogType] = useState('') // 'add', 'edit', 'delete'
  const [selectedOfficer, setSelectedOfficer] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })
  
  const [formData, setFormData] = useState({
    member_id: '',
    name: '',
    role: '',
    password: '',
    isActive: true
  })

  const roles = [
    { value: 'chairman', label: 'Chairman (සභාපති)', icon: '👑' },
    { value: 'secretary', label: 'Secretary (ලේකම්)', icon: '📝' },
    { value: 'vice-chairman', label: 'Vice Chairman (උප සභාපති)', icon: '👨‍💼' },
    { value: 'vice-secretary', label: 'Vice Secretary (උප ලේකම්)', icon: '📋' },
    { value: 'treasurer', label: 'Treasurer (භාණ්ඩාගාරික)', icon: '💰' },
    { value: 'loan-treasurer', label: 'Loan Treasurer (ණය භාණ්ඩාගාරික)', icon: '🏦' },
    { value: 'auditor', label: 'Auditor (විගණකරු)', icon: '🔍' },
    { value: 'speaker-handler', label: 'Speaker Handler (ශ්‍රවණාගාර භාරකරු)', icon: '📢' }
  ]

  useEffect(() => {
    fetchOfficers()
  }, [])

  const fetchOfficers = async () => {
    try {
      setLoading(true)
      const response = await api.get('/officer/all')
      setOfficers(response.data.officers || [])
    } catch (error) {
      console.error('Error fetching officers:', error)
      setSnackbar({
        open: true,
        message: 'Error fetching officers: ' + (error.response?.data?.message || error.message),
        severity: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (type, officer = null) => {
    setDialogType(type)
    setSelectedOfficer(officer)
    if (type === 'add') {
      setFormData({
        member_id: '',
        name: '',
        role: '',
        password: '',
        isActive: true
      })
    } else if (type === 'edit' && officer) {
      setFormData({
        member_id: officer.member_id,
        name: officer.name,
        role: officer.role,
        password: '',
        isActive: officer.isActive
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setSelectedOfficer(null)
    setFormData({
      member_id: '',
      name: '',
      role: '',
      password: '',
      isActive: true
    })
  }

  const handleSubmit = async () => {
    try {
      if (dialogType === 'add') {
        await api.post('/officer/create', formData)
        setSnackbar({
          open: true,
          message: 'Officer created successfully!',
          severity: 'success'
        })
      } else if (dialogType === 'edit') {
        const updateData = { ...formData }
        if (!updateData.password) {
          delete updateData.password // Don't update password if empty
        }
        await api.put(`/officer/update/${selectedOfficer._id}`, updateData)
        setSnackbar({
          open: true,
          message: 'Officer updated successfully!',
          severity: 'success'
        })
      } else if (dialogType === 'delete') {
        await api.delete(`/officer/delete/${selectedOfficer._id}`)
        setSnackbar({
          open: true,
          message: 'Officer deleted successfully!',
          severity: 'success'
        })
      }
      
      handleCloseDialog()
      fetchOfficers()
    } catch (error) {
      console.error('Error:', error)
      setSnackbar({
        open: true,
        message: 'Error: ' + (error.response?.data?.message || error.message),
        severity: 'error'
      })
    }
  }

  const handleDeactivate = async (officerId) => {
    try {
      await api.put(`/officer/deactivate/${officerId}`)
      setSnackbar({
        open: true,
        message: 'Officer deactivated successfully!',
        severity: 'success'
      })
      fetchOfficers()
    } catch (error) {
      console.error('Error:', error)
      setSnackbar({
        open: true,
        message: 'Error deactivating officer: ' + (error.response?.data?.message || error.message),
        severity: 'error'
      })
    }
  }

  const getRoleInfo = (role) => {
    const roleInfo = roles.find(r => r.value === role)
    return roleInfo || { label: role, icon: '👤' }
  }

  return (
    <AuthComponent allowedRoles={['super-admin']}>
      <Layout>
        <Container maxWidth="xl" sx={{ py: 4 }}>
          {/* Header */}
          <Paper elevation={2} sx={{ p: 3, mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box display="flex" alignItems="center">
                <SupervisorIcon sx={{ fontSize: 40, color: 'white', mr: 2 }} />
                <Box>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                    Super Admin Dashboard
                  </Typography>
                  <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                    Officer Management System
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="contained"
                color="success"
                startIcon={<PersonAddIcon />}
                onClick={() => handleOpenDialog('add')}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  backdropFilter: 'blur(10px)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                }}
              >
                Add New Officer
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SupervisorIcon />}
                onClick={() => navigate('/admin/role-management')}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  backdropFilter: 'blur(10px)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                  ml: 2
                }}
              >
                Manage Member Roles
              </Button>
            </Box>
          </Paper>

          {/* Statistics Cards */}
          <Grid2 container spacing={3} sx={{ mb: 4 }}>
            <Grid2 xs={12} sm={6} md={3}>
              <Card elevation={3} sx={{ textAlign: 'center', py: 2 }}>
                <CardContent>
                  <SecurityIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h4" color="primary">
                    {officers.length}
                  </Typography>
                  <Typography color="text.secondary">
                    Total Officers
                  </Typography>
                </CardContent>
              </Card>
            </Grid2>
            <Grid2 xs={12} sm={6} md={3}>
              <Card elevation={3} sx={{ textAlign: 'center', py: 2 }}>
                <CardContent>
                  <AdminIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                  <Typography variant="h4" color="success.main">
                    {officers.filter(o => o.isActive).length}
                  </Typography>
                  <Typography color="text.secondary">
                    Active Officers
                  </Typography>
                </CardContent>
              </Card>
            </Grid2>
            <Grid2 xs={12} sm={6} md={3}>
              <Card elevation={3} sx={{ textAlign: 'center', py: 2 }}>
                <CardContent>
                  <PersonAddIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                  <Typography variant="h4" color="warning.main">
                    {officers.filter(o => !o.isActive).length}
                  </Typography>
                  <Typography color="text.secondary">
                    Inactive Officers
                  </Typography>
                </CardContent>
              </Card>
            </Grid2>
            <Grid2 xs={12} sm={6} md={3}>
              <Card elevation={3} sx={{ textAlign: 'center', py: 2 }}>
                <CardContent>
                  <SupervisorIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                  <Typography variant="h4" color="info.main">
                    {new Set(officers.map(o => o.role)).size}
                  </Typography>
                  <Typography color="text.secondary">
                    Different Roles
                  </Typography>
                </CardContent>
              </Card>
            </Grid2>
          </Grid2>

          {/* Officers List */}
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
              <SecurityIcon sx={{ mr: 1 }} />
              Officers Management
            </Typography>
            
            {loading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid2 container spacing={3}>
                {officers.map((officer) => {
                  const roleInfo = getRoleInfo(officer.role)
                  return (
                    <Grid2 xs={12} sm={6} md={4} key={officer._id}>
                      <Card 
                        elevation={2} 
                        sx={{ 
                          height: '100%',
                          border: officer.isActive ? '2px solid #4caf50' : '2px solid #f44336',
                          opacity: officer.isActive ? 1 : 0.7
                        }}
                      >
                        <CardContent>
                          <Box display="flex" alignItems="center" mb={2}>
                            <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                              {roleInfo.icon}
                            </Avatar>
                            <Box flex={1}>
                              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                {officer.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                ID: {officer.member_id}
                              </Typography>
                            </Box>
                            <Chip 
                              label={officer.isActive ? 'Active' : 'Inactive'} 
                              color={officer.isActive ? 'success' : 'error'}
                              size="small"
                            />
                          </Box>
                          
                          <Divider sx={{ my: 2 }} />
                          
                          <Box mb={2}>
                            <Chip 
                              label={roleInfo.label} 
                              color="primary" 
                              variant="outlined"
                              sx={{ fontSize: '0.75rem' }}
                            />
                          </Box>
                          
                          <Box display="flex" gap={1} flexWrap="wrap">
                            <Button
                              size="small"
                              variant="outlined"
                              color="primary"
                              startIcon={<EditIcon />}
                              onClick={() => handleOpenDialog('edit', officer)}
                            >
                              Edit
                            </Button>
                            {officer.isActive && (
                              <Button
                                size="small"
                                variant="outlined"
                                color="warning"
                                onClick={() => handleDeactivate(officer._id)}
                              >
                                Deactivate
                              </Button>
                            )}
                            {officer.role !== 'super-admin' && (
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<DeleteIcon />}
                                onClick={() => handleOpenDialog('delete', officer)}
                              >
                                Delete
                              </Button>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid2>
                  )
                })}
              </Grid2>
            )}
          </Paper>

          {/* Dialog for Add/Edit/Delete */}
          <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
            <DialogTitle>
              {dialogType === 'add' && 'Add New Officer'}
              {dialogType === 'edit' && 'Edit Officer'}
              {dialogType === 'delete' && 'Delete Officer'}
            </DialogTitle>
            <DialogContent>
              {dialogType === 'delete' ? (
                <Typography>
                  Are you sure you want to permanently delete officer "{selectedOfficer?.name}"?
                  This action cannot be undone.
                </Typography>
              ) : (
                <Box component="form" sx={{ pt: 1 }}>
                  <TextField
                    fullWidth
                    label="Member ID"
                    value={formData.member_id}
                    onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
                    margin="normal"
                    required
                    type="number"
                    disabled={dialogType === 'edit'}
                  />
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    margin="normal"
                    required
                  />
                  <TextField
                    fullWidth
                    select
                    label="Role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    margin="normal"
                    required
                  >
                    {roles.map((role) => (
                      <MenuItem key={role.value} value={role.value}>
                        {role.icon} {role.label}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    fullWidth
                    label={dialogType === 'edit' ? 'New Password (leave empty to keep current)' : 'Password'}
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    margin="normal"
                    required={dialogType === 'add'}
                    InputProps={{
                      endAdornment: (
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOffIcon /> : <ViewIcon />}
                        </IconButton>
                      )
                    }}
                  />
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button 
                onClick={handleSubmit} 
                variant="contained"
                color={dialogType === 'delete' ? 'error' : 'primary'}
              >
                {dialogType === 'add' && 'Create Officer'}
                {dialogType === 'edit' && 'Update Officer'}
                {dialogType === 'delete' && 'Delete Officer'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Snackbar for notifications */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
          >
            <Alert 
              onClose={() => setSnackbar({ ...snackbar, open: false })} 
              severity={snackbar.severity}
              sx={{ width: '100%' }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Container>
      </Layout>
    </AuthComponent>
  )
}

export default AdminDashboard
