import React, { useState, useEffect } from "react"
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Grid,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Pagination
} from "@mui/material"
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Add as AddIcon,
  Visibility as ViewIcon
} from "@mui/icons-material"

import Layout from "../../components/layout"
import { navigate } from "gatsby"
import api from "../../utils/api"
import dayjs from "dayjs"
import loadable from "@loadable/component"

const AuthComponent = loadable(() =>
  import("../../components/common/AuthComponent")
)

const baseUrl = process.env.GATSBY_API_BASE_URL

export default function CommonWorksIndex() {
  // Authentication
  const [roles, setRoles] = useState([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Data
  const [commonWorks, setCommonWorks] = useState([])
  const [stats, setStats] = useState(null)

  // UI states
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  
  // Pagination and filtering
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filterWorkType, setFilterWorkType] = useState("all")
  const [filterYear, setFilterYear] = useState(new Date().getFullYear())

  // Delete confirmation dialog
  const [deleteDialog, setDeleteDialog] = useState({ open: false, workId: null, workTitle: "" })

  const workTypeOptions = [
    { value: "all", label: "සියලුම වර්ග" },
    { value: "maintenance", label: "නඩත්තු කටයුතු" },
    { value: "construction", label: "ඉදිකිරීම් කටයුතු" },
    { value: "cleaning", label: "පිරිසිදු කිරීම" },
    { value: "landscaping", label: "භූමි අලංකරණය" },
    { value: "repair", label: "අලුත්වැඩියා කටයුතු" },
    { value: "other", label: "වෙනත්" }
  ]

  const handleAuthStateChange = ({ isAuthenticated, roles }) => {
    setIsAuthenticated(isAuthenticated)
    setRoles(roles)
    if (!isAuthenticated || !(roles.includes("vice-secretary") || roles.includes("treasurer") || roles.includes("auditor"))) {
      navigate("/login/user-login")
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadCommonWorks()
      loadStats()
    }
  }, [isAuthenticated, page, filterWorkType, filterYear])

  const loadCommonWorks = async () => {
    setLoading(true)
    setError("")
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        workType: filterWorkType,
        startDate: `${filterYear}-01-01`,
        endDate: `${filterYear}-12-31`
      })
      
      const response = await api.get(`${baseUrl}/commonwork?${params}`)
      setCommonWorks(response.data.commonWorks)
      setTotalPages(response.data.totalPages)
    } catch (error) {
      setError("සාමූහික වැඩ ලැයිස්තුව ලබා ගැනීමේදී දෝෂයක් ඇති විය")
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const params = new URLSearchParams({
        year: filterYear.toString(),
        workType: filterWorkType
      })
      
      const response = await api.get(`${baseUrl}/commonwork/stats?${params}`)
      setStats(response.data.stats)
    } catch (error) {
      // Error loading stats
    }
  }

  const handleDelete = async () => {
    if (!deleteDialog.workId) return
    
    setLoading(true)
    try {
      await api.delete(`${baseUrl}/commonwork/${deleteDialog.workId}`)
      setSuccess("සාමූහික වැඩ සාර්ථකව ඉවත් කරන ලදී")
      setDeleteDialog({ open: false, workId: null, workTitle: "" })
      loadCommonWorks()
      loadStats()
    } catch (error) {
      setError("සාමූහික වැඩ ඉවත් කිරීමේදී දෝෂයක් ඇති විය")
    } finally {
      setLoading(false)
    }
  }

  const getWorkTypeLabel = (workType) => {
    const option = workTypeOptions.find(opt => opt.value === workType)
    return option ? option.label : workType
  }

  const getAttendanceColor = (rate) => {
    if (rate >= 80) return "success"
    if (rate >= 60) return "warning"
    return "error"
  }

  return (
    <Layout>
      <AuthComponent onAuthStateChange={handleAuthStateChange} />
      <section>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
          <Typography variant="h4" component="h1">
            සාමූහික වැඩ කටයුතු
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate("/commonworks/attendance")}
            disabled={!roles.includes("vice-secretary")}
          >
            නව වැඩ එකතු කරන්න
          </Button>
        </Box>

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

        {/* Statistics Card */}
        {stats && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {filterYear} වර්ෂයේ සාමූහික වැඩ සංඛ්‍යාලේඛන
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={3}>
                  <Typography variant="body2" color="text.secondary">මුළු වැඩ ගණන</Typography>
                  <Typography variant="h5">{stats.totalWorks}</Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography variant="body2" color="text.secondary">සාමාන්‍ය පැමිණීම්</Typography>
                  <Typography variant="h5" color="primary.main">
                    {stats.avgAttendanceRate ? (stats.avgAttendanceRate * 100).toFixed(1) : 0}%
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography variant="body2" color="text.secondary">මුළු අපේක්ෂිත පැමිණීම්</Typography>
                  <Typography variant="h5">{stats.totalExpectedAttendance}</Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography variant="body2" color="text.secondary">මුළු සත්‍ය පැමිණීම්</Typography>
                  <Typography variant="h5" color="success.main">{stats.totalActualAttendance}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>වර්ගය</InputLabel>
                  <Select
                    value={filterWorkType}
                    onChange={(e) => setFilterWorkType(e.target.value)}
                    label="වර්ගය"
                  >
                    {workTypeOptions.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="වර්ෂය"
                  value={filterYear}
                  onChange={(e) => setFilterYear(parseInt(e.target.value) || new Date().getFullYear())}
                  inputProps={{ min: 2020, max: 2030 }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setPage(1)
                    loadCommonWorks()
                    loadStats()
                  }}
                  fullWidth
                >
                  Filter අදාළ කරන්න
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Common Works Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>දිනය</TableCell>
                <TableCell>මාතෘකාව</TableCell>
                <TableCell>වර්ගය</TableCell>
                <TableCell>ස්ථානය</TableCell>
                <TableCell>පැමිණීම්</TableCell>
                <TableCell>ක්‍රියාවන්</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {commonWorks.map((work) => {
                const attendanceRate = work.totalExpectedMembers > 0 
                  ? (work.totalPresentMembers / work.totalExpectedMembers) * 100 
                  : 0
                
                return (
                  <TableRow key={work._id}>
                    <TableCell>
                      {dayjs(work.date).format('YYYY-MM-DD')}
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2">{work.title}</Typography>
                      {work.description && (
                        <Typography variant="caption" color="text.secondary">
                          {work.description.substring(0, 50)}...
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={getWorkTypeLabel(work.workType)} 
                        size="small" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{work.location || "-"}</TableCell>
                    <TableCell>
                      <Box>
                        <Chip 
                          label={`${attendanceRate.toFixed(1)}%`}
                          color={getAttendanceColor(attendanceRate)}
                          size="small"
                        />
                        <Typography variant="caption" display="block">
                          {work.totalPresentMembers}/{work.totalExpectedMembers}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/commonworks/attendance?date=${dayjs(work.date).format('YYYY-MM-DD')}`)}
                          disabled={!roles.includes("vice-secretary")}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteDialog({
                            open: true,
                            workId: work._id,
                            workTitle: work.title
                          })}
                          disabled={!roles.includes("vice-secretary")}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(e, newPage) => setPage(newPage)}
              color="primary"
            />
          </Box>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false, workId: null, workTitle: "" })}
        >
          <DialogTitle>සාමූහික වැඩ ඉවත් කිරීම</DialogTitle>
          <DialogContent>
            <Typography>
              "{deleteDialog.workTitle}" සාමූහික වැඩ කටයුත්ත ඉවත් කිරීමට අවශ්‍යද?
            </Typography>
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              මෙය ස්ථිරවම ඉවත් කරනු ලබන අතර එය ප්‍රතිවර්තනය කළ නොහැක.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setDeleteDialog({ open: false, workId: null, workTitle: "" })}
              disabled={loading}
            >
              අවලංගු කරන්න
            </Button>
            <Button 
              onClick={handleDelete} 
              color="error" 
              variant="contained"
              disabled={loading}
            >
              ඉවත් කරන්න
            </Button>
          </DialogActions>
        </Dialog>
      </section>
    </Layout>
  )
}
