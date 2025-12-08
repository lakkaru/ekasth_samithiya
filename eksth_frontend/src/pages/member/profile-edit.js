import React, { useState, useEffect } from "react"
import {
  Box,
  TextField,
  Button,
  Typography,
  Grid2,
  Alert,
  InputAdornment,
  IconButton,
  Container,
  Card,
  CardContent,
  Divider,
  Avatar,
  CircularProgress,
  Paper
} from "@mui/material"
import { 
  Visibility, 
  VisibilityOff,
  Person as PersonIcon,
  Lock as LockIcon,
  Phone as PhoneIcon,
  WhatsApp as WhatsAppIcon,
  Email as EmailIcon,
  Home as HomeIcon,
  Save as SaveIcon,
  Edit as EditIcon
} from "@mui/icons-material"
import api from "../../utils/api"

import Layout from "../../components/layout"
import { navigate } from "gatsby"

const baseUrl = process.env.GATSBY_API_BASE_URL
// const token = localStorage.getItem("authToken")
// let token = null;

// if (typeof window !== "undefined") {
//   token = localStorage.getItem("authToken");
// }

export default function ProfileEdit() {
  const [memberData, setMemberData] = useState({
    password: "",
    confirmPassword: "",
    mobile: "",
    whatsApp: "",
    email: "",
    address: "",
  })

  const [feedback, setFeedback] = useState({ type: "", message: "" })
  const [passwordError, setPasswordError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Fetch current member data from API
    setLoading(true)
    api
      .get(`${baseUrl}/member/profile`)
      .then(response => {
        // console.log("response.data :", response.data)
        setMemberData(prev => ({
          ...prev,
          mobile: response.data.mobile || "",
          whatsApp: response.data.whatsApp || "",
          email: response.data.email || "",
          address: response.data.address || "",
        }))
      })
      .catch(error => {
        console.error("Error fetching member data:", error)
        setFeedback({
          type: "error",
          message: "සාමාජික තොරතුරු ලබා ගැනීමේදී දෝෂයක් සිදුවිය. කරුණාකර නැවත උත්සාහ කරන්න.",
        })
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const handleInputChange = e => {
    const { name, value } = e.target
    setMemberData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = () => {
    if (memberData.password !== memberData.confirmPassword) {
      setPasswordError("මුර පද නොගැලපේ!")
      return
    }

    setSaving(true)
    setPasswordError("")
    
    const { confirmPassword, ...dataToUpdate } = memberData // Remove confirmPassword from the data to send
    api
      .put(`${baseUrl}/member/profile`, dataToUpdate)
      .then(() => {
        setFeedback({
          type: "success",
          message: "අලුත් තොරතුරු සාර්ථකව ඇතුලත් කරන ලදී !",
        })
        setTimeout(() => {
          navigate("/member/home")
        }, 2000) // Navigate after 2 seconds to show success message
      })
      .catch(error => {
        console.error("Error updating profile:", error)
        setFeedback({
          type: "error",
          message: "තොරතුරු ඇතුලත් කිරීම අසාර්ථක විය. කරුණාකර නැවත උත්සහ කරන්න.",
        })
      })
      .finally(() => {
        setSaving(false)
      })
  }

  // Toggle password visibility
  const handleClickShowPassword = () => {
    setShowPassword(prev => !prev)
  }

  const handleClickShowConfirmPassword = () => {
    setShowConfirmPassword(prev => !prev)
  }

  // Clear password field on focus
  const handleFocus = e => {
    const { name } = e.target
    if (name === "password" || name === "confirmPassword") {
      setMemberData(prev => ({ ...prev, [name]: "" }))
    }
  }

  if (loading) {
    return (
      <Layout>
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
          <Paper
            elevation={8}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 4,
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              minHeight: 400
            }}
          >
            <CircularProgress size={60} sx={{ color: 'white', mb: 2 }} />
            <Typography variant="h6" sx={{ color: 'white', textAlign: 'center' }}>
              තොරතුරු පූරණය කරමින්...
            </Typography>
          </Paper>
        </Container>
      </Layout>
    )
  }

  return (
    <Layout>
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper
          elevation={8}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: 4,
            p: 4,
            mb: 3
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar sx={{ bgcolor: 'white', color: '#764ba2', mr: 2, width: 56, height: 56 }}>
              <EditIcon fontSize="large" />
            </Avatar>
            <Typography variant="h4" component="h1" sx={{ color: 'white', fontWeight: 'bold' }}>
              තොරතුරු සංස්කරණය
            </Typography>
          </Box>
        </Paper>

        {feedback.message && (
          <Alert severity={feedback.type} sx={{ mb: 3, borderRadius: 2 }}>
            {feedback.message}
          </Alert>
        )}

        {passwordError && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {passwordError}
          </Alert>
        )}

        <Grid2 container spacing={3}>
          {/* Password Change Card */}
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              borderRadius: 3,
              height: '100%'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar sx={{ bgcolor: 'white', color: '#00f2fe', mr: 2 }}>
                    <LockIcon />
                  </Avatar>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                    මුර පදය වෙනස් කරන්න
                  </Typography>
                </Box>
                
                <TextField
                  fullWidth
                  label="නව මුර පදය"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={memberData.password}
                  onChange={handleInputChange}
                  onFocus={handleFocus}
                  placeholder="නව මුර පදය ඇතුලත් කරන්න"
                  variant="filled"
                  margin="normal"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={handleClickShowPassword}>
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    mb: 2,
                    '& .MuiFilledInput-root': {
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      borderRadius: 2,
                      '&:hover': { backgroundColor: 'rgba(255,255,255,1)' }
                    }
                  }}
                />
                
                <TextField
                  fullWidth
                  label="මුර පදය තහවුරු කරන්න"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={memberData.confirmPassword}
                  onChange={handleInputChange}
                  onFocus={handleFocus}
                  placeholder="නව මුර පදය තහවුරු කරන්න"
                  variant="filled"
                  margin="normal"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={handleClickShowConfirmPassword}>
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiFilledInput-root': {
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      borderRadius: 2,
                      '&:hover': { backgroundColor: 'rgba(255,255,255,1)' }
                    }
                  }}
                />
              </CardContent>
            </Card>
          </Grid2>

          {/* Contact Information Card */}
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
              borderRadius: 3,
              height: '100%'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar sx={{ bgcolor: 'white', color: '#fa709a', mr: 2 }}>
                    <PhoneIcon />
                  </Avatar>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                    සබඳතා තොරතුරු
                  </Typography>
                </Box>
                
                <TextField
                  fullWidth
                  label="ජංගම දුරකථන"
                  name="mobile"
                  type="text"
                  value={memberData.mobile}
                  onChange={handleInputChange}
                  placeholder="ජංගම දුරකථන අංකය ඇතුලත් කරන්න"
                  variant="filled"
                  margin="normal"
                  InputProps={{
                    startAdornment: <PhoneIcon sx={{ mr: 1, color: 'rgba(0,0,0,0.6)' }} />
                  }}
                  sx={{
                    mb: 2,
                    '& .MuiFilledInput-root': {
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      borderRadius: 2,
                      '&:hover': { backgroundColor: 'rgba(255,255,255,1)' }
                    }
                  }}
                />
                
                <TextField
                  fullWidth
                  label="WhatsApp අංකය"
                  name="whatsApp"
                  type="text"
                  value={memberData.whatsApp}
                  onChange={handleInputChange}
                  placeholder="WhatsApp අංකය ඇතුලත් කරන්න"
                  variant="filled"
                  margin="normal"
                  InputProps={{
                    startAdornment: <WhatsAppIcon sx={{ mr: 1, color: 'rgba(0,0,0,0.6)' }} />
                  }}
                  sx={{
                    '& .MuiFilledInput-root': {
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      borderRadius: 2,
                      '&:hover': { backgroundColor: 'rgba(255,255,255,1)' }
                    }
                  }}
                />
              </CardContent>
            </Card>
          </Grid2>

          {/* Email and Address Card */}
          <Grid2 size={12}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
              borderRadius: 3
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar sx={{ bgcolor: 'white', color: '#a8edea', mr: 2 }}>
                    <HomeIcon />
                  </Avatar>
                  <Typography variant="h6" sx={{ color: 'rgba(0,0,0,0.8)', fontWeight: 'bold' }}>
                    ලිපින තොරතුරු
                  </Typography>
                </Box>
                
                <Grid2 container spacing={2}>
                  <Grid2 size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Email"
                      name="email"
                      type="text"
                      value={memberData.email}
                      onChange={handleInputChange}
                      placeholder="Email ඇතුලත් කරන්න"
                      variant="filled"
                      InputProps={{
                        startAdornment: <EmailIcon sx={{ mr: 1, color: 'rgba(0,0,0,0.6)' }} />
                      }}
                      sx={{
                        '& .MuiFilledInput-root': {
                          backgroundColor: 'rgba(255,255,255,0.9)',
                          borderRadius: 2,
                          '&:hover': { backgroundColor: 'rgba(255,255,255,1)' }
                        }
                      }}
                    />
                  </Grid2>
                  <Grid2 size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="ලිපිනය"
                      name="address"
                      type="text"
                      value={memberData.address}
                      onChange={handleInputChange}
                      placeholder="ලිපිනය ඇතුලත් කරන්න"
                      variant="filled"
                      multiline
                      rows={3}
                      sx={{
                        '& .MuiFilledInput-root': {
                          backgroundColor: 'rgba(255,255,255,0.9)',
                          borderRadius: 2,
                          '&:hover': { backgroundColor: 'rgba(255,255,255,1)' }
                        }
                      }}
                    />
                  </Grid2>
                </Grid2>
              </CardContent>
            </Card>
          </Grid2>
        </Grid2>

        {/* Action Button */}
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 3,
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              textTransform: 'none',
              fontWeight: 'bold',
              minWidth: 200,
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)'
              },
              '&:disabled': {
                background: 'rgba(102, 126, 234, 0.5)',
              }
            }}
          >
            {saving ? 'සුරැකෙමින්...' : 'නව තොරතුරු ඇතුලත් කරන්න'}
          </Button>
        </Box>
      </Container>
    </Layout>
  )
}
