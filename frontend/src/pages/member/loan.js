import React, { useState, useEffect } from "react"
import { navigate } from "gatsby"
import api from "../../utils/api"
import Layout from "../../components/layout"
import {
  Box,
  Typography,
  Container,
  CircularProgress,
  Alert,
  Grid2,
  Divider,
  Paper,
  Chip
} from "@mui/material"
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn"
import PaymentsIcon from "@mui/icons-material/Payments"
import AuthComponent from "../../components/common/AuthComponent"
import StickyHeadTable from "../../components/StickyHeadTable"
import { TrendingUp, Warning, AccountBalance, Gavel } from "@mui/icons-material"

const baseUrl = process.env.GATSBY_API_BASE_URL

const formatCurrency = amount => {
  return new Intl.NumberFormat("si-LK", {
    style: "currency",
    currency: "LKR",
  }).format(Math.abs(amount) || 0)
}

const getStatusColor = amount => {
  if (amount < 0) return "success"
  if (amount > 0) return "error"
  return "info"
}

const getStatusIcon = amount => {
  if (amount < 0) return <TrendingUp />
  if (amount > 0) return <Warning />
  return <AccountBalance />
}

export default function MemberLoan() {
  const [roles, setRoles] = useState([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loan, setLoan] = useState(null)
  const [earlyPayments, setEarlyPayments] = useState([])
  const [calculatedInterest, setCalculatedInterest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Calculate totals for payment table (after earlyPayments is defined)
  const paymentTotals =
    earlyPayments && earlyPayments.length > 0
      ? earlyPayments.reduce(
          (acc, val) => {
            acc.payedTotal +=
              (val.principleAmount || 0) +
              (val.interestAmount || 0) +
              (val.penaltyInterestAmount || 0)
            acc.amount += val.principleAmount || 0
            acc.interest += val.interestAmount || 0
            acc.penaltyInterest += val.penaltyInterestAmount || 0
            return acc
          },
          { payedTotal: 0, amount: 0, interest: 0, penaltyInterest: 0 }
        )
      : { payedTotal: 0, amount: 0, interest: 0, penaltyInterest: 0 }

  // Loan date, total months (from loan date to now), unpaid months
  const loanDate = loan?.loanDate ? new Date(loan.loanDate) : null
  const formattedLoanDate = loanDate
    ? loanDate.toLocaleDateString("en-CA")
    : "-"
  let totalMonths = "-"
  if (loanDate) {
    const now = new Date()
    const years = now.getFullYear() - loanDate.getFullYear()
    const months = now.getMonth() - loanDate.getMonth()
    totalMonths = years * 12 + months + 1 // +1 to include current month
    if (totalMonths < 1) totalMonths = 1
  }
  // Unpaid months: from last payment date to now (inclusive), or from loan date if no payments
  let unpaidMonths = 0
  if (loanDate) {
    let fromDate = loanDate
    if (earlyPayments.length > 0) {
      const lastPayment = earlyPayments[earlyPayments.length - 1]
      if (lastPayment?.date) {
        fromDate = new Date(lastPayment.date)
      }
    }
    const now = new Date()
    let years = now.getFullYear() - fromDate.getFullYear()
    // console.log("years:", years)
    let months = now.getMonth() - fromDate.getMonth()
    // console.log("months:", months)
    unpaidMonths = years * 12 + months // +1 to include current month
    if (unpaidMonths < 1) unpaidMonths = 1
  }

  // console.log("unpaidMonths:", unpaidMonths)
  // If paid principal >= expected principal, unpaid months should be zero
  let expectedPrincipalPaid = loan?.loanAmount
    ? (loan.loanAmount / 10) * totalMonths
    : null
  if (expectedPrincipalPaid > loan?.loanAmount) {
    expectedPrincipalPaid = loan?.loanAmount
  }
  const paidPrincipal = earlyPayments.reduce(
    (sum, p) => sum + (p.principleAmount || 0),
    0
  )
  // console.log("expectedPrincipalPaid:", expectedPrincipalPaid)
  // console.log("paidPrincipal:", paidPrincipal)
  if (expectedPrincipalPaid && paidPrincipal >= expectedPrincipalPaid) {
    unpaidMonths = 0
  }

  // Prepare payment data array with total row at the end
  const paymentDataArray = [
    ...earlyPayments.map(val => ({
      date: new Date(val.date).toLocaleDateString("en-CA"),
      payedTotal:
        val.principleAmount + val.interestAmount + val.penaltyInterestAmount,
      amount: val.principleAmount,
      interest: val.interestAmount || "-",
      penaltyInterest: val.penaltyInterestAmount || "-",
    })),
    earlyPayments.length > 0
      ? {
          date: "එකතුව",
          payedTotal: formatCurrency(paymentTotals.payedTotal),
          amount: formatCurrency(paymentTotals.amount),
          interest: formatCurrency(paymentTotals.interest),
          penaltyInterest: formatCurrency(paymentTotals.penaltyInterest),
        }
      : null,
  ].filter(Boolean)

  const loanColumns = [
    { id: "date", label: "ණය වු දිනය", minWidth: 50 },
    { id: "id", label: "අංකය", minWidth: 50 },
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
  ]

  const handleAuthStateChange = ({ isAuthenticated, roles }) => {
    setIsAuthenticated(isAuthenticated)
    setRoles(roles)
    if (!isAuthenticated) {
      navigate("/login/user-login")
    }
  }

  useEffect(() => {
    setLoading(true)
    api
      .get(`${baseUrl}/member/myLoan`)
      .then(res => {
        setLoan(res.data.loan)
        setCalculatedInterest(res.data.calculatedInterest)
        setEarlyPayments(res.data.groupedPayments)
        setError("")
      })
      .catch(error => {
        setError("Loan data not found or failed to load.")
        setLoan(null)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <Layout>
      <AuthComponent onAuthStateChange={handleAuthStateChange} />
      <Container maxWidth="md" sx={{ py: 1, px:0 }}>
        <Paper
          elevation={3}
          sx={{
            p: { xs: 2, sm: 4 },
            mb: 3,
            bgcolor: "#e3f2fd",
            borderRadius: 3,
          }}
        >
          <Box sx={{ display: "flex", aligns: "center", mb: 2 }}>
            <MonetizationOnIcon color="primary" sx={{ mr: 1, fontSize: 32 }} />
            <Typography
              variant="h5"
              sx={{ fontWeight: "bold", color: "#1976d2" }}
            >
              ඔබගේ ණය තොරතුරු
            </Typography>
          </Box>
          {loading && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                aligns: "center",
                py: 6,
              }}
            >
              <CircularProgress size={60} />
              <Typography variant="h6" sx={{ mt: 2, color: "#666" }}>
                ණය තොරතුරු පූරණය වේ...
              </Typography>
            </Box>
          )}
          {error && !loading && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          {!loading && !error && !loan && (
            <Typography variant="h6" color="textSecondary" align="center">
              ඔබට ලියාපදිංචි ණය තොරතුරු නොමැත
            </Typography>
          )}
          {!loading && loan && (
            <>
              <Grid2 container justifyContent={'space-between'} aligns="center" sx={{ mb: 2 }}>
                <Grid2  xs={12} sm={6}>
                  <Typography variant="h6" sx={{  }}>
                    ණය අංකය: {loan.loanNumber}
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 1 }}>
                    ණය දිනය: {formattedLoanDate}
                  </Typography>
                  <Box sx={{ display: 'flex', aligns: 'center', mt: 1 }}>
                    <strong>මුළු මාස ගණන:</strong>
                    <Chip
                      label={totalMonths}
                      size="small"
                      color={Number(totalMonths) >= 10 ? 'error' : 'default'}
                      icon={Number(totalMonths) >= 10 ? <ErrorOutlineIcon /> : null}
                      sx={{ ml: 1, fontWeight: Number(totalMonths) >= 10 ? 'bold' : 'normal' }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', aligns: 'center', mt: 1 }}>
                    <strong>නොගෙවූ මාස:</strong>
                    <Chip
                      label={unpaidMonths}
                      size="small"
                      color={unpaidMonths >= 6 ? 'error' : unpaidMonths >=3 ? 'warning' : 'default'}
                      icon={unpaidMonths >= 6 ? <ErrorOutlineIcon /> : unpaidMonths > 3 ? <WarningAmberIcon /> : null}
                      sx={{ ml: 1, fontWeight: unpaidMonths >= 6 ? 'bold' : 'normal' }}
                    />
                  </Box>
                </Grid2>
                <Grid2  xs={12} sm={6}>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    <strong>ඉතිරි ණය මුදල:</strong>{" "}
                    {formatCurrency(loan.loanRemainingAmount)}
                  </Typography>
                  
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    <strong>පොලිය:</strong>{" "}
                    {calculatedInterest?.int
                      ? formatCurrency(calculatedInterest.int)
                      : 0}
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    <strong>දඩ පොලිය:</strong>{" "}
                    {calculatedInterest?.penInt
                      ? formatCurrency(calculatedInterest.penInt)
                      : 0}
                  </Typography>
                  <Typography variant="body1"sx={{ mt: 1 }}>
                    <strong>ණය වාරිකය:</strong>{" "}
                    {calculatedInterest?.installment
                      ? formatCurrency(calculatedInterest.installment)
                      : 0}
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    <strong>මුළු මුදල:</strong>{" "}
                    {formatCurrency(
                      (Number(totalMonths) > 10
                        ? (loan?.loanPrincipalRemainingAmount ?? loan?.loanRemainingAmount ?? 0)
                        : (loan?.loanRemainingAmount ?? 0)
                      )
                      + (calculatedInterest?.penInt ? calculatedInterest.penInt : 0)
                      + (calculatedInterest?.int ? calculatedInterest.int : 0)
                    )}
                  </Typography>
                </Grid2>
              </Grid2>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="textSecondary">
                <strong>ඇපකරු1:</strong> {loan?.guarantor1Id?.member_id} /{" "}
                {loan?.guarantor1Id?.name}, {loan?.guarantor1Id?.mobile}
                <br />
                <strong>ඇපකරු2:</strong> {loan?.guarantor2Id?.member_id} /{" "}
                {loan?.guarantor2Id?.name}, {loan?.guarantor2Id?.mobile}
              </Typography>
            </>
          )}
        </Paper>
        {!loading && loan && (
          <Paper
            elevation={2}
            sx={{ p: { xs: 2, sm: 4 }, mb: 3, borderRadius: 3 }}
          >
            <Box sx={{ display: "flex", aligns: "center", mb: 2 }}>
              <PaymentsIcon color="primary" sx={{ mr: 1, fontSize: 28 }} />
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                ණය ආපසු ගෙවීම්
              </Typography>
            </Box>
            <StickyHeadTable
              columnsArray={paymentColumns}
              dataArray={paymentDataArray}
            />
          </Paper>
        )}
      </Container>
    </Layout>
  )
}
