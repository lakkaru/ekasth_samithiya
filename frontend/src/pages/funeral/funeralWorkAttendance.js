import React, { useState, useEffect } from "react"
import {
  Box,
  Button,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Grid,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  Alert,
  CircularProgress
} from "@mui/material"
import Layout from "../../components/layout"
import { navigate } from "gatsby"
import api from "../../utils/api"
import { getFineSettings } from "../../utils/settingsHelper"
import loadable from "@loadable/component"

const AuthComponent = loadable(() =>
  import("../../components/common/AuthComponent")
)

const baseUrl = process.env.GATSBY_API_BASE_URL

export default function FuneralWorkAttendance() {
  const [roles, setRoles] = useState([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Funeral selection
  const [availableFunerals, setAvailableFunerals] = useState([])
  const [selectedFuneralId, setSelectedFuneralId] = useState("")
  const [selectedFuneral, setSelectedFuneral] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Fine amounts from database
  const [fineAmounts, setFineAmounts] = useState({
    funeralWorkFine: 1000,
    cemeteryWorkFine: 1000,
    funeralAttendanceFine: 100
  })

  // Attendance tracking
  const [cemeteryAttendance, setCemeteryAttendance] = useState({})
  const [funeralAttendance, setFuneralAttendance] = useState({})
  const [funeralWorkAbsents, setFuneralWorkAbsents] = useState([])
  const [cemeteryWorkAbsents, setCemeteryWorkAbsents] = useState([])
  const [originalFuneralWorkAbsents, setOriginalFuneralWorkAbsents] = useState([])
  const [originalCemeteryWorkAbsents, setOriginalCemeteryWorkAbsents] = useState([])
  const [hasChanges, setHasChanges] = useState(false)

  const handleAuthStateChange = ({ isAuthenticated, roles }) => {
    console.log("Auth state change:", { isAuthenticated, roles })
    setIsAuthenticated(isAuthenticated)
    setRoles(roles)
    if (!isAuthenticated || !(roles.includes("vice-secretary") || roles.includes("treasurer") || roles.includes("auditor"))) {
      console.log("Access denied: not authenticated or insufficient roles")
      navigate("/login/user-login")
    }
  }

  useEffect(() => {
    if (!isAuthenticated || !(roles.includes("vice-secretary") || roles.includes("treasurer") || roles.includes("auditor"))) {
      console.log("Waiting for authentication...")
      return
    }

    console.log("Fetching available funerals and fine settings...")
    fetchAvailableFunerals()
    fetchFineSettings()
  }, [isAuthenticated, roles])

  const fetchFineSettings = async () => {
    try {
      const settings = await getFineSettings()
      setFineAmounts(settings)
      console.log("Fine settings loaded:", settings)
    } catch (error) {
      console.error("Error fetching fine settings:", error)
      // Keep default values if fetch fails
    }
  }

  const fetchAvailableFunerals = async () => {
    try {
      setLoading(true)
      setError("")
      const response = await api.get(`${baseUrl}/funeral/getAvailableFunerals`)
      console.log("Funerals response:", response.data)
      setAvailableFunerals(response.data.funerals || [])
    } catch (error) {
      console.error("Error fetching funerals:", error)
      if (error.response?.status === 401 || error.response?.status === 403) {
        setError("ඔබට මෙම තොරතුරු බලන්න අවසරයක් නොමැත")
        navigate("/login/user-login")
      } else if (error.response?.status === 500) {
        setError("සේවාදායක දෝෂයක්: " + (error.response?.data?.error || "අනාමික දෝෂයක්"))
      } else {
        setError("අවමංගල්‍ය උත්සව ලබා ගැනීමේදී දෝෂයක් ඇති විය: " + (error.message || "නොදන්නා දෝෂයක්"))
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchFuneralDetails = async (funeralId) => {
    try {
      setLoading(true)
      setError("")
      console.log("Fetching funeral details for ID:", funeralId)
      const response = await api.get(`${baseUrl}/funeral/getFuneralById/${funeralId}`)
      console.log("Funeral details response:", response.data)
      const funeral = response.data.funeral
      setSelectedFuneral(funeral)
      
      // Fetch actual fine amounts for this funeral from member documents
      try {
        const fineResponse = await api.get(`${baseUrl}/funeral/workFineAmounts/${funeralId}`)
        console.log("Fine amounts response:", fineResponse.data)
        if (fineResponse.data.success && fineResponse.data.fineAmounts) {
          setFineAmounts(prev => ({
            ...prev,
            funeralWorkFine: fineResponse.data.fineAmounts.funeralWorkFine,
            cemeteryWorkFine: fineResponse.data.fineAmounts.cemeteryWorkFine
          }))
          console.log("Updated fine amounts from member documents:", fineResponse.data.fineAmounts)
        }
      } catch (fineError) {
        console.error("Error fetching fine amounts, using current settings:", fineError)
        // Keep existing fine amounts from settings if fetch fails
      }
      
      // Initialize attendance states with current saved data
      const cemeteryAtt = {}
      const funeralAtt = {}
      const funeralAbsents = funeral.funeralWorkAbsents || []
      const cemeteryAbsents = funeral.cemeteryWorkAbsents || []
      
      funeral.cemeteryAssignments?.forEach(member => {
        cemeteryAtt[member.member_id] = !cemeteryAbsents.includes(member.member_id)
      })
      
      funeral.funeralAssignments?.forEach(member => {
        funeralAtt[member.member_id] = !funeralAbsents.includes(member.member_id)
      })
      
      setCemeteryAttendance(cemeteryAtt)
      setFuneralAttendance(funeralAtt)
      setFuneralWorkAbsents([...funeralAbsents])
      setCemeteryWorkAbsents([...cemeteryAbsents])
      setOriginalFuneralWorkAbsents([...funeralAbsents])
      setOriginalCemeteryWorkAbsents([...cemeteryAbsents])
      setHasChanges(false)
      
    } catch (error) {
      console.error("Error fetching funeral details:", error)
      if (error.response?.status === 404) {
        setError("අවමංගල්‍ය උත්සවය සොයා ගත නොහැක")
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        setError("ඔබට මෙම තොරතුරු බලන්න අවසරයක් නොමැත")
        navigate("/login/user-login")
      } else if (error.response?.status === 500) {
        setError("සේවාදායක දෝෂයක්: " + (error.response?.data?.error || "අනාමික දෝෂයක්"))
      } else {
        setError("අවමංගල්‍ය තොරතුරු ලබා ගැනීමේදී දෝෂයක් ඇති විය: " + (error.message || "නොදන්නා දෝෂයක්"))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleFuneralChange = (event) => {
    const funeralId = event.target.value
    setSelectedFuneralId(funeralId)
    if (funeralId) {
      fetchFuneralDetails(funeralId)
    } else {
      setSelectedFuneral(null)
      setCemeteryAttendance({})
      setFuneralAttendance({})
      setFuneralWorkAbsents([])
      setCemeteryWorkAbsents([])
      setOriginalFuneralWorkAbsents([])
      setOriginalCemeteryWorkAbsents([])
      setHasChanges(false)
    }
    setError("")
    setSuccess("")
  }

  const handleCemeteryAttendanceChange = (memberId, isPresent) => {
    setCemeteryAttendance(prev => ({
      ...prev,
      [memberId]: isPresent
    }))
    
    // Update cemetery work absents
    const newAbsents = isPresent
      ? cemeteryWorkAbsents.filter(id => id !== memberId)
      : cemeteryWorkAbsents.includes(memberId) ? cemeteryWorkAbsents : [...cemeteryWorkAbsents, memberId]
    
    setCemeteryWorkAbsents(newAbsents)
    
    // Check if there are changes
    const funeralChanged = JSON.stringify(funeralWorkAbsents.sort()) !== JSON.stringify(originalFuneralWorkAbsents.sort())
    const cemeteryChanged = JSON.stringify(newAbsents.sort()) !== JSON.stringify(originalCemeteryWorkAbsents.sort())
    setHasChanges(funeralChanged || cemeteryChanged)
  }

  const handleFuneralAttendanceChange = (memberId, isPresent) => {
    setFuneralAttendance(prev => ({
      ...prev,
      [memberId]: isPresent
    }))
    
    // Update funeral work absents
    const newAbsents = isPresent
      ? funeralWorkAbsents.filter(id => id !== memberId)
      : funeralWorkAbsents.includes(memberId) ? funeralWorkAbsents : [...funeralWorkAbsents, memberId]
    
    setFuneralWorkAbsents(newAbsents)
    
    // Check if there are changes
    const funeralChanged = JSON.stringify(newAbsents.sort()) !== JSON.stringify(originalFuneralWorkAbsents.sort())
    const cemeteryChanged = JSON.stringify(cemeteryWorkAbsents.sort()) !== JSON.stringify(originalCemeteryWorkAbsents.sort())
    setHasChanges(funeralChanged || cemeteryChanged)
  }

  const handleSaveAttendance = async () => {
    if (!selectedFuneralId) {
      setError("අවමංගල්‍ය උත්සවයක් තෝරන්න")
      return
    }

    try {
      setLoading(true)
      setError("")
      setSuccess("")
      
      const attendanceData = {
        funeralId: selectedFuneralId,
        funeralWorkAbsents: funeralWorkAbsents,
        cemeteryWorkAbsents: cemeteryWorkAbsents
      }

      const response = await api.post(`${baseUrl}/funeral/updateWorkAttendance`, attendanceData)
      
      const { 
        funeralFinesAdded = 0, 
        funeralFinesRemoved = 0,
        cemeteryFinesAdded = 0,
        cemeteryFinesRemoved = 0,
        eventFinesRemoved = 0
      } = response.data
      
      let successMsg = "සුසාන භුමි කටයුතු පැමිණීම සාර්ථකව යාවත්කාලීන කරන ලදී"
      
      const totalFinesAdded = funeralFinesAdded + cemeteryFinesAdded
      const totalFinesRemoved = funeralFinesRemoved + cemeteryFinesRemoved + eventFinesRemoved
      
      if (totalFinesAdded > 0 && totalFinesRemoved > 0) {
        let msg = ` (දඩ ${totalFinesAdded}ක් එකතු කර ${totalFinesRemoved}ක් ඉවත් කරන ලදී`
        if (eventFinesRemoved > 0) {
          msg += `, අවමංගල්‍ය දඩ ${eventFinesRemoved}ක් වැඩ දඩය සමග ප්‍රතිස්ථාපනය කරන ලදී`
        }
        msg += ')'
        successMsg += msg
      } else if (totalFinesAdded > 0) {
        let msg = ` (දඩ ${totalFinesAdded}ක් එකතු කරන ලදී`
        if (eventFinesRemoved > 0) {
          msg += `, අවමංගල්‍ය දඩ ${eventFinesRemoved}ක් ප්‍රතිස්ථාපනය කරන ලදී`
        }
        msg += ')'
        successMsg += msg
      } else if (totalFinesRemoved > 0) {
        successMsg += ` (දඩ ${totalFinesRemoved}ක් ඉවත් කරන ලදී)`
      }
      
      setSuccess(successMsg)
      
      // Update original data to reflect current state
      setOriginalFuneralWorkAbsents([...funeralWorkAbsents])
      setOriginalCemeteryWorkAbsents([...cemeteryWorkAbsents])
      setHasChanges(false)
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(""), 5000)
      
    } catch (error) {
      console.error("Error saving attendance:", error)
      setError(error.response?.data?.message || "පැමිණීම සුරැකීමේදී දෝෂයක් ඇති විය")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('si-LK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getDeceasedName = (funeral) => {
    if (!funeral || !funeral.member_id) return "නොදන්නා"
    
    console.log("Getting deceased name for:", funeral.deceased_id, funeral.member_id._id)
    
    // If deceased_id matches member_id, it's the member who died
    if (funeral.deceased_id && funeral.deceased_id.toString() === funeral.member_id._id.toString()) {
      return funeral.member_id.name || "නොදන්නා"
    }
    
    // Otherwise, look for the dependent
    const dependent = funeral.member_id.dependents?.find(
      dep => dep._id && dep._id.toString() === funeral.deceased_id?.toString()
    )
    
    return dependent?.name || "නොදන්නා"
  }

  return (
    <Layout>
      <AuthComponent onAuthStateChange={handleAuthStateChange} />
      <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4, textAlign: "center" }}>
          සුසාන භුමි කටයුතු පැමිණීම
        </Typography>

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

        {/* Funeral Selection */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>අවමංගල්‍ය උත්සවය තෝරන්න</InputLabel>
              <Select
                value={selectedFuneralId}
                label="අවමංගල්‍ය උත්සවය තෝරන්න"
                onChange={handleFuneralChange}
                disabled={loading}
              >
                <MenuItem value="">
                  <em>අවමංගල්‍ය උත්සවයක් තෝරන්න</em>
                </MenuItem>
                {availableFunerals.map((funeral) => (
                  <MenuItem key={funeral._id} value={funeral._id}>
                    {formatDate(funeral.date)} - {getDeceasedName(funeral)} ({funeral.member_id?.area} {funeral.member_id?.name})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </CardContent>
        </Card>

        {selectedFuneral && (
          <>
            {/* Funeral Details */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  අවමංගල්‍ය තොරතුරු
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography><strong>දිනය:</strong> {formatDate(selectedFuneral.date)}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography><strong>මියගත් අයගේ නම:</strong> {getDeceasedName(selectedFuneral)}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography><strong>සාමාජිකයා:</strong> {selectedFuneral.member_id?.name}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography><strong>ප්‍රදේශය:</strong> {selectedFuneral.member_id?.area}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Cemetery Assignments */}
            {selectedFuneral.cemeteryAssignments && selectedFuneral.cemeteryAssignments.length > 0 && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                    සුසන භූමි කටයුතු පැවරීම් (දඩ රු.{fineAmounts.cemeteryWorkFine.toLocaleString()})
                  </Typography>
                  <Grid container spacing={2}>
                    {selectedFuneral.cemeteryAssignments.map((member) => (
                      <Grid item xs={12} sm={6} md={4} key={member._id}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={cemeteryAttendance[member.member_id] || false}
                              onChange={(e) => handleCemeteryAttendanceChange(member.member_id, e.target.checked)}
                              color="primary"
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {member.member_id} - {member.name}
                              </Typography>
                              {!cemeteryAttendance[member.member_id] && (
                                <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                  <Chip size="small" color="error" label="නොපැමිණි" />
                                  <Chip size="small" color="warning" label={`දඩ රු.${fineAmounts.cemeteryWorkFine.toLocaleString()}`} />
                                </Box>
                              )}
                            </Box>
                          }
                        />
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* Funeral Assignments */}
            {selectedFuneral.funeralAssignments && selectedFuneral.funeralAssignments.length > 0 && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                    අවමංගල්‍ය උත්සව කටයුතු පැවරීම් (දඩ රු.{fineAmounts.funeralWorkFine.toLocaleString()})
                  </Typography>
                  <Grid container spacing={2}>
                    {selectedFuneral.funeralAssignments.map((member) => (
                      <Grid item xs={12} sm={6} md={4} key={member._id}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={funeralAttendance[member.member_id] || false}
                              onChange={(e) => handleFuneralAttendanceChange(member.member_id, e.target.checked)}
                              color="primary"
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {member.member_id} - {member.name}
                              </Typography>
                              {!funeralAttendance[member.member_id] && (
                                <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                  <Chip size="small" color="error" label="නොපැමිණි" />
                                  <Chip size="small" color="warning" label={`දඩ රු.${fineAmounts.funeralWorkFine.toLocaleString()}`} />
                                </Box>
                              )}
                            </Box>
                          }
                        />
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* Summary */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  සාරාංශය
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Typography>
                      <strong>සුසන භූමි - පැමිණි:</strong> {Object.values(cemeteryAttendance).filter(Boolean).length}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography>
                      <strong>සුසන භූමි - නොපැමිණි:</strong> {cemeteryWorkAbsents.length}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography>
                      <strong>මුළු සුසන භූමි:</strong> {selectedFuneral.cemeteryAssignments?.length || 0}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography>
                      <strong>අවමංගල්‍ය - පැමිණි:</strong> {Object.values(funeralAttendance).filter(Boolean).length}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography>
                      <strong>අවමංගල්‍ය - නොපැමිණි:</strong> {funeralWorkAbsents.length}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography>
                      <strong>මුළු අවමංගල්‍ය:</strong> {selectedFuneral.funeralAssignments?.length || 0}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography sx={{ mt: 2 }}>
                      <strong>මුළු නොපැමිණි සාමාජිකයන්:</strong> {funeralWorkAbsents.length + cemeteryWorkAbsents.length}
                    </Typography>
                    <Typography color="error" sx={{ fontSize: '0.9rem' }}>
                      <strong>අවමංගල්‍ය කටයුතු දඩ:</strong> රු. {fineAmounts.funeralWorkFine.toLocaleString()} × {funeralWorkAbsents.length} = රු. {(funeralWorkAbsents.length * fineAmounts.funeralWorkFine).toLocaleString()}
                    </Typography>
                    <Typography color="error" sx={{ fontSize: '0.9rem' }}>
                      <strong>සුසන භූමි කටයුතු දඩ:</strong> රු. {fineAmounts.cemeteryWorkFine.toLocaleString()} × {cemeteryWorkAbsents.length} = රු. {(cemeteryWorkAbsents.length * fineAmounts.cemeteryWorkFine).toLocaleString()}
                    </Typography>
                    <Typography color="error" sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
                      <strong>මුළු දඩ මුදල:</strong> රු. {((funeralWorkAbsents.length * fineAmounts.funeralWorkFine) + (cemeteryWorkAbsents.length * fineAmounts.cemeteryWorkFine)).toLocaleString()}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Save Button */}
            <Box sx={{ textAlign: "center" }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handleSaveAttendance}
                disabled={loading || !hasChanges}
                sx={{ 
                  px: 4, 
                  py: 1.5,
                  opacity: (!hasChanges && !loading) ? 0.6 : 1
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : "පැමිණීම සුරකින්න"}
              </Button>
              {!hasChanges && !loading && (
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  වෙනස්කම් කිරීමෙන් පසුව සුරකින්න
                </Typography>
              )}
            </Box>
          </>
        )}
      </Box>
    </Layout>
  )
}
