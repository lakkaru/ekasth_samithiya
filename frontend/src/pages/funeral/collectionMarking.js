import React, { useState, useEffect } from "react"
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider,
  Alert,
  CircularProgress,
} from "@mui/material"
import { Print as PrintIcon } from "@mui/icons-material"
import Layout from "../../components/layout"
import AuthComponent from "../../components/common/AuthComponent"
import api from "../../utils/api"

const baseUrl = process.env.GATSBY_API_BASE_URL

// Page sizing constants (mm)
const A4_WIDTH_MM = 240
const A4_HEIGHT_MM = 350
const LEFT_MARGIN_MM = 25
// Use very small top padding for print (1mm top + 6mm bottom)
const TOP_BOTTOM_PADDING_MM = 7 // 1mm top + 6mm bottom
// Reduce header reserve so the heading sits much closer to the top of the physical page
const HEADER_RESERVE_MM = 12
// Reserve exact footer height to guarantee footer area is always visible
const FOOTER_RESERVE_MM = 20
// Extra safety buffer to ensure the table never reaches the footer due to rounding
let FOOTER_BUFFER_MM = 20
const TABLE_HEAD_MM = 8
// small extra reduction to printed font to help fit more rows
let SMALL_FONT_REDUCTION_MM = 0.2

export default function CollectionMarking() {
  const [members, setMembers] = useState([])
  const [selectedArea, setSelectedArea] = useState("")
  const [areas, setAreas] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const [collectionData, setCollectionData] = useState({})

  const [rowHeightMm, setRowHeightMm] = useState(9)
  const [printFontSizeMm, setPrintFontSizeMm] = useState(3.5)
  const [rowsPerPage, setRowsPerPage] = useState(20)

  useEffect(() => { fetchAreas() }, [])

  const handleAuthStateChange = authData => setIsAuthenticated(Boolean(authData?.isAuthenticated))

  const fetchAreas = async () => {
    try {
      const res = await api.get(`${baseUrl}/member/areas`)
      if (res.data.success) setAreas(res.data.areas)
    } catch (err) {
      console.error(err)
      setError("ප්‍රදේශ තොරතුරු ලබා ගැනීමේදී දෝෂයක් සිදුවිය")
    }
  }

  const fetchMembersForMarking = async () => {
    if (!selectedArea) { setError("කරුණාකර ප්‍රදේශය තෝරන්න"); return }
    setLoading(true); setError("")
    try {
      const res = await api.get(`${baseUrl}/member/forCollectionMarking?area=${selectedArea}`)
      if (res.data.success) {
        setMembers(res.data.members)
        const initial = {}
        res.data.members.forEach(m => (initial[m._id] = { collected: false, money: "", coconut: "" }))
        setCollectionData(initial)
      } else setError("සාමාජිකයින් ලබා ගැනීමේදී දෝෂයක් සිදුවිය")
    } catch (err) {
      console.error(err); setError("සාමාජිකයින් ලබා ගැනීමේදී දෝෂයක් සිදුවිය")
    } finally { setLoading(false) }
  }

  const handlePrint = () => window.print()

  // automatically fetch members when the selected area changes
  useEffect(() => {
    if (selectedArea) fetchMembersForMarking()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedArea])

  // sizing for print, compute rowsPerPage, rowHeightMm, and font size
  useEffect(() => {
    const calc = () => {
      try {
        // compute safe area for table rows, subtracting footer reserve and a small buffer
        const safeTableHeight = Math.max(0, A4_HEIGHT_MM - TOP_BOTTOM_PADDING_MM - HEADER_RESERVE_MM - FOOTER_RESERVE_MM - FOOTER_BUFFER_MM)
        const usableForRows = Math.max(0, safeTableHeight - TABLE_HEAD_MM)
        const count = Math.max(1, members.length)
        // determine how many rows fit in the usable area (avoid oversize rows that push past footer)
  const maxRowsIf6mm = Math.floor(usableForRows / 6) || 1
  let targetRows = Math.min(count, Math.max(1, maxRowsIf6mm))

  // initial computed row height based on target rows
  const computedRow = usableForRows / targetRows
  // clamp to readable sizes (allow slightly smaller rows now)
  const clampedRow = Math.max(3.2, Math.min(12, computedRow))

  // now compute how many rows actually fit with the clamped row height
  const rowsFit = Math.max(1, Math.floor(usableForRows / clampedRow))
  // final rows per page should not exceed rowsFit
  targetRows = Math.min(targetRows, rowsFit)

  // final row height is usableForRows divided by the final rowsPerPage (safe, fits exactly)
  const finalRowHeight = Math.max(1, usableForRows / targetRows)
  const finalClampedRow = Math.max(3.0, Math.min(12, finalRowHeight))
  // compute base font size from row height, then reduce by SMALL_FONT_REDUCTION_MM
  const fontBase = Math.min(4.5, Math.max(1.8, finalClampedRow * 0.55))
  const fontMm = Math.max(1.6, Math.min(4.5, fontBase - SMALL_FONT_REDUCTION_MM))

  setRowHeightMm(finalClampedRow)
  setPrintFontSizeMm(fontMm)
  setRowsPerPage(targetRows)
      } catch (err) { console.error('calc error', err) }
    }
    calc()
    window.addEventListener('resize', calc)
    return () => window.removeEventListener('resize', calc)
  }, [members])

  // paginate members
  const pages = []
  for (let i = 0; i < members.length; i += rowsPerPage) pages.push(members.slice(i, i + rowsPerPage))
  if (pages.length === 0) pages.push([])

  if (!isAuthenticated) return (
    <Layout>
      <AuthComponent onAuthStateChange={handleAuthStateChange} />
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="info">මෙම පිටුවට ප්‍රවේශ වීමට කරුණාකර ලොගින් වන්න</Alert>
      </Container>
    </Layout>
  )

  return (
    <Layout>
      <AuthComponent onAuthStateChange={handleAuthStateChange} />

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ '@media print': { display: 'none' } }}>
          <Typography variant="h4" sx={{ mb: 3, textAlign: 'center', fontWeight: 'bold', color: '#1976d2' }}>අතිරේක ආධාර සලකුණු කිරීමේ ලැයිස්තුව</Typography>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <FormControl fullWidth>
                  <InputLabel>ප්‍රදේශය තෝරන්න</InputLabel>
                  <Select value={selectedArea} label="ප්‍රදේශය තෝරන්න" onChange={e => setSelectedArea(e.target.value)}>
                    {areas.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <Button fullWidth sx={{ height: 56 }} variant="contained" onClick={fetchMembersForMarking} disabled={!selectedArea || loading}>
                  {loading ? <CircularProgress size={24} /> : 'සාමාජිකයින් ලබා ගන්න'}
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          {members.length > 0 && (
            <Paper sx={{ p: 2, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant='h6'>සාමාජිකයින් ({members.length})</Typography>
                <Button variant='contained' startIcon={<PrintIcon />} color='success' onClick={handlePrint}>මුද්‍රණය කරන්න</Button>
              </Box>

              <TableContainer>
                <Table size='small'>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>අංකය</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>සා. අංකය</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>නම</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {members.map((m, i) => (
                      <TableRow key={m._id}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell>{m.member_id}</TableCell>
                        <TableCell>{m.name}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </Box>

        {/* Print pages */}
        <Box sx={{ display: 'none', '@media print': { display: 'block' } }}>
          {pages.map((pageMembers, pageIndex) => {
            // compute safe table max height for this page in mm
            const safeTableMaxHeight = Math.max(0, A4_HEIGHT_MM - TOP_BOTTOM_PADDING_MM - HEADER_RESERVE_MM - FOOTER_RESERVE_MM - FOOTER_BUFFER_MM)
            return (
            <Box key={pageIndex} className='print-page' sx={{ width: `${A4_WIDTH_MM}mm`, height: `${A4_HEIGHT_MM}mm`, boxSizing: 'border-box', padding: `0mm 0mm 0mm ${LEFT_MARGIN_MM}mm`, pageBreakAfter: 'always', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ textAlign: 'center', mb: '1mm' }}>
                <Typography sx={{ fontWeight: 'bold', fontSize: `${printFontSizeMm + 1}mm` }}>විල්බාගෙදර එක්සත් අවමංගල්‍යාධාර සමිතිය</Typography>
                <Typography sx={{ fontSize: `${printFontSizeMm}mm`, mb: 0.5 }}>අතිරේක ආධාර</Typography>
                <Divider sx={{ my: 1 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ flex: 1, pr: '6mm' }}>
                    <Typography sx={{ fontSize: `${Math.max(10, printFontSizeMm * 4)}px`, mb: 0.5, textAlign: 'left' }}>
                      <strong>සාමාජික අංකය:</strong> __________________
                    </Typography>
                    <Typography sx={{ fontSize: `${Math.max(10, printFontSizeMm * 4)}px`, textAlign: 'left' }}>
                      <strong>මියගිය පුද්ගලයාගේ නම:</strong> ______________________________________
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography sx={{ fontSize: `${Math.max(10, printFontSizeMm * 4)}px`, mb: 0.5 }}>
                      <strong>ප්‍රදේශය:</strong> {selectedArea}
                    </Typography>
                    <Typography sx={{ fontSize: `${Math.max(10, printFontSizeMm * 4)}px` }}>
                      <strong>දිනය:</strong> ____________________
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <TableContainer sx={{ maxHeight: `${safeTableMaxHeight}mm`, overflow: 'hidden', boxSizing: 'border-box', flex: '1 1 auto' }}>
                <Table size='small' sx={{ border: '1px solid black', tableLayout: 'fixed', fontSize: `${Math.max(1.8, printFontSizeMm - SMALL_FONT_REDUCTION_MM)}mm` }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ border: '1px solid black', textAlign: 'center', fontWeight: 'bold', width: '8%' }}>අංකය</TableCell>
                      <TableCell sx={{ border: '1px solid black', textAlign: 'center', fontWeight: 'bold', width: '18%' }}>සා. අංකය</TableCell>
                      <TableCell className='name-col' sx={{ border: '1px solid black', textAlign: 'center', fontWeight: 'bold', width: '48%' }}>නම</TableCell>
                      <TableCell sx={{ border: '1px solid black', textAlign: 'center', fontWeight: 'bold', width: '12%' }}>මුදල</TableCell>
                      <TableCell sx={{ border: '1px solid black', textAlign: 'center', fontWeight: 'bold', width: '14%' }}>පොල්</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pageMembers.map((m, i) => (
                      <TableRow key={m._id} sx={{ height: `${rowHeightMm}mm` }}>
                        <TableCell sx={{ border: '1px solid black', textAlign: 'center', padding: '0.8mm 1mm', fontSize: `${Math.max(1.6, printFontSizeMm - SMALL_FONT_REDUCTION_MM)}mm` }}>{pageIndex * rowsPerPage + i + 1}</TableCell>
                        <TableCell sx={{ border: '1px solid black', textAlign: 'center', padding: '0.8mm 1mm', fontSize: `${Math.max(1.6, printFontSizeMm - SMALL_FONT_REDUCTION_MM)}mm` }}>{m.member_id}</TableCell>
                        <TableCell className='name-cell' sx={{ border: '1px solid black', textAlign: 'left', padding: '0.8mm 1mm', whiteSpace: 'normal', overflow: 'hidden', fontSize: `${Math.max(1.6, printFontSizeMm - SMALL_FONT_REDUCTION_MM)}mm` }}>{m.name}</TableCell>
                        <TableCell sx={{ border: '1px solid black', textAlign: 'center', padding: '0.8mm 1mm', fontSize: `${Math.max(1.6, printFontSizeMm - SMALL_FONT_REDUCTION_MM)}mm` }}>{collectionData[m._id]?.money || ''}</TableCell>
                        <TableCell sx={{ border: '1px solid black', textAlign: 'center', padding: '0.8mm 1mm', fontSize: `${Math.max(1.6, printFontSizeMm - SMALL_FONT_REDUCTION_MM)}mm` }}>{collectionData[m._id]?.coconut || ''}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', minHeight: `${FOOTER_RESERVE_MM}mm`, flex: '0 0 auto' }}>
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant='body2' sx={{ fontSize: '12px' }}>_______________________________________________ <br /> එකතු කරන්නාගේ නම සහ අත්සන</Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant='body2' sx={{ mb: 0.5 }}><strong>මුළු මුදල:</strong> ______________________</Typography>
                  <Typography variant='body2'><strong>පොල් ගණන:</strong> ______________________</Typography>
                </Box>
              </Box>
            </Box>
          )
          })}
        </Box>

        <style jsx global>{`
          @media print {
            body * { visibility: hidden }
            .print-page, .print-page * { visibility: visible }
            /* position absolute/top to reduce browser-imposed blank area above the page box */
            .print-page { position: absolute; left: 0; top: 0 }
            .print-page table { border-collapse: collapse }
            .print-page th, .print-page td { padding: 2px 4px; border: 1px solid black }
            .print-page .name-cell { white-space: normal }
            @page { margin: 0; size: A4 portrait }
          }
        `}</style>
      </Container>
    </Layout>
  )
}
