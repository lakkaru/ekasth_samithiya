import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  Grid2,
  Chip,
  CircularProgress,
} from "@mui/material"
import {
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Home as HomeIcon,
  Cake as CakeIcon,
//   Family as FamilyIcon,
} from "@mui/icons-material"
import api from "../../utils/api"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"

// Configure dayjs plugins
dayjs.extend(utc)
dayjs.extend(timezone)

// Safe date parsing function
const safeDateParse = (dateString) => {
  if (!dateString) return null
  const date = dayjs(dateString)
  return date.isValid() ? date : null
}

const baseUrl = process.env.GATSBY_API_BASE_URL

export default function MemberDetailView({ open, onClose, memberId, member: memberProp, onEdit, onDelete }) {
  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      if (memberProp) {
        // If member data is passed directly, use it
        setMember(memberProp)
        setLoading(false)
      } else if (memberId) {
        // If only memberId is passed, fetch the data
        fetchMemberDetails()
      }
    }
  }, [open, memberId, memberProp])

  const fetchMemberDetails = async () => {
    setLoading(true)
    try {
      const response = await api.get(`${baseUrl}/member/get/${memberId}`)
      if (response.data.success) {
        setMember(response.data.member)
      }
    } catch (error) {
      console.error("Error fetching member details:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    const memberIdToUse = memberId || member?.member_id
    if (onEdit && memberIdToUse) {
      onEdit(memberIdToUse)
      onClose()
    }
  }

  const handleDelete = () => {
    const memberIdToUse = memberId || member?.member_id
    if (onDelete && memberIdToUse) {
      onDelete(memberIdToUse, member?.name)
      onClose()
    }
  }

  const statusTranslations = {
    "regular": "සාමාන්‍ය",
    "funeral-free": "අවමංගල්‍ය වැඩවලින් නිදහස්",
    "attendance-free": "පැමිණීමෙන් නිදහස්",
    "free": "නිදහස්",
    "suspended": "තාවකාලිකව අත්හිටුවන ලද",
    "canceled": "අවලංගු කරන ලද",
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "regular":
        return "success"
      case "suspended":
        return "warning"
      case "canceled":
        return "error"
      default:
        return "info"
    }
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2, maxHeight: "90vh" }
      }}
    >
      <DialogTitle sx={{ 
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", 
        color: "white",
        textAlign: "center"
      }}>
        <PersonIcon sx={{ mr: 1, verticalAlign: "middle" }} />
        සාමාජික විස්තර
      </DialogTitle>
      
      <DialogContent sx={{ p: 0 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : member ? (
          <Box sx={{ p: 3 }}>
            {/* Basic Info */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h5" sx={{ mb: 1, color: "#667eea", fontWeight: "bold" }}>
                {member.name}
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                සාමාජික අංකය: {member.member_id}
              </Typography>
              
              <Chip 
                label={statusTranslations[member.status] || member.status}
                color={getStatusColor(member.status)}
                sx={{ mb: 2 }}
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Contact Info */}
            <Grid2 container spacing={3}>
              <Grid2 size={12}>
                <Typography variant="h6" sx={{ mb: 2, color: "#667eea" }}>
                  <PhoneIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                  සම්බන්ධතා තොරතුරු
                </Typography>
              </Grid2>
              
              <Grid2 size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">ජංගම දුරකථනය</Typography>
                <Typography variant="body1">{member.mobile || "-"}</Typography>
              </Grid2>
              
              <Grid2 size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">WhatsApp</Typography>
                <Typography variant="body1">{member.whatsApp || "-"}</Typography>
              </Grid2>
              
              <Grid2 size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">නිවසේ දුරකථනය</Typography>
                <Typography variant="body1">{member.phone || "-"}</Typography>
              </Grid2>
              
              <Grid2 size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  <EmailIcon sx={{ mr: 0.5, verticalAlign: "middle", fontSize: "small" }} />
                  Email
                </Typography>
                <Typography variant="body1">{member.email || "-"}</Typography>
              </Grid2>
            </Grid2>

            <Divider sx={{ my: 3 }} />

            {/* Personal Info */}
            <Grid2 container spacing={3}>
              <Grid2 size={12}>
                <Typography variant="h6" sx={{ mb: 2, color: "#667eea" }}>
                  <PersonIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                  පුද්ගලික තොරතුරු
                </Typography>
              </Grid2>
              
              <Grid2 size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">ප්‍රදේශය</Typography>
                <Typography variant="body1">{member.area || "-"}</Typography>
              </Grid2>
              
              <Grid2 size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">ජාතික හැඳුනුම්පත්</Typography>
                <Typography variant="body1">{member.nic || "-"}</Typography>
              </Grid2>
              
              <Grid2 size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  <CakeIcon sx={{ mr: 0.5, verticalAlign: "middle", fontSize: "small" }} />
                  උපන් දිනය
                </Typography>
                <Typography variant="body1">
                  {member.birthday ? dayjs(member.birthday).format("YYYY-MM-DD") : "-"}
                </Typography>
              </Grid2>
              
              <Grid2 size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">සාමාජික වූ දිනය</Typography>
                <Typography variant="body1">
                  {member.joined_date ? dayjs(member.joined_date).format("YYYY-MM-DD") : "-"}
                </Typography>
              </Grid2>
              
              <Grid2 size={12}>
                <Typography variant="body2" color="text.secondary">
                  <HomeIcon sx={{ mr: 0.5, verticalAlign: "middle", fontSize: "small" }} />
                  ලිපිනය
                </Typography>
                <Typography variant="body1">{member.address || "-"}</Typography>
              </Grid2>
            </Grid2>

            {/* Dependents */}
            {member.dependents && member.dependents.length > 0 && (
              <>
                <Divider sx={{ my: 3 }} />
                <Typography variant="h6" sx={{ mb: 2, color: "#667eea" }}>
                  {/* <FamilyIcon sx={{ mr: 1, verticalAlign: "middle" }} /> */}
                  යැපෙන්නන් ({member.dependents.length} දෙනා)
                </Typography>
                
                {member.dependents.map((dependent, index) => (
                  <Box 
                    key={dependent._id} 
                    sx={{ 
                      mb: 2, 
                      p: 2, 
                      backgroundColor: "#f9f9f9", 
                      borderRadius: 1,
                      border: "1px solid #eee"
                    }}
                  >
                    <Grid2 container spacing={2}>
                      <Grid2 size={{ xs: 12, sm: 4 }}>
                        <Typography variant="body2" color="text.secondary">නම</Typography>
                        <Typography variant="body1" fontWeight="medium">{dependent.name}</Typography>
                      </Grid2>
                      <Grid2 size={{ xs: 12, sm: 4 }}>
                        <Typography variant="body2" color="text.secondary">සම්බන්ධතාවය</Typography>
                        <Typography variant="body1">{dependent.relationship}</Typography>
                      </Grid2>
                      <Grid2 size={{ xs: 12, sm: 4 }}>
                        <Typography variant="body2" color="text.secondary">උපන් දිනය</Typography>
                        <Typography variant="body1">
                          {dependent.birthday ? dayjs(dependent.birthday).format("YYYY-MM-DD") : "-"}
                        </Typography>
                      </Grid2>
                      {dependent.nic && (
                        <Grid2 size={{ xs: 12, sm: 4 }}>
                          <Typography variant="body2" color="text.secondary">ජාතික හැඳුනුම්පත්</Typography>
                          <Typography variant="body1">{dependent.nic}</Typography>
                        </Grid2>
                      )}
                      {dependent.dateOfDeath && (
                        <Grid2 size={{ xs: 12, sm: 4 }}>
                          <Typography variant="body2" color="text.secondary">මරණ දිනය</Typography>
                          <Typography variant="body1" color="error">
                            {dayjs(dependent.dateOfDeath).format("YYYY-MM-DD")}
                          </Typography>
                        </Grid2>
                      )}
                    </Grid2>
                  </Box>
                ))}
              </>
            )}
          </Box>
        ) : (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <Typography>සාමාජික තොරතුරු පූරණය කල නොහැක</Typography>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 2, backgroundColor: "#f5f5f5" }}>
        <Button 
          onClick={onClose} 
          color="secondary"
          sx={{ textTransform: "none" }}
        >
          වසන්න
        </Button>
        {member && onEdit && onDelete && (
          <>
            <Button 
              onClick={handleEdit}
              variant="contained"
              color="primary"
              sx={{ textTransform: "none" }}
            >
              සංස්කරණය කරන්න
            </Button>
            <Button 
              onClick={handleDelete}
              variant="contained"
              color="error"
              sx={{ textTransform: "none" }}
            >
              මකන්න
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  )
}
