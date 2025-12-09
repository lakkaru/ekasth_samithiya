import React, { useState, useEffect } from "react"
import {
  Box,
  Button,
  Typography,
  Select,
  MenuItem,
  Alert,
  Card,
  CardContent,
  Grid,
  Chip,
  FormControl,
  InputLabel
} from "@mui/material"
import Layout from "../../components/layout"

import FuneralAttChart from "../../components/common/FuneralAttChart"

import { navigate } from "gatsby"
import api from "../../utils/api"
import { getFineSettings } from "../../utils/settingsHelper"
import loadable from "@loadable/component"
const AuthComponent = loadable(() =>
  import("../../components/common/AuthComponent")
)

const baseUrl = process.env.GATSBY_API_BASE_URL

export default function FuneralAttendance() {
  // Authentication
  const [roles, setRoles] = useState([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Funeral selection
  const [availableFunerals, setAvailableFunerals] = useState([])
  const [selectedFuneralId, setSelectedFuneralId] = useState("")
  const [currentFuneral, setCurrentFuneral] = useState(null)
  const [originalAbsents, setOriginalAbsents] = useState([])
  const [finedMembers, setFinedMembers] = useState([])

  // UI states
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Fine settings
  const [fineSettings, setFineSettings] = useState({
    funeralAttendanceFine: 100,
    funeralWorkFine: 1000,
    cemeteryWorkFine: 1000
  })

  const handleAuthStateChange = ({ isAuthenticated, roles }) => {
    setIsAuthenticated(isAuthenticated)
    setRoles(roles)
    if (!isAuthenticated || !(roles.includes("vice-secretary") || roles.includes("treasurer") || roles.includes("auditor"))) {
      navigate("/login/user-login")
    }
  }

  useEffect(() => {
    if (!isAuthenticated || !(roles.includes("vice-secretary") || roles.includes("treasurer") || roles.includes("auditor"))) {
      return
    }

    // Fetch fine settings first
    const loadFineSettings = async () => {
      try {
        const settings = await getFineSettings()
        setFineSettings(settings)
      } catch (error) {
        // Keep default values if fetch fails
      }
    }
    loadFineSettings()

    // Fetch available funerals
    fetchAvailableFunerals()
  }, [isAuthenticated, roles])

  const fetchAvailableFunerals = async () => {
    try {
      setLoading(true)
      setError("")
      const response = await api.get(`${baseUrl}/funeral/getAvailableFunerals`)
      setAvailableFunerals(response.data.funerals || [])
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        setError("ඔබට මෙම තොරතුරු බලන්න අවසරයක් නොමැත")
        navigate("/login/user-login")
      } else {
        setError("අවමංගල්‍ය උත්සව ලබා ගැනීමේදී දෝෂයක් ඇති විය")
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchFuneralDetails = async (funeralId) => {
    try {
      setLoading(true)
      setError("")
      const response = await api.get(`${baseUrl}/funeral/getFuneralById/${funeralId}`)
      const funeral = response.data.funeral
      setCurrentFuneral(funeral)
      setOriginalAbsents([...(funeral.eventAbsents || [])])

      // Load fined members for this funeral
      await loadFinedMembers(funeralId)
    } catch (error) {
      if (error.response?.status === 404) {
        setError("අවමංගල්‍ය උත්සවය සොයා ගත නොහැක")
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        setError("ඔබට මෙම තොරතුරු බලන්න අවසරයක් නොමැත")
        navigate("/login/user-login")
      } else {
        setError("අවමංගල්‍ය තොරතුරු ලබා ගැනීමේදී දෝෂයක් ඇති විය")
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
      setCurrentFuneral(null)
      setOriginalAbsents([])
      setFinedMembers([])
    }
    setError("")
    setSuccess("")
  }

  const saveAttendance = async ({ absentMemberIds }) => {
    if (!selectedFuneralId) {
      setError("අවමංගල්‍ය උත්සවයක් තෝරන්න")
      return
    }

    // Check if there are changes
    const currentAbsents = absentMemberIds.sort()
    const originalAbsentsSorted = originalAbsents.sort()
    const hasActualChanges = JSON.stringify(currentAbsents) !== JSON.stringify(originalAbsentsSorted)

    if (!hasActualChanges) {
      setError("කිසිම වෙනස්කමක් නොමැත")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    const absentData = { funeral_id: selectedFuneralId, absentArray: absentMemberIds }

    try {
      const response = await api.post(`${baseUrl}/funeral/funeralAbsents`, { absentData })
      const { finesAdded = 0, finesRemoved = 0, excludedFromFines = 0, excludedDueToExistingFines = 0 } = response.data

      let successMsg = "අවමංගල්‍ය පැමිණීම සාර්ථකව යාවත්කාලීන කරන ලදී"

      if (finesAdded > 0 && finesRemoved > 0) {
        successMsg += ` (දඩ ${finesAdded}ක් එකතු කර ${finesRemoved}ක් ඉවත් කරන ලදී)`
      } else if (finesAdded > 0) {
        successMsg += ` (දඩ ${finesAdded}ක් එකතු කරන ලදී)`
      } else if (finesRemoved > 0) {
        successMsg += ` (දඩ ${finesRemoved}ක් ඉවත් කරන ලදී)`
      }

      if (excludedFromFines > 0) {
        successMsg += ` (වැඩ පැවරුම් සහිත සාමාජිකයන් ${excludedFromFines} දෙනෙකු දඩයෙන් හැර ගන්නා ලදී)`
      }

      if (excludedDueToExistingFines > 0) {
        successMsg += ` (දැනටමත් දඩ ඇති සාමාජිකයන් ${excludedDueToExistingFines} දෙනෙකු අමතර දඩයෙන් ගලවා ගන්නා ලදී)`
      }

      // Note: Officers from Admin collection are automatically excluded from fines (except auditor)
      // Area admins are only excluded if they are from the same area as the deceased member

      setSuccess(successMsg)
      setOriginalAbsents([...absentMemberIds])

      // Scroll to top to show success message and updated information
      window.scrollTo({ top: 0, behavior: 'smooth' })

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(""), 5000)

      // Update current funeral data
      setCurrentFuneral(prev => ({
        ...prev,
        eventAbsents: absentMemberIds
      }))

      // Reload fined members to get updated fine status
      await loadFinedMembers(selectedFuneralId)
    } catch (error) {
      setError(error.response?.data?.message || "පැමිණීම සුරැකීමේදී දෝෂයක් ඇති විය")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedFuneralId("")
    setCurrentFuneral(null)
    setOriginalAbsents([])
    setFinedMembers([])
    setError("")
    setSuccess("")
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

  // Calculate fine-eligible absent members (excluding assigned workers and removed members)
  const loadFinedMembers = async (funeralId) => {
    try {
      const response = await api.get(`${baseUrl}/funeral/getFuneralFines/${funeralId}`)
      setFinedMembers(response.data.finedMembers || [])
    } catch (error) {
      setFinedMembers([])
    }
  }

  const calculateFineEligibleAbsents = () => {
    if (!currentFuneral || !currentFuneral.eventAbsents) return {
      count: 0,
      totalFine: 0,
      totalAbsents: 0,
      excludedCount: 0,
      breakdown: { cemetery: 0, funeral: 0, removed: 0 }
    }

    const eventAbsents = currentFuneral.eventAbsents || []

    // Get members who should be excluded from fines
    const cemeteryAssignedIds = (currentFuneral.cemeteryAssignments || []).map(assignment => assignment.member_id)
    const funeralAssignedIds = (currentFuneral.funeralAssignments || []).map(assignment => assignment.member_id)
    const removedMemberIds = (currentFuneral.removedMembers || []).map(member => member.member_id)

    const excludedFromFines = [
      ...cemeteryAssignedIds,
      ...funeralAssignedIds,
      ...removedMemberIds
    ]

    // Count only absent members who are eligible for fines
    const fineEligibleAbsents = eventAbsents.filter(memberId => !excludedFromFines.includes(memberId))
    const fineAmount = fineSettings.funeralAttendanceFine

    // Calculate breakdown of excluded members
    const cemeteryExcluded = eventAbsents.filter(memberId => cemeteryAssignedIds.includes(memberId)).length
    const funeralExcluded = eventAbsents.filter(memberId => funeralAssignedIds.includes(memberId)).length
    const removedExcluded = eventAbsents.filter(memberId => removedMemberIds.includes(memberId)).length

    return {
      count: fineEligibleAbsents.length,
      totalFine: fineEligibleAbsents.length * fineAmount,
      totalAbsents: eventAbsents.length,
      excludedCount: eventAbsents.length - fineEligibleAbsents.length,
      breakdown: {
        cemetery: cemeteryExcluded,
        funeral: funeralExcluded,
        removed: removedExcluded
      }
    }
  }

  return (
    <Layout>
      <AuthComponent onAuthStateChange={handleAuthStateChange} />
      <section>
        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4, textAlign: "center" }}>
          අවමංගල්‍ය උත්සව පැමිණීම
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

        {/* Funeral Selection Section */}
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

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={resetForm}
                disabled={loading || !selectedFuneralId}
              >
                Reset
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Funeral Information */}
        {currentFuneral && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                අවමංගල්‍ය තොරතුරු
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography><strong>දිනය:</strong> {formatDate(currentFuneral.date)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography><strong>මියගත් අයගේ නම:</strong> {getDeceasedName(currentFuneral)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography><strong>සාමාජිකයා:</strong> {currentFuneral.member_id?.name}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography><strong>ප්‍රදේශය:</strong> {currentFuneral.member_id?.area}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography><strong>මුළු නොපැමිණි සාමාජිකයන්:</strong> {calculateFineEligibleAbsents().totalAbsents}</Typography>
                  {/* <Typography><strong>දඩයට යෝග්‍ය නොපැමිණි සාමාජිකයන්:</strong> {calculateFineEligibleAbsents().count}</Typography>
                  {calculateFineEligibleAbsents().excludedCount > 0 && (
                    <>
                      <Typography color="info.main" sx={{ fontSize: '0.9rem', mt: 1 }}>
                        <strong>දඩයෙන් හැර ගත් සාමාජිකයන්:</strong> {calculateFineEligibleAbsents().excludedCount}
                      </Typography>
                      <Box sx={{ ml: 2, fontSize: '0.85rem' }}>
                        {calculateFineEligibleAbsents().breakdown.cemetery > 0 && (
                          <Typography color="text.secondary">
                            • සුසන භූමි වැඩ: {calculateFineEligibleAbsents().breakdown.cemetery}
                          </Typography>
                        )}
                        {calculateFineEligibleAbsents().breakdown.funeral > 0 && (
                          <Typography color="text.secondary">
                            • අවමංගල්‍ය වැඩ: {calculateFineEligibleAbsents().breakdown.funeral}
                          </Typography>
                        )}
                        {calculateFineEligibleAbsents().breakdown.removed > 0 && (
                          <Typography color="text.secondary">
                            • ඉවත් කළ සාමාජිකයන්: {calculateFineEligibleAbsents().breakdown.removed}
                          </Typography>
                        )}
                      </Box>
                    </>
                  )} */}
                  <Typography color="error" sx={{ fontSize: '0.9rem', mt: 1 }}>
                    <strong>දඩ මුදල (එක් අයෙකු සඳහා):</strong> රු. {process.env.GATSBY_FUNERAL_ATTENDANCE_FINE_VALUE || 100}
                  </Typography>
                  <Typography color="error" sx={{ fontSize: '0.9rem' }}>
                    <strong>මුළු දඩ මුදල:</strong> රු. {finedMembers.filter(member => member.fineAmount > 0).reduce((sum, member) => sum + member.fineAmount, 0)}
                  </Typography>
                </Grid>

                {/* Show fined members if any exist with non-zero fine amounts */}
                {finedMembers.filter(member => member.fineAmount > 0).length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mt: 2, mb: 1, color: 'error.main' }}>
                      අවමංගල්‍ය නොපැමිණීම් දඩ ගෙවන සාමාජිකයන් ({finedMembers.filter(member => member.fineAmount > 0).length})
                    </Typography>
                    <Box sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 1,
                      maxHeight: '200px',
                      overflowY: 'auto',
                      p: 1.5,
                      border: '1px solid',
                      borderColor: 'error.main',
                      borderRadius: 1,
                      bgcolor: '#ffebee'
                    }}>
                      {finedMembers
                        .filter(member => member.fineAmount > 0)
                        .sort((a, b) => a.member_id - b.member_id)
                        .map(member => (
                          <Chip
                            key={member.member_id}
                            label={`${member.member_id} (රු.${member.fineAmount})`}
                            size="small"
                            color="error"
                            variant="outlined"
                            sx={{ fontSize: '0.75rem' }}
                          />
                        ))}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Only show the attendance chart when a funeral is selected and loaded */}
        {selectedFuneralId && currentFuneral && (
          <FuneralAttChart
            chartName={"Funeral Attendance"}
            saveAttendance={saveAttendance}
            initialAbsents={originalAbsents}
            funeralId={selectedFuneralId}
            loading={loading}
            finedMembers={finedMembers}
          />
        )}

        {/* Show helpful message when no funeral is selected */}
        {!selectedFuneralId && (
          <Card sx={{ mt: 3, textAlign: 'center', py: 4 }}>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                අවමංගල්‍ය පැමිණීම සටහන් කිරීම සඳහා
              </Typography>
              <Typography color="text.secondary">
                කරුණාකර ඉහත අවමංගල්‍ය උත්සවයක් තෝරන්න
              </Typography>
            </CardContent>
          </Card>
        )}
      </section>
    </Layout>
  )
}
