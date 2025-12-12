import React, { useEffect, useState } from "react"
import Layout from "../../components/layout"
import { Box, Paper, Typography, Button, GlobalStyles, TextField } from "@mui/material"
import api from "../../utils/api"

const baseUrl = process.env.GATSBY_API_BASE_URL

// A simple A4-ready attendance sheet for vice-secretary
export default function AttendanceViceSecretary() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })

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
  const ROWS_PER_PAGE = 28
  for (let i = 0; i < ROWS_PER_PAGE; i++) {
    const member = members[i]
    rows.push(member || null)
  }

  // Print styles: ensure A4 sized container with light borders
  return (
    <Layout>
      <GlobalStyles
        styles={{
          '@page': { size: 'A4', margin: '0mm 6mm 0mm 1in' },
          '@media print': {
            'header, nav, footer, .site-header, .site-nav, .MuiAppBar-root, .no-print': { display: 'none !important' },
            'html, body': { margin: 0, padding: 0, height: '100%' },
            'body': { margin: 0 },
            '.attendance-container': { maxWidth: '780px', width: '100%', margin: 0, padding: '4px' },
            '#attendance-grid-table': { fontSize: '0.88rem', tableLayout: 'fixed' },
            '#attendance-grid-table td': { padding: '4px !important', minHeight: '18px !important', fontSize: '0.88rem' },
            '#attendance-grid-table tr': { height: '20px' },
            '*': { '-webkit-print-color-adjust': 'exact' }
          }
        }}
      />
       <Box className="attendance-container" sx={{ maxWidth: 840, margin: "20px auto", padding: 2 }}>
        {/* On-screen heading (hidden when printing) */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, '@media print': { display: 'none' } }}>
          <Typography variant="h6">මහා සභා පැමිණීම - (තහවුරු කිරීම)</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              label="Choose month"
              type="month"
              size="small"
              value={month}
              onChange={e => setMonth(e.target.value)}
              sx={{ input: { textAlign: 'left' }, mr: 1 }}
            />
            <Button variant="outlined" onClick={() => window.print()} sx={{ mr: 1 }}>Print</Button>
            <Button variant="contained" onClick={fetchActiveMembers}>Refresh</Button>
          </Box>
        </Box>

        {/* Print-only heading: match MeetingSheet print header */}
        <Box sx={{ display: 'none', '@media print': { display: 'block' }, mb: 2 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 'bold',
              textAlign: 'center',
              textDecoration: 'underline',
            }}
          >
            විල්බාගෙදර එක්සත් අවමංගල්‍යාධාර සමිතිය
          </Typography>

          <Box sx={{ display: 'flex', gap: 5, mb: '4px', justifyContent: 'center' }}>
            <Typography sx={{ fontWeight: 'bold' }}>මහා සභාවට සහභාගිත්වය</Typography>
            <Typography>
              දිනය:- {(() => {
                if (!month) return " / /.........."
                const [y, m] = month.split('-')
                const mon = (m || '').padStart(2, '0')
                return `${y}/${mon}/..........`
              })()}
            </Typography>
            <Typography>සාමාජික සංඛ්‍යාව:- ..........</Typography>
          </Box>
        </Box>

        <Paper elevation={1} sx={{ padding: 2 }}>
          {/* Grid: 30 rows, dynamic columns to fit all member IDs on one page */}
          <Box
            id="attendance-grid-table"
            component="table"
            sx={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '1.1rem',
              tableLayout: 'fixed'
            }}
          >
            <Box component="tbody">
              {
                (() => {
                  // We'll render numbered slots (1..rowsCount*cols). For each slot
                  // try to find a member whose numeric member_id equals the slot number.
                  const rowsCount = ROWS_PER_PAGE
                  // Decide columns based on either max numeric id or members length
                  // find max numeric id to determine reasonable columns
                  const numericIds = members
                    .map(m => {
                      const v = String(m.member_id || "").trim()
                      const parsed = parseInt(v.replace(/[^0-9]/g, ''), 10)
                      return isNaN(parsed) ? null : parsed
                    })
                    .filter(Boolean)
                  const maxId = numericIds.length ? Math.max(...numericIds) : members.length
                  const cols = Math.max(1, Math.ceil(Math.max(maxId, members.length) / rowsCount))

                  // build a lookup by numeric id for fast matching
                  const byNumber = {}
                  members.forEach(m => {
                    const v = String(m.member_id || "").trim()
                    const parsed = parseInt(v.replace(/[^0-9]/g, ''), 10)
                    if (!isNaN(parsed)) byNumber[parsed] = m
                  })

                  const tableRows = []
                  for (let r = 0; r < rowsCount; r++) {
                    const cells = []
                    for (let c = 0; c < cols; c++) {
                      const slotNumber = c * rowsCount + r + 1
                      const m = byNumber[slotNumber] || null
                      const isFree = m && (m.status === 'free' || m.status === 'attendance-free')
                      cells.push(
                        <Box
                          component="td"
                          key={`c-${c}`}
                          sx={{
                            border: '1px solid #ddd',
                            padding: '10px',
                            minHeight: 34,
                            textAlign: 'center',
                            width: `${100 / Math.max(1, cols)}%`,
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                            backgroundColor: m ? (isFree ? '#f5f5f5' : 'transparent') : 'rgba(250,250,250,0.8)',
                            fontWeight: isFree ? 400 : (m ? 700 : 400),
                            color: m ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.35)',
                            fontSize: m ? '1.1rem' : '1.05rem'
                          }}
                        >
                          {m ? m.member_id : <Box component="span" sx={{ color: 'rgba(0,0,0,0.35)' }}>—</Box>}
                        </Box>
                      )
                    }
                    tableRows.push(
                      <Box component="tr" key={`r-${r}`} sx={{ pageBreakInside: 'avoid' }}>
                        {cells}
                      </Box>
                    )
                  }
                  return tableRows
                })()
              }
            </Box>
          </Box>
        </Paper>

        {/* Print-only signature line for marking person */}
        <Box sx={{ display: 'none', '@media print': { display: 'block', position: 'fixed', bottom: '18mm', left: '1in', right: '6mm', textAlign: 'left' } }}>
          <Typography sx={{ fontSize: '0.95rem', fontWeight: 'bold' }}>සලකුණු කරන ලද්දේ .............................</Typography>
        </Box>
      </Box>
    </Layout>
  )
}
