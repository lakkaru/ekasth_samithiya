import React, { useState, useEffect } from "react"
import {
  Box,
  Button,
  TextField,
  Typography,
  Select,
  MenuItem,
  Alert,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Chip,
  CircularProgress
} from "@mui/material"
import Layout from "../../components/layout"
import CommonWorkAttChart from "../../components/common/CommonWorkAttChart"
import BasicDatePicker from "../../components/common/basicDatePicker"

import { navigate } from "gatsby"
import api from "../../utils/api"
import { getFineSettings } from "../../utils/settingsHelper"
import dayjs from "dayjs"
import loadable from "@loadable/component"

const AuthComponent = loadable(() =>
  import("../../components/common/AuthComponent")
)

const baseUrl = process.env.GATSBY_API_BASE_URL

export default function CommonWorkAttendance() {
  // Authentication
  const [roles, setRoles] = useState([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Form data
  const [selectedDate, setSelectedDate] = useState(dayjs())
  const [title, setTitle] = useState("")
  const [remarks, setRemarks] = useState("")

  // Work and attendance data
  const [currentWork, setCurrentWork] = useState(null)
  const [workId, setWorkId] = useState("")
  const [originalAbsents, setOriginalAbsents] = useState([])
  // Recent works for dropdown
  const [recentWorks, setRecentWorks] = useState([])
  const [loadingRecentWorks, setLoadingRecentWorks] = useState(false)

  // UI states
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [hasChanges, setHasChanges] = useState(false)
  const [isFormValid, setIsFormValid] = useState(false)

  // Fine settings
  const [fineSettings, setFineSettings] = useState({
    commonWorkFine: 500
  })

  // Check form validity
  useEffect(() => {
    setIsFormValid(title.trim() !== "")
  }, [title])

  // Fetch fine settings on mount
  useEffect(() => {
    const loadFineSettings = async () => {
      try {
        const settings = await getFineSettings()
        setFineSettings(settings)
      } catch (error) {
        console.error("Error loading fine settings:", error)
      }
    }
    loadFineSettings()
  }, [])

  // Fetch recent works when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchRecentWorks()
    }
  }, [isAuthenticated])

  const handleAuthStateChange = ({ isAuthenticated, roles }) => {
    setIsAuthenticated(isAuthenticated)
    setRoles(roles)
    if (!isAuthenticated || !roles.includes("vice-secretary")) {
      navigate("/login/user-login")
    }
  }

  // Load a work by id
  const loadWorkById = async (id) => {
    if (!id) return
    setLoading(true)
    setError("")
    setSuccess("")
    try {
      const response = await api.get(`${baseUrl}/commonwork/${id}`)
      const workData = response.data.commonWork
      if (workData) {
        setCurrentWork(workData)
        setWorkId(workData._id)
        setTitle(workData.title)
        setRemarks(workData.remarks || "")
        setOriginalAbsents([...(workData.absents || [])])
        setHasChanges(false)

        // Fetch actual fine amount from member documents
          try {
          const fineResponse = await api.get(`${baseUrl}/commonwork/fineAmount/${workData._id}`)
          if (fineResponse.data.success && fineResponse.data.fineAmount) {
            setFineSettings(prev => ({
              ...prev,
              commonWorkFine: fineResponse.data.fineAmount
            }))
          }
        } catch (fineError) {
          console.error("Error fetching fine amount by id, using current settings:", fineError)
        }

        // update selectedDate to the work's date for consistency
        if (workData.date) setSelectedDate(dayjs(workData.date))
      }
    } catch (error) {
      setError("පවතින වැඩ තොරතුරු ලබා ගැනීමේදී දෝෂයක් ඇති විය")
    } finally {
      setLoading(false)
    }
  }

  // Fetch recent common works for dropdown
  const fetchRecentWorks = async () => {
    try {
      setLoadingRecentWorks(true)
      const res = await api.get(`${baseUrl}/commonwork?limit=20`)
      setRecentWorks(res.data.commonWorks || [])
    } catch (err) {
      console.error('Error loading recent common works', err)
    } finally {
      setLoadingRecentWorks(false)
    }
  }

  useEffect(() => {
    // Check URL parameters for date
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const dateParam = urlParams.get('date')
      if (dateParam && dayjs(dateParam).isValid()) {
        setSelectedDate(dayjs(dateParam))
      }
    }
  }, [])

  // Load existing work data when date changes
  useEffect(() => {
    if (selectedDate && isAuthenticated) {
      loadExistingWorkByDate(selectedDate.format("YYYY-MM-DD"))
    }
  }, [selectedDate, isAuthenticated])

  const loadExistingWorkByDate = async (date) => {
    setLoading(true)
    setError("")
    setSuccess("")
    
    try {
      const response = await api.get(`${baseUrl}/commonwork/date?date=${date}`)
      const workData = response.data.commonWork
      
      if (workData) {
        // Load existing work data into form
        setCurrentWork(workData)
        setWorkId(workData._id)
        setTitle(workData.title)
        setRemarks(workData.remarks || "")
        setOriginalAbsents([...(workData.absents || [])])
        setHasChanges(false)
        
        // Fetch actual fine amount from member documents
        try {
          const fineResponse = await api.get(`${baseUrl}/commonwork/fineAmount/${workData._id}`)
          console.log("Fine amount response:", fineResponse.data)
          if (fineResponse.data.success && fineResponse.data.fineAmount) {
            setFineSettings(prev => ({
              ...prev,
              commonWorkFine: fineResponse.data.fineAmount
            }))
            console.log("Updated fine amount from member documents:", fineResponse.data.fineAmount)
          }
        } catch (fineError) {
          console.error("Error fetching fine amount, using current settings:", fineError)
          // Keep existing fine amount from settings if fetch fails
        }
        
        setSuccess(`${dayjs(workData.date).format('YYYY-MM-DD')} දිනයට පවතින සාමූහික වැඩ තොරතුරු ලබා ගන්නා ලදී`)
      } else {
        // No existing work, reset form
        resetForm()
        setSuccess("")
      }
    } catch (error) {
      setError("පවතින වැඩ තොරතුරු ලබා ගැනීමේදී දෝෂයක් ඇති විය")
      resetForm()
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setCurrentWork(null)
    setWorkId("")
    setTitle("")
    setRemarks("")
    setOriginalAbsents([])
    setHasChanges(false)
    setError("")
    setSuccess("")
  }

  const saveAttendance = async ({ absentMemberIds }) => {
    if (!isFormValid) {
      setError("කරුණාකර අවශ්‍ය ක්ෂේත්‍ර පුරවන්න")
      return
    }

    // Check if there are changes (for updates)
    if (currentWork) {
      const currentAbsents = absentMemberIds.sort()
      const originalAbsentsSorted = originalAbsents.sort()
      const hasAttendanceChanges = JSON.stringify(currentAbsents) !== JSON.stringify(originalAbsentsSorted)
      
      const hasFormChanges = 
        title !== currentWork.title ||
        remarks !== (currentWork.remarks || "")
      
      if (!hasAttendanceChanges && !hasFormChanges) {
        setError("කිසිම වෙනස්කමක් නොමැත")
        return
      }
    }

    setLoading(true)
    setError("")
    setSuccess("")
    
    const workData = {
      date: selectedDate.toDate(),
      title: title.trim(),
      remarks: remarks.trim(),
      absentArray: absentMemberIds
    }
    
    try {
      const response = await api.post(`${baseUrl}/commonwork/attendance`, { workData })
      
      const { isUpdate, stats } = response.data
      
      let successMsg = isUpdate ? 
        "සාමූහික වැඩ පැමිණීම සාර්ථකව යාවත්කාලීන කරන ලදී" : 
        "සාමූහික වැඩ පැමිණීම සාර්ථකව සුරකින ලදී"
      
      if (stats) {
        successMsg += ` (පැමිණි: ${stats.totalPresentMembers}, නොපැමිණි: ${stats.totalAbsentMembers}, පැමිණීම්: ${stats.attendanceRate}%)`
      }
      
      setSuccess(successMsg)
      setOriginalAbsents([...absentMemberIds])
      setHasChanges(false)
      
      // Reload the work data to get updated information
      await loadExistingWorkByDate(selectedDate.format("YYYY-MM-DD"))
      
      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' })
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(""), 5000)
      
    } catch (error) {
      setError(error.response?.data?.message || "පැමිණීම සුරැකීමේදී දෝෂයක් ඇති විය")
    } finally {
      setLoading(false)
    }
  }

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate)
    setError("")
    setSuccess("")
  }

  const resetToToday = () => {
    setSelectedDate(dayjs())
    setError("")
    setSuccess("")
  }

  return (
    <Layout>
      <AuthComponent onAuthStateChange={handleAuthStateChange} />
      <section>
        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4, textAlign: "center" }}>
          සාමූහික වැඩ පැමිණීම
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

        {/* Date Selection */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3, flexWrap: 'wrap' }}>
              <Typography variant="h6">දිනය තෝරන්න:</Typography>
              <FormControl sx={{ minWidth: 320 }} size="small">
                <InputLabel id="recent-works-label">පසුගිය සාමූහික වැඩ</InputLabel>
                <Select
                  labelId="recent-works-label"
                  label="පසුගිය සාමූහික වැඩ"
                  value={workId || ""}
                  onChange={(e) => {
                    const id = e.target.value
                    setWorkId(id)
                    if (id) loadWorkById(id)
                    else setCurrentWork(null)
                  }}
                >
                  <MenuItem value="">-- තෝරන්න --</MenuItem>
                  {loadingRecentWorks ? (
                    <MenuItem disabled>Loading...</MenuItem>
                  ) : (
                    recentWorks.map(w => (
                      <MenuItem key={w._id} value={w._id}>{`${dayjs(w.date).format('YYYY-MM-DD')} — ${w.title || 'No title'}`}</MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>

              <BasicDatePicker
                selectedDate={selectedDate}
                setSelectedDate={handleDateChange}
              />
              {/* <Button 
                variant="outlined" 
                onClick={resetToToday}
                disabled={loading}
              >
                අද
              </Button> */}
            </Box>

            {currentWork && (
              <Alert severity="info" sx={{ mb: 2 }}>
                මෙම දිනයට පවතින සාමූහික වැඩ කටයුත්තක් සංස්කරණය කරමින්
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Work Details Form */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              සාමූහික වැඩ තොරතුරු
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="වැඩ මාතෘකාව *"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={loading}
                  error={title.trim() === ""}
                  helperText={title.trim() === "" ? "මාතෘකාව අවශ්‍යයි" : ""}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="විශේෂ සටහන්"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  disabled={loading}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Work Statistics */}
        {currentWork && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                පැමිණීම් සංඛ්‍යාලේඛන
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={3}>
                  <Typography><strong>අපේක්ෂිත සාමාජිකයන්:</strong> {currentWork.totalExpectedMembers}</Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography color="success.main"><strong>පැමිණි සාමාජිකයන්:</strong> {currentWork.totalPresentMembers}</Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography color="error.main"><strong>නොපැමිණි සාමාජිකයන්:</strong> {currentWork.absents ? currentWork.absents.length : 0}</Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography color="primary.main">
                    <strong>පැමිණීම්:</strong> {currentWork.totalExpectedMembers > 0 ? 
                      ((currentWork.totalPresentMembers / currentWork.totalExpectedMembers) * 100).toFixed(1) : 0}%
                  </Typography>
                </Grid>
              </Grid>
              
              {/* Fine Information */}
              {currentWork.absents && currentWork.absents.length > 0 && (
                <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #e0e0e0' }}>
                  <Typography color="error" sx={{ fontSize: '0.9rem' }}>
                    <strong>සාමූහික වැඩ දඩ මුදල:</strong> රු. {fineSettings.commonWorkFine || 500}
                  </Typography>
                  <Typography color="error" sx={{ fontSize: '0.9rem', mt: 0.5 }}>
                    <strong>මුළු දඩ මුදල:</strong> රු. {((currentWork.absents.length || 0) * (fineSettings.commonWorkFine || 500)).toLocaleString()}
                  </Typography>
                  
                  {/* Show fined members */}
                  <Typography variant="h6" sx={{ mt: 2, mb: 1, color: 'error.main', fontSize: '1rem' }}>
                    සාමූහික වැඩ නොපැමිණීම් දඩ ගෙවන සාමාජිකයන් ({currentWork.absents.length})
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: 1,
                    maxHeight: '150px',
                    overflowY: 'auto',
                    p: 1.5,
                    border: '1px solid',
                    borderColor: 'error.main',
                    borderRadius: 1,
                    bgcolor: '#ffebee'
                  }}>
                    {currentWork.absents
                      .sort((a, b) => a - b)
                      .map(memberId => (
                        <Chip
                          key={memberId}
                          label={`${memberId} (රු.${fineSettings.commonWorkFine || 500})`}
                          size="small"
                          color="error"
                          variant="outlined"
                          sx={{ fontSize: '0.75rem' }}
                        />
                      ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        )}

        {/* Attendance Chart */}
        {isFormValid && (
          <CommonWorkAttChart
            chartName={`${title || 'සාමූහික වැඩ'} - පැමිණීම`}
            saveAttendance={saveAttendance}
            initialAbsents={originalAbsents}
            loading={loading}
          />
        )}

        {/* Show form validation message */}
        {!isFormValid && (
          <Card sx={{ mt: 3, textAlign: 'center', py: 4 }}>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                සාමූහික වැඩ පැමිණීම සටහන් කිරීම සඳහා
              </Typography>
              <Typography color="text.secondary">
                කරුණාකර වැඩ මාතෘකාව ඇතුළත් කරන්න
              </Typography>
            </CardContent>
          </Card>
        )}
      </section>
    </Layout>
  )
}
