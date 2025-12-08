import React, { useEffect, useState, useCallback } from "react"
import Layout from "../../components/layout"
import {
  Box,
  Button,
  TextField,
  Typography,
  Snackbar,
  Paper,
  Card,
  CardContent,
  Avatar,
  Chip,
  Grid2,
  Alert,
  Divider,
  Fade,
  Skeleton,
  Tooltip,
} from "@mui/material"
import {
  Search as SearchIcon,
  AccountBalance as AccountBalanceIcon,
  Person as PersonIcon,
  Payment as PaymentIcon,
  Schedule as ScheduleIcon,
  Money as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Receipt as ReceiptIcon,
} from "@mui/icons-material"
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import StickyHeadTable from "../../components/StickyHeadTable"
import dayjs from "dayjs"
import { useLocation } from "@reach/router"
import { navigate } from "gatsby"

import api from "../../utils/api"
//un authorized access preventing
import loadable from "@loadable/component"
const AuthComponent = loadable(() =>
  import("../../components/common/AuthComponent")
)

const baseUrl = process.env.GATSBY_API_BASE_URL
// const token = localStorage.getItem("authToken")
// let token = null

// if (typeof window !== "undefined") {
//   token = localStorage.getItem("authToken")
// }

export default function Search() {
  //un authorized access preventing
  const [roles, setRoles] = useState([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const [memberInputId, setMemberInputId] = useState("")
  const [member, setMember] = useState(null)
  const [loan, setLoan] = useState(null)
  const [earlyPayments, setEarlyPayments] = useState([])
  const [paymentDate, setPaymentDate] = useState(dayjs())
  const [paymentAmount, setPaymentAmount] = useState("")
  const [payingPenaltyInterest, setPayingPenaltyInterest] = useState(0)
  const [payingInterest, setPayingInterest] = useState(0)
  const [payingPrincipal, setPayingPrincipal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [snackbarOpen, setSnackbarOpen] = useState(false)

  const location = useLocation()
  const queryParams = new URLSearchParams(location?.search)
  const memberId = queryParams.get("memberId")

  // Format currency helper function
  const formatCurrency = amount => {
    return new Intl.NumberFormat("si-LK", {
      style: "currency",
      currency: "LKR",
    }).format(amount || 0)
  }

  const loanColumns = [
    { id: "date", label: "ණය වු දිනය", minWidth: 50 },
    { id: "id", label: "අංකය", minWidth: 50 },
    // { id: "amount", label: "Loan Amount", minWidth: 50 },
    { id: "remaining", label: "ඉතිරි මුදල", minWidth: 50 },
    { id: "interest", label: "පොලිය", minWidth: 50 },
    { id: "penaltyInterest", label: "දඩ පොලිය", minWidth: 50 },
    { id: "installment", label: "වාරිකය", minWidth: 50 },
    { id: "due", label: "මුළු මුදල", minWidth: 50, align: "right" },
  ]

  const paymentColumns = [
    { id: "date", label: "දිනය", minWidth: 50 },
    { id: "payedTotal", label: "මුළු මුදල", minWidth: 50 },
    { id: "amount", label: "ණය මුදල", minWidth: 50 },
    { id: "interest", label: "පොලිය", minWidth: 50 },
    { id: "penaltyInterest", label: "දඩ පොලිය", minWidth: 50 },
    { id: "actions", label: "", minWidth: 50 },
  ]

  //calculating interest for loan according to payment date
  const calculateInterest = (
    loanDate,
    remainingAmount,
    lastInterestPaymentDate,
    paymentDate
  ) => {
    if (!loanDate || !remainingAmount || !paymentDate)
      return { int: 0, penInt: 0 }
    // console.log("paymentDate: ", paymentDate)
    const loanDateObj = new Date(loanDate)
    const lastIntPayDateObj = new Date(lastInterestPaymentDate || loanDate)
    const currentDate = new Date(paymentDate)
    // console.log("currentDate :", currentDate)
    const monthlyInterestRate = 0.03
    const loanPeriodMonths = 10

    let totalMonths =
      (currentDate.getFullYear() - loanDateObj.getFullYear()) * 12 +
      (currentDate.getMonth() - loanDateObj.getMonth())
    //adding one month if loan date is exceed
    if (currentDate.getDate() - loanDateObj.getDate() > 0) {
      totalMonths = totalMonths + 1
    }
    //getting installment
    let loanInstallment = 0
    // console.log("totalMonths:", totalMonths)
    // console.log("remainingAmount:", remainingAmount)
    let principleShouldPay = (10000 / 10) * totalMonths
    let totalPrinciplePaid = 10000 - remainingAmount
    //  console.log("principleShouldPay: ", principleShouldPay);
  // console.log("totalPrinciplePaid: ", totalPrinciplePaid);
    if (totalPrinciplePaid >= principleShouldPay) {
      loanInstallment = 0
    } else if (totalMonths <= 10) {
      loanInstallment = totalMonths * 1000 - (10000 - remainingAmount)
      // console.log(loanInstallment)
    } else {
      loanInstallment = remainingAmount
      // console.log(loanInstallment)
    }

    // console.log("totalMonths :", totalMonths)
    // console.log('lastIntPayDateObj.getFullYear():',lastIntPayDateObj.getFullYear())
    // console.log('lastIntPayDateObj.getMonth():',lastIntPayDateObj.getMonth())
    // console.log('loanDateObj.getMonth():',loanDateObj.getMonth())
    let lastPaymentMonths =
      (lastIntPayDateObj.getFullYear() - loanDateObj.getFullYear()) * 12 +
      (lastIntPayDateObj.getMonth() - loanDateObj.getMonth())
    // //adding one month if loan date is exceed
    if (lastIntPayDateObj.getDate() - loanDateObj.getDate() > 0) {
      lastPaymentMonths = lastPaymentMonths + 1
    }
    // console.log("lastPaymentMonths :", lastPaymentMonths)

    const interestUnpaidMonths = Math.max(totalMonths - lastPaymentMonths, 0)
    // console.log("interestUnpaidMonths: ", interestUnpaidMonths)
    let penaltyMonths = 0
    //checking loan is over due
    if (totalMonths > 10) {
      //penalty months
      const dueMonths = totalMonths - loanPeriodMonths
      //checking if int payment has done before due
      if (interestUnpaidMonths > dueMonths) {
        penaltyMonths = dueMonths
      } else {
        penaltyMonths = interestUnpaidMonths
      }
    }
    // console.log('penaltyMonths: ', penaltyMonths)
    const interest =
      remainingAmount * interestUnpaidMonths * monthlyInterestRate
    const penaltyInterest =
      remainingAmount * penaltyMonths * monthlyInterestRate
    return {
      int: Math.round(interest),
      penInt: Math.round(penaltyInterest),
      installment: Math.round(loanInstallment + interest + penaltyInterest),
    }
  }

  const handleSearch = useCallback(
    async date => {
      // console.log("date on handle search: ", date)
      if (!memberInputId) return
      setLoading(true)
      try {
        // Fetch member info
        const {
          data: { member },
        } = await api.get(`${baseUrl}/member/getMemberById/${memberInputId}`)

        const memberResponse = member
        setMember(memberResponse)

        // If the member exists, fetch the loan data
        if (memberResponse?._id) {
          const { data: loanResponse } = await api.get(
            `${baseUrl}/loan/member/${memberResponse._id}`
          )

          const loanData = loanResponse?.loan

          if (loanData) {
            const allPayments = loanResponse?.groupedPayments || []
            const lastInterestPaymentDate =
              loanResponse?.lastIntPaymentDate?.date

            setEarlyPayments(allPayments)

            const calculatedInterest = calculateInterest(
              loanData.loanDate,
              loanData.loanRemainingAmount,
              lastInterestPaymentDate,
              date
            )

            setLoan({
              ...loanData,
              interest: calculatedInterest.int,
              penaltyInterest: calculatedInterest.penInt,
              installment: calculatedInterest.installment,
              dueAmount:
                loanData.loanRemainingAmount +
                calculatedInterest.int +
                calculatedInterest.penInt,
            })
          } else {
            // Set loan to null explicitly only when loanData is not present
            console.warn("No loan data found.")
            setLoan(null)
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        // navigate('../404')
      } finally {
        setLoading(false)
      }
    },
    [memberInputId]
  )

  const resetPaymentFields = () => {
    setPayingPrincipal(0)
    setPayingPenaltyInterest(0)
    setPayingInterest(0)
    setPaymentAmount("")
    // setPaymentDate(dayjs())
  }

  const calculatePaymentSplit = amount => {
    const payment = parseFloat(amount) || 0
    const penaltyInterestPart = Math.min(payment, loan.penaltyInterest || 0)
    const remainingAfterPenalty = payment - penaltyInterestPart
    const interestPart = Math.min(remainingAfterPenalty, loan.interest || 0)
    const remainingAfterInterest = remainingAfterPenalty - interestPart
    const principalPart = Math.max(remainingAfterInterest, 0)

    setPayingPenaltyInterest(penaltyInterestPart)
    setPayingInterest(interestPart)
    setPayingPrincipal(principalPart)
  }

  const handleIdChange = e => {
    setMemberInputId(e.target.value)
    setMember(null)
    setLoan(null)
    setPaymentDate(dayjs())
  }
  const handleDateChange = newDate => {
    if (newDate) {
      // console.log("newDate: ", newDate)
      setPaymentDate(newDate)
      handleSearch(newDate)
      resetPaymentFields()
    }
  }

  // const handleDeletePayment = async paymentId => {
  // console.log(loan._id)
  // console.log(paymentId)
  // }

  const handleLoanPayment = async () => {
    if (!paymentAmount || !loan?._id) return
    // console.log("paymentAmount: ", paymentAmount)
    // console.log("payingPrincipal: ", payingPrincipal)
    // console.log("payingInterest: ", payingInterest)
    // console.log("payingPenaltyInterest: ", payingPenaltyInterest)
    try {
      await api
        .post(`${baseUrl}/loan/payments`, {
          loanId: loan._id,
          amounts: {
            principle: parseFloat(payingPrincipal),
            interest: parseFloat(payingInterest),
            penaltyInterest: parseFloat(payingPenaltyInterest),
          },
          date: paymentDate,
        })
        .then(res => {
          // console.log(res)
        })
      resetPaymentFields()
      setSnackbarOpen(true)
      await handleSearch()
    } catch (error) {
      console.error("Error recording payment:", error)
    }
  }

  //un authorized access preventing
  const handleAuthStateChange = ({ isAuthenticated, roles }) => {
    setIsAuthenticated(isAuthenticated)
    setRoles(roles)
    if (
      !isAuthenticated ||
      (!roles.includes("loan-treasurer") && !roles.includes("treasurer") && !roles.includes("auditor"))
    ) {
      navigate("/login/user-login")
    }
  }

  useEffect(() => {
    //for searching loan when visit  from another page
    if (memberId) {
      setMemberInputId(memberId)
      handleSearch(paymentDate)
    }
    // handleSearch(paymentDate)
  }, [memberId, handleSearch, paymentDate])

  return (
    <Layout>
      <AuthComponent onAuthStateChange={handleAuthStateChange} />
      <Box
        sx={{
          maxWidth: 1400,
          mx: "auto",
          p: 3,
          background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
          minHeight: "100vh",
        }}
      >
        {/* Back button if navigated from active loans */}
        {memberId && (
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
            <Button
              variant="outlined"
              startIcon={<SearchIcon />}
              sx={{ borderRadius: 2, fontWeight: "bold" }}
              onClick={() => navigate("/loan/active-loans")}
            >
              ආපසු - ක්‍රියාකාරී ණය
            </Button>
          </Box>
        )}
        {/* Header */}
        <Paper
          elevation={3}
          sx={{
            p: 3,
            mb: 3,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            borderRadius: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar
              sx={{ bgcolor: "white", color: "#667eea", width: 56, height: 56 }}
            >
              <SearchIcon fontSize="large" />
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: "bold", mb: 1 }}>
                ණය සෙවීම සහ ගෙවීම්
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                සාමාජිකයන්ගේ ණය තොරතුරු සෙවීම සහ ණය ගෙවීම් කළමනාකරණය
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Search Section */}
        <Card elevation={2} sx={{ mb: 3, borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
              <Avatar sx={{ bgcolor: "#1976d2", width: 40, height: 40 }}>
                <PersonIcon />
              </Avatar>
              <Typography
                variant="h6"
                sx={{ fontWeight: "bold", color: "#1976d2" }}
              >
                සාමාජික සෙවීම
              </Typography>
            </Box>

            <Grid2 container spacing={3} alignItems="end">
              <Grid2 xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="සාමාජික අංකය"
                  variant="outlined"
                  type="number"
                  value={memberInputId}
                  onChange={handleIdChange}
                  InputProps={{
                    startAdornment: (
                      <PersonIcon sx={{ mr: 1, color: "#666" }} />
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                    },
                  }}
                  disabled={!!memberId}
                />
              </Grid2>
              <Grid2 xs={12} sm={3}>
                <Button
                  variant="contained"
                  onClick={() => handleSearch(paymentDate)}
                  startIcon={<SearchIcon />}
                  disabled={!memberInputId || loading || !!memberId}
                  fullWidth
                  sx={{
                    py: 1.8,
                    borderRadius: 2,
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    "&:hover": {
                      background:
                        "linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)",
                    },
                  }}
                >
                  {loading ? "සෙවෙමින්..." : "ණය සෙවීම"}
                </Button>
              </Grid2>
            </Grid2>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <Card elevation={1} sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent sx={{ p: 3, textAlign: "center" }}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Skeleton variant="circular" width={64} height={64} />
                <Skeleton variant="text" width={200} height={32} />
                <Typography variant="body1" color="textSecondary">
                  දත්ත පූරණය වෙමින්...
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* No Loan Found */}
        {!loading && member && !loan && (
          <Alert severity="info" sx={{ borderRadius: 2, mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <WarningIcon />
              <Typography variant="body1">
                <strong>{member.name}</strong> සඳහා ක්‍රියාකාරී ණයක් සොයාගත
                නොහැකි විය.
              </Typography>
            </Box>
          </Alert>
        )}

        {/* Member and Loan Information */}
        {!loading && member && loan && (
          <Fade in={true} timeout={500}>
            <Box>
              {/* Member Info Card */}
              <Card elevation={2} sx={{ mb: 3, borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      mb: 3,
                    }}
                  >
                    <Avatar sx={{ bgcolor: "#4caf50", width: 40, height: 40 }}>
                      <PersonIcon />
                    </Avatar>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: "bold", color: "#4caf50" }}
                    >
                      සාමාජික තොරතුරු
                    </Typography>
                  </Box>

                  <Grid2 container spacing={3}>
                    <Grid2 xs={12} md={8}>
                      <Paper
                        elevation={1}
                        sx={{ p: 3, borderRadius: 2, bgcolor: "#f9f9f9" }}
                      >
                        <Grid2 container spacing={2}>
                          <Grid2 xs={12} sm={3}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <Avatar
                                sx={{
                                  bgcolor: "#1976d2",
                                  width: 32,
                                  height: 32,
                                }}
                              >
                                {member.name?.charAt(0).toUpperCase()}
                              </Avatar>
                              <Box>
                                <Typography
                                  variant="caption"
                                  color="textSecondary"
                                >
                                  නම
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: "bold" }}
                                >
                                  {member.name}
                                </Typography>
                              </Box>
                            </Box>
                          </Grid2>
                          <Grid2 xs={12} sm={3}>
                            <Box>
                              <Typography
                                variant="caption"
                                color="textSecondary"
                              >
                                සාමාජික අංකය
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: "bold" }}
                              >
                                {member.member_id}
                              </Typography>
                            </Box>
                          </Grid2>
                          <Grid2 xs={12} sm={3}>
                            <Box>
                              <Typography
                                variant="caption"
                                color="textSecondary"
                              >
                                ප්‍රදේශය
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: "medium" }}
                              >
                                {member.area}
                              </Typography>
                            </Box>
                          </Grid2>
                          <Grid2 xs={12} sm={3}>
                            <Box>
                              <Typography
                                variant="caption"
                                color="textSecondary"
                              >
                                දුරකථන
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: "medium" }}
                              >
                                {member.mobile}
                              </Typography>
                            </Box>
                          </Grid2>
                        </Grid2>
                      </Paper>
                    </Grid2>
                    <Grid2 xs={12} md={4}>
                      <Paper
                        elevation={1}
                        sx={{ p: 3, borderRadius: 2, bgcolor: "#e3f2fd" }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: "bold", color: "#1976d2", mb: 2 }}
                        >
                          ඇපකරුවන්
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" color="textSecondary">
                            පළමු ඇපකරු
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: "medium" }}
                          >
                            {loan?.guarantor1Id.member_id} -{" "}
                            {loan?.guarantor1Id.name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {loan?.guarantor1Id.mobile}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            දෙවන ඇපකරු
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: "medium" }}
                          >
                            {loan?.guarantor2Id.member_id} -{" "}
                            {loan?.guarantor2Id.name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {loan?.guarantor2Id.mobile}
                          </Typography>
                        </Box>
                      </Paper>
                    </Grid2>
                  </Grid2>
                </CardContent>
              </Card>

              {/* Loan Details Card */}
              <Card elevation={2} sx={{ mb: 3, borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      mb: 3,
                    }}
                  >
                    <Avatar sx={{ bgcolor: "#ff9800", width: 40, height: 40 }}>
                      <AccountBalanceIcon />
                    </Avatar>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: "bold", color: "#ff9800" }}
                    >
                      ණය විස්තර
                    </Typography>
                  </Box>

                  <Paper
                    elevation={1}
                    sx={{ p: 3, borderRadius: 2, bgcolor: "#fff3e0" }}
                  >
                    <Grid2 container spacing={3}>
                      <Grid2 xs={12} sm={6} md={2}>
                        <Box sx={{ textAlign: "center" }}>
                          <Typography variant="caption" color="textSecondary">
                            ණය දිනය
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: "bold", color: "#1976d2" }}
                          >
                            {new Date(loan.loanDate).toLocaleDateString(
                              "si-LK"
                            )}
                          </Typography>
                        </Box>
                      </Grid2>
                      <Grid2 xs={12} sm={6} md={2}>
                        <Box sx={{ textAlign: "center" }}>
                          <Typography variant="caption" color="textSecondary">
                            ණය අංකය
                          </Typography>
                          <Chip
                            label={loan.loanNumber}
                            color="primary"
                            sx={{ fontWeight: "bold", fontSize: "1rem" }}
                          />
                        </Box>
                      </Grid2>
                      <Grid2 xs={12} sm={6} md={2}>
                        <Box sx={{ textAlign: "center" }}>
                          <Typography variant="caption" color="textSecondary">
                            ඉතිරි මුදල
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: "bold", color: "#d32f2f" }}
                          >
                            {formatCurrency(loan.loanRemainingAmount)}
                          </Typography>
                        </Box>
                      </Grid2>
                      <Grid2 xs={12} sm={6} md={2}>
                        <Box sx={{ textAlign: "center" }}>
                          <Typography variant="caption" color="textSecondary">
                            පොලිය
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: "bold", color: "#ff5722" }}
                          >
                            {formatCurrency(loan.interest)}
                          </Typography>
                        </Box>
                      </Grid2>
                      <Grid2 xs={12} sm={6} md={2}>
                        <Box sx={{ textAlign: "center" }}>
                          <Typography variant="caption" color="textSecondary">
                            දඩ පොලිය
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: "bold", color: "#e91e63" }}
                          >
                            {formatCurrency(loan.penaltyInterest)}
                          </Typography>
                        </Box>
                      </Grid2>
                      <Grid2 xs={12} sm={6} md={2}>
                        <Box sx={{ textAlign: "center" }}>
                          <Typography variant="caption" color="textSecondary">
                            මුළු මුදල
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: "bold", color: "#4caf50" }}
                          >
                            {formatCurrency(loan.dueAmount)}
                          </Typography>
                        </Box>
                      </Grid2>
                    </Grid2>

                    {loan.installment && (
                      <Box
                        sx={{ mt: 2, pt: 2, borderTop: "1px solid #e0e0e0" }}
                      >
                        <Box sx={{ textAlign: "center" }}>
                          <Typography variant="caption" color="textSecondary">
                            මාසික වාරිකය
                          </Typography>
                          <Typography
                            variant="h5"
                            sx={{ fontWeight: "bold", color: "#2e7d32" }}
                          >
                            {formatCurrency(loan.installment)}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </Paper>
                </CardContent>
              </Card>

              {/* Payment History Card */}
              <Card elevation={2} sx={{ mb: 3, borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      mb: 3,
                    }}
                  >
                    <Avatar sx={{ bgcolor: "#9c27b0", width: 40, height: 40 }}>
                      <ReceiptIcon />
                    </Avatar>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: "bold", color: "#9c27b0" }}
                    >
                      ණය ආපසු ගෙවීම් ඉතිහාසය
                    </Typography>
                  </Box>

                  {earlyPayments.length === 0 ? (
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                      <Typography>
                        මෙම ණය සඳහා තවම කිසිදු ගෙවීමක් සිදු කර නොමැත.
                      </Typography>
                    </Alert>
                  ) : (
                    <Box>
                      {earlyPayments.map((payment, index) => (
                        <Fade in={true} timeout={300 + index * 100} key={index}>
                          <Paper
                            elevation={1}
                            sx={{
                              p: 2,
                              mb: 2,
                              borderRadius: 2,
                              borderLeft: "4px solid #9c27b0",
                              "&:hover": {
                                boxShadow: 3,
                                transform: "translateY(-2px)",
                                transition: "all 0.2s ease-in-out",
                              },
                            }}
                          >
                            <Grid2 container spacing={2} alignItems="center">
                              <Grid2 xs={12} sm={2}>
                                <Box>
                                  <Typography
                                    variant="caption"
                                    color="textSecondary"
                                  >
                                    දිනය
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    sx={{ fontWeight: "bold" }}
                                  >
                                    {new Date(payment.date).toLocaleDateString(
                                      "si-LK"
                                    )}
                                  </Typography>
                                </Box>
                              </Grid2>
                              <Grid2 xs={12} sm={2.5}>
                                <Box>
                                  <Typography
                                    variant="caption"
                                    color="textSecondary"
                                  >
                                    මුළු ගෙවීම
                                  </Typography>
                                  <Typography
                                    variant="body1"
                                    sx={{
                                      fontWeight: "bold",
                                      color: "#2e7d32",
                                    }}
                                  >
                                    {formatCurrency(
                                      payment.principleAmount +
                                        payment.interestAmount +
                                        payment.penaltyInterestAmount
                                    )}
                                  </Typography>
                                </Box>
                              </Grid2>
                              <Grid2 xs={12} sm={2.5}>
                                <Box>
                                  <Typography
                                    variant="caption"
                                    color="textSecondary"
                                  >
                                    ණය මුදල
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    sx={{ fontWeight: "medium" }}
                                  >
                                    {formatCurrency(payment.principleAmount)}
                                  </Typography>
                                </Box>
                              </Grid2>
                              <Grid2 xs={12} sm={2.5}>
                                <Box>
                                  <Typography
                                    variant="caption"
                                    color="textSecondary"
                                  >
                                    පොලිය
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    sx={{ fontWeight: "medium" }}
                                  >
                                    {formatCurrency(payment.interestAmount)}
                                  </Typography>
                                </Box>
                              </Grid2>
                              <Grid2 xs={12} sm={2.5}>
                                <Box>
                                  <Typography
                                    variant="caption"
                                    color="textSecondary"
                                  >
                                    දඩ පොලිය
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    sx={{ fontWeight: "medium" }}
                                  >
                                    {formatCurrency(
                                      payment.penaltyInterestAmount
                                    )}
                                  </Typography>
                                </Box>
                              </Grid2>
                            </Grid2>
                          </Paper>
                        </Fade>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
              {/* Payment Form Card */}
              <Card elevation={2} sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      mb: 3,
                    }}
                  >
                    <Avatar sx={{ bgcolor: "#4caf50", width: 40, height: 40 }}>
                      <PaymentIcon />
                    </Avatar>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: "bold", color: "#4caf50" }}
                    >
                      ණය ගෙවීම
                    </Typography>
                  </Box>

                  {roles.includes("loan-treasurer") ? (
                    <Paper
                      elevation={1}
                      sx={{ p: 3, borderRadius: 2, bgcolor: "#f1f8e9" }}
                    >
                      <Grid2 container spacing={3}>
                        <Grid2 xs={12} md={4}>
                          <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                              label="ගෙවීමේ දිනය"
                              value={paymentDate}
                              onChange={handleDateChange}
                              format="YYYY/MM/DD"
                              sx={{ width: "100%" }}
                            />
                          </LocalizationProvider>
                        </Grid2>
                        <Grid2 xs={12} md={4}>
                          <TextField
                            fullWidth
                            label="ගෙවන මුදල"
                            type="number"
                            value={paymentAmount}
                            onChange={e => {
                              setPaymentAmount(e.target.value)
                              calculatePaymentSplit(e.target.value)
                            }}
                            InputProps={{
                              startAdornment: (
                                <MoneyIcon sx={{ mr: 1, color: "#666" }} />
                              ),
                            }}
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                borderRadius: 2,
                              },
                            }}
                          />
                        </Grid2>
                        <Grid2 xs={12} md={4}>
                          <Button
                            variant="contained"
                            onClick={handleLoanPayment}
                            disabled={
                              !paymentAmount ||
                              parseFloat(paymentAmount) <= 0 ||
                              parseFloat(paymentAmount) <
                                loan.interest + loan.penaltyInterest
                            }
                            startIcon={<CheckCircleIcon />}
                            fullWidth
                            sx={{
                              py: 1.8,
                              borderRadius: 2,
                              background:
                                "linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)",
                              boxShadow: "0 3px 5px 2px rgba(76, 175, 80, .3)",
                              "&:hover": {
                                background:
                                  "linear-gradient(45deg, #388e3c 30%, #4caf50 90%)",
                              },
                              "&:disabled": {
                                background: "#e0e0e0",
                                color: "#bdbdbd",
                              },
                            }}
                          >
                            ගෙවන්න
                          </Button>
                        </Grid2>
                      </Grid2>

                      {paymentAmount && (
                        <Box sx={{ mt: 3 }}>
                          <Divider sx={{ mb: 2 }} />
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: "bold", mb: 2, color: "#388e3c" }}
                          >
                            ගෙවීමේ විශ්ලේෂණය
                          </Typography>
                          <Grid2 container spacing={2}>
                            <Grid2 xs={12} sm={4}>
                              <Paper
                                elevation={0}
                                sx={{
                                  p: 2,
                                  bgcolor: "#ffebee",
                                  borderRadius: 2,
                                }}
                              >
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                  }}
                                >
                                  <Avatar
                                    sx={{
                                      bgcolor: "#e91e63",
                                      width: 24,
                                      height: 24,
                                    }}
                                  >
                                    <WarningIcon fontSize="small" />
                                  </Avatar>
                                  <Box>
                                    <Typography
                                      variant="caption"
                                      color="textSecondary"
                                    >
                                      ගෙවන දඩ පොලිය
                                    </Typography>
                                    <Typography
                                      variant="body1"
                                      sx={{ fontWeight: "bold" }}
                                    >
                                      {formatCurrency(payingPenaltyInterest)}
                                    </Typography>
                                  </Box>
                                </Box>
                              </Paper>
                            </Grid2>
                            <Grid2 xs={12} sm={4}>
                              <Paper
                                elevation={0}
                                sx={{
                                  p: 2,
                                  bgcolor: "#fff3e0",
                                  borderRadius: 2,
                                }}
                              >
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                  }}
                                >
                                  <Avatar
                                    sx={{
                                      bgcolor: "#ff9800",
                                      width: 24,
                                      height: 24,
                                    }}
                                  >
                                    <TrendingUpIcon fontSize="small" />
                                  </Avatar>
                                  <Box>
                                    <Typography
                                      variant="caption"
                                      color="textSecondary"
                                    >
                                      ගෙවන පොලිය
                                    </Typography>
                                    <Typography
                                      variant="body1"
                                      sx={{ fontWeight: "bold" }}
                                    >
                                      {formatCurrency(payingInterest)}
                                    </Typography>
                                  </Box>
                                </Box>
                              </Paper>
                            </Grid2>
                            <Grid2 xs={12} sm={4}>
                              <Paper
                                elevation={0}
                                sx={{
                                  p: 2,
                                  bgcolor: "#e8f5e8",
                                  borderRadius: 2,
                                }}
                              >
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                  }}
                                >
                                  <Avatar
                                    sx={{
                                      bgcolor: "#4caf50",
                                      width: 24,
                                      height: 24,
                                    }}
                                  >
                                    <AccountBalanceIcon fontSize="small" />
                                  </Avatar>
                                  <Box>
                                    <Typography
                                      variant="caption"
                                      color="textSecondary"
                                    >
                                      ගෙවන ණය මුදල
                                    </Typography>
                                    <Typography
                                      variant="body1"
                                      sx={{ fontWeight: "bold" }}
                                    >
                                      {formatCurrency(payingPrincipal)}
                                    </Typography>
                                  </Box>
                                </Box>
                              </Paper>
                            </Grid2>
                          </Grid2>

                          {parseFloat(paymentAmount) <
                            loan.interest + loan.penaltyInterest && (
                            <Alert
                              severity="warning"
                              sx={{ mt: 2, borderRadius: 2 }}
                            >
                              <Typography variant="body2">
                                <strong>අවශ්‍ය අවම ගෙවීම:</strong>{" "}
                                {formatCurrency(
                                  loan.interest + loan.penaltyInterest
                                )}
                                <br />
                                පොලිය සහ දඩ පොලිය අවම වශයෙන් ගෙවිය යුතුය.
                              </Typography>
                            </Alert>
                          )}
                        </Box>
                      )}
                    </Paper>
                  ) : (
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 2 }}
                      >
                        <SecurityIcon />
                        <Typography variant="body1">
                          ණය ගෙවීම් කළමනාකරණය කිරීමට{" "}
                          <strong>ණය භාණ්ඩාගාරික</strong> අවසර අවශ්‍ය වේ.
                        </Typography>
                      </Box>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Box>
          </Fade>
        )}

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={4000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
          sx={{ mt: 8 }}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity="success"
            sx={{
              borderRadius: 2,
              boxShadow: 3,
              minWidth: "300px",
            }}
          >
            ගෙවීම සාර්ථකව සටහන් කරන ලදී
          </Alert>
        </Snackbar>
      </Box>
    </Layout>
  )
}
