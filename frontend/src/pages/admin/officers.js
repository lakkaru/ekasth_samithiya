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
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination
} from "@mui/material"
import {
  PersonAdd as PersonAddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  AdminPanelSettings as AdminIcon,
  Visibility as ViewIcon,
  VisibilityOff as VisibilityOffIcon,
  SupervisorAccount as SupervisorIcon,
  ArrowBack as ArrowBackIcon
} from "@mui/icons-material"
import Layout from "../../components/layout"
import { navigate } from "gatsby"
import api from "../../utils/api"
import loadable from "@loadable/component"

const AuthComponent = loadable(() => import("../../components/common/AuthComponent"))

const OfficersPage = () => {
  const [officers, setOfficers] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [openDialog, setOpenDialog] = useState(false)
  const [dialogType, setDialogType] = useState('')
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
          delete updateData.password
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

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  return (
    <AuthComponent allowedRoles={['super-admin']}>
      <Layout>
        <Container maxWidth="xl" sx={{ py: 4 }}>
          {/* Header */}
          <Paper elevation={2} sx={{ p: 3, mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box display="flex" alignItems="center">
                <IconButton 
                  onClick={() => navigate('/admin/dashboard')}
                  sx={{ color: 'white', mr: 2 }}
                >
                  <ArrowBackIcon />
                </IconButton>
                <SupervisorIcon sx={{ fontSize: 40, color: 'white', mr: 2 }} />
                <Box>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                    Officer Management
                  </Typography>
                  <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                    Complete officer administration
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
            </Box>
          </Paper>

          {/* Officers Table */}
          <Paper elevation={3} sx={{ overflow: 'hidden' }}>
            <Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0' }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <SecurityIcon sx={{ mr: 1 }} />
                Officers List ({officers.length} total)
              </Typography>
            </Box>
            
            {loading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                      <TableRow>
                        <TableCell><strong>Officer</strong></TableCell>
                        <TableCell><strong>Member ID</strong></TableCell>
                        <TableCell><strong>Role</strong></TableCell>
                        <TableCell><strong>Status</strong></TableCell>
                        <TableCell><strong>Actions</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {officers
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((officer) => {
                          const roleInfo = getRoleInfo(officer.role)
                          return (
                            <TableRow key={officer._id} hover>
                              <TableCell>
                                <Box display="flex" alignItems="center">
                                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 32, height: 32 }}>
                                    {roleInfo.icon}
                                  </Avatar>
                                  <Typography variant="body2" fontWeight="bold">
                                    {officer.name}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  #{officer.member_id}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={roleInfo.label} 
                                  color="primary" 
                                  variant="outlined"
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={officer.isActive ? 'Active' : 'Inactive'} 
                                  color={officer.isActive ? 'success' : 'error'}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                <Box display="flex" gap={1}>
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
                              </TableCell>
                            </TableRow>
                          )
                        })}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={officers.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </>
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
                <Alert severity="warning">
                  Are you sure you want to permanently delete officer <strong>"{selectedOfficer?.name}"</strong>?
                  This action cannot be undone.
                </Alert>
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

export default OfficersPage
