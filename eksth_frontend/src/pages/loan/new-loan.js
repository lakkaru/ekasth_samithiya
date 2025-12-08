import React, { useEffect, useState } from "react"
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Grid2,
  Chip,
  Divider,
  Avatar,
  Paper,
  IconButton,
  Tooltip,
} from "@mui/material"
import {
  PersonSearch as PersonSearchIcon,
  AccountBalance as AccountBalanceIcon,
  Person as PersonIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Money as MoneyIcon,
  CalendarToday as CalendarIcon,
  Security as SecurityIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material"
import Layout from "../../components/layout"
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import { DemoContainer } from "@mui/x-date-pickers/internals/demo"
import dayjs from "dayjs"

import { navigate } from "gatsby"
import api from "../../utils/api"

//un authorized access preventing
import loadable from "@loadable/component"
const AuthComponent = loadable(() =>
  import("../../components/common/AuthComponent")
)
const baseUrl = process.env.GATSBY_API_BASE_URL
// const token = localStorage.getItem("authToken")
let token = null

if (typeof window !== "undefined") {
  token = localStorage.getItem("authToken")
}

export default function NewLoan() {
  //un authorized access preventing
  const [roles, setRoles] = useState([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const [loading, setLoading] = useState(true) // Handle loading state
  const [error, setError] = useState(null)

  const [member_id, setMember_id] = useState("")
  const [member, setMember] = useState("")
  const [existingLoan, setExistingLoan] = useState(false)
  const [loanNumber, setLoanNumber] = useState("")
  const [loanAmount, setLoanAmount] = useState("")
  const [loanDate, setLoanDate] = useState(dayjs()) // Default to today
  const [guarantor1_id, setGuarantor1_id] = useState("")
  const [guarantor1, setGuarantor1] = useState("")
  const [guarantor2_id, setGuarantor2_id] = useState("")
  const [guarantor2, setGuarantor2] = useState("")

  const [alert, setAlert] = useState({ open: false, severity: "", message: "" }) // Alert state

  const handleCloseAlert = () =>
    setAlert({ open: false, severity: "", message: "" })

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('si-LK', {
      style: 'currency',
      currency: 'LKR'
    }).format(amount || 0)
  }

  // Function to fetch next available loan number
  const getNextLoanNumber = async () => {
    try {
      const response = await api.get(`${baseUrl}/loan/next-loan-number`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (response.data.success) {
        setLoanNumber(response.data.nextLoanNumber)
        setAlert({
          open: true,
          severity: "info",
          message: `ඊලග ණය අංකය (${response.data.nextLoanNumber}) ස්වයංක්‍රීයව පූරණය කරන ලදි`,
        })
      }
    } catch (error) {
      console.error("Error fetching next loan number:", error)
      setAlert({
        open: true,
        severity: "error",
        message: "ණය අංකය ලබා ගැනීමේදී දෝෂයක් සිදුවිය",
      })
    }
  }

  const getMemberInfoById = async e => {
    try {
      await api
        .get(`${baseUrl}/member/getMemberAllInfoById?member_id=${member_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(response => {
          // console.log(response.data)
          const memberData = response?.data?.memberData
          setMember(memberData || {})
          
          // Check if member has an existing active loan
          const hasActiveLoan = memberData?.loanInfo?.loan && 
                                memberData?.loanInfo?.loan.loanRemainingAmount > 0
          setExistingLoan(hasActiveLoan)
          
          // Check if member has outstanding dues (temporarily disabled)
          const hasOutstandingDues = false // (memberData?.totalDue || 0) > 0
          
          if (hasActiveLoan) {
            setAlert({
              open: true,
              severity: "warning",
              message: `${memberData?.memberDetails?.name} සතුව දැනට අවසන් නොකළ ණයක් ඇත. පරණ ණය අවසන් කළ පසු නව ණයක් ලබා ගත හැක.`,
            })
          } else if (hasOutstandingDues) {
            setAlert({
              open: true,
              severity: "warning",
              message: `${memberData?.memberDetails?.name} සතුව ${formatCurrency(memberData.totalDue)} හිඟ මුදලක් ඇත. හිඟ මුදල් සම්පූර්ණයෙන් ගෙවා නව ණයක් ලබා ගත හැක.`,
            })
            setExistingLoan(true) // Block loan form
          } else {
            // Member is eligible for a loan, fetch next loan number
            getNextLoanNumber()
          }
        })
        .catch(error => {
          setAlert({
            open: true,
            severity: "error",
            message: "සාමාජිකයා සොයා ගත නොහැක.",
          })

          console.error("api error : ", error)
        })
    } catch (error) {
      // navigate('../404')
    }
  }

  const getGuarantor1ById = e => {
    // console.log("guarantor 1 :", guarantor1_id)
    api
      .get(`${baseUrl}/member/getMemberAllInfoById?member_id=${guarantor1_id}&exclude_loan_installment=true`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(response => {
        // console.log("gu1: ", response.data)
        const guarantorData = response?.data?.memberData
        const memberDetails = guarantorData?.memberDetails || {}
        const guarantorInfo = {
          ...memberDetails,
          totalDue: guarantorData?.totalDue || 0,
          // Add additional financial details for guarantors
          membershipRate: guarantorData?.membershipRate || 0,
          currentMembershipDue: guarantorData?.currentMembershipDue || 0,
          fines: guarantorData?.fines || {},
          groupedPayments: guarantorData?.groupedPayments || {},
          loanInfo: guarantorData?.loanInfo || null
        }
        setGuarantor1(guarantorInfo)
        // Check guarantor count after setting the guarantor - use the member's _id
        checkGuarantorCount(memberDetails?._id, guarantorInfo)
      })
      .catch(error => {
        console.error("api error : ", error)
        setAlert({
          open: true,
          severity: "error",
          message: "සාමාජික සෙවීමේදී දෝෂයක් සිදුවිය. කරුණාකර නැවත උත්සාහ කරන්න",
        })
        setGuarantor1({})
      })
  }
  const getGuarantor2ById = e => {
    api
      .get(`${baseUrl}/member/getMemberAllInfoById?member_id=${guarantor2_id}&exclude_loan_installment=true`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(response => {
        const guarantorData = response?.data?.memberData
        const memberDetails = guarantorData?.memberDetails || {}
        const guarantorInfo = {
          ...memberDetails,
          totalDue: guarantorData?.totalDue || 0,
          // Add additional financial details for guarantors
          membershipRate: guarantorData?.membershipRate || 0,
          currentMembershipDue: guarantorData?.currentMembershipDue || 0,
          fines: guarantorData?.fines || {},
          groupedPayments: guarantorData?.groupedPayments || {},
          loanInfo: guarantorData?.loanInfo || null
        }
        setGuarantor2(guarantorInfo)
        // Check guarantor count after setting the guarantor - use the member's _id
        checkGuarantorCount(memberDetails?._id, guarantorInfo)
      })
      .catch(error => {
        console.error("Axios error : ", error)
        setGuarantor2({})
      })
  }

  const checkGuarantorCount = async (memberId, guarantorData) => {
    try {
      const response = await api.get(`${baseUrl}/loan/active-loans`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      const activeLoans = response.data.activeLoans || []
      const guarantorCount = activeLoans.filter(loan => {
        const guarantor1Id = loan.guarantor1Id?._id || loan.guarantor1Id?.member_id || loan.guarantor1Id
        const guarantor2Id = loan.guarantor2Id?._id || loan.guarantor2Id?.member_id || loan.guarantor2Id
        return guarantor1Id === memberId || guarantor2Id === memberId
      }).length

      // Update the guarantor object with count
      guarantorData.guarantorCount = guarantorCount

      if (guarantorCount >= 2) {
        setAlert({
          open: true,
          severity: "warning",
          message: `මෙම සාමාජිකයා දැනටමත් ${guarantorCount} ණය සඳහා ඇපකරුවෙකු වේ. තවත් ණයකට ඇපකරුවෙකු වීමට නොහැක.`,
        })
      }
    } catch (error) {
      console.error("Error checking guarantor count:", error)
    }
  }

  const handleApply = () => {
    if (!member?.memberDetails?._id) {
      console.error("Member ID is missing. Cannot proceed with loan creation.")
      return
    }

    if (!guarantor1_id || !guarantor2_id) {
      console.error("Both guarantor IDs are required.")
      return
    }

    const postData = {
      memberId: member.memberDetails?._id, // Use member's ObjectId here
      guarantor1Id: guarantor1._id,
      guarantor2Id: guarantor2._id,
      loanNumber,
      loanAmount,
      loanRemainingAmount: loanAmount,
      loanDate: loanDate.toISOString(), // Ensure ISO format for the date
    }

    api
      .post(`${baseUrl}/loan/create`, postData, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(response => {
        console.log("Loan recorded successfully:", response.data)

        setAlert({
          open: true,
          severity: "success",
          message: "නව ණයක් සාර්ථකව සටහන් කර ඇත.",
        })
        // Reset form fields
        setLoanNumber("")
        setLoanAmount("")
        setLoanDate(dayjs())
        setGuarantor1_id("")
        setGuarantor1("")
        setGuarantor2_id("")
        setGuarantor2("")
      })
      .catch(error => {
        console.error("Error recording loan:", error)
        const errorMessage = error.response?.data?.message || "නව ණයක් සටහන් කිරීමට නොහැකි විය"
        setAlert({
          open: true,
          severity: "error",
          message: errorMessage,
        })
      })

    // Clear all fields
    resetFields()
  }

  const resetFields = () => {
    setMember_id("")
    setMember("")
    setExistingLoan(false)
    setLoanNumber("") // Clear the auto-populated loan number
    setLoanAmount("")
    setLoanDate(dayjs())
    setGuarantor1_id("")
    setGuarantor1("")
    setGuarantor2_id("")
    setGuarantor2("")
  }

  //un authorized access preventing
  const handleAuthStateChange = ({ isAuthenticated, roles }) => {
    setIsAuthenticated(isAuthenticated)
    setRoles(roles)
    if (!isAuthenticated || !roles.includes("loan-treasurer")) {
      navigate("/login/user-login")
    }
  }

useEffect(()=>{
  const blacklistMembers = async () => {
    // console.log('first')
    try {
      const blacklisted = await api.get(`${baseUrl}/member/blacklist`)
      console.log("blacklisted: ", blacklisted.data)
    } catch (err) {
      console.error("Error fetching attendance data:", err)
    } finally {
      setLoading(false)
    }
  }
  blacklistMembers()
},[])

  // console.log('existingLoan: ', existingLoan)
  return (
    <Layout>
      <AuthComponent onAuthStateChange={handleAuthStateChange} />
      <Box sx={{ 
        maxWidth: 1200, 
        mx: 'auto', 
        p: 3,
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        minHeight: '100vh'
      }}>
        <Snackbar
          open={alert.open}
          autoHideDuration={3000}
          onClose={handleCloseAlert}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
          sx={{ mt: 8 }}
        >
          <Alert onClose={handleCloseAlert} severity={alert.severity}>
            {alert.message}
          </Alert>
        </Snackbar>

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
                නව ණය අයදුම්පත්‍රය
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                නව ණයක් ලබා දීම සඳහා සම්පූර්ණ තොරතුරු ඇතුළත් කරන්න
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Member Search Section */}
        <Card elevation={2} sx={{ mb: 3, borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Avatar sx={{ bgcolor: '#1976d2', width: 40, height: 40 }}>
                <PersonIcon />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                අයදුම්කරු තොරතුරු
              </Typography>
            </Box>
            
            <Grid2 container spacing={3} alignItems="end">
              <Grid2 xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="සාමාජික අංකය"
                  variant="outlined"
                  type="number"
                  value={member_id}
                  onChange={e => {
                    setMember_id(e.target.value)
                    setMember({})
                  }}
                  onFocus={resetFields}
                  InputProps={{
                    startAdornment: <PersonIcon sx={{ mr: 1, color: '#666' }} />
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    }
                  }}
                />
              </Grid2>
              <Grid2 xs={12} sm={3}>
                <Button
                  variant="contained"
                  onClick={getMemberInfoById}
                  startIcon={<PersonSearchIcon />}
                  fullWidth
                  sx={{
                    py: 1.8,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                    }
                  }}
                >
                  සොයන්න
                </Button>
              </Grid2>
            </Grid2>

            {/* Member Info Display */}
            {member.memberDetails?.name && (
              <Paper 
                elevation={1} 
                sx={{ 
                  p: 3, 
                  mt: 3, 
                  borderRadius: 2,
                  border: '1px solid #e0e0e0',
                  background: '#fafafa'
                }}
              >
                <Grid2 container spacing={2} alignItems="center">
                  <Grid2 xs={12} sm={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ bgcolor: '#4caf50', width: 32, height: 32 }}>
                        {member.memberDetails.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {member.memberDetails.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          සාමාජික අංකය: {member_id}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid2>
                  <Grid2 xs={12} sm={3}>
                    <Box>
                      <Typography variant="caption" color="textSecondary">
                        ප්‍රදේශය
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {member.memberDetails.area}
                      </Typography>
                    </Box>
                  </Grid2>
                  <Grid2 xs={12} sm={3}>
                    <Box>
                      <Typography variant="caption" color="textSecondary">
                        දුරකථන
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {member.memberDetails.mobile}
                      </Typography>
                    </Box>
                  </Grid2>
                  <Grid2 xs={12} sm={3}>
                    <Box sx={{ textAlign: 'right' }}>
                      <Chip
                        icon={<MoneyIcon />}
                        label={
                          (member.totalDue || 0) >= 0 
                            ? `හිඟ: ${formatCurrency(Math.abs(member.totalDue || 0))}`
                            : `ඉතිරි: ${formatCurrency(Math.abs(member.totalDue || 0))}`
                        }
                        color={(member.totalDue || 0) >= 0 ? "error" : "success"}
                        variant="outlined"
                        size="small"
                      />
                    </Box>
                  </Grid2>
                </Grid2>
              </Paper>
            )}
          </CardContent>
        </Card>
        {/* Loan Eligibility Warning */}
        {existingLoan && (
          <Card elevation={2} sx={{ mb: 3, borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ bgcolor: '#ff9800', width: 40, height: 40 }}>
                  <WarningIcon />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#ff9800' }}>
                  ණය ලබා දීමේ සීමාවන්
                </Typography>
              </Box>

              <Alert severity="warning" sx={{ borderRadius: 2 }}>
                {member?.loanInfo?.loan && member?.loanInfo?.loan.loanRemainingAmount > 0 ? (
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                      {member.memberDetails?.name} සතුව දැනට අවසන් නොකළ ණයක් ඇත
                    </Typography>
                    <Grid2 container spacing={2}>
                      <Grid2 xs={12} sm={6} md={3}>
                        <Typography variant="caption" color="textSecondary">ණය අංකය</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {member.loanInfo.loan.loanNumber}
                        </Typography>
                      </Grid2>
                      <Grid2 xs={12} sm={6} md={3}>
                        <Typography variant="caption" color="textSecondary">ණය මුදල</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {formatCurrency(member.loanInfo.loan.loanAmount)}
                        </Typography>
                      </Grid2>
                      <Grid2 xs={12} sm={6} md={3}>
                        <Typography variant="caption" color="textSecondary">ඉතිරි මුදල</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#d32f2f' }}>
                          {formatCurrency(member.loanInfo.loan.loanRemainingAmount)}
                        </Typography>
                      </Grid2>
                      <Grid2 xs={12} sm={6} md={3}>
                        <Typography variant="caption" color="textSecondary">ණය දිනය</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {new Date(member.loanInfo.loan.loanDate).toLocaleDateString('si-LK')}
                        </Typography>
                      </Grid2>
                    </Grid2>
                    <Typography variant="body2" sx={{ mt: 2, fontWeight: 'bold', color: '#d32f2f' }}>
                      පරණ ණය සම්පූර්ණයෙන් අවසන් කළ පසු නව ණයක් ලබා ගත හැක.
                    </Typography>
                  </Box>
                ) : (member?.totalDue || 0) > 0 ? (
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                      {member.memberDetails?.name} සතුව හිඟ මුදලක් ඇත
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#d32f2f' }}>
                        මුළු හිඟ මුදල: {formatCurrency(member.totalDue)}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        (සාමාජික මුදල්, දඩ මුදල් සහ වෙනත් හිඟකම් ඇතුළුව)
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#d32f2f' }}>
                      හිඟ මුදල් සම්පූර්ණයෙන් ගෙවා නව ණයක් ලබා ගත හැක.
                    </Typography>
                  </Box>
                ) : null}
              </Alert>
            </CardContent>
          </Card>
        )}
        {/* Guarantor and Loan Details Section */}
        {Object.keys(member).length > 0 && !existingLoan && (
          <Box>
            {/* Guarantor 1 Section */}
            <Card elevation={2} sx={{ mb: 3, borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Avatar sx={{ bgcolor: '#2196f3', width: 40, height: 40 }}>
                    <PersonIcon />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                    පළමු ඇපකරු (First Guarantor)
                  </Typography>
                </Box>

                <Grid2 container spacing={3} sx={{ mb: 2 }}>
                  <Grid2 xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="ඇපකරු 1 අංකය"
                      value={guarantor1_id}
                      onChange={(e) => setGuarantor1_id(e.target.value)}
                      onBlur={getGuarantor1ById}
                      variant="outlined"
                      size="medium"
                      type="number"
                    />
                  </Grid2>
                  <Grid2 xs={12} md={4}>
                    <Button
                      variant="outlined"
                      onClick={getGuarantor1ById}
                      disabled={!guarantor1_id}
                      startIcon={<PersonSearchIcon />}
                      sx={{ height: '56px', borderRadius: 2 }}
                      fullWidth
                    >
                      සොයන්න
                    </Button>
                  </Grid2>
                </Grid2>

                {guarantor1.name && (
                  <Paper 
                    elevation={1} 
                    sx={{ 
                      p: 3, 
                      borderRadius: 2,
                      border: (guarantor1.guarantorCount || 0) >= 2 ? '2px solid #f44336' : '1px solid #e0e0e0',
                      bgcolor: (guarantor1.guarantorCount || 0) >= 2 ? '#ffebee' : '#f9f9f9'
                    }}
                  >
                    <Grid2 container spacing={3} alignItems="center">
                      <Grid2 xs={12} sm={3}>
                        <Box>
                          <Typography variant="caption" color="textSecondary">නම</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            {guarantor1.name}
                          </Typography>
                        </Box>
                      </Grid2>
                      <Grid2 xs={12} sm={3}>
                        <Box>
                          <Typography variant="caption" color="textSecondary">ප්‍රදේශය</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {guarantor1.area}
                          </Typography>
                        </Box>
                      </Grid2>
                      <Grid2 xs={12} sm={3}>
                        <Box>
                          <Typography variant="caption" color="textSecondary">දුරකථන</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {guarantor1.mobile}
                          </Typography>
                        </Box>
                      </Grid2>
                      <Grid2 xs={12} sm={3}>
                        <Box sx={{ textAlign: 'right' }}>
                          <Chip
                            label={`ඇපවිම්: ${guarantor1.guarantorCount || 0}`}
                            color={(guarantor1.guarantorCount || 0) >= 2 ? 'error' : 'success'}
                            size="medium"
                            sx={{ fontWeight: 'bold', mb: 1 }}
                          />
                          <br />
                          <Chip
                            label={`හිඟ: ${formatCurrency(guarantor1.totalDue || 0)}`}
                            color={(guarantor1.totalDue || 0) > 0 ? 'error' : 'success'}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      </Grid2>
                    </Grid2>

                    {(guarantor1.guarantorCount || 0) >= 2 && (
                      <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                        <Typography variant="body2">
                          <strong>මෙම සාමාජිකයා දැනටමත් 2ක් ඇපකරු ලෙස කටයුතු කරයි!</strong>
                        </Typography>
                      </Alert>
                    )}

                    {(guarantor1.totalDue || 0) > 0 && (
                      <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
                        <Typography variant="body2">
                          <strong>ඇපකරුට හිඟ මුදලක් ඇත!</strong>
                        </Typography>
                      </Alert>
                    )}
                  </Paper>
                )}
              </CardContent>
            </Card>

            {/* Guarantor 2 Section */}
            <Card elevation={2} sx={{ mb: 3, borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Avatar sx={{ bgcolor: '#4caf50', width: 40, height: 40 }}>
                    <PersonIcon />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#388e3c' }}>
                    දෙවන ඇපකරු (Second Guarantor)
                  </Typography>
                </Box>

                <Grid2 container spacing={3} sx={{ mb: 2 }}>
                  <Grid2 xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="ඇපකරු 2 අංකය"
                      value={guarantor2_id}
                      onChange={(e) => setGuarantor2_id(e.target.value)}
                      onBlur={getGuarantor2ById}
                      variant="outlined"
                      size="medium"
                      type="number"
                    />
                  </Grid2>
                  <Grid2 xs={12} md={4}>
                    <Button
                      variant="outlined"
                      onClick={getGuarantor2ById}
                      disabled={!guarantor2_id}
                      startIcon={<PersonSearchIcon />}
                      sx={{ height: '56px', borderRadius: 2 }}
                      fullWidth
                    >
                      සොයන්න
                    </Button>
                  </Grid2>
                </Grid2>

                {guarantor2.name && (
                  <Paper 
                    elevation={1} 
                    sx={{ 
                      p: 3, 
                      borderRadius: 2,
                      border: (guarantor2.guarantorCount || 0) >= 2 ? '2px solid #f44336' : '1px solid #e0e0e0',
                      bgcolor: (guarantor2.guarantorCount || 0) >= 2 ? '#ffebee' : '#f9f9f9'
                    }}
                  >
                    <Grid2 container spacing={3} alignItems="center">
                      <Grid2 xs={12} sm={3}>
                        <Box>
                          <Typography variant="caption" color="textSecondary">නම</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            {guarantor2.name}
                          </Typography>
                        </Box>
                      </Grid2>
                      <Grid2 xs={12} sm={3}>
                        <Box>
                          <Typography variant="caption" color="textSecondary">ප්‍රදේශය</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {guarantor2.area}
                          </Typography>
                        </Box>
                      </Grid2>
                      <Grid2 xs={12} sm={3}>
                        <Box>
                          <Typography variant="caption" color="textSecondary">දුරකථන</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {guarantor2.mobile}
                          </Typography>
                        </Box>
                      </Grid2>
                      <Grid2 xs={12} sm={3}>
                        <Box sx={{ textAlign: 'right' }}>
                          <Chip
                            label={`ඇපවිම්: ${guarantor2.guarantorCount || 0}`}
                            color={(guarantor2.guarantorCount || 0) >= 2 ? 'error' : 'success'}
                            size="medium"
                            sx={{ fontWeight: 'bold', mb: 1 }}
                          />
                          <br />
                          <Chip
                            label={`හිඟ: ${formatCurrency(guarantor2.totalDue || 0)}`}
                            color={(guarantor2.totalDue || 0) > 0 ? 'error' : 'success'}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      </Grid2>
                    </Grid2>

                    {(guarantor2.guarantorCount || 0) >= 2 && (
                      <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                        <Typography variant="body2">
                          <strong>මෙම සාමාජිකයා දැනටමත් 2ක් ඇපකරු ලෙස කටයුතු කරයි!</strong>
                        </Typography>
                      </Alert>
                    )}

                    {(guarantor2.totalDue || 0) > 0 && (
                      <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
                        <Typography variant="body2">
                          <strong>ඇපකරුට හිඟ මුදලක් ඇත!</strong>
                        </Typography>
                      </Alert>
                    )}
                  </Paper>
                )}
              </CardContent>
            </Card>

            {/* Loan Details Section */}
            <Card elevation={2} sx={{ mb: 3, borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Avatar sx={{ bgcolor: '#ff9800', width: 40, height: 40 }}>
                    <MoneyIcon />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#f57c00' }}>
                    ණය විස්තර (Loan Details)
                  </Typography>
                </Box>

                <Grid2 container spacing={3}>
                  <Grid2 xs={12} md={4}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DemoContainer components={["DatePicker"]}>
                        <DatePicker
                          label="ණය දිනය"
                          value={loanDate}
                          onChange={(newValue) => setLoanDate(newValue)}
                          format="YYYY/MM/DD"
                          maxDate={dayjs()}
                          sx={{ width: '100%' }}
                        />
                      </DemoContainer>
                    </LocalizationProvider>
                  </Grid2>
                  <Grid2 xs={12} md={4}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        fullWidth
                        label="ණය අංකය"
                        value={loanNumber}
                        onChange={(e) => setLoanNumber(e.target.value)}
                        variant="outlined"
                        size="medium"
                        type="number"
                        helperText="ස්වයංක්‍රීයව පූරණය වේ"
                        sx={{
                          '& .MuiInputBase-input': {
                            backgroundColor: loanNumber ? '#e8f5e8' : 'transparent',
                          }
                        }}
                      />
                      <Tooltip title="නව ණය අංකයක් ලබා ගන්න">
                        <IconButton
                          onClick={getNextLoanNumber}
                          sx={{ 
                            bgcolor: '#f5f5f5',
                            '&:hover': { bgcolor: '#e0e0e0' },
                            height: '56px',
                            width: '56px'
                          }}
                        >
                          <RefreshIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Grid2>
                  <Grid2 xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="ණය මුදල"
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(e.target.value)}
                      variant="outlined"
                      size="medium"
                      type="number"
                    />
                  </Grid2>
                </Grid2>

                <Divider sx={{ my: 3 }} />
                
                <Box sx={{ textAlign: 'right' }}>
                  <Button
                    variant="contained"
                    onClick={handleApply}
                    disabled={
                      !loanAmount || !loanNumber || !guarantor1 || !guarantor2 ||
                      (guarantor1.guarantorCount || 0) >= 2 || (guarantor2.guarantorCount || 0) >= 2
                    }
                    startIcon={<CheckCircleIcon />}
                    sx={{ 
                      px: 4, 
                      py: 1.5, 
                      borderRadius: 2,
                      background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
                      boxShadow: '0 3px 5px 2px rgba(76, 175, 80, .3)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #388e3c 30%, #4caf50 90%)',
                      }
                    }}
                  >
                    නිකුත් කරන්න
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}
      </Box>
    </Layout>
  )
}
