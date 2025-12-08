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
  Warning as WarningIcon,
  Gavel as GavelIcon,
  Assessment as AssessmentIcon,
  History as HistoryIcon,
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon
} from "@mui/icons-material"

import api from "../../utils/api"
import { useMember } from "../../context/MemberContext"
const baseUrl = process.env.GATSBY_API_BASE_URL

export default function Fines() {
  const { memberData } = useMember()
  const [memberInfo, setMemberInfo] = useState(memberData)
  const [loading, setLoading] = useState(!memberData) // Only show loading if no memberData in context
  const [error, setError] = useState(null)
  const [fines, setFines] = useState([])

  const columnsArray = [
    { id: "date", label: "දිනය", minWidth: 120 },
    { id: "fineType", label: "කාරණය", minWidth: 200 },
    { id: "fineAmount", label: "දඩ මුදල්", minWidth: 150 },
  ]
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

    // Getting fines of member
    const fetchFines = async () => {
      try {
        const response = await api.get(`${baseUrl}/member/fines`)
        console.log("fines response: ", response.data)
        setFines(response.data.fines || [])
      } catch (err) {
        console.error("Error fetching fines:", err)
        setError("Failed to load fines. Please try again later.")
        setFines([])
      }
    }

    fetchFines()
  }, [memberData]) // Add memberData as dependency

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

  const getTotalFines = () => {
    if (!Array.isArray(fines)) return 0
    return fines.reduce((total, fine) => total + (fine.fineAmount || 0), 0)
  }

  const getFineTypeColor = (fineType) => {
    if (!fineType) return "default"
    const lowerType = fineType.toLowerCase()
    if (lowerType.includes("සභා") || lowerType.includes("රැස්වීම")) return "warning"
    if (lowerType.includes("ගෙවීම") || lowerType.includes("ගාස්තු")) return "error"
    if (lowerType.includes("කටයුත්ත") || lowerType.includes("ක්‍රියාකාරකම්")) return "info"
    return "secondary"
  }

  if (loading) {
    return (
      <Layout>
        <Container maxWidth="lg" sx={{ padding: "40px 20px", textAlign: "center" }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ marginTop: "20px", color: "#666" }}>
            දඩ තොරතුරු පූරණය වේ...
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
            <GavelIcon sx={{ marginRight: "10px", verticalAlign: "middle" }} />
            මගේ දඩ විස්තර
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            දඩ මුදල් සහ කාරණා විස්තර
          </Typography>
        </Box>

        {/* Financial Summary Cards */}
        <Grid2 container spacing={3} sx={{ marginBottom: "40px" }}>
          {/* Previous Due */}
          <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
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

          {/* Current Fines Total */}
          <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
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
                  වර්තමාන දඩ මුදල්
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

          {/* Fines Count */}
          <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
            <Card 
              elevation={3}
              sx={{ 
                height: "100%",
                background: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
                border: "2px solid #2196f3",
                borderRadius: "12px"
              }}
            >
              <CardContent sx={{ textAlign: "center", padding: "24px" }}>
                <Box sx={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
                  <AssessmentIcon sx={{ color: "#2196f3" }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: "bold", marginBottom: "8px" }}>
                  දඩ ගණන
                </Typography>
                <Chip
                  label="සංඛ්‍යාව"
                  color="info"
                  size="small"
                  sx={{ marginBottom: "8px" }}
                />
                <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                  {Array.isArray(fines) ? fines.length : 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid2>
        </Grid2>

        <Divider sx={{ marginY: "30px" }} />

        {/* Fines History Section */}
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
            දඩ ඉතිහාසය
          </Typography>
        </Box>

        {/* Fines Table */}
        {fines && fines.length > 0 ? (
          <Paper 
            elevation={4} 
            sx={{ 
              borderRadius: "12px",
              overflow: "hidden",
              border: "1px solid #e0e0e0"
            }}
          >
            <Box sx={{ 
              background: "linear-gradient(135deg, #f44336 0%, #e57373 100%)",
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
                <GavelIcon sx={{ marginRight: "8px" }} />
                දඩ විස්තර
              </Typography>
            </Box>
            <Box sx={{ padding: "20px" }}>
              {/* Enhanced Table with better formatting */}
              <Paper elevation={1} sx={{ borderRadius: "8px", overflow: "hidden" }}>
                <Box sx={{ padding: "10px" }}>
                  {fines.map((fine, index) => (
                    <Box 
                      key={index}
                      sx={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center",
                        padding: "15px",
                        borderBottom: index < fines.length - 1 ? "1px solid #e0e0e0" : "none",
                        "&:hover": {
                          backgroundColor: "#f5f5f5"
                        }
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: "bold", marginBottom: "5px" }}>
                          {new Date(fine.date).toLocaleDateString('si-LK')}
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Chip
                            label={fine.fineType || "නිශ්චිත නොවේ"}
                            color={getFineTypeColor(fine.fineType)}
                            size="small"
                          />
                        </Box>
                      </Box>
                      <Box sx={{ textAlign: "right" }}>
                        <Typography variant="h6" sx={{ fontWeight: "bold", color: "#f44336" }}>
                          {formatCurrency(fine.fineAmount)}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Box>
          </Paper>
        ) : (
          <Paper 
            elevation={2} 
            sx={{ 
              padding: "40px", 
              textAlign: "center",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #f5f5f5 0%, #eeeeee 100%)"
            }}
          >
            <GavelIcon sx={{ fontSize: 60, color: "#ccc", marginBottom: "20px" }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              දඩ ඉතිහාසයක් නොමැත
            </Typography>
            <Typography variant="body2" color="textSecondary">
              ඔබට කිසිදු දඩයක් නොමැත
            </Typography>
          </Paper>
        )}
      </Container>
    </Layout>
  )
}
