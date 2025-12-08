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

  const getAbsentLevel = (row, dateHeaders) => {
    const last4 = dateHeaders.slice(-4)
    const last3 = dateHeaders.slice(-3)

    if (last4.length === 4 && last4.every(date => row[date] === "❌")) {
      return "level2" // Absent for last 4
    } else if (last3.length === 3 && last3.every(date => row[date] === "❌")) {
      return "level1" // Absent for last 3
    }
    return null
  }

  return (
    <Layout>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>සාමාජික අංකය</TableCell>
              {dateHeaders.map(date => (
                <TableCell key={date}>{date}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(row => {
              const absentLevel = getAbsentLevel(row, dateHeaders)
              const rowStyle =
                absentLevel === "level2"
                  ? { backgroundColor: "#ffb3b3" } // Darker red for 4 absents
                  : absentLevel === "level1"
                  ? { backgroundColor: "#ffe0e0" } // Light red for 3 absents
                  : {}

              return (
                <TableRow key={row.memberId} sx={rowStyle}>
                  <TableCell>{row.memberId}</TableCell>
                  {dateHeaders.map(date => (
                    <TableCell key={date}>{row[date]}</TableCell>
                  ))}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Layout>
  )
}
