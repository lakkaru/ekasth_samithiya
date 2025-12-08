import React, { useState } from "react"
import {
  Box,
  Button,
  TextField,
  Typography,
  MenuItem,
  Alert,
  Snackbar,
  Paper,
  Grid2,
  IconButton,
  Tooltip,
} from "@mui/material"
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material"
import Layout from "../../components/layout"
import StickyHeadTable from "../../components/StickyHeadTable"
import MemberDetailView from "../../components/member/MemberDetailView"
import DeleteConfirmDialog from "../../components/member/DeleteConfirmDialog"
import { navigate } from "gatsby"
import api from "../../utils/api"

//un authorized access preventing
import loadable from "@loadable/component"
const AuthComponent = loadable(() =>
  import("../../components/common/AuthComponent")
)

const baseUrl = process.env.GATSBY_API_BASE_URL

export default function SearchByArea() {
  //un authorized access preventing
  const [roles, setRoles] = useState([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const [alert, setAlert] = useState({ open: false, message: "", severity: "success" })
  const [loading, setLoading] = useState(false)
  const [selectedArea, setSelectedArea] = useState("")
  const [searchedArea, setSearchedArea] = useState("")
  const [members, setMembers] = useState([])
  const [searchPerformed, setSearchPerformed] = useState(false)
  
  // Dialog states
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)

  const handleAuthStateChange = ({ isAuthenticated, roles }) => {
    setIsAuthenticated(isAuthenticated)
    setRoles(roles)
    if (!isAuthenticated || !roles.includes("vice-secretary")) {
      navigate("/login/user-login")
    }
  }

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false })
  }

  const showAlert = (message, severity = "success") => {
    setAlert({ open: true, message, severity })
  }

  const areas = [
    "අලුත්වතු ගංගොඩ",
    "වලව් ගංගොඩ 1",
    "වලව් ගංගොඩ 2",
    "ගොඩවිටිගෙදර",
    "කහඹිලියාව",
    "කොලොන්ගස්යාය",
    "මහවතු ගංගොඩ 1",
    "මහවතු ගංගොඩ 2",
    "මැද ගංගොඩ",
    "වැව ඉහළ",
  ]

  // Table columns definition
  const columnsArray = [
    { id: "member_id", label: "සාමාජික අංකය", minWidth: 80 },
    { id: "name", label: "නම", minWidth: 150 },
    { id: "mobile", label: "ජංගම දුරකථනය", minWidth: 120 },
    { id: "whatsApp", label: "WhatsApp", minWidth: 120 },
    { id: "status", label: "තත්වය", minWidth: 100 },
    { id: "actions", label: "ක්‍රියා", minWidth: 150, align: "center" },
  ]

  const handleSearch = async () => {
    if (!selectedArea) {
      showAlert("කරුණාකර ප්‍රදේශයක් තෝරන්න", "error")
      return
    }

    setLoading(true)
    setSearchPerformed(true)
    setSearchedArea(selectedArea) // Set the searched area when search is performed

    try {
      const response = await api.get(`${baseUrl}/member/searchByArea?area=${encodeURIComponent(selectedArea)}`)
      
      if (response.data.success) {
        setMembers(response.data.members || [])
        if (response.data.members.length === 0) {
          showAlert(`"${selectedArea}" ප්‍රදේශයේ සාමාජිකයන් හමු නොවිය`, "info")
        } else {
          showAlert(`"${selectedArea}" ප්‍රදේශයේ සාමාජිකයන් ${response.data.members.length} දෙනෙකු හමුවිය`, "success")
        }
      }
    } catch (error) {
      console.error("Error searching members:", error)
      const errorMessage = error.response?.data?.error || "සාමාජිකයන් සෙවීමේදී දෝෂයක් සිදුවිය"
      showAlert(errorMessage, "error")
      setMembers([])
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setSelectedArea("")
    setSearchedArea("")
    setMembers([])
    setSearchPerformed(false)
  }

  // Action handlers
  const handleViewMember = async (memberId) => {
    try {
      const response = await api.get(`${baseUrl}/member/get/${memberId}`)
      if (response.data.success) {
        console.log('member data:', response.data.member)
        console.log('dependents:', response.data.member?.dependents)
        setSelectedMember(response.data.member)
        setDetailDialogOpen(true)
      } else {
        showAlert("සාමාජික විස්තර ලබා ගැනීමේදී දෝෂයක් සිදුවිය", "error")
      }
    } catch (error) {
      console.error("Error fetching member details:", error)
      showAlert("සාමාජික විස්තර ලබා ගැනීමේදී දෝෂයක් සිදුවිය", "error")
    }
  }

  const handleUpdateMember = (memberId) => {
    navigate(`/member/update-member?id=${memberId}`)
  }

  const handleDeleteMember = async (memberId, memberName) => {
    try {
      const response = await api.get(`${baseUrl}/member/get/${memberId}`)
      if (response.data.success) {
        setSelectedMember(response.data.member)
        setDeleteDialogOpen(true)
      } else {
        showAlert("සාමාජික විස්තර ලබා ගැනීමේදී දෝෂයක් සිදුවිය", "error")
      }
    } catch (error) {
      console.error("Error fetching member for delete:", error)
      showAlert("සාමාජික විස්තර ලබා ගැනීමේදී දෝෂයක් සිදුවිය", "error")
    }
  }

  const handleDeleteConfirm = async (memberId) => {
    try {
      const response = await api.delete(`${baseUrl}/member/delete/${memberId}`)
      if (response.data.success) {
        setMembers(members.filter(member => member.member_id !== memberId))
        setDeleteDialogOpen(false)
        setSelectedMember(null)
        showAlert("සාමාජිකයා සාර්ථකව මකා දමන ලදී", "success")
      } else {
        showAlert(response.data.message || "සාමාජිකයා මකා දැමීමේදී දෝෂයක් සිදුවිය", "error")
      }
    } catch (error) {
      console.error("Error deleting member:", error)
      showAlert("සාමාජිකයා මකා දැමීමේදී දෝෂයක් සිදුවිය", "error")
    }
  }

  const handleCloseDetailDialog = () => {
    setDetailDialogOpen(false)
    setSelectedMember(null)
  }

  const renderActionButtons = (memberId, memberName) => {
    // console.log("renderActionButtons called with:", memberId, memberName)
    return (
      <Box sx={{ display: "flex", gap: 0.5 }}>
        <Tooltip title="විස්තර බලන්න">
          <IconButton
            size="small"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              console.log("View button clicked for:", memberId)
              handleViewMember(memberId)
            }}
            color="primary"
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="සංස්කරණය කරන්න">
          <IconButton
            size="small"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleUpdateMember(memberId)
            }}
            color="success"
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="මකන්න">
          <IconButton
            size="small"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleDeleteMember(memberId, memberName)
            }}
            color="error"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    )
  }

  // Map member data for table display
  const tableData = members.map(member => ({
    member_id: member.member_id,
    name: member.name,
    mobile: member.mobile || "-",
    whatsApp: member.whatsApp || "-",
    address: member.address || "-",
    status: {
      "regular": "සාමාන්‍ය",
      "funeral-free": "අවමංගල්‍ය වැඩවලින් නිදහස්",
      "attendance-free": "පැමිණීමෙන් නිදහස්",
      "free": "නිදහස්",
      "suspended": "තාවකාලිකව අත්හිටුවන ලද",
      "canceled": "අවලංගු කරන ලද",
    }[member.status] || member.status,
    actions: renderActionButtons(member.member_id, member.name),
  }))

  return (
    <Layout>
      {/* Dialog components */}
      <MemberDetailView
        open={detailDialogOpen}
        onClose={handleCloseDetailDialog}
        member={selectedMember}
        onEdit={handleUpdateMember}
        onDelete={handleDeleteMember}
      />
      
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        member={selectedMember}
        onConfirm={handleDeleteConfirm}
      />
      
      <AuthComponent onAuthStateChange={handleAuthStateChange} />
      <section>
        <Snackbar
          open={alert.open}
          autoHideDuration={6000}
          onClose={handleCloseAlert}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
          sx={{ marginTop: "25vh" }}
        >
          <Alert onClose={handleCloseAlert} severity={alert.severity}>
            {alert.message}
          </Alert>
        </Snackbar>

        <Box
          sx={{
            maxWidth: "1200px",
            margin: "20px auto",
            padding: "20px",
          }}
        >
          <Typography
            variant="h5"
            sx={{ marginBottom: "20px", textAlign: "center" }}
          >
            ප්‍රදේශය අනුව සාමාජිකයන් සෙවීම
          </Typography>

          {/* Search Section */}
          <Paper elevation={3} sx={{ padding: "20px", marginBottom: "20px" }}>
            <Grid2 container spacing={3} alignItems="center">
              <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  select
                  label="ප්‍රදේශය තෝරන්න"
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                >
                  {areas.map((area) => (
                    <MenuItem key={area} value={area}>
                      {area}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid2>
              
              <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
                <Box sx={{ display: "flex", gap: "10px" }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSearch}
                    disabled={loading}
                    sx={{ textTransform: "none" }}
                  >
                    {loading ? "සොයමින්..." : "සොයන්න"}
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={handleClear}
                    disabled={loading}
                    sx={{ textTransform: "none" }}
                  >
                    මකන්න
                  </Button>
                </Box>
              </Grid2>
            </Grid2>
          </Paper>

          {/* Results Section */}
          {searchPerformed && (
            <Paper elevation={3} sx={{ padding: "20px" }}>
              <Typography variant="h6" sx={{ marginBottom: "15px" }}>
                සෙවුම් ප්‍රතිඵල
                {searchedArea && ` - ${searchedArea}`}
                {members.length > 0 && ` (${members.length} දෙනා)`}
              </Typography>
              
              {members.length > 0 ? (
                <StickyHeadTable
                  columnsArray={columnsArray}
                  dataArray={tableData}
                  headingAlignment="left"
                  dataAlignment="left"
                  totalRow={false}
                  hidePagination={false}
                />
              ) : (
                <Box
                  sx={{
                    textAlign: "center",
                    padding: "40px",
                    color: "text.secondary",
                  }}
                >
                  <Typography variant="body1">
                    {searchedArea 
                      ? `"${searchedArea}" ප්‍රදේශයේ සාමාජිකයන් හමු නොවිය`
                      : "සෙවුම් ප්‍රතිඵල මෙහි පෙන්වනු ඇත"
                    }
                  </Typography>
                </Box>
              )}
            </Paper>
          )}
        </Box>
      </section>
    </Layout>
  )
}
