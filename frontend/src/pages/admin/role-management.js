import React, { useState, useEffect } from "react"
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  Chip,
  Alert,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material"
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  AdminPanelSettings as AdminIcon,
  LocationOn as LocationIcon,
} from "@mui/icons-material"
import Layout from "../../components/layout"
import AuthComponent from "../../components/common/AuthComponent"
import api from "../../utils/api"

const RoleManagement = () => {
  const [members, setMembers] = useState([])
  const [currentOfficers, setCurrentOfficers] = useState([])
  const [areaOfficers, setAreaOfficers] = useState([])
  const [openDialog, setOpenDialog] = useState(false)
  const [openAreaDialog, setOpenAreaDialog] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)
  const [selectedRoles, setSelectedRoles] = useState([])
  const [selectedArea, setSelectedArea] = useState("")
  const [selectedAreaRole, setSelectedAreaRole] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const baseUrl = process.env.GATSBY_API_BASE_URL

  const officerRoles = [
    { value: "chairman", label: "Chairman", color: "#1976d2" },
    { value: "secretary", label: "Secretary", color: "#388e3c" },
    { value: "treasurer", label: "Treasurer", color: "#f57c00" },
    { value: "viceChairman", label: "Vice Chairman", color: "#7b1fa2" },
    { value: "viceSecretary", label: "Vice Secretary", color: "#5d4037" },
    { value: "loanTreasurer", label: "Loan Treasurer", color: "#c2185b" },
    { value: "auditor", label: "Auditor", color: "#00796b" },
    { value: "speakerHandler", label: "Speaker Handler", color: "#455a64" },
  ]

  const areaRoles = [
    { value: "area-admin", label: "Area Admin", color: "#e65100" },
    { value: "area-helper-1", label: "Area Helper 1", color: "#bf360c" },
    { value: "area-helper-2", label: "Area Helper 2", color: "#3e2723" },
  ]

  const areas = [
    "අලුත්වතු ගංගොඩ",
    "වලව් ගංගොඩ",
    "ගොඩවිටිගෙදර",
    "කහඹිලියාව",
    "කොලොන්ගස්යාය",
    "මහවතු ගංගොඩ",
    "මැද ගංගොඩ",
    "වැව ඉහළ",
  ]

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch all suitable members
      const membersResponse = await api.get(`${baseUrl}/admin-management/suitable-officers`)
      setMembers(membersResponse.data)
      
      // Fetch admin structure
      const adminResponse = await api.get(`${baseUrl}/admin-management/admin-structure`)
      
      // Set main officers from admin collection
      if (adminResponse.data.mainOfficers) {
        setCurrentOfficers(adminResponse.data.mainOfficers)
      }
      
      // Set area officers from admin structure
      if (adminResponse.data.areaOfficers) {
        setAreaOfficers(adminResponse.data.areaOfficers)
      }
      
    } catch (error) {
      console.error("Error fetching data:", error)
      setError("Failed to fetch officer data")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (member = null) => {
    setSelectedMember(member)
    setSelectedRoles(member ? member.roles || [] : [])
    setOpenDialog(true)
    setError("")
    setSuccess("")
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setSelectedMember(null)
    setSelectedRoles([])
  }

  const handleOpenAreaDialog = (area = "", role = "", currentOfficer = null) => {
    setOpenAreaDialog(true)
    setSelectedMember(currentOfficer)
    setSelectedArea(area)
    setSelectedAreaRole(role)
    setError("")
    setSuccess("")
  }

  const handleCloseAreaDialog = () => {
    setOpenAreaDialog(false)
    setSelectedMember(null)
    setSelectedArea("")
    setSelectedAreaRole("")
  }

  const handleAssignRoles = async () => {
    if (!selectedMember || selectedRoles.length === 0) {
      setError("Please select a member and at least one role")
      return
    }

    try {
      setLoading(true)
      
      // Send roles as is (backend will handle filtering)
      await api.put(`${baseUrl}/admin-management/assign-role`, {
        member_id: selectedMember.member_id,
        roles: ["member", ...selectedRoles], // Always include member as base role
        name: selectedMember.name
      })

      setSuccess(`Successfully assigned roles to ${selectedMember.name}`)
      handleCloseDialog()
      fetchData() // Refresh data
      
    } catch (error) {
      console.error("Error assigning roles:", error)
      setError("Failed to assign roles: " + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
    }
  }

  const handleAssignAreaRole = async () => {
    if (!selectedMember || !selectedArea || !selectedAreaRole) {
      setError("Please select a member, area, and role")
      return
    }

    try {
      setLoading(true)
      
      await api.put(`${baseUrl}/admin-management/assign-area-role`, {
        member_id: selectedMember.member_id,
        name: selectedMember.name,
        area: selectedArea,
        role: selectedAreaRole
      })

      setSuccess(`Successfully assigned ${selectedMember.name} as ${selectedAreaRole} for ${selectedArea}`)
      handleCloseAreaDialog()
      fetchData() // Refresh data
      
    } catch (error) {
      console.error("Error assigning area role:", error)
      setError("Failed to assign area role: " + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveRole = async (member, roleToRemove) => {
    try {
      setLoading(true)
      
      // Remove the specific role but keep others
      const newRoles = (member.roles || []).filter(role => role !== roleToRemove)
      
      await api.put(`${baseUrl}/admin-management/assign-role`, {
        member_id: member.member_id,
        roles: ["member", ...newRoles], // Always include member as base role
        name: member.name
      })

      setSuccess(`Successfully removed ${roleToRemove} role from ${member.name}`)
      fetchData() // Refresh data
      
    } catch (error) {
      console.error("Error removing role:", error)
      setError("Failed to remove role: " + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveAreaRole = async (areaOfficer) => {
    try {
      setLoading(true)
      
      await api.delete(`${baseUrl}/admin-management/remove-area-role`, {
        data: {
          area: areaOfficer.area,
          role: areaOfficer.role
        }
      })

      setSuccess(`Successfully removed ${areaOfficer.role} from ${areaOfficer.area}`)
      fetchData() // Refresh data
      
    } catch (error) {
      console.error("Error removing area role:", error)
      setError("Failed to remove area role: " + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
    }
  }

  const getRoleColor = (role) => {
    const roleConfig = officerRoles.find(r => r.value === role) || areaRoles.find(r => r.value === role)
    return roleConfig ? roleConfig.color : "#666"
  }

  const getRoleLabel = (role) => {
    const roleConfig = officerRoles.find(r => r.value === role) || areaRoles.find(r => r.value === role)
    return roleConfig ? roleConfig.label : role
  }

  const getOfficersByRole = (role) => {
    return currentOfficers.filter(officer => 
      officer.roles && officer.roles.includes(role)
    )
  }

  return (
    <Layout>
      <AuthComponent allowedRoles={["super-admin"]}>
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <AdminIcon color="primary" />
              Officer Role Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Assign and manage officer roles for society members
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

          {/* Actions moved to top */}
          <Box sx={{ mb: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              size="large"
            >
              Assign Officer Role
            </Button>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<LocationIcon />}
              onClick={() => handleOpenAreaDialog()}
              size="large"
            >
              Assign Area Role
            </Button>
          </Box>

        {/* Current Officers Overview */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {officerRoles.map((role) => {
            const officers = getOfficersByRole(role.value)
            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={role.value}>
                <Card 
                  sx={{ 
                    height: '100%',
                    borderLeft: `4px solid ${role.color}`,
                    '&:hover': {
                      boxShadow: 3,
                      transform: 'translateY(-2px)',
                      transition: 'all 0.2s ease-in-out'
                    }
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" color={role.color} gutterBottom>
                      {role.label}
                    </Typography>
                    {officers.length > 0 ? (
                      officers.map((officer) => (
                        <Box key={officer.member_id} sx={{ mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {officer.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {officer.member_id} • {officer.area}
                          </Typography>
                          {/* Show contact information if available */}
                          {(officer.mobile || officer.phone || officer.whatsApp) && (
                            <Box sx={{ mt: 0.5 }}>
                              {officer.mobile && (
                                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                                  📱 {officer.mobile}
                                </Typography>
                              )}
                              {officer.phone && (
                                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                                  📞 {officer.phone}
                                </Typography>
                              )}
                              {officer.whatsApp && (
                                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                                  💬 {officer.whatsApp}
                                </Typography>
                              )}
                            </Box>
                          )}
                          <Box sx={{ mt: 0.5 }}>
                            <IconButton 
                              size="small" 
                              onClick={() => handleOpenDialog(officer)}
                              color="primary"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              onClick={() => handleRemoveRole(officer, role.value)}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        No one assigned
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
        </Grid>

        {/* Area Officers Grid */}
        {areas.map((area) => {
          const areaOfficersForArea = areaOfficers.filter(officer => officer.area === area)
          
          return (
            <Box key={area} sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationIcon color="primary" />
                {area} - Area Officers
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {areaRoles.map((role) => {
                  const officer = areaOfficersForArea.find(o => o.role === role.value)
                  return (
                    <Grid item xs={12} sm={4} key={role.value}>
                      <Card 
                        sx={{ 
                          height: '100%',
                          borderLeft: `4px solid ${role.color}`,
                          '&:hover': {
                            boxShadow: 3,
                            transform: 'translateY(-2px)',
                            transition: 'all 0.2s ease-in-out'
                          }
                        }}
                      >
                        <CardContent>
                          <Typography variant="h6" color={role.color} gutterBottom>
                            {role.label}
                          </Typography>
                          {officer ? (
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                {officer.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                ID: {officer.memberId}
                              </Typography>
                              {/* Show phone numbers if available */}
                              {(officer.mobile || officer.phone || officer.whatsApp) && (
                                <Box sx={{ mt: 0.5 }}>
                                  {officer.mobile && (
                                    <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                                      📱 {officer.mobile}
                                    </Typography>
                                  )}
                                  {officer.phone && (
                                    <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                                      📞 {officer.phone}
                                    </Typography>
                                  )}
                                  {officer.whatsApp && (
                                    <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                                      💬 {officer.whatsApp}
                                    </Typography>
                                  )}
                                </Box>
                              )}
                              <Box sx={{ mt: 0.5 }}>
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleOpenAreaDialog(area, role.value, officer)}
                                  color="primary"
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleRemoveAreaRole(officer)}
                                  color="error"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                              No one assigned
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  )
                })}
              </Grid>
            </Box>
          )
        })}

        {/* Role Assignment Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {selectedMember ? `Edit Roles for ${selectedMember.name}` : "Assign Officer Roles"}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              {!selectedMember && (
                <Autocomplete
                  options={members}
                  getOptionLabel={(option) => `${option.name} (${option.member_id}) - ${option.area}`}
                  value={selectedMember}
                  onChange={(event, newValue) => setSelectedMember(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Member"
                      variant="outlined"
                      fullWidth
                      sx={{ mb: 3 }}
                    />
                  )}
                />
              )}

              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Officer Roles</InputLabel>
                <Select
                  multiple
                  value={selectedRoles}
                  onChange={(e) => setSelectedRoles(e.target.value)}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip 
                          key={value} 
                          label={getRoleLabel(value)} 
                          size="small"
                          sx={{ 
                            backgroundColor: getRoleColor(value),
                            color: 'white'
                          }}
                        />
                      ))}
                    </Box>
                  )}
                >
                  {officerRoles.map((role) => (
                    <MenuItem key={role.value} value={role.value}>
                      {role.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {selectedMember && (
                <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Member Details:
                  </Typography>
                  <Typography variant="body2">
                    <strong>Name:</strong> {selectedMember.name}
                  </Typography>
                  <Typography variant="body2">
                    <strong>ID:</strong> {selectedMember.member_id}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Area:</strong> {selectedMember.area}
                  </Typography>
                  {selectedMember.mobile && (
                    <Typography variant="body2">
                      <strong>Mobile:</strong> {selectedMember.mobile}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              onClick={handleAssignRoles}
              variant="contained"
              disabled={!selectedMember || selectedRoles.length === 0 || loading}
            >
              {loading ? "Assigning..." : "Assign Roles"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Area Role Assignment Dialog */}
        <Dialog open={openAreaDialog} onClose={handleCloseAreaDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {selectedMember ? `Edit Area Role for ${selectedMember.name}` : "Assign Area Role"}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Select Area</InputLabel>
                <Select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  label="Select Area"
                >
                  {areas.map((area) => (
                    <MenuItem key={area} value={area}>
                      {area}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Select Role</InputLabel>
                <Select
                  value={selectedAreaRole}
                  onChange={(e) => setSelectedAreaRole(e.target.value)}
                  label="Select Role"
                >
                  {areaRoles.map((role) => (
                    <MenuItem key={role.value} value={role.value}>
                      {role.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Autocomplete
                options={members.filter(m => selectedArea ? m.area === selectedArea : true)}
                getOptionLabel={(option) => `${option.name} (${option.member_id})`}
                value={selectedMember}
                onChange={(event, newValue) => setSelectedMember(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Member"
                    variant="outlined"
                    fullWidth
                  />
                )}
              />

              {selectedMember && (
                <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Assignment Details:
                  </Typography>
                  <Typography variant="body2">
                    <strong>Member:</strong> {selectedMember.name} (ID: {selectedMember.member_id})
                  </Typography>
                  <Typography variant="body2">
                    <strong>Area:</strong> {selectedArea}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Role:</strong> {areaRoles.find(r => r.value === selectedAreaRole)?.label}
                  </Typography>
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAreaDialog}>Cancel</Button>
            <Button
              onClick={handleAssignAreaRole}
              variant="contained"
              disabled={!selectedMember || !selectedArea || !selectedAreaRole || loading}
            >
              {loading ? "Assigning..." : "Assign Area Role"}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </AuthComponent>
    </Layout>
  )
}

export default RoleManagement
