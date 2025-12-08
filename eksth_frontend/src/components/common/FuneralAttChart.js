import React, { useState, useEffect } from "react"
import { Box, Typography, Button, Checkbox, Paper, Grid2, CircularProgress, Chip } from "@mui/material"
import BasicDatePicker from "./basicDatePicker"

import dayjs from "dayjs"
import Axios from "axios"

import { navigate } from "gatsby"
import api from "../../utils/api"
import loadable from "@loadable/component"
const AuthComponent = loadable(() =>
  import("../../components/common/AuthComponent")
)

// const Axios = require("axios")
const baseUrl = process.env.GATSBY_API_BASE_URL

export default function FuneralAttChart({ chartName, saveAttendance, initialAbsents = [], loading = false, finedMembers = [] }) {
  const chunkSize = 100 // Define 100 cells per group
  const [memberIds, setMemberIds] = useState([])
  const [membersWithStatus, setMembersWithStatus] = useState([])
  const [attendance, setAttendance] = useState([])
//   const [selectedDate, setSelectedDate] = useState(dayjs()) // Initialize with today's date
  const [memberIdMap, setMemberIdMap] = useState({}) // Map for quick lookup
  const [statusMap, setStatusMap] = useState({}) // Map for member statuses
  const [finedMemberIds, setFinedMemberIds] = useState(new Set())

  useEffect(() => {
    api.get(`${baseUrl}/member/getMemberIdsForFuneralAttendance`).then(
      response => {
        const ids = response.data.memberIds || []
        const membersWithStatusData = response.data.membersWithStatus || []
        
        setMemberIds(ids)
        setMembersWithStatus(membersWithStatusData)
        
        const idMap = {}
        const statusMap = {}
        
        ids.forEach(id => {
          idMap[id] = true // Mark valid member IDs
        })
        
        membersWithStatusData.forEach(member => {
          statusMap[member.member_id] = {
            status: member.status,
            showStatus: member.showStatus
          }
        })
        
        console.log('idMap: ', idMap)
        console.log('statusMap: ', statusMap)
        
        setMemberIdMap(idMap)
        setStatusMap(statusMap)
        
        // Initialize attendance based on initialAbsents
        const initialAttendance = ids.map(id => !initialAbsents.includes(id))
        setAttendance(initialAttendance)
      }
    )
  }, [])

  // Update attendance when initialAbsents changes
  useEffect(() => {
    if (memberIds.length > 0) {
      const updatedAttendance = memberIds.map(id => !initialAbsents.includes(id))
      setAttendance(updatedAttendance)
    }
  }, [initialAbsents, memberIds])

  // Update fined member IDs when finedMembers changes
  useEffect(() => {
    const finedIds = new Set(finedMembers.map(member => member.member_id))
    setFinedMemberIds(finedIds)
  }, [finedMembers])

  // Get background color based on member status
  const getCellBackgroundColor = (cell) => {
    if (!cell.isEnabled) {
      return "#e0e0e0" // Disabled color
    }
    
    // Check if member is fined (show with distinct color)
    if (finedMemberIds.has(cell.id)) {
      return cell.isChecked ? "#ffebcd" : "#8B0000" // Light orange for present fined, dark red for absent fined
    }
    
    // Check if member has special status that should be shown
    if (cell.memberStatus && cell.memberStatus.showStatus) {
      if (cell.memberStatus.status === 'attendance-free') {
        return "#fff3cd" // Light yellow for attendance-free (always same color)
      } else if (cell.memberStatus.status === 'free') {
        return "#e6f3ff" // Light blue for free (distinct from present color)
      }
    }
    
    // Normal active members
    return cell.isChecked ? "#e0fffa" : "#FF6600" // Updated colors for active members
  }

  // Check if cell should be disabled (non-editable)
  const isCellDisabled = (cell) => {
    if (!cell.isEnabled) return true // Already disabled member
    
    // Disable cells for 'attendance-free' and 'free' members
    if (cell.memberStatus && cell.memberStatus.showStatus) {
      return cell.memberStatus.status === 'attendance-free' || cell.memberStatus.status === 'free'
    }
    
    return false // Active members are editable
  }
// console.log(memberIdMap)
  // Calculate total attendance (checked cells)
  const totalAttendance = attendance.filter(value => value).length

  // Toggle individual checkbox
  const handleToggle = index => {
    const updatedAttendance = [...attendance]
    updatedAttendance[index] = !updatedAttendance[index]
    setAttendance(updatedAttendance)
  }

  // Check all checkboxes (only for enabled and editable cells)
  const handleCheckAll = () => {
    setAttendance(attendance.map((_, index) => {
      const memberId = memberIds[index];
      const memberStatus = statusMap[memberId];
      const isDisabled = memberStatus && memberStatus.showStatus && 
        (memberStatus.status === 'attendance-free' || memberStatus.status === 'free');
      
      return memberIdMap[memberId] && !isDisabled; // Only check enabled, non-disabled cells
    }));
  }

  // Uncheck all checkboxes (only for enabled and editable cells)
  const handleUncheckAll = () => {
    setAttendance(attendance.map((_, index) => {
      const memberId = memberIds[index];
      const memberStatus = statusMap[memberId];
      const isDisabled = memberStatus && memberStatus.showStatus && 
        (memberStatus.status === 'attendance-free' || memberStatus.status === 'free');
      
      return isDisabled ? attendance[index] : false; // Keep disabled cells unchanged, uncheck others
    }));
  }

  const handleSubmit = () => {
    // const date = selectedDate.format("YYYY-MM-DD")

    // Filter and map attendance to get only absent member IDs
    const absentMemberIds = attendance
      .map((checked, index) => (!checked ? memberIds[index] : null))
      .filter(id => id !== null)

    // Pass only the absent member IDs and date to saveAttendance
    saveAttendance({ absentMemberIds })
    // Don't auto-reset - let parent handle the state
  }

  // Generate 100 cells per group, disabling invalid memberIds
  const totalCells = Math.ceil(Math.max(...memberIds) / chunkSize) * chunkSize
  console.log('totalCells :', totalCells)
  const cells = Array.from({ length: totalCells }, (_, i) => ({
    id: i + 1,
    isEnabled: memberIdMap[i + 1] || false,
    isChecked: memberIdMap[i + 1]
      ? attendance[memberIds.indexOf(i + 1)]
      : false,
    memberStatus: statusMap[i + 1] || null, // Get full status info for this member
  }))

  const chunks = Array.from(
    { length: Math.ceil(cells.length / chunkSize) },
    (_, i) => cells.slice(i * chunkSize, (i + 1) * chunkSize)
  )
console.log('chunk: ', chunks)
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
        {/* <BasicDatePicker
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        /> */}
      </Box>

      {/* Total Attendance */}
      <Typography variant="h6" align="center" gutterBottom>
        Total Attendance: {totalAttendance} / {memberIds.length}
      </Typography>

      {/* Status Color Legend */}
      <Box sx={{ mb: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom align="center">
          Member Status Color Guide
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 20, height: 20, backgroundColor: '#e0fffa', border: '1px solid #ddd', borderRadius: '3px' }}></Box>
            <Typography variant="caption">Present</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 20, height: 20, backgroundColor: '#FF6600', border: '1px solid #ddd', borderRadius: '3px' }}></Box>
            <Typography variant="caption">Absent</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 20, height: 20, backgroundColor: '#ffebcd', border: '1px solid #ddd', borderRadius: '3px' }}></Box>
            <Typography variant="caption">Present (Fined)</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 20, height: 20, backgroundColor: '#8B0000', border: '1px solid #ddd', borderRadius: '3px' }}></Box>
            <Typography variant="caption">Absent (Fined)</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 20, height: 20, backgroundColor: '#fff3cd', border: '1px solid #ddd', borderRadius: '3px' }}></Box>
            <Typography variant="caption">Attendance-Free</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 20, height: 20, backgroundColor: '#e6f3ff', border: '1px solid #ddd', borderRadius: '3px' }}></Box>
            <Typography variant="caption">Free</Typography>
          </Box>
        </Box>
        <Typography variant="caption" display="block" align="center" sx={{ mt: 1, color: 'text.secondary' }}>
          Note: Attendance-Free and Free members are non-editable and exempt from fines.<br/>
          Fined members are shown with special colors to indicate their current fine status.
        </Typography>
      </Box>

      {/* Buttons to check/uncheck all */}
      <Box sx={{ display: "flex", justifyContent: "center", marginBottom: 2 }}>
        <Button
          onClick={handleCheckAll}
          variant="contained"
          color="primary"
          sx={{ marginRight: 2 }}
        >
          Check All
        </Button>
        <Button onClick={handleUncheckAll} variant="outlined" color="secondary">
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
            {chunk.map(cell => (
              <Grid2 key={cell.id}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    border: "2px solid #ddd",
                    padding: 1,
                    width: 50, // Back to original width
                    height: 50, // Back to original height
                    justifyContent: "center",
                    borderRadius: "4px",
                    backgroundColor: getCellBackgroundColor(cell),
                  }}
                >
                  <Typography variant="body2" sx={{ marginBottom: 0.5 }}>
                    {cell.id} {/* Just member ID, no status code */}
                  </Typography>
                  <Checkbox
                    checked={cell.isChecked}
                    disabled={!cell.isEnabled || isCellDisabled(cell)}
                    onChange={() => {
                      if (!isCellDisabled(cell)) {
                        handleToggle(memberIds.indexOf(cell.id));
                      }
                    }}
                    size="small"
                    color="primary"
                  />
                </Box>
              </Grid2>
            ))}
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
