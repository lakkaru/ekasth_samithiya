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
import {
  Print as PrintIcon,
} from "@mui/icons-material"
import Layout from "../../components/layout"
import AuthComponent from "../../components/common/AuthComponent"
import api from "../../utils/api"

const baseUrl = process.env.GATSBY_API_BASE_URL
// A4 sizing constants (mm)
const A4_WIDTH_MM = 210
// use standard A4 height in mm
const A4_HEIGHT_MM = 330
const LEFT_MARGIN_MM = 25
const TOP_BOTTOM_PADDING_MM = 6
// reserve for header area (reduce slightly to allow more table space)
const HEADER_RESERVE_MM = 14
// reserve for footer (reduce slightly)
const FOOTER_RESERVE_MM = 0
// small extra buffer to account for scrollbar thickness and rounding in different browsers
const FOOTER_BUFFER_MM = 0
const SCROLLBAR_BUFFER_MM = 0
const TABLE_HEAD_MM = 6
// small buffer to account for table borders/rounding across rows
const ROW_BORDER_BUFFER_MM = 2
// page margin from @page { margin: 1cm } — top and bottom are each 10mm
const PAGE_MARGIN_MM = 0
// additional safety buffer observed necessary to avoid last-row clipping in some browsers/printers
const EXTRA_PRINT_BUFFER_MM = 20

export default function CollectionList() {
  const [members, setMembers] = useState([])
  const [selectedArea, setSelectedArea] = useState("")
  const [areas, setAreas] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [isViceSecretary, setIsViceSecretary] = useState(false)

  useEffect(() => {
    fetchAreas()
  }, [])

  const handleAuthStateChange = (authData) => {
    if (authData && authData.roles && authData.roles.includes("vice-secretary")) {
      setIsViceSecretary(true)
    } else {
      setIsViceSecretary(false)
    }
  }

  const fetchAreas = async () => {
    try {
      const response = await api.get(`${baseUrl}/member/areas`)
      if (response.data.success) {
        setAreas(response.data.areas)
      }
    } catch (error) {
      console.error("Error fetching areas:", error)
      setError("ප්‍රදේශ තොරතුරු ලබා ගැනීමේදී දෝෂයක් සිදුවිය")
    }
  }

  const fetchMembersForCollection = async () => {
    if (!selectedArea) {
      setError("කරුණාකර ප්‍රදේශය තෝරන්න")
      return
    }

    setLoading(true)
    setError("")

    try {
  // Get members for collection using the specialized endpoint (include admins/area officers)
  const response = await api.get(`${baseUrl}/member/forCollection?area=${selectedArea}&includeAdmins=true&includeFree=true`)
      
      if (response.data.success) {
        setMembers(response.data.members)
      } else {
        setError("සාමාජිකයින් ලබා ගැනීමේදී දෝෂයක් සිදුවිය")
      }
    } catch (error) {
      console.error("Error fetching members:", error)
      setError("සාමාජිකයින් ලබා ගැනීමේදී දෝෂයක් සිදුවිය")
    } finally {
      setLoading(false)
    }
  }

  // auto-fetch members when an area is selected
  useEffect(() => {
    if (!selectedArea) {
      setMembers([])
      return
    }

    // fetch members for the newly selected area
    fetchMembersForCollection()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedArea])

  const handlePrint = () => {
    window.print()
  }

  const generatePrintContent = () => {
  // compute dynamic sizes so all members fit on a single A4 page
  // account for the @page margins (top+bottom) and add buffers so rows aren't hidden
  const safeTableHeight = Math.max(0, A4_HEIGHT_MM - (2 * PAGE_MARGIN_MM) - TOP_BOTTOM_PADDING_MM - HEADER_RESERVE_MM - FOOTER_RESERVE_MM - FOOTER_BUFFER_MM - SCROLLBAR_BUFFER_MM - ROW_BORDER_BUFFER_MM)
  // subtract an extra safety buffer to account for rendering differences and hidden header/footer
  const usableForRows = Math.max(0, safeTableHeight - TABLE_HEAD_MM - EXTRA_PRINT_BUFFER_MM)
    const count = Math.max(1, members.length)
  // compute row height to fit exactly count rows (in mm)
  let rowHeightMm = usableForRows / count
  // relax clamps so rows can shrink further to avoid any vertical scrolling
  rowHeightMm = Math.max(1.9, Math.min(12, rowHeightMm))
  // derive font size from row height (allow smaller min font)
  let printFontSizeMm = Math.max(0.95, Math.min(4.5, rowHeightMm * 0.55))

    return (
      <Box className="print-content" sx={{ display: 'none', '@media print': { display: 'block' } }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            විල්බාගෙදර එක්සත් අවමංගල්‍යාධාර සමිතිය
          </Typography>
          <Typography variant="h5" sx={{ mb: 2 }}>
            අතිරේක ද්‍රව්‍ය එකතු කරන්නන් ගේ ලැයිස්තුව - {new Date().getFullYear()}
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ textAlign: 'left', mb: 3 }}>
            {/* <Typography variant="h6" sx={{ mb: 1 }}>
              <strong>සාමාජික අංකය: </strong> .............................
            </Typography>
            <Typography variant="h6" sx={{ mb: 1 }}>
              <strong>මියගිය අයගේ නම: </strong> ...............................................................................
            </Typography> */}
            <Typography variant="h6" sx={{ mb: 1 }}>
              <strong>ප්‍රදේශය: </strong> {selectedArea}
            </Typography>
            {/* <Typography variant="h6">
              <strong>දිනය: </strong> ........................../............../.........................
            </Typography> */}
          </Box>
        </Box>

  <TableContainer sx={{ maxHeight: `${safeTableHeight}mm`, boxSizing: 'border-box', overflow: 'hidden', mb: 1 }}>
          <Table size="small" sx={{ border: '1px solid black', fontSize: `${printFontSizeMm}mm`, tableLayout: 'fixed', borderCollapse: 'collapse' }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ border: '1px solid black', textAlign: 'center', fontWeight: 'bold', width: '6%' }}>අංකය</TableCell>
                    <TableCell sx={{ border: '1px solid black', textAlign: 'center', fontWeight: 'bold', width: '14%' }}>සා. අංකය</TableCell>
                    <TableCell sx={{ border: '1px solid black', textAlign: 'center', fontWeight: 'bold', width: '52%' }}>නම</TableCell>
                    <TableCell sx={{ border: '1px solid black', textAlign: 'center', fontWeight: 'bold', width: '18%' }}>දිනය</TableCell>
                    <TableCell sx={{ border: '1px solid black', textAlign: 'center', fontWeight: 'bold', width: '10%' }}>සා. අංකය</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
              {members.map((member, index) => {
                // gray area admin, officers, and free members; do not gray area helpers
                const muted = member.isAreaAdmin || member.isOfficer || (member.status === 'free')
                // show actual name and append role/status suffix: admin, free, or officer
                let displayName = `${member.name || ''}`
                if (member.isAreaAdmin) displayName += ' - කාරක සභික'
                else if (member.status === 'free') displayName += ' - නිදහස්'
                else if (member.isOfficer) displayName += ' - නිලධාරී'
                return (
                  <TableRow key={member._id} sx={{ color: muted ? 'text.secondary' : 'inherit', opacity: muted ? 0.65 : 1, height: `${rowHeightMm}mm` }}>
                    <TableCell sx={{ border: '1px solid black', textAlign: 'center', padding: '0.6mm 1mm', fontSize: `${printFontSizeMm}mm` }}>{index + 1}</TableCell>
                    <TableCell sx={{ border: '1px solid black', textAlign: 'center', padding: '0.6mm 1mm', fontSize: `${printFontSizeMm}mm` }}>{member.member_id}</TableCell>
                    <TableCell sx={{ border: '1px solid black', textAlign: 'left', pl: 1, padding: '0.6mm 1mm', fontSize: `${printFontSizeMm}mm` }}>{displayName}</TableCell>
                    <TableCell sx={{ border: '1px solid black', height: `${rowHeightMm}mm`, minWidth: '120px' }}></TableCell>
                    <TableCell sx={{ border: '1px solid black', height: `${rowHeightMm}mm` }}></TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Box sx={{ textAlign: 'left' }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              <strong>මුළු මුදල:</strong> .................................
            </Typography>
            <Typography variant="body1">
              <strong>මුළු පොල්:</strong> .............................
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="body2">
              ............................................................................. <br />
              එකතු කරන්නාගේ නම
            </Typography>
          </Box>
        </Box> */}
      </Box>
    )
  }

  if (!isViceSecretary) {
    return (
      <Layout>
        <AuthComponent onAuthStateChange={handleAuthStateChange} />
        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Alert severity="error">
            මෙම පිටුවට ප්‍රවේශය උප ලේකම්වරුන්ට පමණක් සීමා වේ
          </Alert>
        </Container>
      </Layout>
    )
  }

  return (
    <Layout>
      <AuthComponent onAuthStateChange={handleAuthStateChange} />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Screen Content */}
        <Box className="screen-content" sx={{ '@media print': { display: 'none' } }}>
          <Typography variant="h4" sx={{ mb: 3, textAlign: 'center', fontWeight: 'bold', color: '#1976d2' }}>
            අතිරේක ද්‍රව්‍ය එකතු කිරීමේ ලැයිස්තුව
          </Typography>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <FormControl fullWidth>
                  <InputLabel>ප්‍රදේශය තෝරන්න</InputLabel>
                  <Select
                    value={selectedArea}
                    label="ප්‍රදේශය තෝරන්න"
                    onChange={(e) => setSelectedArea(e.target.value)}
                  >
                    {areas.map((area) => (
                      <MenuItem key={area} value={area}>
                        {area}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <Button
                  variant="contained"
                  onClick={fetchMembersForCollection}
                  disabled={!selectedArea || loading}
                  sx={{ mr: 2, height: '56px' }}
                  fullWidth
                >
                  {loading ? <CircularProgress size={24} /> : 'ලැයිස්තුව ජනනය කරන්න'}
                </Button>
              </Grid>

              {members.length > 0 && (
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<PrintIcon />}
                    onClick={handlePrint}
                    fullWidth
                  >
                    මුද්‍රණය කරන්න
                  </Button>
                </Grid>
              )}
            </Grid>
          </Paper>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {members.length > 0 && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                ප්‍රදර්ශන ලැයිස්තුව ({members.length} සාමාජිකයින්)
              </Typography>
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell sx={{ fontWeight: 'bold', width: '6%' }}>අංකය</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', width: '14%' }}>සාමාජික අංකය</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', width: '70%' }}>නම</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {members.map((member, index) => {
                      const muted = member.isAreaAdmin || member.isOfficer || (member.status === 'free')
                      let displayName = `${member.name || ''}`
                      if (member.isAreaAdmin) displayName += ' - කාරක සභික'
                      else if (member.status === 'free') displayName += ' - නිදහස්'
                      else if (member.isOfficer) displayName += ' - නිලධාරී'

                      return (
                        <TableRow key={member._id} sx={{ color: muted ? 'text.secondary' : 'inherit', opacity: muted ? 0.65 : 1 }}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{member.member_id}</TableCell>
                          <TableCell>{displayName}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {/* removed "and X more" message — show full list on screen now */}
            </Paper>
          )}
        </Box>

        {/* Print Content */}
        {generatePrintContent()}

        {/* Print Styles */}
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-content, .print-content * {
              visibility: visible;
            }
            .print-content {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                overflow: hidden;
              }
            .print-content table {
                // force table to fit available height and avoid internal scrolling
                height: 100%;
                box-sizing: border-box;
            }
            @page {
              margin: 1cm;
              size: A4;
            }
          }
        `}</style>
      </Container>
    </Layout>
  )
}
