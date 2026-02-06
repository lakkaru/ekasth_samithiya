import React, { useEffect, useState } from "react"
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Grid2,
  Card,
  CardContent,
  Chip,
  Container,
  CircularProgress,
  Alert,
  Avatar,
  IconButton
} from "@mui/material"
import {
  Person as PersonIcon,
  Home as HomeIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  AccountBalance as AccountBalanceIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  Group as GroupIcon,
  Gavel as GavelIcon,
  EventBusy as EventBusyIcon,
  Security as SecurityIcon,
  LocationOn as LocationOnIcon,
  WhatsApp as WhatsAppIcon,
  Assignment as AssignmentIcon
} from "@mui/icons-material"
import api from "../../utils/api"
import { navigate } from "gatsby"

import { useMember } from "../../context/MemberContext"
import Layout from "../../components/layout"

const baseUrl = process.env.GATSBY_API_BASE_URL
// const token = localStorage.getItem("authToken")
// let token = null;

// if (typeof window !== "undefined") {
//   token = localStorage.getItem("authToken");
// }

const MemberHomePage = () => {
  const { memberData, setMemberData } = useMember()
  const [loading, setLoading] = useState(!memberData) // Only show loading if no memberData in context
  const [error, setError] = useState("")

  useEffect(() => {
    // If memberData is available in context, use it
    if (memberData) {
      setLoading(false)
    } else {
      // Fetch member data if not available in context
      const fetchMemberData = async () => {
        try {
          setLoading(true)
          const response = await api.get(`${baseUrl}/member/info`)
          console.log("response: ", response.data)
          setMemberData(response.data)
        } catch (err) {
          console.error("Error fetching member data:", err)
          setError("Failed to load member data. Please try again later.")
          setMemberData(null)
        } finally {
          setLoading(false)
        }
      }
      fetchMemberData()
    }
  }, [memberData])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('si-LK', {
      style: 'currency',
      currency: 'LKR'
    }).format(Math.abs(amount) || 0)
  }

  const getStatusColor = (amount) => {
    if (amount < 0) return "success" // Green for surplus/credit
    if (amount > 0) return "error" // Red for due/debt
    return "info" // Blue for zero balance
  }

  const getStatusIcon = (amount) => {
    if (amount < 0) return <TrendingUpIcon />
    if (amount > 0) return <WarningIcon />
    return <AccountBalanceIcon />
  }

  const calculateTotalDue = () => {
    return (memberData?.membershipDue || 0) + 
           (memberData?.fineDue || 0) + 
           (memberData?.due2023 || 0)
  }
  if (loading) {
    return (
      <Layout>
        <Container maxWidth="lg" sx={{ padding: "40px 20px", textAlign: "center" }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ marginTop: "20px", color: "#666" }}>
            සාමාජික තොරතුරු පූරණය වේ...
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

  if (!memberData) {
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

  const totalDue = calculateTotalDue()

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ padding: "20px" }}>
        {/* Page Header */}
        <Box sx={{ textAlign: "center", marginBottom: "40px" }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              margin: "0 auto 20px",
              background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
              fontSize: "2rem"
            }}
          >
            <PersonIcon fontSize="large" />
          </Avatar>
          <Typography
            variant="h4"
            gutterBottom
            sx={{ 
              fontWeight: "bold", 
              color: "#2c3e50",
              marginBottom: "10px"
            }}
          >
            සාමාජික මුල් පිටුව
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            ඔබගේ සමිති සාමාජිකත්වයේ සම්පූර්ණ විස්තර
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
                background: memberData?.due2023 < 0 
                  ? "linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)"
                  : "linear-gradient(135deg, #fff3e0 0%, #ffcc02 100%)",
                border: `2px solid ${memberData?.due2023 < 0 ? "#4caf50" : "#ff9800"}`,
                borderRadius: "12px"
              }}
            >
              <CardContent sx={{ textAlign: "center", padding: "24px" }}>
                <Box sx={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
                  {getStatusIcon(memberData?.due2023)}
                </Box>
                <Typography variant="h6" sx={{ fontWeight: "bold", marginBottom: "8px" }}>
                  පසුගිය වසර
                </Typography>
                <Chip
                  label={memberData?.due2023 < 0 ? "ඉතිරිය" : "හිඟය"}
                  color={getStatusColor(memberData?.due2023)}
                  size="small"
                  sx={{ marginBottom: "8px" }}
                />
                <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                  {formatCurrency(memberData?.due2023)}
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
                background: memberData?.membershipDue < 0 
                  ? "linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)"
                  : "linear-gradient(135deg, #fff3e0 0%, #ffcc02 100%)",
                border: `2px solid ${memberData?.membershipDue < 0 ? "#4caf50" : "#ff9800"}`,
                borderRadius: "12px"
              }}
            >
              <CardContent sx={{ textAlign: "center", padding: "24px" }}>
                <Box sx={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
                  {getStatusIcon(memberData?.membershipDue)}
                </Box>
                <Typography variant="h6" sx={{ fontWeight: "bold", marginBottom: "8px" }}>
                  සාමාජික මුදල්
                </Typography>
                <Chip
                  label={memberData?.membershipDue < 0 ? "ඉතිරිය" : "හිඟය"}
                  color={getStatusColor(memberData?.membershipDue)}
                  size="small"
                  sx={{ marginBottom: "8px" }}
                />
                <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                  {formatCurrency(memberData?.membershipDue)}
                </Typography>
              </CardContent>
            </Card>
          </Grid2>

          {/* Fines */}
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
                  <GavelIcon sx={{ color: "#f44336" }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: "bold", marginBottom: "8px" }}>
                  දඩ මුදල්
                </Typography>
                <Chip
                  label="දඩ"
                  color="error"
                  size="small"
                  sx={{ marginBottom: "8px" }}
                />
                <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                  {formatCurrency(memberData?.fineTotal || 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid2>

          {/* Total Balance */}
          <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
            <Card 
              elevation={3}
              sx={{ 
                height: "100%",
                background: totalDue < 0 
                  ? "linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)"
                  : "linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)",
                border: `2px solid ${totalDue < 0 ? "#4caf50" : "#f44336"}`,
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

        {/* Information Sections */}
        <Grid2 container spacing={3}>
          {/* Contact Information */}
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Card elevation={3} sx={{ borderRadius: "12px", height: "100%" }}>
              <Box sx={{ 
                background: "linear-gradient(135deg, #2196f3 0%, #42a5f5 100%)",
                color: "white",
                padding: "20px",
                textAlign: "center"
              }}>
                <Typography variant="h6" sx={{ fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <PersonIcon sx={{ marginRight: "8px" }} />
                  සම්බන්ධතා තොරතුරු
                </Typography>
              </Box>
              <CardContent sx={{ padding: "20px" }}>
                <List disablePadding>
                  <ListItem sx={{ padding: "12px 0" }}>
                    <LocationOnIcon sx={{ marginRight: "15px", color: "#666" }} />
                    <ListItemText
                      primary="බල ප්‍රදේශය"
                      secondary={memberData?.area || "ලබා දී නැත"}
                      primaryTypographyProps={{ fontWeight: "bold" }}
                    />
                  </ListItem>
                  <Divider />
                  <ListItem sx={{ padding: "12px 0" }}>
                    <HomeIcon sx={{ marginRight: "15px", color: "#666" }} />
                    <ListItemText
                      primary="ලිපිනය"
                      secondary={memberData?.address || "ලබා දී නැත"}
                      primaryTypographyProps={{ fontWeight: "bold" }}
                    />
                  </ListItem>
                  <Divider />
                  <ListItem sx={{ padding: "12px 0" }}>
                    <PhoneIcon sx={{ marginRight: "15px", color: "#666" }} />
                    <ListItemText
                      primary="ජංගම දුරකථන"
                      secondary={memberData?.mobile || "ලබා දී නැත"}
                      primaryTypographyProps={{ fontWeight: "bold" }}
                    />
                  </ListItem>
                  <Divider />
                  <ListItem sx={{ padding: "12px 0" }}>
                    <WhatsAppIcon sx={{ marginRight: "15px", color: "#25D366" }} />
                    <ListItemText
                      primary="WhatsApp"
                      secondary={memberData?.whatsApp || "ලබා දී නැත"}
                      primaryTypographyProps={{ fontWeight: "bold" }}
                    />
                  </ListItem>
                  <Divider />
                  <ListItem sx={{ padding: "12px 0" }}>
                    <EmailIcon sx={{ marginRight: "15px", color: "#666" }} />
                    <ListItemText
                      primary="Email"
                      secondary={memberData?.email || "ලබා දී නැත"}
                      primaryTypographyProps={{ fontWeight: "bold" }}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid2>

          {/* Activity Information */}
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Card elevation={3} sx={{ borderRadius: "12px", height: "100%" }}>
              <Box sx={{ 
                background: "linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)",
                color: "white",
                padding: "20px",
                textAlign: "center"
              }}>
                <Typography variant="h6" sx={{ fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <AssignmentIcon sx={{ marginRight: "8px" }} />
                  සමිති ක්‍රියාකාරකම්
                </Typography>
              </Box>
              <CardContent sx={{ padding: "20px" }}>
                <List disablePadding>
                  <ListItem sx={{ padding: "12px 0" }}>
                    <EventBusyIcon sx={{ marginRight: "15px", color: "#f44336" }} />
                    <ListItemText
                      primary="මහා සභා නොපැමිණිම්"
                      secondary={
                        <Chip 
                          label={memberData?.meetingAbsents ? `${memberData?.meetingAbsents} වතාවක්` : "නැත"}
                          color={memberData?.meetingAbsents > 0 ? "error" : "success"}
                          size="small"
                        />
                      }
                      primaryTypographyProps={{ fontWeight: "bold" }}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid2>
        </Grid2>

        {/* Loan Guarantor Information */}
        {memberData?.loanDetailsAsGuarantor && memberData.loanDetailsAsGuarantor.length > 0 && (
          <>
            <Divider sx={{ marginY: "30px" }} />
            <Grid2 container spacing={3}>
              <Grid2 size={{ xs: 12 }}>
                <Card elevation={3} sx={{ borderRadius: "12px" }}>
                  <Box sx={{ 
                    background: "linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)",
                    color: "white",
                    padding: "20px",
                    textAlign: "center"
                  }}>
                    <Typography variant="h6" sx={{ fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <SecurityIcon sx={{ marginRight: "8px" }} />
                      ණය ඇපකරු විස්තර
                    </Typography>
                  </Box>
                  <CardContent sx={{ padding: "20px" }}>
                    {memberData.loanDetailsAsGuarantor.map((loan, key) => {
                      const currentDate = new Date()
                      const lastIntPaymentDate = loan.lastIntPaymentDate
                        ? new Date(loan.lastIntPaymentDate)
                        : null

                      let unpaidMonths = 0
                      if (lastIntPaymentDate) {
                        const yearDiff = currentDate.getFullYear() - lastIntPaymentDate.getFullYear()
                        const monthDiff = currentDate.getMonth() - lastIntPaymentDate.getMonth()
                        unpaidMonths = yearDiff * 12 + monthDiff
                      }

                      return (
                        <Card 
                          key={key} 
                          variant="outlined" 
                          sx={{ 
                            marginBottom: "15px",
                            border: unpaidMonths >= 3 ? "2px solid #f44336" : "1px solid #e0e0e0",
                            borderRadius: "8px"
                          }}
                        >
                          <CardContent>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                                ණය #{key + 1}
                              </Typography>
                              <Chip
                                label={unpaidMonths >= 3 ? "අවදානම්" : "සාමාන්‍ය"}
                                color={unpaidMonths >= 3 ? "error" : "success"}
                                size="small"
                              />
                            </Box>
                            <Typography variant="body1" sx={{ marginBottom: "8px" }}>
                              <strong>ණය ගන්නා:</strong> {loan.loanMember.member_id} - {loan.loanMember.name}
                            </Typography>
                            <Typography variant="body1" sx={{ marginBottom: "8px" }}>
                              <strong>ඉතිරි මුදල:</strong> {formatCurrency(loan.loanRemainingAmount)}
                            </Typography>
                            <Typography variant="body1" sx={{ marginBottom: "8px" }}>
                              <strong>ණය ගත් දිනය:</strong> {new Date(loan.loanDate).toLocaleDateString()}
                            </Typography>
                            <Typography 
                              variant="body1" 
                              sx={{ 
                                color: unpaidMonths >= 3 ? "#f44336" : "inherit",
                                fontWeight: unpaidMonths >= 3 ? "bold" : "normal"
                              }}
                            >
                              <strong>නොගෙවු මාස:</strong> {unpaidMonths > 0 ? `${unpaidMonths} මාසය` : "නැත"}
                            </Typography>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </CardContent>
                </Card>
              </Grid2>
            </Grid2>
          </>
        )}

        {/* Dependents Information */}
        {memberData?.dependents && memberData.dependents.length > 0 && (
          <>
            <Divider sx={{ marginY: "30px" }} />
            <Grid2 container spacing={3}>
              <Grid2 size={{ xs: 12 }}>
                <Card elevation={3} sx={{ borderRadius: "12px" }}>
                  <Box sx={{ 
                    background: "linear-gradient(135deg, #4caf50 0%, #81c784 100%)",
                    color: "white",
                    padding: "20px",
                    textAlign: "center"
                  }}>
                    <Typography variant="h6" sx={{ fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <GroupIcon sx={{ marginRight: "8px" }} />
                      යැපෙන්නන් ලේඛනය
                    </Typography>
                  </Box>
                  <CardContent sx={{ padding: "20px" }}>
                    <Grid2 container spacing={2}>
                      {memberData.dependents.map((dependent, index) => (
                        <Grid2 size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                          <Card variant="outlined" sx={{ borderRadius: "8px" }}>
                            <CardContent sx={{ textAlign: "center", padding: "16px" }}>
                              <Avatar 
                                sx={{ 
                                  width: 50, 
                                  height: 50, 
                                  margin: "0 auto 10px",
                                  background: "linear-gradient(135deg, #4caf50 0%, #81c784 100%)"
                                }}
                              >
                                <PersonIcon />
                              </Avatar>
                              <Typography variant="h6" sx={{ fontWeight: "bold", marginBottom: "5px" }}>
                                {dependent.name}
                              </Typography>
                              <Chip
                                label={dependent.relationship}
                                color="primary"
                                size="small"
                              />
                            </CardContent>
                          </Card>
                        </Grid2>
                      ))}
                    </Grid2>
                  </CardContent>
                </Card>
              </Grid2>
            </Grid2>
          </>
        )}

        {/* No dependents message */}
        {(!memberData?.dependents || memberData.dependents.length === 0) && (
          <>
            <Divider sx={{ marginY: "30px" }} />
            <Paper 
              elevation={2} 
              sx={{ 
                padding: "40px", 
                textAlign: "center",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #f5f5f5 0%, #eeeeee 100%)"
              }}
            >
              <GroupIcon sx={{ fontSize: 60, color: "#ccc", marginBottom: "20px" }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                යැපෙන්නන් නොමැත
              </Typography>
              <Typography variant="body2" color="textSecondary">
                ඔබට ලියාපදිංචි යැපෙන්නන් නොමැත
              </Typography>
            </Paper>
          </>
        )}
      </Container>
    </Layout>
  )
}

export default MemberHomePage
