import React, { useEffect, useState } from "react"
import Layout from "../../components/layout"
import StickyHeadTable from "../../components/StickyHeadTable"
import { 
  Box, 
  Typography, 
  Paper, 
  Grid2, 
  Card, 
  CardContent, 
  Divider,
  Chip,
  Container,
  CircularProgress,
  Alert
} from "@mui/material"
import {
  AccountBalance as AccountBalanceIcon,
  Payment as PaymentIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  History as HistoryIcon
} from "@mui/icons-material"

import api from "../../utils/api"
import { useMember } from "../../context/MemberContext"
const baseUrl = process.env.GATSBY_API_BASE_URL

export default function Payments() {
  const { memberData } = useMember()
  const [memberInfo, setMemberInfo] = useState(memberData)
  const [loading, setLoading] = useState(!memberData) // Only show loading if no memberData in context
  const [error, setError] = useState(null)
  const [groupedPayments, setGroupedPayments] = useState({})
  //   const [perviousDue, setPerviousDue] = useState()
  //   const [member, setMember] = useState({})
  // console.log(member)

  const columnsArray = [
    { id: "date", label: "දිනය", minWidth: 120 },
    { id: "memAmount", label: "සාමාජික මුදල්", minWidth: 150 },
    { id: "fineAmount", label: "දඩ/හිඟ මුදල්", minWidth: 150 },
  ]
  // console.log('groupedPayments:', groupedPayments["2024"]?.totals.memAmount);
  //   let fines = []
  //   const getMemberAccountById = async () => {
  //     try {
  // Step 1: Get all dues
  //   const dueResponse = await Axios.get(
  //     `http://127.0.0.1:3001/api/getAllDueById?member_id=${memberId}`
  //   )
  //   const previousDue = dueResponse.data.due.previousDue
  //   setPerviousDue(previousDue.totalDue) // Set the previous due
  //   // fines = dueResponse.data.due.fines
  //   // console.log("Previous Due:", fines)

  //   // Step 2: Get payments
  //   const paymentsResponse = await Axios.get(
  //     `http://127.0.0.1:3001/api/getPaymentsById?member_id=${memberId}`
  // //   )
  //   const { payments, member, fines } = paymentsResponse.data
  //   setMember(member) // Set the member details
  //   // console.log("Member Details:", member)

  //   // Step 3: Process and group payments
  //   const formattedPayments = payments.map(payment => ({
  //     ...payment,
  //     date:
  //       payment.date !== "Total"
  //         ? new Date(payment.date)
  //             .toISOString()
  //             .split("T")[0]
  //             .replace(/-/g, "/")
  //         : "Total",
  //   }))

  //   const grouped = formattedPayments.reduce((acc, payment) => {
  //     if (payment.date === "Total") return acc // Skip the global total row
  //     const year = payment.date.split("/")[0] // Extract the year
  //     if (!acc[year]) {
  //       acc[year] = {
  //         payments: [],
  //         totals: { memAmount: 0, fineAmount: 0 },
  //       }
  //     }

  //     acc[year].payments.push(payment)

  //     acc[year].totals.memAmount += payment.memAmount || 0
  //     acc[year].totals.fineAmount += payment.fineAmount || 0

  //     return acc
  //   }, {})

  // Add totals to each year's group
  //       Object.keys(grouped).forEach(year => {
  //         grouped[year].payments.push({
  //           date: "Total",
  //           memAmount: grouped[year].totals.memAmount,
  //           fineAmount: grouped[year].totals.fineAmount,
  //         })
  //       })

  //       setGroupedPayments(grouped)
  //       // console.log("Grouped Payments:", grouped);
  //     } catch (error) {
  //       console.error("Error in getMemberAccountById:", error)
  //     }
  //   }
  //   let membershipDue = 0
  //   const currentMonth = new Date().getMonth() + 1 // Get the current month (1-based)
  //   if (member.siblingsCount === 0) {
  //     membershipDue = currentMonth * 300
  //   } else {
  //     membershipDue = currentMonth * 300 * (1.3 * member.siblingsCount)
  //   }

  //   const totalFines = fines.reduce((total, fine) => total + fine.amount, 0)
  //   // console.log("membershipDue:", membershipDue)
  //   const totalDue = (perviousDue + membershipDue)||0
  //   let membershipDue = 0
  //   let totalFines = 0
  //   let totalDue = 0

  // console.log("groupedPayments :", groupedPayments)
  useEffect(() => {
    // If memberData is available in context, use it and set loading to false
    if (memberData) {
      setMemberInfo(memberData)
      setLoading(false)
    } else {
      // Get memberData if page reload and context is empty
      const fetchMemberData = async () => {
        try {
          setLoading(true)
          const response = await api.get(`${baseUrl}/member/info`)
          console.log("response: ", response.data)
          setMemberInfo(response.data)
        } catch (err) {
          console.error("Error fetching member data:", err)
          setError("Failed to load member data. Please try again later.")
          setMemberInfo(null)
        } finally {
          setLoading(false)
        }
      }
      fetchMemberData()
    }

    // Getting payments of member
    const fetchPayments = async () => {
      try {
        const response = await api.get(`${baseUrl}/member/payments`)
        console.log("payments response: ", response.data)
        setGroupedPayments(response.data.payments)
      } catch (err) {
        console.error("Error fetching payments:", err)
        setError("Failed to load payments. Please try again later.")
        setGroupedPayments({})
      }
    }

    fetchPayments()
  }, [memberData]) // Add memberData as dependency
  // console.log(memberInfo?.previousDue?.totalDue<0).
  const membershipDue = memberInfo?.membershipDue
  const totalDue =
    memberInfo?.previousDue +
      memberInfo?.membershipDue +
      memberInfo?.fineDue || "0"

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('si-LK', {
      style: 'currency',
      currency: 'LKR'
    }).format(Math.abs(amount) || 0)
  }

  const getStatusColor = (amount) => {
    if (amount < 0) return "success" // Green for surplus/credit
    if (amount > 0) return "warning" // Orange for due/debt
    return "info" // Blue for zero balance
  }

  const getStatusIcon = (amount) => {
    if (amount < 0) return <TrendingUpIcon />
    if (amount > 0) return <WarningIcon />
    return <AccountBalanceIcon />
  }

  if (loading) {
    return (
      <Layout>
        <Container maxWidth="lg" sx={{ padding: "40px 20px", textAlign: "center" }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ marginTop: "20px", color: "#666" }}>
            ගෙවීම් තොරතුරු පූරණය වේ...
          </Typography>
        </Container>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <Container maxWidth="lg" sx={{ padding: "40px 20px" }}>
          <Alert severity="error" sx={{ marginBottom: "20px" }}>
            {error}
          </Alert>
        </Container>
      </Layout>
    )
  }

  if (!memberInfo) {
    return (
      <Layout>
        <Container maxWidth="lg" sx={{ padding: "40px 20px", textAlign: "center" }}>
          <Alert severity="warning" sx={{ marginBottom: "20px" }}>
            සාමාජික තොරතුරු ලබා ගත නොහැක. කරුණාකර නැවත උත්සාහ කරන්න.
          </Alert>
        </Container>
      </Layout>
    )
  }

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ padding: "20px" }}>
        {/* Page Header */}
        <Box sx={{ textAlign: "center", marginBottom: "40px" }}>
          <Typography
            variant="h4"
            gutterBottom
            sx={{ 
              fontWeight: "bold", 
              color: "#2c3e50",
              marginBottom: "10px"
            }}
          >
            <PaymentIcon sx={{ marginRight: "10px", verticalAlign: "middle" }} />
            මගේ ගෙවීම් ඉතිහාසය
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            සාමාජික ගෙවීම් සහ දඩ ගෙවීම් විස්තර
          </Typography>
        </Box>

        {/* Financial Summary Cards */}
        <Grid2 container spacing={3} sx={{ marginBottom: "40px" }}>
          {/* Previous Due */}
          <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
            <Card 
              elevation={3}
              sx={{ 
                height: "100%",
                background: memberInfo?.previousDue < 0 
                  ? "linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)"
                  : "linear-gradient(135deg, #fff3e0 0%, #ffcc02 100%)",
                border: `2px solid ${memberInfo?.previousDue < 0 ? "#4caf50" : "#ff9800"}`,
                borderRadius: "12px"
              }}
            >
              <CardContent sx={{ textAlign: "center", padding: "24px" }}>
                <Box sx={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
                  {getStatusIcon(memberInfo?.previousDue)}
                </Box>
                <Typography variant="h6" sx={{ fontWeight: "bold", marginBottom: "8px" }}>
                  පැරණි ශේෂය
                </Typography>
                <Chip
                  label={memberInfo?.previousDue < 0 ? "ඉතිරිය" : "හිඟය"}
                  color={getStatusColor(memberInfo?.previousDue)}
                  size="small"
                  sx={{ marginBottom: "8px" }}
                />
                <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                  {formatCurrency(memberInfo?.previousDue)}
                </Typography>
              </CardContent>
            </Card>
          </Grid2>

          {/* Membership Due */}
          <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
            <Card 
              elevation={3}
              sx={{ 
                height: "100%",
                background: membershipDue < 0 
                  ? "linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)"
                  : "linear-gradient(135deg, #fff3e0 0%, #ffcc02 100%)",
                border: `2px solid ${membershipDue < 0 ? "#4caf50" : "#ff9800"}`,
                borderRadius: "12px"
              }}
            >
              <CardContent sx={{ textAlign: "center", padding: "24px" }}>
                <Box sx={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
                  {getStatusIcon(membershipDue)}
                </Box>
                <Typography variant="h6" sx={{ fontWeight: "bold", marginBottom: "8px" }}>
                  සාමාජික මුදල්
                </Typography>
                <Chip
                  label={membershipDue < 0 ? "ඉතිරිය" : "හිඟය"}
                  color={getStatusColor(membershipDue)}
                  size="small"
                  sx={{ marginBottom: "8px" }}
                />
                <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                  {formatCurrency(membershipDue)}
                </Typography>
              </CardContent>
            </Card>
          </Grid2>

          {/* Fine/Penalty */}
          <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
            <Card 
              elevation={3}
              sx={{ 
                height: "100%",
                background: "linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)",
                border: "2px solid #f44336",
                borderRadius: "12px"
              }}
            >
              <CardContent sx={{ textAlign: "center", padding: "24px" }}>
                <Box sx={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
                  <WarningIcon sx={{ color: "#f44336" }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: "bold", marginBottom: "8px" }}>
                  දඩ/හිඟ මුදල්
                </Typography>
                <Chip
                  label="දඩ"
                  color="error"
                  size="small"
                  sx={{ marginBottom: "8px" }}
                />
                <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                  {formatCurrency(memberInfo?.fineTotal || 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid2>

          {/* Total Due */}
          <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
            <Card 
              elevation={3}
              sx={{ 
                height: "100%",
                background: totalDue < 0 
                  ? "linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)"
                  : "linear-gradient(135deg, #fff3e0 0%, #ffcc02 100%)",
                border: `2px solid ${totalDue < 0 ? "#4caf50" : "#ff9800"}`,
                borderRadius: "12px"
              }}
            >
              <CardContent sx={{ textAlign: "center", padding: "24px" }}>
                <Box sx={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
                  {getStatusIcon(totalDue)}
                </Box>
                <Typography variant="h6" sx={{ fontWeight: "bold", marginBottom: "8px" }}>
                  සම්පූර්ණ ශේෂය
                </Typography>
                <Chip
                  label={totalDue < 0 ? "මුළු ඉතිරිය" : "මුළු හිඟය"}
                  color={getStatusColor(totalDue)}
                  size="small"
                  sx={{ marginBottom: "8px" }}
                />
                <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                  {formatCurrency(totalDue)}
                </Typography>
              </CardContent>
            </Card>
          </Grid2>
        </Grid2>

        <Divider sx={{ marginY: "30px" }} />

        {/* Payment History Section */}
        <Box sx={{ marginBottom: "20px" }}>
          <Typography
            variant="h5"
            gutterBottom
            sx={{ 
              fontWeight: "bold", 
              color: "#2c3e50",
              display: "flex",
              alignItems: "center",
              marginBottom: "20px"
            }}
          >
            <HistoryIcon sx={{ marginRight: "10px" }} />
            ගෙවීම් ඉතිහාසය
          </Typography>
        </Box>

        {/* Payment Tables by Year */}
        {groupedPayments &&
          Object.keys(groupedPayments)
            .sort((a, b) => b - a) // Sort years in descending order
            .map(year => (
              <Box key={year} sx={{ marginBottom: "30px" }}>
                <Paper 
                  elevation={4} 
                  sx={{ 
                    borderRadius: "12px",
                    overflow: "hidden",
                    border: "1px solid #e0e0e0"
                  }}
                >
                  <Box sx={{ 
                    background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
                    color: "white",
                    padding: "20px",
                    textAlign: "center"
                  }}>
                    <Typography
                      variant="h6"
                      sx={{ 
                        fontWeight: "bold",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <PaymentIcon sx={{ marginRight: "8px" }} />
                      {year} වසරේ ගෙවීම්
                    </Typography>
                  </Box>
                  <Box sx={{ padding: "20px" }}>
                    <StickyHeadTable
                      columnsArray={columnsArray}
                      dataArray={groupedPayments[year]?.payments || []}
                      headingAlignment={"center"}
                      dataAlignment={"center"}
                    />
                  </Box>
                </Paper>
              </Box>
            ))}

        {(!groupedPayments || Object.keys(groupedPayments).length === 0) && (
          <Paper 
            elevation={2} 
            sx={{ 
              padding: "40px", 
              textAlign: "center",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #f5f5f5 0%, #eeeeee 100%)"
            }}
          >
            <PaymentIcon sx={{ fontSize: 60, color: "#ccc", marginBottom: "20px" }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              ගෙවීම් ඉතිහාසයක් නොමැත
            </Typography>
            <Typography variant="body2" color="textSecondary">
              ඔබගේ ගෙවීම් මෙහි පෙන්වනු ඇත
            </Typography>
          </Paper>
        )}
      </Container>
    </Layout>
  )
}
