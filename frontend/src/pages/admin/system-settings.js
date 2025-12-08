import React, { useState, useEffect } from "react"
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from "@mui/material"
import {
  Edit as EditIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  AttachMoney as MoneyIcon,
  Gavel as FineIcon
} from "@mui/icons-material"
import Layout from "../../components/layout"
import { navigate } from "gatsby"
import api from "../../utils/api"
import loadable from "@loadable/component"

const AuthComponent = loadable(() =>
  import("../../components/common/AuthComponent")
)

const baseUrl = process.env.GATSBY_API_BASE_URL

export default function SystemSettings() {
  const [roles, setRoles] = useState([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [settings, setSettings] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  
  // Edit dialog state
  const [editDialog, setEditDialog] = useState(false)
  const [currentSetting, setCurrentSetting] = useState(null)
  const [editValue, setEditValue] = useState("")
  const [editReason, setEditReason] = useState("")
  const [saving, setSaving] = useState(false)
  
  // History dialog state
  const [historyDialog, setHistoryDialog] = useState(false)
  const [historySetting, setHistorySetting] = useState(null)

  const handleAuthStateChange = ({ isAuthenticated, roles }) => {
    setIsAuthenticated(isAuthenticated)
    setRoles(roles)
    
    // Only redirect if explicitly not authenticated (not just waiting for auth)
    if (isAuthenticated === false) {
      console.log("User is not authenticated, redirecting to login")
      navigate("/login/user-login")
      return
    }
    
    // Check for super-admin role only after authentication is confirmed
    if (isAuthenticated && !roles.includes("super-admin")) {
      console.log("Access denied: user authenticated but not super-admin")
      setError("ඔබට මෙම පිටුව බලන්න අවසරයක් නොමැත. Super Admin ප්‍රවේශයක් අවශ්‍ය වේ.")
      setTimeout(() => navigate("/"), 3000)
    }
  }

  useEffect(() => {
    // Only fetch settings if user is properly authenticated as super-admin
    if (isAuthenticated === true && roles.includes("super-admin")) {
      console.log("User authenticated as super-admin, fetching settings...")
      fetchSettings()
    } else if (isAuthenticated === true && !roles.includes("super-admin")) {
      console.log("User authenticated but not super-admin")
      // Error message already set in handleAuthStateChange
    } else {
      console.log("Waiting for authentication...", { isAuthenticated, roles })
    }
  }, [isAuthenticated, roles])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      setError("")
      console.log("Attempting to fetch settings...")
      const response = await api.get(`${baseUrl}/system-settings`)
      console.log("Settings response:", response.data)
      setSettings(response.data.settings || [])
    } catch (error) {
      console.error("Error fetching settings:", error)
      console.error("Error response:", error.response)
      if (error.response?.status === 401) {
        setError("සත්‍යාපනය අසාර්ථකයි. කරුණාකර නැවත ලොග් වන්න.")
        setTimeout(() => navigate("/login/user-login"), 2000)
      } else if (error.response?.status === 403) {
        setError("ප්‍රවේශය ප්‍රතික්ෂේප විය. ඔබට මෙම සම්පත් වලට ප්‍රවේශ වීමට අවසරයක් නොමැත.")
      } else {
        setError("සැකසුම් ලබා ගැනීමේදී දෝෂයක් ඇති විය: " + (error.response?.data?.message || error.message))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEditClick = (setting) => {
    setCurrentSetting(setting)
    setEditValue(setting.settingValue.toString())
    setEditReason("")
    setEditDialog(true)
  }

  const handleSaveEdit = async () => {
    if (!currentSetting || !editValue) {
      setError("සැකසුම් අගය අවශ්‍ය වේ")
      return
    }

    try {
      setSaving(true)
      setError("")

      // Convert value to appropriate type
      let value = editValue
      if (currentSetting.settingType === 'financial' || currentSetting.settingType === 'fine') {
        value = parseFloat(editValue)
        if (isNaN(value)) {
          setError("වලංගු සංඛ්‍යාවක් ඇතුළත් කරන්න")
          return
        }
      }

      const response = await api.put(`${baseUrl}/system-settings/${currentSetting.settingName}`, {
        settingValue: value,
        updateReason: editReason
      })

      setSuccess(response.data.message)
      setEditDialog(false)
      fetchSettings() // Refresh the list
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(""), 5000)
    } catch (error) {
      console.error("Error updating setting:", error)
      setError(error.response?.data?.message || "සැකසුම යාවත්කාලීන කිරීමේදී දෝෂයක් ඇති විය")
    } finally {
      setSaving(false)
    }
  }

  const handleHistoryClick = async (setting) => {
    try {
      setLoading(true)
      const response = await api.get(`${baseUrl}/system-settings/${setting.settingName}`)
      setHistorySetting(response.data.setting)
      setHistoryDialog(true)
    } catch (error) {
      setError("ඉතිහාසය ලබා ගැනීමේදී දෝෂයක් ඇති විය")
    } finally {
      setLoading(false)
    }
  }

  const handleInitializeSettings = async () => {
    try {
      setLoading(true)
      setError("")
      const response = await api.post(`${baseUrl}/system-settings/initialize`)
      setSuccess(response.data.message)
      fetchSettings()
      setTimeout(() => setSuccess(""), 5000)
    } catch (error) {
      setError(error.response?.data?.message || "සැකසුම් ආරම්භ කිරීමේදී දෝෂයක් ඇති විය")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('si-LK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatValue = (value, type) => {
    if (type === 'financial' || type === 'fine') {
      return `රු. ${parseFloat(value).toLocaleString()}`
    }
    return value.toString()
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'financial':
        return <MoneyIcon color="primary" />
      case 'fine':
        return <FineIcon color="warning" />
      default:
        return <SettingsIcon color="action" />
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'financial':
        return 'primary'
      case 'fine':
        return 'warning'
      default:
        return 'default'
    }
  }

  const groupedSettings = settings.reduce((acc, setting) => {
    if (!acc[setting.settingType]) {
      acc[setting.settingType] = []
    }
    acc[setting.settingType].push(setting)
    return acc
  }, {})

  return (
    <Layout>
      <AuthComponent onAuthStateChange={handleAuthStateChange} />
      <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4, textAlign: "center" }}>
          පද්ධති සැකසුම් කළමනාකරණය
        </Typography>

        {/* Debug Info - Remove in production */}
        {/* {process.env.NODE_ENV === 'development' && (
          <Card sx={{ mb: 2, backgroundColor: '#f5f5f5' }}>
            <CardContent>
              <Typography variant="body2">
                <strong>Debug Info:</strong> Authenticated: {isAuthenticated?.toString()}, Roles: {JSON.stringify(roles)}
              </Typography>
            </CardContent>
          </Card>
        )} */}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {/* Initialize Button */}
        {settings.length === 0 && !loading && (
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                සැකසුම් ආරම්භ කරන්න
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                පද්ධතිය සඳහා මූලික සැකසුම් ආරම්භ කරන්න
              </Typography>
              <Button
                variant="contained"
                onClick={handleInitializeSettings}
                disabled={loading}
                startIcon={<SettingsIcon />}
              >
                මූලික සැකසුම් ආරම්භ කරන්න
              </Button>
            </CardContent>
          </Card>
        )}

        {loading && settings.length === 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Settings by Type */}
        {Object.entries(groupedSettings).map(([type, typeSettings]) => (
          <Card key={type} sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                {getTypeIcon(type)}
                <Typography variant="h6" sx={{ ml: 1 }}>
                  {type === 'financial' ? 'මූල්‍ය සැකසුම්' : 
                   type === 'fine' ? 'දඩ සැකසුම්' : 'සාමාන්‍ය සැකසුම්'}
                </Typography>
              </Box>
              
              <Grid container spacing={2}>
                {typeSettings.map((setting) => (
                  <Grid item xs={12} md={6} key={setting._id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" component="div">
                              {setting.description}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {setting.settingName}
                            </Typography>
                          </Box>
                          <Chip 
                            label={getTypeColor(setting.settingType)} 
                            color={getTypeColor(setting.settingType)}
                            size="small"
                          />
                        </Box>
                        
                        <Typography variant="h5" color="primary" sx={{ mb: 2 }}>
                          {formatValue(setting.settingValue, setting.settingType)}
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          අවසන් වරට යාවත්කාලීන: {formatDate(setting.lastUpdateDate)}
                        </Typography>
                        
                        {/* Show latest update info instead of just updatedBy */}
                        {setting.updateHistory && setting.updateHistory.length > 0 ? (
                          <Box sx={{ mb: 2, p: 1, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              <strong>අවසන් වෙනස:</strong>
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {formatValue(setting.updateHistory[setting.updateHistory.length - 1].previousValue, setting.settingType)} → {formatValue(setting.updateHistory[setting.updateHistory.length - 1].newValue, setting.settingType)}
                            </Typography>
                            {setting.updateHistory[setting.updateHistory.length - 1].updateReason && (
                              <Typography variant="body2" color="text.secondary">
                                හේතුව: {setting.updateHistory[setting.updateHistory.length - 1].updateReason}
                              </Typography>
                            )}
                            <Typography variant="body2" color="text.secondary">
                              වෙනස් කිරීම් ගණන: {setting.updateHistory.length}
                            </Typography>
                          </Box>
                        ) : (
                          <Box sx={{ mb: 2, p: 1, backgroundColor: '#e8f5e8', borderRadius: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              <strong>මූලික සැකසුම:</strong> තවම වෙනස් කර නොමැත
                            </Typography>
                          </Box>
                        )}
                        
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<EditIcon />}
                            onClick={() => handleEditClick(setting)}
                          >
                            සංස්කරණය
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<HistoryIcon />}
                            onClick={() => handleHistoryClick(setting)}
                          >
                            ඉතිහාසය
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        ))}

        {/* Edit Dialog */}
        <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>සැකසුම සංස්කරණය</DialogTitle>
          <DialogContent>
            {currentSetting && (
              <Box sx={{ pt: 1 }}>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  <strong>{currentSetting.description}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  වර්තමාන අගය: {formatValue(currentSetting.settingValue, currentSetting.settingType)}
                </Typography>
                
                <TextField
                  fullWidth
                  label="නව අගය"
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (currentSetting.settingType === 'financial' || currentSetting.settingType === 'fine') ? 'රු. ' : undefined
                  }}
                />
                
                <TextField
                  fullWidth
                  label="වෙනස් කිරීමට හේතුව (අතිරේක)"
                  multiline
                  rows={3}
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialog(false)}>අවලංගු කරන්න</Button>
            <Button 
              onClick={handleSaveEdit} 
              variant="contained"
              disabled={saving || !editValue}
            >
              {saving ? <CircularProgress size={20} /> : "සුරකින්න"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* History Dialog */}
        <Dialog open={historyDialog} onClose={() => setHistoryDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>සැකසුම් ඉතිහාසය</DialogTitle>
          <DialogContent>
            {historySetting && (
              <Box sx={{ pt: 1 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  {historySetting.description}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  වර්තමාන අගය: {formatValue(historySetting.settingValue, historySetting.settingType)}
                </Typography>
                
                {historySetting.updateHistory && historySetting.updateHistory.length > 0 ? (
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>දිනය</TableCell>
                          <TableCell>පෙර අගය</TableCell>
                          <TableCell>නව අගය</TableCell>
                          <TableCell>හේතුව</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {historySetting.updateHistory.map((history, index) => (
                          <TableRow key={index}>
                            <TableCell>{formatDate(history.updateDate)}</TableCell>
                            <TableCell>{formatValue(history.previousValue, historySetting.settingType)}</TableCell>
                            <TableCell>{formatValue(history.newValue, historySetting.settingType)}</TableCell>
                            <TableCell>{history.updateReason || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography color="text.secondary">
                    කිසිදු යාවත්කාලීන ඉතිහාසයක් නොමැත
                  </Typography>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setHistoryDialog(false)}>වසන්න</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  )
}
