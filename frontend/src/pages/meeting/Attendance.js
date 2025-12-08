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
  Chip,
  CircularProgress
} from "@mui/material"
import Layout from "../../components/layout"

import AttendanceChart from "../../components/common/AttendanceChart"

import { navigate } from "gatsby"
import api from "../../utils/api"
import { getFineSettings } from "../../utils/settingsHelper"
import loadable from "@loadable/component"
const AuthComponent = loadable(() =>
  import("../../components/common/AuthComponent")
)

// const Axios = require("axios")
const baseUrl = process.env.GATSBY_API_BASE_URL

export default function Attendance() {
  // Authentication
  const [roles, setRoles] = useState([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Meeting and member data
  const [totalMembers, setTotalMembers] = useState(0)
  const [currentMeeting, setCurrentMeeting] = useState(null)
  const [finedMembers, setFinedMembers] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)

  // UI states
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Fine settings
  const [fineSettings, setFineSettings] = useState({
    meetingAttendanceFine: 500
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

    // Fetch fine settings
    const loadFineSettings = async () => {
      try {
        const settings = await getFineSettings()
        setFineSettings(settings)
      } catch (error) {
        // Keep default values if fetch fails
      }
    }
    loadFineSettings()

    // Getting number of members
    api
      .get(`${baseUrl}/member/getNextId`)
      .then(response => {
        setTotalMembers(response?.data?.nextMemberId - 1 || "Not Available")
      })
      .catch(error => {
        // Handle error
      })
  }, [isAuthenticated, roles])

  // Load fined members for a specific meeting
  const loadFinedMembers = async (meetingId) => {
    try {
      console.log(`Loading fined members for meeting: ${meetingId}`);
      const response = await api.get(`${baseUrl}/meeting/fines/${meetingId}`)
      console.log('Fined members response:', response.data);
      console.log('Fined members array:', response.data.finedMembers);
      setFinedMembers(response.data.finedMembers || [])
    } catch (error) {
      console.error('Error loading fined members:', error);
      setFinedMembers([])
    }
  }

  // Handle meeting data changes from AttendanceChart
  const handleMeetingDataChange = async (meetingData, date) => {
    setCurrentMeeting(meetingData)
    setSelectedDate(date)
    
    if (meetingData && meetingData._id) {
      await loadFinedMembers(meetingData._id)
    } else {
      setFinedMembers([])
    }
  }

//   const getMemberById = e => {
//     console.log("search:", memberId)
//     api
//       .get(`${baseUrl}/member/getMembershipDeathById?member_id=${memberId}`)
//       .then(response => {
//         console.log(response?.data?.data)
//         const data = response?.data?.data || {}
//         setMember(data.member || {})
//         // setDependents(data.dependents || [])

//         // Prepare deceased options
//         const deceased = []
//         // console.log(data.member?.dateOfDeath)
//         if (data.member?.dateOfDeath) {
//           deceased.push({
//             name: data.member.name,
//             id: "member",
//             isMember: true,
//           })
//           // console.log(deceased)
//         }
//         data.dependents.forEach(dependent => {
//           if (dependent.dateOfDeath) {
//             deceased.push({
//               name: dependent.name,
//               id: dependent._id,
//               isMember: false,
//             })
//           }
//           // deceased.push({
//           //   name: dependent.name,
//           //   id: dependent._id,
//           //   isMember: false,
//           // });
//         })
//         setDeceasedOptions(deceased)
//       })
//       .catch(error => {
//         console.error("Axios error: ", error)
//       })
//   }

//   const handleSelectChange = event => {
//     setSelectedDeceased(event.target.value)
//     let deceased_id
//     // console.log('get funeral id', event.target.value)
//     if (event.target.value === "member") {
//       deceased_id = member._id
//     } else {
//       deceased_id = event.target.value
//     }
//     api
//       .get(`${baseUrl}/funeral/getFuneralId?deceased_id=${deceased_id}`)
//       .then(response => {
//         console.log("funeral Id : ", response.data)
//         setFuneralId(response.data)
//       })
//       .catch(error => {
//         console.error("Axios error: ", error)
//       })
//   }

  const saveAttendance = async ({ absentMemberIds, selectedDate}) => {
    const absentData = { date: new Date(selectedDate), absentArray: absentMemberIds }
    
    try {
      setLoading(true)
      setError("")
      setSuccess("")
      
      const response = await api.post(`${baseUrl}/meeting/absents`, { absentData })
      
      setSuccess("මහා සභා පැමිණීම සාර්ථකව යාවත්කාලීන කරන ලදී")
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(""), 5000)
      
      // Always refresh meeting data and fines after saving attendance
      // This handles both new meetings and updates to existing meetings
      try {
        // Get updated meeting data for the selected date
        const meetingResponse = await api.get(`${baseUrl}/meeting/attendance/date?date=${selectedDate.format('YYYY-MM-DD')}`)
        const updatedMeetingData = meetingResponse.data.meeting
        
        if (updatedMeetingData) {
          // Update current meeting state
          setCurrentMeeting(updatedMeetingData)
          
          // Load fined members with the updated meeting ID
          await loadFinedMembers(updatedMeetingData._id)
        } else {
          // Clear fine data if no meeting found
          setFinedMembers([])
        }
      } catch (refreshError) {
        console.error("Error refreshing meeting data after save:", refreshError)
        // Don't show error to user as main save was successful
      }
      
      return response.data
    } catch (error) {
      setError("මහා සභා පැමිණීම සුරැකීමේදී දෝෂයක් ඇති විය")
      throw error
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <AuthComponent onAuthStateChange={handleAuthStateChange} />
      <section>
        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4, textAlign: "center" }}>
          මහා සභා පැමිණීම
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

        {/* Meeting Information */}
        {currentMeeting && selectedDate && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                මහා සභා තොරතුරු
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography><strong>දිනය:</strong> {selectedDate.format('YYYY-MM-DD')}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography><strong>නොපැමිණි සාමාජිකයන්:</strong> {currentMeeting.absents?.length || 0}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography color="error" sx={{ fontSize: '0.9rem', mt: 1 }}>
                    <strong>මහා සභා දඩ මුදල (අඛණ්ඩ තෙවන නොපැමිණීම):</strong> රු. {fineSettings.meetingAttendanceFine || 500}
                  </Typography>
                  <Typography color="error" sx={{ fontSize: '0.9rem' }}>
                    <strong>මුළු දඩ මුදල:</strong> රු. {finedMembers.filter(member => member.totalFineAmount > 0).reduce((sum, member) => sum + member.totalFineAmount, 0)}
                  </Typography>
                </Grid>
                
                {/* Show fined members with all their individual fines */}
                {(() => {
                  console.log('All finedMembers:', finedMembers);
                  const filteredMembers = finedMembers.filter(member => member.totalFineAmount > 0);
                  console.log('Filtered finedMembers (totalFineAmount > 0):', filteredMembers);
                  console.log('Filtered count:', filteredMembers.length);
                  return filteredMembers.length > 0;
                })() && (
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mt: 2, mb: 1, color: 'error.main' }}>
                      මහා සභා නොපැමිණීම් දඩ ගෙවන සාමාජිකයන් ({finedMembers.filter(member => member.totalFineAmount > 0).length})
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
                        .filter(member => member.totalFineAmount > 0)
                        .sort((a, b) => a.member_id - b.member_id)
                        .map(member => (
                          <Chip
                            key={member.member_id}
                            label={`${member.member_id} (${member.fines.map(fine => `රු.${fine.amount}`).join(', ')})`}
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

        <AttendanceChart
          chartName={"Meeting Attendance"}
          saveAttendance={saveAttendance}
          onMeetingDataChange={handleMeetingDataChange}
          finedMembers={finedMembers}
        />
      </section>
    </Layout>
  )
}
