import React, { useState, useEffect } from "react"
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Card,
  CardContent,
  Avatar,
  Chip,
  Fade,
  Skeleton,
  Grid2,
  Tooltip
} from "@mui/material"
import {
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon
} from "@mui/icons-material"
import dayjs from "dayjs"
import { navigate } from "gatsby"

import Layout from "../../components/layout"
import AuthComponent from "../../components/common/AuthComponent"
import api from "../../utils/api"
const baseUrl = process.env.GATSBY_API_BASE_URL

export default function ActiveLoans() {
  const [roles, setRoles] = useState([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeLoans, setActiveLoans] = useState([])
  const [loading, setLoading] = useState(false)

  // Delete functionality
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [loanToDelete, setLoanToDelete] = useState(null)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  })

  const isLoanCreatedToday = (loanDate) => {
    const today = dayjs().startOf('day')
    const loanDay = dayjs(loanDate).startOf('day')
    return today.isSame(loanDay)
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('si-LK', {
      style: 'currency',
      currency: 'LKR'
    }).format(amount)
  }

  const formatDate = (date) => {
    return dayjs(date).format('YYYY/MM/DD')
  }

  // Calculate statistics
  const calculateStats = () => {
    if (!activeLoans.length) return { totalLoans: 0, totalAmount: 0, totalRemaining: 0, overdue: 0 }
    
    return {
      totalLoans: activeLoans.length,
      totalAmount: activeLoans.reduce((sum, loan) => sum + (loan.loanAmount || 0), 0),
      totalRemaining: activeLoans.reduce((sum, loan) => sum + (loan.loanRemainingAmount || 0), 0),
      overdue: activeLoans.filter(loan => (loan.unpaidDuration || 0) > 2).length
    }
  }

  const stats = calculateStats()

  const handleViewMore = memberId => {
    navigate(`/loan/search?memberId=${memberId}`)
  }

  const handleDeleteClick = (loan) => {
    setLoanToDelete(loan)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      const response = await api.delete(`${baseUrl}/loan/${loanToDelete._id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
      })

      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'ණය සාර්ථකව ඉවත් කරන ලදී',
          severity: 'success'
        })
        setDeleteDialogOpen(false)
        setLoanToDelete(null)
        fetchActiveLoans() // Refresh the data
      }
    } catch (error) {
      console.error("Error deleting loan:", error)
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'ණය ඉවත් කිරීමේදී දෝෂයක් සිදුවිය',
        severity: 'error'
      })
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setLoanToDelete(null)
  }

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  const handleAuthStateChange = ({ isAuthenticated, roles }) => {
    setIsAuthenticated(isAuthenticated)
    setRoles(roles)
    if (!isAuthenticated || (!roles.includes("loan-treasurer") && !roles.includes("treasurer") && !roles.includes("chairman") && !roles.includes("auditor"))) {
      navigate("/login/user-login")
    }
  }

  const fetchActiveLoans = async () => {
    setLoading(true)
    try {
      const response = await api.get(`${baseUrl}/loan/active-loans`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
      })
      setActiveLoans(response.data.activeLoans)
    } catch (error) {
      console.error("Error fetching data:", error)
      setSnackbar({
        open: true,
        message: 'දත්ත ලබා ගැනීමේදී දෝෂයක් සිදුවිය',
        severity: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchActiveLoans()
    }
  }, [isAuthenticated])
  return (
    <Layout>
      <AuthComponent onAuthStateChange={handleAuthStateChange} />
      <Box sx={{ 
        maxWidth: 1400, 
        mx: 'auto', 
        p: 3,
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        minHeight: '100vh'
      }}>
        {/* Header */}
        <Paper
          elevation={3}
          sx={{
            p: 3,
            mb: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: 3
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'white', color: '#667eea', width: 56, height: 56 }}>
              <AccountBalanceIcon fontSize="large" />
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                ක්‍රියාකාරී ණය
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                දැනට ක්‍රියාකාරී සියලුම ණය සහ ඒවායේ වත්මන් තත්ත්වය
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Statistics Cards */}
        <Grid2 container spacing={3} sx={{ mb: 3 }}>
          <Grid2 xs={12} sm={6} md={3}>
            <Card elevation={2} sx={{ borderRadius: 3, overflow: 'visible' }}>
              <CardContent sx={{ p: 3, position: 'relative' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: '#2196f3', width: 48, height: 48 }}>
                    <PeopleIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2196f3' }}>
                      {loading ? <Skeleton width={40} /> : stats.totalLoans}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      මුළු ණය ගණන
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid2>

          <Grid2 xs={12} sm={6} md={3}>
            <Card elevation={2} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: '#4caf50', width: 48, height: 48 }}>
                    <TrendingUpIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                      {loading ? <Skeleton width={80} /> : formatCurrency(stats.totalAmount)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      මුළු ණය මුදල
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid2>

          <Grid2 xs={12} sm={6} md={3}>
            <Card elevation={2} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: '#ff9800', width: 48, height: 48 }}>
                    <AccountBalanceIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#ff9800' }}>
                      {loading ? <Skeleton width={80} /> : formatCurrency(stats.totalRemaining)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      ඉතිරි මුදල
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid2>

          <Grid2 xs={12} sm={6} md={3}>
            <Card elevation={2} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: '#f44336', width: 48, height: 48 }}>
                    <WarningIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#f44336' }}>
                      {loading ? <Skeleton width={40} /> : stats.overdue}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      පසුගිය ණය
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid2>
        </Grid2>

        {/* Active Loans Table */}
        <Card elevation={2} sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 3, pb: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 2 }}>
                ණය ලැයිස්තුව
              </Typography>
              <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                <Typography variant="body2">
                  <strong>සටහන:</strong> ණය කාලය මාස 10ක් ඉක්මවන සාමාජිකයින් 
                  <span style={{ color: '#9c27b0', fontWeight: 'bold' }}> ජම්බු </span> 
                  පැහැයෙන් හඳුන්වනු ලබයි. එවැනි ණය සම්පූර්ණ කිරීමෙන් පසු සාමාජිකයා වසරක් නව ණය සඳහා තහනම් වේ.
                </Typography>
              </Alert>
            </Box>
            
            <TableContainer>
              <Table size="small" sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow sx={{ 
                    background: 'linear-gradient(90deg, #e3f2fd 0%, #f3e5f5 100%)'
                  }}>
                    <TableCell sx={{ fontWeight: "bold", color: '#1976d2', py: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ScheduleIcon fontSize="small" />
                        ණය දිනය
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", color: '#1976d2' }}>ණය අංකය</TableCell>
                    <TableCell sx={{ fontWeight: "bold", color: '#1976d2' }}>සාමාජික අංකය</TableCell>
                    <TableCell sx={{ fontWeight: "bold", color: '#1976d2' }}>සාමාජිකයා</TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold", color: '#1976d2' }}>ණය මුදල</TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold", color: '#1976d2' }}>ඉතිරි මුදල</TableCell>
                    <TableCell align="center" sx={{ fontWeight: "bold", color: '#1976d2' }}>
                      <Tooltip title="ණය ගැනීමේ දිනයේ සිට නොගෙවු මාස ගණන / මුළු ණය කාලය">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                          නොගෙවු මාස / මුළු කාලය
                        </Box>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: "bold", color: '#1976d2' }}>ක්‍රියා</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell><Skeleton /></TableCell>
                        <TableCell><Skeleton /></TableCell>
                        <TableCell><Skeleton /></TableCell>
                        <TableCell><Skeleton /></TableCell>
                        <TableCell><Skeleton /></TableCell>
                        <TableCell><Skeleton /></TableCell>
                        <TableCell><Skeleton /></TableCell>
                        <TableCell><Skeleton /></TableCell>
                      </TableRow>
                    ))
                  ) : activeLoans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: '#f5f5f5', width: 64, height: 64 }}>
                            <AccountBalanceIcon fontSize="large" color="disabled" />
                          </Avatar>
                          <Typography variant="h6" color="textSecondary">
                            ක්‍රියාකාරී ණය නොමැත
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            දැනට කිසිදු ක්‍රියාකාරී ණයක් නොමැත
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    activeLoans.map((loan, index) => {
                      // Calculate total loan duration in months from loan date to today
                      const loanStartDate = dayjs(loan.loanDate)
                      const currentDate = dayjs()
                      const totalDurationMonths = currentDate.diff(loanStartDate, 'month')
                      
                      return (
                        <Fade in={true} timeout={300 + index * 50} key={index}>
                          <TableRow 
                            sx={{ 
                              '&:hover': { 
                                backgroundColor: '#f8f9fa',
                                transform: 'scale(1.001)',
                                transition: 'all 0.2s ease-in-out'
                              },
                              backgroundColor: (totalDurationMonths > 10) ? 'rgba(156, 39, 176, 0.1)' : 'transparent',
                              borderLeft: (totalDurationMonths > 10) ? '4px solid #9c27b0' :
                                         (loan.unpaidDuration > 2) ? '4px solid #f44336' : 
                                         (loan.loanRemainingAmount === 0) ? '4px solid #4caf50' : '4px solid transparent',
                              border: (totalDurationMonths > 10) ? '2px solid rgba(156, 39, 176, 0.3)' : 'none'
                            }}
                          >
                          <TableCell sx={{ py: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {formatDate(loan.loanDate)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={loan.loanNumber} 
                              size="small" 
                              color="primary" 
                              variant="outlined"
                              sx={{ fontWeight: 'bold' }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {loan.memberId?.member_id || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ width: 32, height: 32, bgcolor: '#1976d2', fontSize: '0.875rem' }}>
                                {(loan.memberId?.name || 'N').charAt(0).toUpperCase()}
                              </Avatar>
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                {loan.memberId?.name || 'N/A'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" sx={{ fontWeight: "bold", color: '#1976d2' }}>
                              {formatCurrency(loan.loanAmount)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: "bold", 
                                color: loan.loanRemainingAmount > 0 ? "#d32f2f" : "#2e7d32" 
                              }}
                            >
                              {formatCurrency(loan.loanRemainingAmount)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                              <Chip
                                label={`${loan.unpaidDuration} `}
                                size="small"
                                color={loan.unpaidDuration > 2 ? 'error' : loan.unpaidDuration > 1 ? 'warning' : 'success'}
                                icon={loan.unpaidDuration > 2 ? <WarningIcon /> : <CheckCircleIcon />}
                                sx={{ fontWeight: 'bold' }}
                              />
                              {totalDurationMonths > 10 && (
                                <Chip
                                  label={`මුළු කාලය: ${totalDurationMonths}මාස`}
                                  size="small"
                                  color="secondary"
                                  variant="outlined"
                                  sx={{ 
                                    fontWeight: 'bold',
                                    fontSize: '0.7rem',
                                    backgroundColor: 'rgba(156, 39, 176, 0.1)',
                                    border: '1px solid #9c27b0'
                                  }}
                                />
                              )}
                              {loan.loanRemainingAmount === 0 && (
                                <Chip
                                  label="සම්පූර්ණ"
                                  size="small"
                                  color="success"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                              <Tooltip title="වැඩි විස්තර බලන්න">
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewMore(loan.memberId?.member_id)}
                                  sx={{ 
                                    bgcolor: '#e3f2fd',
                                    color: '#1976d2',
                                    '&:hover': { bgcolor: '#bbdefb' }
                                  }}
                                >
                                  <ViewIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              {roles.includes("loan-treasurer") && (
                                <Tooltip title={
                                  isLoanCreatedToday(loan.loanDate) 
                                    ? "ණය ඉවත් කරන්න" 
                                    : "අද දිනයේ එකතු කරන ලද ණය පමණක් ඉවත් කළ හැක"
                                }>
                                  <span>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleDeleteClick(loan)}
                                      disabled={!isLoanCreatedToday(loan.loanDate)}
                                      sx={{ 
                                        bgcolor: isLoanCreatedToday(loan.loanDate) ? '#ffebee' : '#f5f5f5',
                                        color: isLoanCreatedToday(loan.loanDate) ? '#d32f2f' : '#bdbdbd',
                                        '&:hover': { 
                                          bgcolor: isLoanCreatedToday(loan.loanDate) ? '#ffcdd2' : '#f5f5f5' 
                                        }
                                      }}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      </Fade>
                    )
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2, 
          pb: 2,
          background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
          color: 'white'
        }}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
            <WarningIcon />
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            ණය ඉවත් කරන්න
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body1" sx={{ mb: 2, fontWeight: 'medium' }}>
            ඔබට මෙම ණය ස්ථිරවම ඉවත් කිරීමට අවශ්‍යද?
          </Typography>
          {loanToDelete && (
            <Card elevation={1} sx={{ borderRadius: 2, border: '1px solid #e0e0e0' }}>
              <CardContent sx={{ p: 2 }}>
                <Grid2 container spacing={2}>
                  <Grid2 xs={12} sm={6}>
                    <Typography variant="caption" color="textSecondary">සාමාජිකයා</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {loanToDelete.memberId?.name}
                    </Typography>
                  </Grid2>
                  <Grid2 xs={12} sm={6}>
                    <Typography variant="caption" color="textSecondary">ණය අංකය</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {loanToDelete.loanNumber}
                    </Typography>
                  </Grid2>
                  <Grid2 xs={12} sm={6}>
                    <Typography variant="caption" color="textSecondary">ණය මුදල</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                      {formatCurrency(loanToDelete.loanAmount)}
                    </Typography>
                  </Grid2>
                  <Grid2 xs={12} sm={6}>
                    <Typography variant="caption" color="textSecondary">ඉතිරි මුදල</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#d32f2f' }}>
                      {formatCurrency(loanToDelete.loanRemainingAmount)}
                    </Typography>
                  </Grid2>
                  <Grid2 xs={12}>
                    <Typography variant="caption" color="textSecondary">දිනය</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {formatDate(loanToDelete.loanDate)}
                    </Typography>
                  </Grid2>
                </Grid2>
              </CardContent>
            </Card>
          )}
          <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              <strong>සෘණය:</strong> අද දිනයේ එකතු කරන ලද ණය පමණක් ඉවත් කළ හැක. මෙය අහම්බෙන් එකතු කරන ලද ණය සඳහා පමණි.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={handleDeleteCancel}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            අවලංගු කරන්න
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            variant="contained" 
            color="error" 
            startIcon={<DeleteIcon />}
            sx={{ 
              borderRadius: 2,
              background: 'linear-gradient(45deg, #f44336 30%, #d32f2f 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #d32f2f 30%, #c62828 90%)',
              }
            }}
          >
            ඉවත් කරන්න
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ mt: 8 }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          sx={{ 
            borderRadius: 2,
            boxShadow: 3,
            minWidth: '300px'
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Layout>
  )
}
