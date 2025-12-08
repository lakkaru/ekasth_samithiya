import React, { useEffect, useState } from "react"
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Snackbar,
  MenuItem,
  Grid2,
  CircularProgress,
} from "@mui/material"
import DependentForm from "../../components/member/DependentForm"
import Layout from "../../components/layout"
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import { DemoContainer } from "@mui/x-date-pickers/internals/demo"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"

import { navigate } from "gatsby"
import api from "../../utils/api"

//un authorized access preventing
import loadable from "@loadable/component"
const AuthComponent = loadable(() =>
  import("../../components/common/AuthComponent")
)

// Initialize dayjs plugins
dayjs.extend(utc)
dayjs.extend(timezone)

const baseUrl = process.env.GATSBY_API_BASE_URL

// Safe date parsing function
const safeDateParse = (dateValue) => {
  if (!dateValue || dateValue === "" || dateValue === null || dateValue === undefined) {
    return null
  }
  
  try {
    // Handle different date formats
    let parsed
    if (typeof dateValue === 'string') {
      parsed = dayjs(dateValue)
    } else if (dayjs.isDayjs(dateValue)) {
      return dateValue
    } else {
      parsed = dayjs(dateValue)
    }
    
    // Check if the parsed date is valid
    if (parsed && typeof parsed.isValid === 'function' && parsed.isValid()) {
      return parsed
    }
    return null
  } catch (error) {
    console.warn("Date parsing error:", error, "for value:", dateValue)
    return null
  }
}

export default function UpdateMember() {
  //un authorized access preventing
  const [roles, setRoles] = useState([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const [alert, setAlert] = useState({ open: false, message: "", severity: "success" })
  const [loading, setLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [memberFound, setMemberFound] = useState(false)

  // Search state
  const [searchMemberId, setSearchMemberId] = useState("")

  // Form state
  const [memberData, setMemberData] = useState({
    member_id: "",
    name: "",
    area: "",
    phone: "",
    mobile: "",
    whatsApp: "",
    address: "",
    email: "",
    nic: "",
    birthday: null,
    gender: "",
    siblingsCount: 0,
    status: "regular",
  })

  // Dependents state
  const [dependents, setDependents] = useState([
    { name: "", relationship: "", birthday: null, nic: "", dateOfDeath: null }
  ])

  // Calculate siblings count from dependents
  const getSiblingsCount = () => {
    return dependents.filter(dep => 
      dep.relationship === "සහෝදරයා" || dep.relationship === "සහෝදරිය"
    ).length
  }

  // Handle URL parameters for direct member loading
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      const memberId = urlParams.get('id')
      if (memberId) {
        setSearchMemberId(memberId)
        // Auto-load member data if ID is provided in URL
        loadMemberData(memberId)
      }
    }
  }, [])

  const loadMemberData = async (memberId) => {
    if (!memberId) return
    
    setSearchLoading(true)
    try {
      const response = await api.get(`${baseUrl}/member/get/${memberId}`)
      
      if (response.data.success) {
        const member = response.data.member
        setMemberData({
          member_id: member.member_id,
          name: member.name,
          area: member.area,
          phone: member.phone || "",
          mobile: member.mobile || "",
          whatsApp: member.whatsApp || "",
          address: member.address,
          nic: member.nic,
          birthday: safeDateParse(member.birthday),
          gender: member.gender,
          status: member.status,
        })
        
        // Process dependents with safe date parsing
        if (member.dependents && member.dependents.length > 0) {
          setDependents(member.dependents.map(dep => ({
            _id: dep._id,
            name: dep.name || "",
            relationship: dep.relationship || "",
            birthday: safeDateParse(dep.birthday),
            nic: dep.nic || "",
            dateOfDeath: safeDateParse(dep.dateOfDeath),
          })))
        } else {
          setDependents([{ name: "", relationship: "", birthday: null, nic: "", dateOfDeath: null }])
        }
        
        setMemberFound(true)
        showAlert("සාමාජික විස්තර සාර්ථකව ලබා ගන්නා ලදී", "success")
      } else {
        showAlert("සාමාජිකයා සොයා ගත නොහැක", "error")
      }
    } catch (error) {
      console.error("Error loading member:", error)
      showAlert("සාමාජික විස්තර ලබා ගැනීමේදී දෝෂයක් සිදුවිය", "error")
    } finally {
      setSearchLoading(false)
    }
  }

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

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setMemberData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleDateChange = (date) => {
    setMemberData(prev => ({
      ...prev,
      birthday: date
    }))
  }

  const resetForm = () => {
    setMemberData({
      member_id: "",
      name: "",
      area: "",
      phone: "",
      mobile: "",
      whatsApp: "",
      address: "",
      email: "",
      nic: "",
      birthday: null,
      siblingsCount: 0,
      status: "regular",
    })
    setDependents([{ name: "", relationship: "", birthday: null, nic: "", dateOfDeath: null }])
    setMemberFound(false)
    setSearchMemberId("")
  }

  // Search for member
  const handleSearchMember = async () => {
    if (!searchMemberId) {
      showAlert("සාමාජික අංකය ඇතුලත් කරන්න", "error")
      return
    }

    setSearchLoading(true)
    try {
      const response = await api.get(`${baseUrl}/member/get/${searchMemberId}`)
      
      if (response.data.success && response.data.member) {
        const member = response.data.member
        
        setMemberData({
          member_id: member.member_id,
          name: member.name,
          area: member.area || "",
          phone: member.phone || "",
          mobile: member.mobile || "",
          whatsApp: member.whatsApp || "",
          address: member.address || "",
          email: member.email || "",
          nic: member.nic || "",
          birthday: safeDateParse(member.birthday),
          siblingsCount: member.siblingsCount || 0,
          status: member.status || "regular",
        })

        // Set dependents if they exist
        if (member.dependents && member.dependents.length > 0) {
          setDependents(member.dependents.map(dep => ({
            _id: dep._id,
            name: dep.name || "",
            relationship: dep.relationship || "",
            birthday: safeDateParse(dep.birthday),
            nic: dep.nic || "",
            dateOfDeath: safeDateParse(dep.dateOfDeath),
          })))
        } else {
          setDependents([{ name: "", relationship: "", birthday: null, nic: "", dateOfDeath: null }])
        }

        setMemberFound(true)
        showAlert("සාමාජිකයා සාර්ථකව සොයා ගන්නා ලදී", "success")
      } else {
        showAlert("එම අංකයේ සාමාජිකයෙකු සොයා ගත නොහැකිය", "error")
        setMemberFound(false)
      }
    } catch (error) {
      console.error("Error searching member:", error)
      showAlert("සාමාජිකයා සෙවීමේදී දෝෂයක් සිදුවිය", "error")
      setMemberFound(false)
    } finally {
      setSearchLoading(false)
    }
  }

  const validateForm = () => {
    if (!memberData.member_id || !memberData.name) {
      showAlert("සාමාජික අංකය සහ නම අවශ්‍යයි", "error")
      return false
    }
    if (memberData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(memberData.email)) {
      showAlert("වලංගු Email ලිපිනයක් ඇතුලත් කරන්න", "error")
      return false
    }
    if (memberData.mobile && !/^[0-9]{10}$/.test(memberData.mobile)) {
      showAlert("වලංගු ජංගම දුරකථන අංකයක් ඇතුලත් කරන්න (10 digits)", "error")
      return false
    }
    if (memberData.nic && !/^([0-9]{9}[vVxX]|[0-9]{12})$/.test(memberData.nic)) {
      showAlert("වලංගු ජාතික හැඳුනුම්පත් අංකයක් ඇතුලත් කරන්න", "error")
      return false
    }
    // Validate dependents - only if they have data
    for (let i = 0; i < dependents.length; i++) {
      const d = dependents[i]
      if ((d.name || d.relationship || d.birthday) && (!d.name || !d.relationship || !d.birthday)) {
        showAlert(`යැපෙන්නා ${i + 1} සඳහා නම, සබඳතාවය සහ උපන් දිනය අවශ්‍යයි`, "error")
        return false
      }
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)

    try {
      // Filter out empty dependents
      const validDependents = dependents.filter(d => d.name && d.relationship && d.birthday)

      const submitData = {
        ...memberData,
        birthday: memberData.birthday ? memberData.birthday.format("YYYY-MM-DD") : null,
        siblingsCount: getSiblingsCount(), // Auto-calculated from dependents
        dependents: validDependents.map(d => ({
          ...d,
          birthday: d.birthday ? d.birthday.format("YYYY-MM-DD") : null,
          dateOfDeath: d.dateOfDeath ? d.dateOfDeath.format("YYYY-MM-DD") : null,
        }))
      }

      const response = await api.put(`${baseUrl}/member/update/${memberData.member_id}`, submitData)
      
      if (response.data.success) {
        showAlert(`සාමාජික ${memberData.name} සාර්ථකව යාවත්කාලීන කරන ලදී!`, "success")
      }
    } catch (error) {
      console.error("Error updating member:", error)
      const errorMessage = error.response?.data?.error || "සාමාජික යාවත්කාලීන කිරීමේදී දෝෂයක් සිදුවිය"
      showAlert(errorMessage, "error")
    } finally {
      setLoading(false)
    }
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

  const statusOptions = [
    { value: "regular", label: "සාමාන්‍ය" },
    { value: "funeral-free", label: "අවමංගල්‍ය වැඩවලින් නිදහස්" },
    { value: "attendance-free", label: "පැමිණීමෙන් නිදහස්" },
    { value: "free", label: "නිදහස්" },
    { value: "suspended", label: "තාවකාලිකව අත්හිටුවන ලද" },
    { value: "canceled", label: "අවලංගු කරන ලද" },
  ]

  return (
    <Layout>
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
            maxWidth: "800px",
            margin: "20px auto",
            padding: "20px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            background: "#fff",
          }}
        >
          <Typography
            variant="h5"
            sx={{ marginBottom: "20px", textAlign: "center" }}
          >
            සාමාජික තොරතුරු යාවත්කාලීන කිරීම
          </Typography>

          {/* Search Section */}
          <Box sx={{ mb: 3, p: 2, border: "1px solid #eee", borderRadius: 2, background: "#f9f9f9" }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              සාමාජිකයා සොයන්න
            </Typography>
            <Grid2 container spacing={2} alignItems="center">
              <Grid2 size={{ xs: 12, sm: 8 }}>
                <TextField
                  fullWidth
                  label="සාමාජික අංකය"
                  type="number"
                  value={searchMemberId}
                  onChange={(e) => setSearchMemberId(e.target.value)}
                  placeholder="සාමාජික අංකය ඇතුලත් කරන්න"
                />
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 4 }}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleSearchMember}
                  disabled={searchLoading}
                  sx={{ textTransform: "none", height: "56px" }}
                >
                  {searchLoading ? <CircularProgress size={24} color="inherit" /> : "සොයන්න"}
                </Button>
              </Grid2>
            </Grid2>
          </Box>

          {memberFound && (
            <Grid2 container spacing={3}>
              {/* Member fields */}
              <Grid2 size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="සාමාජික අංකය"
                  name="member_id"
                  type="number"
                  value={memberData.member_id}
                  onChange={handleInputChange}
                  required
                  disabled // Cannot update member ID
                />
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="නම"
                  name="name"
                  value={memberData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="සම්පූර්ණ නම ඇතුලත් කරන්න"
                />
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  select
                  label="බල ප්‍රදේශය"
                  name="area"
                  value={memberData.area}
                  onChange={handleInputChange}
                  placeholder="ගම/ප්‍රදේශය"
                >
                  {areas.map((area) => (
                    <MenuItem key={area} value={area}>
                      {area}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  select
                  label="තත්වය"
                  name="status"
                  value={memberData.status}
                  onChange={handleInputChange}
                >
                  {statusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="නිවසේ දුරකථන අංකය"
                  name="phone"
                  value={memberData.phone}
                  onChange={handleInputChange}
                  placeholder="නිවසේ දුරකථන අංකය"
                />
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="ජංගම දුරකථන අංකය"
                  name="mobile"
                  value={memberData.mobile}
                  onChange={handleInputChange}
                  placeholder="0712345678"
                />
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="WhatsApp අංකය"
                  name="whatsApp"
                  value={memberData.whatsApp}
                  onChange={handleInputChange}
                  placeholder="0712345678"
                />
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={memberData.email}
                  onChange={handleInputChange}
                  placeholder="example@email.com"
                />
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="ජාතික හැඳුනුම්පත් අංකය"
                  name="nic"
                  value={memberData.nic}
                  onChange={handleInputChange}
                  placeholder="123456789V හෝ 123456789012"
                />
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 6 }}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DemoContainer components={["DatePicker"]}>
                    <DatePicker
                      label="උපන් දිනය"
                      value={memberData.birthday}
                      onChange={handleDateChange}
                      format="YYYY-MM-DD"
                      slotProps={{
                        textField: {
                          fullWidth: true,
                        },
                      }}
                    />
                  </DemoContainer>
                </LocalizationProvider>
              </Grid2>
              <Grid2 size={12}>
                <TextField
                  fullWidth
                  label="ලිපිනය"
                  name="address"
                  value={memberData.address}
                  onChange={handleInputChange}
                  multiline
                  rows={3}
                  placeholder="සම්පූර්ණ ලිපිනය ඇතුලත් කරන්න"
                />
              </Grid2>

              {/* Dependents section */}
              <Grid2 size={12}>
                <Box sx={{ mt: 3, mb: 2, p: 2, border: "1px solid #eee", borderRadius: 2, background: "#f9f9f9" }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    යැපෙන්නන් {getSiblingsCount() > 0 && `(සහෝදර සහෝදරියන්: ${getSiblingsCount()})`}
                  </Typography>
                  {dependents.map((dep, idx) => (
                    <DependentForm
                      key={idx}
                      dependent={dep}
                      onChange={e => {
                        const { name, value } = e.target
                        setDependents(prev => prev.map((d, i) => {
                          if (i === idx) {
                            // Handle date fields specially
                            if (name === "birthday" || name === "dateOfDeath") {
                              return { ...d, [name]: value } // value is already a dayjs object or null
                            }
                            return { ...d, [name]: value }
                          }
                          return d
                        }))
                      }}
                      onRemove={() => setDependents(prev => prev.filter((_, i) => i !== idx))}
                      showRemove={dependents.length > 1}
                    />
                  ))}
                  <Button
                    variant="outlined"
                    onClick={() => setDependents(prev => ([...prev, { name: "", relationship: "", birthday: null, nic: "", dateOfDeath: null }]))}
                    sx={{ mt: 1 }}
                  >
                    තවත් අයෙකු එක් කරන්න
                  </Button>
                </Box>
              </Grid2>

              {/* Submit Buttons */}
              <Grid2 size={12} sx={{ textAlign: "center", paddingTop: "20px" }}>
                <Box sx={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSubmit}
                    disabled={loading}
                    sx={{ textTransform: "none", minWidth: "120px" }}
                  >
                    {loading ? "යාවත්කාලීන කරමින්..." : "යාවත්කාලීන කරන්න"}
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={resetForm}
                    disabled={loading}
                    sx={{ textTransform: "none", minWidth: "120px" }}
                  >
                    මුල සිටම ආරම්භ කරන්න
                  </Button>
                </Box>
              </Grid2>
            </Grid2>
          )}
        </Box>
      </section>
    </Layout>
  )
}
