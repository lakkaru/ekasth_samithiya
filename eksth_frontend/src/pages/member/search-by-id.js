import React, { useState } from "react"
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Snackbar,
  Paper,
} from "@mui/material"
import Layout from "../../components/layout"
import MemberDetailView from "../../components/member/MemberDetailView"
import { navigate } from "gatsby"
import api from "../../utils/api"
import loadable from "@loadable/component"

const AuthComponent = loadable(() => import("../../components/common/AuthComponent"))

export default function SearchById() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [roles, setRoles] = useState([])

  const [memberId, setMemberId] = useState("")
  const [loading, setLoading] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [alert, setAlert] = useState({ open: false, message: "", severity: "info" })

  const handleAuthStateChange = ({ isAuthenticated, roles }) => {
    setIsAuthenticated(isAuthenticated)
    setRoles(roles)
    // Only vice-secretary may access this page
    if (!isAuthenticated || !roles.includes("vice-secretary")) {
      navigate("/login/user-login")
    }
  }

  const showAlert = (message, severity = "info") => setAlert({ open: true, message, severity })
  const closeAlert = () => setAlert({ ...alert, open: false })

  const handleSearch = async () => {
    const idTrim = (memberId || "").toString().trim()
    if (!idTrim) {
      showAlert("කරුණාකර සාමාජික අංකය ඇතුලත් කරන්න", "error")
      return
    }

    setLoading(true)
    try {
      // backend route: GET /member/get/:member_id (requires vice-secretary auth)
      const res = await api.get(`/member/get/${encodeURIComponent(idTrim)}`)
      if (res.data && res.data.success && res.data.member) {
        setSelectedMember(res.data.member)
        setDetailOpen(true)
        showAlert("සාමාජික දත්ත සාර්ථකව සොයාගෙන ඇත", "success")
      } else if (res.data && res.data.member) {
        // backwards compatible: some endpoints return member directly
        setSelectedMember(res.data.member)
        setDetailOpen(true)
        showAlert("සාමාජික දත්ත සාර්ථකව සොයාගෙන ඇත", "success")
      } else {
        showAlert("සාමාජිකයා හමු නොවීය", "info")
        setSelectedMember(null)
      }
    } catch (err) {
      console.error("Error fetching member by id:", err)
      const msg = err.response?.data?.error || "සාමාජික දත්ත ලබාගැනීමේදී දෝෂයක් සිදුවිය"
      showAlert(msg, "error")
      setSelectedMember(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <AuthComponent onAuthStateChange={handleAuthStateChange} />

      <MemberDetailView open={detailOpen} onClose={() => { setDetailOpen(false); setSelectedMember(null) }} member={selectedMember} />

      <Snackbar open={alert.open} autoHideDuration={6000} onClose={closeAlert} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert onClose={closeAlert} severity={alert.severity}>{alert.message}</Alert>
      </Snackbar>

      <Box sx={{ maxWidth: 1000, mx: "auto", mt: 6, p: 2 }}>
        <Typography variant="h5" sx={{ textAlign: "center", mb: 3 }}>
          සාමාජික අංකය අනුව සෙවීම
        </Typography>

        <Paper elevation={3} sx={{ p: 3 }}>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
            <TextField
              label="සාමාජික අංකය"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              onKeyPress={(e) => { if (e.key === "Enter") handleSearch() }}
              sx={{ minWidth: 220 }}
            />

            <Button variant="contained" color="primary" onClick={handleSearch} disabled={loading} sx={{ textTransform: "none" }}>
              {loading ? "සොයමින්..." : "සොයන්න"}
            </Button>

            {/* <Button variant="outlined" color="secondary" onClick={() => { setMemberId(""); setSelectedMember(null); setDetailOpen(false) }} sx={{ textTransform: "none" }}>
              පැහැදිලි කරන්න
            </Button> */}
          </Box>

          <Box sx={{ mt: 3 }}>
            {selectedMember ? (
              <Box>
                <Typography variant="subtitle1">සොයාගත් සාමාජිකයා:</Typography>
                <Box sx={{ mt: 1 }}>
                  <Typography><strong>සාමාජික අංකය:</strong> {selectedMember.member_id}</Typography>
                  <Typography><strong>නම:</strong> {selectedMember.name}</Typography>
                  <Typography><strong>ප්‍රදේශය:</strong> {selectedMember.area || '-'}</Typography>
                  <Typography><strong>දුරකථන:</strong> {selectedMember.mobile || selectedMember.phone || '-'}</Typography>
                  <Typography><strong>WhatsApp:</strong> {selectedMember.whatsApp || '-'}</Typography>
                  <Typography><strong>තත්වය:</strong> {selectedMember.status || '-'}</Typography>
                  <Typography><strong>පුද්ගලිකත්වය / බොඳපණ:</strong> {selectedMember.siblingsCount ?? '-'} දරුවන්</Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="subtitle2">පවුලේ යැපෙන්නන් / රැඳී සිටින අය:</Typography>
                    {Array.isArray(selectedMember.dependents) && selectedMember.dependents.length > 0 ? (
                      <Box component="ul" sx={{ pl: 3, mt: 0.5 }}>
                        {selectedMember.dependents.map((d, idx) => (
                          <li key={`dep-${idx}`}>
                            {d.name} {d.relationship ? `— ${d.relationship}` : ''} {d.dateOfDeath ? `(දිරිය: ${new Date(d.dateOfDeath).toLocaleDateString()})` : ''}
                          </li>
                        ))}
                      </Box>
                    ) : (
                      <Typography sx={{ color: 'text.secondary' }}>යැපෙන්නන් නොමැත</Typography>
                    )}
                  </Box>
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Button variant="contained" onClick={() => { setDetailOpen(true) }} sx={{ textTransform: "none" }}>වඩා විස්තර බලන්න</Button>
                </Box>
              </Box>
            ) : (
              <Typography sx={{ color: "text.secondary" }}>සාමාජික අංකය ඇතුලත් කර සොයන්න</Typography>
            )}
          </Box>
        </Paper>
      </Box>
    </Layout>
  )
}
