import React, { useEffect, useState } from "react"
import Layout from "../../components/layout"
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material"

import api from "../../utils/api"

const baseUrl = process.env.GATSBY_API_BASE_URL

export default function MeetingAttendance() {
  const [loading, setLoading] = useState(true) // Handle loading state
  const [error, setError] = useState(null)

  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [memberIds, setMemberIds] = useState([])

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const attendance = await api.get(`${baseUrl}/meeting/attendance`)
        // console.log("attendance: ", attendance.data)
        setAttendanceRecords(attendance.data.attendanceRecords)
        setMemberIds(attendance.data.memberIds)
      } catch (err) {
        console.error("Error fetching attendance data:", err)
        setError("Failed to load attendance data. Please try again later.")
        setAttendanceRecords(null)
      } finally {
        setLoading(false)
      }
    }
    fetchAttendance()
  }, [])
  const transformAttendanceData = (attendanceRecords, memberIds) => {
    // Initialize rows with memberId
    const rows = memberIds.map(id => ({ memberId: id }))

    // For each meeting, fill present/absent status
    attendanceRecords.forEach(meeting => {
      const dateKey = new Date(meeting.date).toISOString().split("T")[0] // Format as YYYY-MM-DD
      meeting.attendance.forEach(att => {
        const row = rows.find(r => r.memberId === att.memberId)
        if (row) row[dateKey] = att.present ? "✅" : "❌"
      })
    })

    return rows
  }

  const rows = transformAttendanceData(attendanceRecords, memberIds)

  const dateHeaders = attendanceRecords.map(
    meeting => new Date(meeting.date).toISOString().split("T")[0]
  )

  const isFinedCell = (row, date, dateHeaders) => {
    let consecutiveCount = 0
    for (const d of dateHeaders) {
      if (row[d] === "❌") {
        consecutiveCount++
      } else {
        consecutiveCount = 0
      }
      
      if (d === date) {
        return consecutiveCount > 0 && consecutiveCount % 3 === 0
      }
    }
    return false
  }

  return (
    <Layout>
      <TableContainer component={Paper} sx={{ maxHeight: "70vh", maxWidth: "100%", overflow: "auto" }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  position: "sticky",
                  left: 0,
                  backgroundColor: "background.paper",
                  zIndex: 3,
                  borderRight: "2px solid rgba(224, 224, 224, 1)",
                  fontWeight: "bold",
                }}
              >
                සාමාජික අංකය
              </TableCell>
              {dateHeaders.map(date => (
                <TableCell key={date} sx={{ fontWeight: "bold" }}>{date}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(row => {
              return (
                <TableRow key={row.memberId}>
                  <TableCell
                    sx={{
                      position: "sticky",
                      left: 0,
                      backgroundColor: "background.paper",
                      zIndex: 1,
                      borderRight: "2px solid rgba(224, 224, 224, 1)",
                    }}
                  >
                    {row.memberId}
                  </TableCell>
                  {dateHeaders.map(date => {
                    const isFined = isFinedCell(row, date, dateHeaders)
                    return (
                      <TableCell 
                        key={date}
                        sx={isFined ? { backgroundColor: "#ffcdd2" } : {}}
                      >
                        {row[date]}
                      </TableCell>
                    )
                  })}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Layout>
  )
}
