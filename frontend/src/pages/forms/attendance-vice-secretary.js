import React, { useEffect, useState } from "react"
import Layout from "../../components/layout"
import { Box, Paper, Typography, Button } from "@mui/material"
import api from "../../utils/api"

const baseUrl = process.env.GATSBY_API_BASE_URL

// A simple A4-ready attendance sheet for vice-secretary
export default function AttendanceViceSecretary() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActiveMembers()
  }, [])

  async function fetchActiveMembers() {
    setLoading(true)
    try {
      const res = await api.get(`${baseUrl}/member/getActiveMembers`)
      // The endpoint returns { success: true, data: members }
      const data = res?.data?.data || res?.data?.members || []
      // Normalize to an array of objects with member_id and status
      const normalized = data.map(m => ({
        member_id: m.member_id || m.memberId || m.member_id,
        name: m.name || "",
        status: m.status || "regular"
      }))
      setMembers(normalized)
    } catch (err) {
      console.error("Error fetching active members", err)
      setMembers([])
    } finally {
      setLoading(false)
    }
  }

  // Render rows: 30 rows per page (A4 single column set up). If fewer members, fill with empty rows.
  const rows = []
  for (let i = 0; i < 30; i++) {
    const member = members[i]
    rows.push(member || null)
  }

  // Print styles: ensure A4 sized container with light borders
  return (
    <Layout>
      <Box sx={{ maxWidth: 840, margin: "20px auto", padding: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">මහා සභා පැමිණීම - සටහන (Vice-Secretary)</Typography>
          <Box>
            <Button variant="outlined" onClick={() => window.print()} sx={{ mr: 1 }}>Print</Button>
            <Button variant="contained" onClick={fetchActiveMembers}>Refresh</Button>
          </Box>
        </Box>

        <Paper elevation={1} sx={{ padding: 2 }}>
          <Box
            component="table"
            sx={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.95rem'
            }}
          >
            <Box component="thead">
              <Box component="tr">
                <Box component="th" sx={{ border: '1px solid #ddd', padding: '8px', width: '10%', textAlign: 'center' }}>No</Box>
                <Box component="th" sx={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Member ID</Box>
                <Box component="th" sx={{ border: '1px solid #ddd', padding: '8px', width: '20%', textAlign: 'center' }}>Signature / Mark</Box>
              </Box>
            </Box>
            <Box component="tbody">
              {rows.map((r, idx) => {
                const isFree = r && (r.status === 'free' || r.status === 'attendance-free')
                return (
                  <Box component="tr" key={idx} sx={{ pageBreakInside: 'avoid' }}>
                    <Box component="td" sx={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{idx + 1}</Box>
                    <Box component="td" sx={{ border: '1px solid #ddd', padding: '8px', minHeight: 24, backgroundColor: isFree ? 'rgba(230,245,255,0.6)' : 'transparent' }}>
                      {r ? r.member_id : ''}
                    </Box>
                    <Box component="td" sx={{ border: '1px solid #ddd', padding: '8px' }}></Box>
                  </Box>
                )
              })}
            </Box>
          </Box>
        </Paper>

        <Typography variant="caption" sx={{ display: 'block', mt: 2 }}>Print settings: A4 portrait, scale 100%, margins small.</Typography>
      </Box>
    </Layout>
  )
}
