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
  Grid2,
  Chip,
  Divider,
  Card,
  CardContent,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel
} from "@mui/material"
import {
  Print as PrintIcon,
  Download as DownloadIcon,
  Save as SaveIcon,
  History as HistoryIcon
} from "@mui/icons-material"
import { DatePicker } from "@mui/x-date-pickers/DatePicker"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"
import { navigate } from "gatsby"

import Layout from "../../components/layout"
import AuthComponent from "../../components/common/AuthComponent"
import api from "../../utils/api"

const baseUrl = process.env.GATSBY_API_BASE_URL

export default function MonthlyReport() {
  const [roles, setRoles] = useState([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState(null)
  
  // View mode state - auditors can only view saved reports
  const [viewMode, setViewMode] = useState('new') // 'new' or 'saved'
  const [savedReports, setSavedReports] = useState([])
  const [selectedSavedReport, setSelectedSavedReport] = useState('')
  const [loadingSavedReports, setLoadingSavedReports] = useState(false)
  
  // Notification state
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info' // 'success', 'error', 'warning', 'info'
  })
  
  // Date range filters
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [endDate, setEndDate] = useState(new Date())

  const handleAuthStateChange = ({ isAuthenticated, roles }) => {
    setIsAuthenticated(isAuthenticated)
    setRoles(roles)
    if (!isAuthenticated) {
      navigate("/login/user-login")
    } else if (!roles.includes("treasurer") && !roles.includes("auditor") && !roles.includes("chairman")) {
      // User is authenticated but doesn't have permission - show error instead of redirecting
      showNotification("ඔබට මෙම පිටුව බැලීමට අවසර නැත. භාණ්ඩාගාරික, ගණකාධිකාරී හෝ සභාපතිවරුන්ට පමණක් මෙම තොරතුරු ප්‍රවේශ විය හැක.", "error")
    }
    // Set auditors and chairman to view saved reports by default
    if (roles.includes("auditor") || roles.includes("chairman")) {
      setViewMode('saved')
    }
  }

  // Fetch saved reports when roles change and user is auditor
  useEffect(() => {
    if (roles.includes("auditor") && viewMode === 'saved') {
      fetchSavedReports()
    }
  }, [roles, viewMode])

  const showNotification = (message, severity = 'info') => {
    setNotification({
      open: true,
      message,
      severity
    })
  }

  const handleCloseNotification = (event, reason) => {
    if (reason === 'clickaway') {
      return
    }
    setNotification({ ...notification, open: false })
  }

  // Fetch saved reports when switching to saved mode
  const fetchSavedReports = async () => {
    if (!isAuthenticated || (!roles.includes("treasurer") && !roles.includes("auditor"))) return
    
    setLoadingSavedReports(true)
    try {
      const response = await api.get(`${baseUrl}/period-balance/all-balances`)
      if (response.data.success) {
        setSavedReports(response.data.balances || [])
      } else {
        showNotification("සුරකින ලද වාර්තා ලබා ගැනීමේදී දෝෂයක් සිදුවිය", "error")
      }
    } catch (error) {
      console.error("Error fetching saved reports:", error)
      showNotification("සුරකින ලද වාර්තා ලබා ගැනීමේදී දෝෂයක් සිදුවිය", "error")
    } finally {
      setLoadingSavedReports(false)
    }
  }

  // Load a saved report and regenerate full details
  const loadSavedReport = async (savedReportId) => {
    if (!savedReportId) return
    
    setLoading(true)
    try {
      const selectedReport = savedReports.find(report => report._id === savedReportId)
      if (!selectedReport) {
        showNotification("තෝරාගත් වාර්තාව සොයා ගැනීමට නොහැකි විය", "error")
        return
      }

      // Check if the report has period start date (new format)
      if (!selectedReport.periodStartDate) {
        showNotification("මෙම වාර්තාවට කාල සීමාවේ ආරම්භක දිනය නොමැත. සම්පූර්ණ විස්තර ලබා ගත නොහැක.", "warning")
        
        // Fall back to simplified saved report display
        const savedReportData = {
          period: { 
            startDate: new Date(selectedReport.createdAt), 
            endDate: new Date(selectedReport.periodEndDate) 
          },
          incomes: [],
          expenses: [],
          totals: {
            totalIncome: selectedReport.totalIncome || 0,
            totalExpense: selectedReport.totalExpense || 0,
            netCashFlow: selectedReport.netCashFlow || 0,
            currentCashOnHand: selectedReport.endingCashOnHand || 0,
            currentBankDeposit: selectedReport.endingBankDeposit || 0,
            periodStartCashOnHand: 0, 
            periodStartBankDeposit: 0,
            periodBankDeposits: 0,
            periodBankWithdrawals: 0
          },
          isSavedReport: true
        }
        setReportData(savedReportData)
        return
      }

      // Regenerate full report using saved period dates
      const savedStartDate = new Date(selectedReport.periodStartDate)
      const savedEndDate = new Date(selectedReport.periodEndDate)
      
      console.log("Regenerating full report for saved period:", savedStartDate.toISOString(), "to", savedEndDate.toISOString())
      
      // Fetch full transaction data for the saved period
      const [incomesResponse, expensesResponse, lastBalanceResponse] = await Promise.all([
        api.get(`${baseUrl}/account/incomes`, {
          params: {
            startDate: savedStartDate.toISOString(),
            endDate: savedEndDate.toISOString()
          }
        }),
        api.get(`${baseUrl}/account/expenses/all`, {
          params: {
            startDate: savedStartDate.toISOString(),
            endDate: savedEndDate.toISOString()
          }
        }),
        api.get(`${baseUrl}/period-balance/last-balance`, {
          params: {
            beforeDate: savedStartDate.toISOString()
          }
        }).catch(balanceError => {
          console.warn("Failed to fetch last balance for saved report, using initial values:", balanceError.message)
          const initialCashOnHand = parseFloat(process.env.GATSBY_INITIAL_CASH_ON_HAND || 0)
          const initialBankDeposit = parseFloat(process.env.GATSBY_INITIAL_BANK_DEPOSIT || 0)
          
          return {
            data: {
              success: true,
              balance: {
                endingCashOnHand: initialCashOnHand,
                endingBankDeposit: initialBankDeposit,
                periodEndDate: new Date('2024-12-31'),
                isInitial: true
              }
            }
          }
        })
      ])

      if (incomesResponse.data.success && expensesResponse.data.success && lastBalanceResponse.data.success) {
        const incomes = incomesResponse.data.incomes || []
        const expenses = expensesResponse.data.expenses || []
        const lastBalance = lastBalanceResponse.data.balance
        
        // Starting balances for this period
        const periodStartCashOnHand = lastBalance.endingCashOnHand
        const periodStartBankDeposit = lastBalance.endingBankDeposit

        // Calculate bank transactions during the period
        const periodBankDeposits = expenses
          .filter(expense => expense.category === 'බැංකු තැන්පතු')
          .reduce((sum, expense) => sum + expense.amount, 0)

        const periodBankWithdrawals = incomes
          .filter(income => income.category === 'බැංකු මුදල් ආපසු ගැනීම')
          .reduce((sum, income) => sum + income.amount, 0)

        const totalIncome = incomesResponse.data.totalAmount || 0
        const totalExpense = expensesResponse.data.totalAmount || 0
        const netCashFlow = totalIncome - totalExpense
        
        // Calculate current balances (end of selected period)
        const currentBankDeposit = periodStartBankDeposit + periodBankDeposits - periodBankWithdrawals
        const currentCashOnHand = periodStartCashOnHand + netCashFlow

        // Create full report data with regenerated transaction details
        const fullReportData = {
          period: { startDate: savedStartDate, endDate: savedEndDate },
          incomes,
          expenses,
          totals: {
            totalIncome,
            totalExpense,
            netCashFlow,
            periodBankDeposits,
            periodBankWithdrawals,
            currentCashOnHand,
            currentBankDeposit,
            periodStartCashOnHand,
            periodStartBankDeposit
          },
          isRegeneratedFromSaved: true
        }

        setReportData(fullReportData)
        showNotification("සුරකින ලද වාර්තාව සම්පූර්ණ විස්තර සහිතව සාර්ථකව පූරණය විය", "success")
      } else {
        showNotification("සුරකින ලද වාර්තාව පූරණය කිරීමේදී දෝෂයක් සිදුවිය", "error")
      }

    } catch (error) {
      console.error("Error loading saved report:", error)
      showNotification("සුරකින ලද වාර්තාව පූරණය කිරීමේදී දෝෂයක් සිදුවිය", "error")
    } finally {
      setLoading(false)
    }
  }

  // Handle view mode change
  const handleViewModeChange = (event) => {
    const newMode = event.target.checked ? 'saved' : 'new'
    setViewMode(newMode)
    setReportData(null) // Clear current report
    setSelectedSavedReport('')
    
    if (newMode === 'saved') {
      fetchSavedReports()
    }
  }

  const fetchReportData = async () => {
    if (!startDate || !endDate) {
      showNotification("කරුණාකර දින පරාසය තෝරන්න", "warning")
      return
    }

    setLoading(true)
    console.log("Starting report generation...")
    console.log("Date range:", startDate.toISOString(), "to", endDate.toISOString())
    
    try {
      console.log("Making API calls...")
      console.log("Base URL:", baseUrl)
      
      // Make API calls individually to isolate which one is hanging
      console.log("1. Fetching incomes...")
      const incomesResponse = await api.get(`${baseUrl}/account/incomes`, {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      })
      console.log("✓ Incomes response received:", incomesResponse.data)

      console.log("2. Fetching expenses...")
      const expensesResponse = await api.get(`${baseUrl}/account/expenses/all`, {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      })
      console.log("✓ Expenses response received:", expensesResponse.data)

      console.log("3. Fetching last balance...")
      let lastBalanceResponse
      try {
        lastBalanceResponse = await api.get(`${baseUrl}/period-balance/last-balance`, {
          params: {
            beforeDate: startDate.toISOString()
          },
          timeout: 10000 // 10 second timeout
        })
        console.log("✓ Last balance response received:", lastBalanceResponse.data)
      } catch (balanceError) {
        console.warn("Failed to fetch last balance, using initial values from environment:", balanceError.message)
        // Use initial values from environment variables if the API call fails or no records found
        const initialCashOnHand = parseFloat(process.env.GATSBY_INITIAL_CASH_ON_HAND || 0)
        const initialBankDeposit = parseFloat(process.env.GATSBY_INITIAL_BANK_DEPOSIT || 0)
        
        console.log("Using initial values from .env:", {
          initialCashOnHand,
          initialBankDeposit
        })
        
        lastBalanceResponse = {
          data: {
            success: true,
            balance: {
              endingCashOnHand: initialCashOnHand,
              endingBankDeposit: initialBankDeposit,
              periodEndDate: new Date('2024-12-31'),
              isInitial: true
            }
          }
        }
      }

      if (incomesResponse.data.success && expensesResponse.data.success && lastBalanceResponse.data.success) {
        console.log("All API calls successful, processing data...")
        const incomes = incomesResponse.data.incomes || []
        const expenses = expensesResponse.data.expenses || []
        const lastBalance = lastBalanceResponse.data.balance
        
        console.log("Processing incomes:", incomes.length, "items")
        console.log("Processing expenses:", expenses.length, "items")
        console.log("Last balance:", lastBalance)
        
        // Starting balances for this period (from last stored balance or initial amounts)
        const periodStartCashOnHand = lastBalance.endingCashOnHand
        const periodStartBankDeposit = lastBalance.endingBankDeposit

        // Calculate totals by category
        const incomeByCategory = calculateIncomeByCategory(incomes)
        const expenseByCategory = calculateExpenseByCategory(expenses)
        
        // Calculate bank transactions during the period
        const periodBankDeposits = expenses
          .filter(expense => expense.category === 'බැංකු තැන්පතු')
          .reduce((sum, expense) => sum + expense.amount, 0)

        // Calculate bank withdrawals from incomes
        const periodBankWithdrawals = incomes
          .filter(income => income.category === 'බැංකු මුදල් ආපසු ගැනීම')
          .reduce((sum, income) => sum + income.amount, 0)

        const totalIncome = incomesResponse.data.totalAmount || 0
        const totalExpense = expensesResponse.data.totalAmount || 0
        const netCashFlow = totalIncome - totalExpense
        
        // Calculate current balances (end of selected period)
        const currentBankDeposit = periodStartBankDeposit + periodBankDeposits - periodBankWithdrawals
        const currentCashOnHand = periodStartCashOnHand + netCashFlow

        console.log("Report data calculated successfully")
        setReportData({
          period: { startDate, endDate },
          incomes,
          expenses,
          incomeByCategory,
          expenseByCategory,
          totals: {
            totalIncome,
            totalExpense,
            netCashFlow,
            periodBankDeposits,
            periodBankWithdrawals,
            currentCashOnHand,
            currentBankDeposit,
            periodStartCashOnHand, // Starting balance for this period
            periodStartBankDeposit // Starting balance for this period
          }
        })
      } else {
        console.error("One or more API calls failed:")
        console.error("Incomes success:", incomesResponse.data.success)
        console.error("Expenses success:", expensesResponse.data.success)
        console.error("Balance success:", lastBalanceResponse.data.success)
        showNotification("API ප්‍රතිචාරවල දෝෂයක් සිදුවිය", "error")
      }
    } catch (error) {
      console.error("Error fetching report data:", error)
      console.error("Error details:", error.response?.data || error.message)
      showNotification(`වාර්තා දත්ත ලබා ගැනීමේදී දෝෂයක් සිදුවිය: ${error.response?.data?.message || error.message}`, "error")
    } finally {
      console.log("Report generation completed, setting loading to false")
      setLoading(false)
    }
  }

  const calculateIncomeByCategory = (incomes) => {
    const categoryTotals = {}
    incomes.forEach(income => {
      const category = income.category
      categoryTotals[category] = (categoryTotals[category] || 0) + income.amount
    })
    return categoryTotals
  }

  const calculateExpenseByCategory = (expenses) => {
    const categoryTotals = {}
    expenses.forEach(expense => {
      const category = expense.category
      categoryTotals[category] = (categoryTotals[category] || 0) + expense.amount
    })
    return categoryTotals
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('si-LK', {
      style: 'currency',
      currency: 'LKR'
    }).format(amount)
  }

  const formatDate = (date) => {
    return date.toLocaleDateString('si-LK')
  }

  const handlePrint = () => {
    window.print()
  }

  const handleSaveBalance = async () => {
    if (!reportData) return

    try {
      const dataToSave = {
        periodStartDate: startDate.toISOString(),
        periodEndDate: endDate.toISOString(),
        endingCashOnHand: reportData.totals.currentCashOnHand,
        endingBankDeposit: reportData.totals.currentBankDeposit,
        totalIncome: reportData.totals.totalIncome,
        totalExpense: reportData.totals.totalExpense,
        netCashFlow: reportData.totals.netCashFlow
      }

      const response = await api.post(`${baseUrl}/period-balance/save-balance`, dataToSave, {
        timeout: 15000 // 15 second timeout
      })

      if (response.data.success) {
        showNotification("කාල සීමාවේ ශේෂය සාර්ථකව සුරකින ලදී!", "success")
      } else {
        showNotification("ශේෂය සුරැකීමේදී දෝෂයක් සිදුවිය", "error")
      }
    } catch (error) {
      console.error("Error saving balance:", error)
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message
      showNotification(`ශේෂය සුරැකීමේදී දෝෂයක් සිදුවිය: ${errorMessage}`, "error")
    }
  }

  const getIncomeColor = (category) => {
    if (category === 'සාමාජික ගාස්තු' || category === 'දඩ මුදල්') return "info"
    if (category.includes('කුලිය')) return "primary"
    if (category.includes('බැංකු')) return "success"
    if (category.includes('පරිත්‍යාග')) return "secondary"
    return "default"
  }

  const getExpenseColor = (category) => {
    if (category.includes('ප්‍රතිලාභ') || category.includes('ආධාර')) return "error"
    if (category.includes('කම්කරු') || category.includes('සේවා')) return "warning"
    if (category.includes('කාර්යාල') || category.includes('සභා')) return "info"
    if (category.includes('බැංකු')) return "success"
    return "default"
  }

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

  // Check if user has permission to view monthly reports
  if (!roles.includes("treasurer") && !roles.includes("auditor") && !roles.includes("chairman")) {
    return (
      <Layout>
        <AuthComponent onAuthStateChange={handleAuthStateChange} />
        <Box sx={{ padding: "20px", textAlign: "center" }}>
          <Paper sx={{ padding: "40px", borderRadius: "10px", maxWidth: "600px", margin: "0 auto" }}>
            <Typography variant="h5" gutterBottom sx={{ color: "#f44336", marginBottom: "20px" }}>
              ප්‍රවේශ අවසරයක් නැත
            </Typography>
            <Typography variant="body1" sx={{ marginBottom: "20px" }}>
              මාසික වාර්තා බැලීමට ඔබට අවසර නැත. මෙම තොරතුරු භාණ්ඩාගාරික, ගණකාධිකාරී හෝ සභාපතිවරුන්ට පමණක් ප්‍රවේශ විය හැක.
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => navigate("/member/home")}
              sx={{ marginTop: "10px" }}
            >
              මුල් පිටුවට යන්න
            </Button>
          </Paper>
        </Box>
      </Layout>
    )
  }

  return (
    <Layout>
      <AuthComponent onAuthStateChange={handleAuthStateChange} />
      <section style={{ padding: "20px" }} className="no-print">
        <Box sx={{ maxWidth: "1400px", margin: "0 auto" }}>
          <Paper sx={{ padding: "30px", borderRadius: "10px" }}>
            <Typography
              variant="h4"
              gutterBottom
              sx={{ textAlign: "center", marginBottom: "30px", color: "#2c3e50" }}
            >
              මාසික ආදායම්/වියදම් වාර්තාව
            </Typography>

            {/* View Mode Toggle - Hide for auditors since they can only view saved reports */}
            {!roles.includes("auditor") && (
              <Box sx={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={viewMode === 'saved'}
                      onChange={handleViewModeChange}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <HistoryIcon />
                      <Typography>සුරකින ලද වාර්තා බලන්න</Typography>
                    </Box>
                  }
                />
              </Box>
            )}

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              {/* Date Range Filter or Saved Report Selector */}
              {viewMode === 'new' ? (
                <Grid2 container spacing={2} sx={{ marginBottom: "30px" }}>
                  <Grid2 size={{ xs: 12, sm: 6, md: 2.4 }}>
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
                  <Grid2 size={{ xs: 12, sm: 6, md: 2.4 }}>
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
                  <Grid2 size={{ xs: 12, sm: 4, md: 2.4 }}>
                    <Button
                      variant="contained"
                      onClick={fetchReportData}
                      disabled={loading}
                      sx={{ 
                        height: "56px", 
                        width: "100%",
                        textTransform: "none" 
                      }}
                    >
                      {loading ? "සකසමින්..." : "වාර්තාව සකසන්න"}
                    </Button>
                  </Grid2>
                  <Grid2 size={{ xs: 12, sm: 4, md: 2.4 }}>
                    <Button
                      variant="outlined"
                      startIcon={<PrintIcon />}
                      onClick={handlePrint}
                      disabled={!reportData}
                      sx={{ 
                        height: "56px", 
                        width: "100%",
                        textTransform: "none" 
                      }}
                    >
                      මුද්‍රණය කරන්න
                    </Button>
                  </Grid2>
                  <Grid2 size={{ xs: 12, sm: 4, md: 2.4 }}>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<SaveIcon />}
                      onClick={handleSaveBalance}
                      disabled={!reportData}
                      sx={{ 
                        height: "56px", 
                        width: "100%",
                        textTransform: "none" 
                      }}
                    >
                      ශේෂය සුරකින්න
                    </Button>
                  </Grid2>
                </Grid2>
              ) : (
                <Grid2 container spacing={2} sx={{ marginBottom: "30px" }}>
                  <Grid2 size={{ xs: 12, md: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel>සුරකින ලද වාර්තාවක් තෝරන්න</InputLabel>
                      <Select
                        value={selectedSavedReport}
                        label="සුරකින ලද වාර්තාවක් තෝරන්න"
                        onChange={(e) => {
                          setSelectedSavedReport(e.target.value)
                          loadSavedReport(e.target.value)
                        }}
                        disabled={loadingSavedReports}
                      >
                        {savedReports.map((report) => (
                          <MenuItem key={report._id} value={report._id}>
                            {report.periodStartDate ? (
                              <>
                                {formatDate(new Date(report.periodStartDate))} - {formatDate(new Date(report.periodEndDate))} 
                                (ශුද්ධ: {formatCurrency(report.netCashFlow || 0)})
                              </>
                            ) : (
                              <>
                                {formatDate(new Date(report.periodEndDate))} 
                                (ශුද්ධ: {formatCurrency(report.netCashFlow || 0)}) [සීමිත දත්ත]
                              </>
                            )}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid2>
                  <Grid2 size={{ xs: 12, md: 3 }}>
                    <Button
                      variant="outlined"
                      startIcon={<PrintIcon />}
                      onClick={handlePrint}
                      disabled={!reportData}
                      sx={{ 
                        height: "56px", 
                        width: "100%",
                        textTransform: "none" 
                      }}
                    >
                      මුද්‍රණය කරන්න
                    </Button>
                  </Grid2>
                  <Grid2 size={{ xs: 12, md: 3 }}>
                    <Button
                      variant="contained"
                      startIcon={<HistoryIcon />}
                      onClick={fetchSavedReports}
                      disabled={loadingSavedReports}
                      sx={{ 
                        height: "56px", 
                        width: "100%",
                        textTransform: "none" 
                      }}
                    >
                      {loadingSavedReports ? "පූරණය වේ..." : "යළි පූරණය"}
                    </Button>
                  </Grid2>
                </Grid2>
              )}
            </LocalizationProvider>

            {reportData && (
              <Box id="report-content">
                {/* Report Header */}
                <Box sx={{ textAlign: "center", marginBottom: "30px" }} className="print-only">
                  <Typography variant="h4" sx={{ fontWeight: "bold", marginBottom: "10px" }}>
                    එක්සත් සමිතිය
                  </Typography>
                  <Typography variant="h5" sx={{ marginBottom: "10px" }}>
                    {reportData.isRegeneratedFromSaved ? "සුරකින ලද කාල සීමාවේ සම්පූර්ණ " : 
                     reportData.isSavedReport ? "සුරකින ලද " : ""}මාසික ආදායම්/වියදම් වාර්තාව
                  </Typography>
                  <Typography variant="h6">
                    {formatDate(reportData.period.startDate)} සිට {formatDate(reportData.period.endDate)} දක්වා
                  </Typography>
                  {reportData.isRegeneratedFromSaved && (
                    <Typography variant="body2" color="primary" sx={{ marginTop: 1, fontWeight: "bold" }}>
                      (සුරකින ලද වාර්තාවෙන් සම්පූර්ණ විස්තර සහිතව නැවත ජනනය කරන ලදී)
                    </Typography>
                  )}
                  {reportData.isSavedReport && !reportData.isRegeneratedFromSaved && (
                    <Typography variant="body2" color="textSecondary" sx={{ marginTop: 1 }}>
                      (සුරකින ලද වාර්තාව - විස්තරාත්මක ගනුදෙනු දත්ත නැත)
                    </Typography>
                  )}
                </Box>

                {/* Summary Cards */}
                <Grid2 container spacing={3} sx={{ marginBottom: "30px" }}>
                  <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
                    <Card sx={{ bgcolor: "#e8f5e8" }}>
                      <CardContent>
                        <Typography variant="h6" color="#2e7d32">කාල සීමාවේ මුළු ආදායම</Typography>
                        <Typography variant="h4" sx={{ fontWeight: "bold", color: "#2e7d32" }}>
                          {formatCurrency(reportData.totals.totalIncome)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid2>
                  <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
                    <Card sx={{ bgcolor: "#ffebee" }}>
                      <CardContent>
                        <Typography variant="h6" color="#d32f2f">කාල සීමාවේ මුළු වියදම</Typography>
                        <Typography variant="h4" sx={{ fontWeight: "bold", color: "#d32f2f" }}>
                          {formatCurrency(reportData.totals.totalExpense)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid2>
                  <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
                    <Card sx={{ 
                      bgcolor: reportData.totals.netCashFlow >= 0 ? "#e8f5e8" : "#ffebee"
                    }}>
                      <CardContent>
                        <Typography variant="h6" color={
                          reportData.totals.netCashFlow >= 0 ? "#2e7d32" : "#d32f2f"
                        }>
                          ශුද්ධ මුදල් ප්‍රවාහය
                        </Typography>
                        <Typography variant="h4" sx={{ 
                          fontWeight: "bold", 
                          color: reportData.totals.netCashFlow >= 0 ? "#2e7d32" : "#d32f2f"
                        }}>
                          {formatCurrency(reportData.totals.netCashFlow)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid2>
                </Grid2>

                {/* Current Balances */}
                <Grid2 container spacing={3} sx={{ marginBottom: "30px" }}>
                  <Grid2 size={{ xs: 12, sm: 6 }}>
                    <Card sx={{ bgcolor: "#e3f2fd", border: "2px solid #1976d2" }}>
                      <CardContent>
                        <Typography variant="h6" color="#1976d2" sx={{ marginBottom: "10px" }}>
                          වර්තමාන බැංකු තැන්පතු
                        </Typography>
                        {!reportData.isSavedReport ? (
                          <>
                            <Typography variant="body2" color="#666" sx={{ marginBottom: "5px" }}>
                              කාල සීමාව ආරම්භයේ: {formatCurrency(reportData.totals.periodStartBankDeposit)}
                            </Typography>
                            <Typography variant="body2" color="#666" sx={{ marginBottom: "5px" }}>
                              කාල සීමාවේ තැන්පතු: +{formatCurrency(reportData.totals.periodBankDeposits)}
                            </Typography>
                            <Typography variant="body2" color="#666" sx={{ marginBottom: "10px" }}>
                              කාල සීමාවේ ආපසු ගැනීම්: -{formatCurrency(reportData.totals.periodBankWithdrawals)}
                            </Typography>
                          </>
                        ) : (
                          <Typography variant="body2" color="#666" sx={{ marginBottom: "10px" }}>
                            කාල සීමාව අවසානයේ ශේෂය:
                          </Typography>
                        )}
                        <Typography variant="h4" sx={{ fontWeight: "bold", color: "#1976d2" }}>
                          {formatCurrency(reportData.totals.currentBankDeposit)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid2>
                  <Grid2 size={{ xs: 12, sm: 6 }}>
                    <Card sx={{ 
                      bgcolor: reportData.totals.currentCashOnHand >= 0 ? "#e8f5e8" : "#ffebee",
                      border: `2px solid ${reportData.totals.currentCashOnHand >= 0 ? "#2e7d32" : "#d32f2f"}`
                    }}>
                      <CardContent>
                        <Typography variant="h6" color={
                          reportData.totals.currentCashOnHand >= 0 ? "#2e7d32" : "#d32f2f"
                        } sx={{ marginBottom: "10px" }}>
                          වර්තමාන අත ඉතිරි මුදල
                        </Typography>
                        {!reportData.isSavedReport ? (
                          <>
                            <Typography variant="body2" color="#666" sx={{ marginBottom: "5px" }}>
                              කාල සීමාව ආරම්භයේ: {formatCurrency(reportData.totals.periodStartCashOnHand)}
                            </Typography>
                            <Typography variant="body2" color="#666" sx={{ marginBottom: "10px" }}>
                              කාල සීමාවේ ශුද්ධ ප්‍රවාහය: {reportData.totals.netCashFlow >= 0 ? '+' : ''}{formatCurrency(reportData.totals.netCashFlow)}
                            </Typography>
                          </>
                        ) : (
                          <Typography variant="body2" color="#666" sx={{ marginBottom: "10px" }}>
                            කාල සීමාව අවසානයේ ශේෂය:
                          </Typography>
                        )}
                        <Typography variant="h4" sx={{ 
                          fontWeight: "bold", 
                          color: reportData.totals.currentCashOnHand >= 0 ? "#2e7d32" : "#d32f2f"
                        }}>
                          {formatCurrency(reportData.totals.currentCashOnHand)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid2>
                </Grid2>

                {/* Net Cash Flow Alert */}
                <Alert 
                  severity={reportData.totals.netCashFlow >= 0 ? "success" : "warning"}
                  sx={{ marginBottom: "15px" }}
                >
                  <Typography variant="h6">
                    මෙම කාල සීමාවේ ශුද්ධ මුදල් ප්‍රවාහය: {" "}
                    <strong>{formatCurrency(reportData.totals.netCashFlow)}</strong>
                    {reportData.totals.netCashFlow >= 0 ? " (ධනාත්මක)" : " (ඍණාත්මක)"}
                  </Typography>
                </Alert>

                {/* Total Assets Alert */}
                <Alert 
                  severity="info"
                  sx={{ marginBottom: "30px" }}
                >
                  <Typography variant="h6">
                    මුළු වත්කම් (බැංකු + අත ඉතිරි): {" "}
                    <strong>{formatCurrency(reportData.totals.currentBankDeposit + reportData.totals.currentCashOnHand)}</strong>
                  </Typography>
                </Alert>

                {/* Income and Expense Details */}
                {!reportData.isSavedReport || reportData.isRegeneratedFromSaved ? (
                  <>
                    {/* Income Summary */}
                    <Box sx={{ marginBottom: "30px" }}>
                      <Typography variant="h5" sx={{ marginBottom: "15px", color: "#2e7d32" }}>
                        ආදායම් සාරාංශය
                      </Typography>
                      <TableContainer component={Paper}>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ backgroundColor: "#e8f5e8" }}>
                              <TableCell sx={{ fontWeight: "bold" }}>ප්‍රවර්ගය</TableCell>
                              <TableCell sx={{ fontWeight: "bold" }}>විස්තර/මූලාශ්‍රය</TableCell>
                              <TableCell align="right" sx={{ fontWeight: "bold" }}>මුදල</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {reportData.incomes.map((income, index) => (
                              <TableRow key={income._id || index}>
                                <TableCell>
                                  <Chip 
                                    label={income.category} 
                                    color={getIncomeColor(income.category)}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>
                                  {income.source && (
                                    <Typography variant="body2" sx={{ marginBottom: "2px" }}>
                                      <strong>මූලාශ්‍රය:</strong> {income.source}
                                    </Typography>
                                  )}
                                  {income.description && (
                                    <Typography variant="body2">
                                      <strong>විස්තරය:</strong> {income.description}
                                    </Typography>
                                  )}
                                  {!income.source && !income.description && "-"}
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: "bold" }}>
                                  {formatCurrency(income.amount)}
                                </TableCell>
                              </TableRow>
                            ))}
                            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                              <TableCell sx={{ fontWeight: "bold", fontStyle: "italic" }}></TableCell>
                              <TableCell sx={{ fontWeight: "bold" }}>මුළු ආදායම</TableCell>
                              <TableCell align="right" sx={{ fontWeight: "bold", fontSize: "1.1em" }}>
                                {formatCurrency(reportData.totals.totalIncome)}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>

                    {/* Expense Summary */}
                    <Box sx={{ marginBottom: "30px" }}>
                      <Typography variant="h5" sx={{ marginBottom: "15px", color: "#d32f2f" }}>
                        වියදම් සාරාංශය
                      </Typography>
                      <TableContainer component={Paper}>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ backgroundColor: "#ffebee" }}>
                              <TableCell sx={{ fontWeight: "bold" }}>ප්‍රවර්ගය</TableCell>
                              <TableCell sx={{ fontWeight: "bold" }}>විස්තර/ප්‍රතිලාභලාභී/ගෙවන ලද තැන</TableCell>
                              <TableCell align="right" sx={{ fontWeight: "bold" }}>මුදල</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {reportData.expenses.map((expense, index) => (
                              <TableRow key={expense._id || index}>
                                <TableCell>
                                  <Chip 
                                    label={expense.category} 
                                    color={getExpenseColor(expense.category)}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>
                                  {expense.beneficiaryMemberId && (
                                    <Typography variant="body2" sx={{ marginBottom: "2px" }}>
                                      <strong>ප්‍රතිලාභලාභී සාමාජික ID:</strong> {expense.beneficiaryMemberId}
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
                              </TableRow>
                            ))}
                            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                              <TableCell sx={{ fontWeight: "bold", fontStyle: "italic" }}></TableCell>
                              <TableCell sx={{ fontWeight: "bold" }}>මුළු වියදම</TableCell>
                              <TableCell align="right" sx={{ fontWeight: "bold", fontSize: "1.1em" }}>
                                {formatCurrency(reportData.totals.totalExpense)}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  </>
                ) : (
                  /* Saved Report Notice */
                  <Alert severity="info" sx={{ marginBottom: "30px" }}>
                    <Typography variant="h6">
                      මෙය සීමිත දත්ත සහිත සුරකින ලද වාර්තාවකි. විස්තරාත්මක ගනුදෙනු දත්ත ලබා ගත නොහැක.
                    </Typography>
                    <Typography variant="body2" sx={{ marginTop: 1 }}>
                      සම්පූර්ණ ගනුදෙනු විස්තර සඳහා නව වාර්තාවක් ජනනය කරන්න හෝ කාල සීමා ආරම්භක දිනය සහිත වාර්තාවක් තෝරන්න.
                    </Typography>
                  </Alert>
                )}

                {/* Report Footer */}
                <Box sx={{ marginTop: "40px", textAlign: "center" }} className="print-only">
                  <Divider sx={{ marginBottom: "20px" }} />
                  <Typography variant="body2" color="textSecondary">
                    වාර්තාව සකස් කළ දිනය: {formatDate(new Date())}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    එක්සත් සමිතිය - භාණ්ඩාගාරික වාර්තාව
                  </Typography>
                </Box>
              </Box>
            )}

            {!reportData && (
              <Box sx={{ textAlign: "center", marginTop: "40px" }}>
                <Typography variant="h6" color="textSecondary">
                  {viewMode === 'new' 
                    ? "වාර්තාව නිර්මාණය කිරීමට මුල කරන්න" 
                    : "සුරකින ලද වාර්තාවක් තෝරන්න"
                  }
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      </section>

      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
        
        @media screen {
          .print-only {
            display: none !important;
          }
        }
      `}</style>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Layout>
  )
}
