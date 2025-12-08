import React, { useState, useEffect } from "react"
import {
  Box,
  Paper,
  Typography,
  TextField,
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
  Chip,
  Grid2
} from "@mui/material"
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon
} from "@mui/icons-material"
import { DatePicker } from "@mui/x-date-pickers/DatePicker"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"
import { navigate } from "gatsby"

import Layout from "../../components/layout"
import AuthComponent from "../../components/common/AuthComponent"
import api from "../../utils/api"

const baseUrl = process.env.GATSBY_API_BASE_URL

export default function ViewExpenses() {
  const [roles, setRoles] = useState([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState({ open: false, message: "", severity: "success" })
  const [totalAmount, setTotalAmount] = useState(0)
  
  // Date range filters
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [endDate, setEndDate] = useState(new Date())
  
  // Delete confirmation dialog
  const [deleteDialog, setDeleteDialog] = useState({ open: false, expenseId: null })
  
  // View details dialog
  const [viewDialog, setViewDialog] = useState({ open: false, expense: null })

  const handleAuthStateChange = ({ isAuthenticated, roles }) => {
    setIsAuthenticated(isAuthenticated)
    setRoles(roles)
    if (!isAuthenticated || (!roles.includes("treasurer") && !roles.includes("auditor"))) {
      navigate("/login/user-login")
    }
  }

  const showAlert = (message, severity) => {
    setAlert({ open: true, message, severity })
  }

  const handleCloseAlert = () => {
    setAlert({ open: false, message: "", severity: "success" })
  }

  const fetchExpenses = async () => {
    if (!startDate || !endDate) {
      showAlert("කරුණාකර දින පරාසය තෝරන්න", "error")
      return
    }

    setLoading(true)
    try {
      const response = await api.get(`${baseUrl}/account/expenses/all`, {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      })

      if (response.data.success) {
        setExpenses(response.data.expenses)
        setTotalAmount(response.data.totalAmount || 0)
        showAlert(`${response.data.expenses.length} වියදම් සොයා ගන්නා ලදී`, "success")
      }
    } catch (error) {
      console.error("Error fetching expenses:", error)
      showAlert("වියදම් ලබා ගැනීමේදී දෝෂයක් සිදුවිය", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (expenseId) => {
    try {
      const response = await api.delete(`${baseUrl}/account/expense/${expenseId}`)
      
      if (response.data.success) {
        const deletedExpense = expenses.find(expense => expense._id === expenseId)
        const updatedExpenses = expenses.filter(expense => expense._id !== expenseId)
        setExpenses(updatedExpenses)
        setTotalAmount(prevTotal => prevTotal - (deletedExpense?.amount || 0))
        setDeleteDialog({ open: false, expenseId: null })
        showAlert("වියදම සාර්ථකව මකා දමන ලදී", "success")
      }
    } catch (error) {
      console.error("Error deleting expense:", error)
      showAlert("වියදම මකා දැමීමේදී දෝෂයක් සිදුවිය", "error")
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('si-LK', {
      style: 'currency',
      currency: 'LKR'
    }).format(amount)
  }

  const formatDate = (dateInput) => {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput)
    return date.toLocaleDateString('si-LK')
  }

  const getCategoryChipColor = (category) => {
    // === සාමාජික ප්‍රතිලාභ (Member Benefits) ===
    const memberBenefitCategories = [
      "මරණ ප්‍රතිලාභ ගෙවීම්",
      "ක්ෂණික ප්‍රතිලාභ ගෙවීම්", 
      "මළවුන් රැගෙන යාමේ ගාස්තු",
      "ද්‍රව්‍ය ආධාර හිග"
    ]
    
    // === සේවා වියදම් (Service Expenses) ===
    const serviceCategories = [
      "කූඩාරම් හසුරුවීම - කම්කරු ගාස්තු",
      "පිඟන් නිකුත් කිරීම",
      "පුටු නිකුත් කිරීම",
      "බුෆේ සෙට් නිකුත් කිරීම",
      "ශබ්ද විකාශන හසුරුවීම"
    ]

    // === පරිපාලන වියදම් (Administrative Expenses) ===
    const administrativeCategories = [
      "කාර්යාල වියදම්",
      "සභා වියදම්",
      "සේවකයින්ගේ වැටුප්",
      "ප්‍රවාහන වියදම්"
    ]

    // === මූල්‍ය වියදම් (Financial Expenses) ===
    const financialCategories = [
      "බැංකු තැන්පතු",
      "විදුලි බිල්පත්"
    ]

    // === මිලදී ගැනීම් සහ නඩත්තු (Purchases & Maintenance) ===
    const purchaseMaintenanceCategories = [
      "මිලදී ගැනීම්",
      "කම්කරු ගාස්තු",
      "නඩත්තු වියදම්"
    ]
    
    if (memberBenefitCategories.includes(category)) return "error"
    if (serviceCategories.includes(category)) return "warning"
    if (administrativeCategories.includes(category)) return "info"
    if (financialCategories.includes(category)) return "success"
    if (purchaseMaintenanceCategories.includes(category)) return "secondary"
    return "primary"
  }

  // Load expenses on component mount
  useEffect(() => {
    if (isAuthenticated && roles.includes("treasurer")) {
      fetchExpenses()
    }
  }, [isAuthenticated, roles])

  if (!isAuthenticated) {
    return (
      <Layout>
        <AuthComponent onAuthStateChange={handleAuthStateChange} />
        <Box sx={{ padding: "20px", textAlign: "center" }}>
          <Typography>පුරනය වන්න...</Typography>
        </Box>
      </Layout>
    )
  }

  return (
    <Layout>
      <AuthComponent onAuthStateChange={handleAuthStateChange} />
      <section style={{ padding: "20px" }}>
        <Box sx={{ maxWidth: "1200px", margin: "0 auto" }}>
          <Paper sx={{ padding: "30px", borderRadius: "10px" }}>
            <Typography
              variant="h4"
              gutterBottom
              sx={{ textAlign: "center", marginBottom: "30px", color: "#2c3e50" }}
            >
              වියදම් පෙන්වන්න
            </Typography>

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              {/* Date Range Filter */}
              <Grid2 container spacing={3} sx={{ marginBottom: "30px" }}>
                <Grid2 size={{ xs: 12, sm: 4 }}>
                  <DatePicker
                    label="ආරම්භක දිනය"
                    value={startDate}
                    onChange={setStartDate}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                      },
                    }}
                  />
                </Grid2>
                <Grid2 size={{ xs: 12, sm: 4 }}>
                  <DatePicker
                    label="අවසාන දිනය"
                    value={endDate}
                    onChange={setEndDate}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                      },
                    }}
                  />
                </Grid2>
                <Grid2 size={{ xs: 12, sm: 4 }}>
                  <Button
                    variant="contained"
                    onClick={fetchExpenses}
                    disabled={loading}
                    sx={{ 
                      height: "56px", 
                      width: "100%",
                      textTransform: "none" 
                    }}
                  >
                    {loading ? "සොයමින්..." : "වියදම් සොයන්න"}
                  </Button>
                </Grid2>
              </Grid2>
            </LocalizationProvider>

            {/* Total Amount Summary */}
            {expenses.length > 0 && (
              <Box sx={{ marginTop: "20px", marginBottom: "10px" }}>
                <Paper sx={{ padding: "20px", backgroundColor: "#e3f2fd", border: "1px solid #2196f3" }}>
                  <Typography variant="h6" sx={{ textAlign: "center", color: "#1976d2", fontWeight: "bold" }}>
                    තෝරාගත් දින පරාසයේ මුළු වියදම: {formatCurrency(totalAmount)}
                  </Typography>
                  <Typography variant="body2" sx={{ textAlign: "center", color: "#666", marginTop: "5px" }}>
                    {formatDate(startDate)} සිට {formatDate(endDate)} දක්වා
                  </Typography>
                </Paper>
              </Box>
            )}

            {/* Expenses Table */}
            {expenses.length > 0 && (
              <TableContainer component={Paper} sx={{ marginTop: "20px" }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                      <TableCell sx={{ fontWeight: "bold" }}>දිනය</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>වර්ගය</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>විස්තර</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }} align="right">මුදල</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>ක්‍රියා</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {expenses.map((expense) => (
                      <TableRow key={expense._id} hover>
                        <TableCell>{formatDate(expense.date)}</TableCell>
                        <TableCell>
                          <Chip 
                            label={expense.category} 
                            color={getCategoryChipColor(expense.category)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {expense.beneficiaryMemberId && (
                            <Typography variant="body2" sx={{ marginBottom: "2px" }}>
                              <strong>සාමාජික ID:</strong> {expense.beneficiaryMemberId}
                            </Typography>
                          )}
                          {expense.description && (
                            <Typography variant="body2" sx={{ marginBottom: "2px" }}>
                              <strong>විස්තරය:</strong> {expense.description}
                            </Typography>
                          )}
                          {expense.paidTo && (
                            <Typography variant="body2">
                              <strong>ගෙවන ලද තැන:</strong> {expense.paidTo}
                            </Typography>
                          )}
                          {!expense.beneficiaryMemberId && !expense.description && !expense.paidTo && "-"}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold" }}>
                          {formatCurrency(expense.amount)}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            onClick={() => setViewDialog({ open: true, expense })}
                            color="primary"
                            size="small"
                          >
                            <ViewIcon />
                          </IconButton>
                          {/* Hide edit/delete buttons for auditors */}
                          {!roles.includes("auditor") && (
                            <>
                              <IconButton
                                onClick={() => navigate(`/account/edit-expense?id=${expense._id}`)}
                                color="warning"
                                size="small"
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                onClick={() => setDeleteDialog({ open: true, expenseId: expense._id })}
                                color="error"
                                size="small"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {expenses.length === 0 && !loading && (
              <Box sx={{ textAlign: "center", marginTop: "40px" }}>
                <Typography variant="h6" color="textSecondary">
                  තෝරාගත් දින පරාසයේ වියදම් සොයා ගත නොහැක
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      </section>

      {/* View Details Dialog */}
      <Dialog 
        open={viewDialog.open} 
        onClose={() => setViewDialog({ open: false, expense: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>වියදම් විස්තර</DialogTitle>
        <DialogContent>
          {viewDialog.expense && (
            <Box sx={{ padding: "10px" }}>
              <Typography><strong>දිනය:</strong> {formatDate(viewDialog.expense.date)}</Typography>
              <Typography><strong>වර්ගය:</strong> {viewDialog.expense.category}</Typography>
              <Typography><strong>මුදල:</strong> {formatCurrency(viewDialog.expense.amount)}</Typography>
              {viewDialog.expense.description && (
                <Typography><strong>විස්තරය:</strong> {viewDialog.expense.description}</Typography>
              )}
              {viewDialog.expense.paidTo && (
                <Typography><strong>ගෙවන ලද තැන:</strong> {viewDialog.expense.paidTo}</Typography>
              )}
              {viewDialog.expense.beneficiaryMemberId && (
                <Typography><strong>ප්‍රතිලාභ ලබන සාමාජික අංකය:</strong> {viewDialog.expense.beneficiaryMemberId}</Typography>
              )}
              <Typography><strong>එක් කළ දිනය:</strong> {formatDate(viewDialog.expense.created_at)}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog({ open: false, expense: null })}>
            වසන්න
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteDialog.open} 
        onClose={() => setDeleteDialog({ open: false, expenseId: null })}
      >
        <DialogTitle>වියදම මකා දැමීම</DialogTitle>
        <DialogContent>
          <Typography>
            ඔබට මෙම වියදම මකා දැමීමට අවශ්‍ය බව විශ්වාසද? මෙම ක්‍රියාව ආපසු හැරවිය නොහැක.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, expenseId: null })}>
            අවලංගු කරන්න
          </Button>
          <Button 
            onClick={() => handleDelete(deleteDialog.expenseId)}
            color="error"
            variant="contained"
          >
            මකා දමන්න
          </Button>
        </DialogActions>
      </Dialog>

      {/* Alert Snackbar */}
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleCloseAlert} severity={alert.severity}>
          {alert.message}
        </Alert>
      </Snackbar>
    </Layout>
  )
}
