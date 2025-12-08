import React, { useState, useEffect } from "react"
import { Box, Typography, Button, Checkbox, Paper, Grid2, CircularProgress } from "@mui/material"

import dayjs from "dayjs"
import api from "../../utils/api"
import loadable from "@loadable/component"

const AuthComponent = loadable(() =>
  import("../../components/common/AuthComponent")
)

const baseUrl = process.env.GATSBY_API_BASE_URL

export default function CommonWorkAttChart({ 
  chartName, 
  saveAttendance, 
  initialAbsents = [], 
  loading = false 
}) {
  const chunkSize = 100 // Define 100 cells per group
  const [memberIds, setMemberIds] = useState([])
  const [membersData, setMembersData] = useState([]) // Store complete member data with status
  const [attendance, setAttendance] = useState([])
  const [memberIdMap, setMemberIdMap] = useState({}) // Map for quick lookup

  useEffect(() => {
    // Get members for common work with status information
    api.get(`${baseUrl}/member/getMembersForCommonWorkDocument`).then(
      response => {
        const allMembers = response.data.members || []
        setMembersData(allMembers)
        
        // Get all member IDs (including special status ones)
        const ids = allMembers.map(member => member.member_id)
        setMemberIds(ids)
        
        const idMap = {}
        allMembers.forEach(member => {
          idMap[member.member_id] = {
            exists: true,
            status: member.status || 'active',
            isOfficer: member.isOfficer || false,
            isDeactivated: member.isDeactivated || false,
            isDeceased: member.isDeceased || false
          }
        })
        
        setMemberIdMap(idMap)
        
        // Initialize attendance based on initialAbsents and member status
        const initialAttendance = ids.map(id => {
          const memberInfo = idMap[id]
          if (!memberInfo || memberInfo.isDeactivated || memberInfo.isDeceased) {
            return false // Inactive members are absent
          }
          // Free members, attendance-free members, and officers are automatically present
          if (memberInfo.status === 'free' || memberInfo.status === 'attendance-free' || memberInfo.isOfficer) {
            return true
          }
          // Regular members based on initialAbsents
          return !initialAbsents.includes(id)
        })
        setAttendance(initialAttendance)
      }
    ).catch(error => {
      // Error fetching member IDs for common work
    })
  }, [])

  // Update attendance when initialAbsents changes
  useEffect(() => {
    if (memberIds.length > 0 && Object.keys(memberIdMap).length > 0) {
      const updatedAttendance = memberIds.map(id => {
        const memberInfo = memberIdMap[id]
        if (!memberInfo || memberInfo.isDeactivated || memberInfo.isDeceased) {
          return false // Inactive members are absent
        }
        // Free members, attendance-free members, and officers are automatically present
        if (memberInfo.status === 'free' || memberInfo.status === 'attendance-free' || memberInfo.isOfficer) {
          return true
        }
        // Regular members based on initialAbsents
        return !initialAbsents.includes(id)
      })
      setAttendance(updatedAttendance)
    }
  }, [initialAbsents, memberIds, memberIdMap])

  // Calculate total attendance (checked cells for eligible members only)
  const eligibleMembersCount = memberIds.filter(id => {
    const memberInfo = memberIdMap[id]
    return memberInfo && !memberInfo.isDeactivated && !memberInfo.isDeceased
  }).length
  
  const totalAttendance = attendance.filter((value, index) => {
    const memberInfo = memberIdMap[memberIds[index]]
    return value && memberInfo && !memberInfo.isDeactivated && !memberInfo.isDeceased
  }).length

  // Toggle individual checkbox (only for eligible regular members)
  const handleToggle = index => {
    const memberId = memberIds[index]
    const memberInfo = memberIdMap[memberId]
    
    // Don't allow toggle for special status members or inactive members
    if (!memberInfo || memberInfo.isDeactivated || memberInfo.isDeceased || 
        memberInfo.status === 'free' || memberInfo.status === 'attendance-free' || 
        memberInfo.isOfficer) {
      return
    }
    
    const updatedAttendance = [...attendance]
    updatedAttendance[index] = !updatedAttendance[index]
    setAttendance(updatedAttendance)
  }

  // Check all checkboxes (only for eligible regular members)
  const handleCheckAll = () => {
    const updatedAttendance = attendance.map((current, index) => {
      const memberId = memberIds[index]
      const memberInfo = memberIdMap[memberId]
      
      // Keep current state for special status members, set to true for regular members
      if (!memberInfo || memberInfo.isDeactivated || memberInfo.isDeceased || 
          memberInfo.status === 'free' || memberInfo.status === 'attendance-free' || 
          memberInfo.isOfficer) {
        return current
      }
      return true
    })
    setAttendance(updatedAttendance)
  }

  // Uncheck all checkboxes (only for eligible regular members)
  const handleUncheckAll = () => {
    const updatedAttendance = attendance.map((current, index) => {
      const memberId = memberIds[index]
      const memberInfo = memberIdMap[memberId]
      
      // Keep current state for special status members, set to false for regular members
      if (!memberInfo || memberInfo.isDeactivated || memberInfo.isDeceased || 
          memberInfo.status === 'free' || memberInfo.status === 'attendance-free' || 
          memberInfo.isOfficer) {
        return current
      }
      return false
    })
    setAttendance(updatedAttendance)
  }

  const handleSubmit = () => {
    // Filter and map attendance to get only absent member IDs (exclude special status members from fines)
    const absentMemberIds = attendance
      .map((checked, index) => {
        const memberId = memberIds[index]
        const memberInfo = memberIdMap[memberId]
        
        // Only include regular members who are absent
        if (!checked && memberInfo && !memberInfo.isDeactivated && !memberInfo.isDeceased &&
            memberInfo.status !== 'free' && memberInfo.status !== 'attendance-free' && 
            !memberInfo.isOfficer) {
          return memberId
        }
        return null
      })
      .filter(id => id !== null)

    // Pass only the absent member IDs to saveAttendance
    saveAttendance({ absentMemberIds })
  }

  // Generate cells per group with proper status handling
  const totalCells = Math.ceil(Math.max(...memberIds) / chunkSize) * chunkSize
  
  const cells = Array.from({ length: totalCells }, (_, i) => {
    const cellId = i + 1
    const memberInfo = memberIdMap[cellId]
    const memberIndex = memberIds.indexOf(cellId)
    
    let cellStatus = 'inactive' // Default for non-members
    let isEnabled = false
    let isChecked = false
    
    if (memberInfo) {
      if (memberInfo.isDeactivated) {
        cellStatus = 'deactivated'
      } else if (memberInfo.isDeceased) {
        cellStatus = 'deceased'
      } else if (memberInfo.status === 'free') {
        cellStatus = 'free'
        isEnabled = false // Disabled but checked
        isChecked = true
      } else if (memberInfo.status === 'attendance-free') {
        cellStatus = 'attendance-free'
        isEnabled = false // Disabled but checked
        isChecked = true
      } else if (memberInfo.isOfficer) {
        cellStatus = 'officer'
        isEnabled = false // Disabled but checked
        isChecked = true
      } else {
        cellStatus = 'regular'
        isEnabled = true
        isChecked = memberIndex >= 0 ? attendance[memberIndex] : false
      }
    }
    
    return {
      id: cellId,
      status: cellStatus,
      isEnabled: isEnabled,
      isChecked: isChecked,
    }
  })

  const chunks = Array.from(
    { length: Math.ceil(cells.length / chunkSize) },
    (_, i) => cells.slice(i * chunkSize, (i + 1) * chunkSize)
  )

  return (
    <Box sx={{ padding: 2 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "end",
          justifyContent: "center",
          gap: 4,
        }}
      >
        <Typography variant="h5" align="center" gutterBottom>
          {chartName}
        </Typography>
      </Box>

      {/* Total Attendance */}
      <Typography variant="h6" align="center" gutterBottom>
        Total Attendance: {totalAttendance} / {eligibleMembersCount}
      </Typography>

      {/* Status Color Legend */}
      <Box sx={{ mb: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom align="center">
          Attendance Status Color Guide
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 20, height: 20, backgroundColor: '#e0fffa', border: '1px solid #ddd', borderRadius: '3px' }}></Box>
            <Typography variant="caption">Present (Regular)</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 20, height: 20, backgroundColor: '#c93330', border: '1px solid #ddd', borderRadius: '3px' }}></Box>
            <Typography variant="caption">Absent (Regular)</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 20, height: 20, backgroundColor: '#4caf50', border: '1px solid #ddd', borderRadius: '3px' }}></Box>
            <Typography variant="caption">Officers (Auto Present)</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 20, height: 20, backgroundColor: '#2196f3', border: '1px solid #ddd', borderRadius: '3px' }}></Box>
            <Typography variant="caption">Free Members</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 20, height: 20, backgroundColor: '#ff9800', border: '1px solid #ddd', borderRadius: '3px' }}></Box>
            <Typography variant="caption">Attendance Free</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 20, height: 20, backgroundColor: '#e0e0e0', border: '1px solid #ddd', borderRadius: '3px' }}></Box>
            <Typography variant="caption">Not Active</Typography>
          </Box>
        </Box>
        <Typography variant="caption" display="block" align="center" sx={{ mt: 1, color: 'text.secondary' }}>
          Note: Only regular members can receive fines for absence
        </Typography>
      </Box>

      {/* Buttons to check/uncheck all */}
      <Box sx={{ display: "flex", justifyContent: "center", marginBottom: 2 }}>
        <Button
          onClick={handleCheckAll}
          variant="contained"
          color="primary"
          sx={{ marginRight: 2 }}
          disabled={loading}
        >
          Check All
        </Button>
        <Button 
          onClick={handleUncheckAll} 
          variant="outlined" 
          color="secondary"
          disabled={loading}
        >
          Uncheck All
        </Button>
      </Box>

      {/* Render groups */}
      {chunks.map((chunk, chunkIndex) => (
        <Paper key={chunkIndex} sx={{ padding: 2, marginBottom: 2 }}>
          <Typography variant="h6" align="center" gutterBottom>
            Group {chunkIndex + 1} (Cells {chunkIndex * chunkSize + 1} to{" "}
            {(chunkIndex + 1) * chunkSize})
          </Typography>
          <Grid2 container spacing={1} justifyContent="center">
            {chunk.map(cell => {
              // Define colors based on status
              let backgroundColor = '#e0e0e0' // Default inactive color
              let textColor = '#666'
              
              switch(cell.status) {
                case 'regular':
                  backgroundColor = cell.isChecked ? "#e0fffa" : "#c93330" // Present/Absent for regular members
                  textColor = cell.isChecked ? '#333' : '#fff'
                  break
                case 'officer':
                  backgroundColor = "#4caf50" // Green for officers
                  textColor = '#fff'
                  break
                case 'free':
                  backgroundColor = "#2196f3" // Blue for free members
                  textColor = '#fff'
                  break
                case 'attendance-free':
                  backgroundColor = "#ff9800" // Orange for attendance-free
                  textColor = '#fff'
                  break
                case 'deactivated':
                case 'deceased':
                  backgroundColor = "#f5f5f5" // Light gray for inactive
                  textColor = '#999'
                  break
                default:
                  backgroundColor = "#e0e0e0" // Default gray
                  textColor = '#666'
              }
              
              return (
                <Grid2 key={cell.id}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      border: "2px solid #ddd",
                      padding: 1,
                      width: 50,
                      height: 50,
                      justifyContent: "center",
                      borderRadius: "4px",
                      backgroundColor: backgroundColor,
                      opacity: loading ? 0.6 : 1,
                      cursor: cell.isEnabled ? 'pointer' : 'not-allowed',
                    }}
                  >
                    <Typography variant="body2" sx={{ marginBottom: -1, color: textColor }}>
                      {cell.id}
                    </Typography>
                    <Checkbox
                      checked={cell.isChecked}
                      disabled={!cell.isEnabled || loading}
                      onChange={() => handleToggle(memberIds.indexOf(cell.id))}
                      size="small"
                      color="primary"
                      sx={{
                        color: textColor,
                        '&.Mui-checked': {
                          color: textColor,
                        },
                        '&.Mui-disabled': {
                          color: textColor,
                        }
                      }}
                    />
                  </Box>
                </Grid2>
              )
            })}
          </Grid2>
        </Paper>
      ))}

      {/* Submit Button */}
      <Box sx={{ textAlign: "center" }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={handleSubmit}
          disabled={loading}
          sx={{ 
            px: 4, 
            py: 1.5,
            fontSize: '1.1rem'
          }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : "පැමිණීම සුරකින්න"}
        </Button>
      </Box>
    </Box>
  )
}
