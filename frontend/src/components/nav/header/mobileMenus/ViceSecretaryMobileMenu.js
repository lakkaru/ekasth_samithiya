import React from "react"
import { Box, Typography, Button, Divider } from "@mui/material"
import { Groups as GroupsIcon, MonetizationOn as MonetizationOnIcon, Person as PersonIcon } from "@mui/icons-material"

export default function ViceSecretaryMobileMenu({ isViceSecretary, onMenuItemClick }) {
  if (!isViceSecretary) return null

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" sx={{
        textAlign: "center",
        color: "#667eea",
        fontWeight: 'bold',
        mb: 2,
        py: 1,
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        borderRadius: 1
      }}>
        උප ලේකම්
      </Typography>

      {/* Attendance Section */}
      <Typography variant="body2" sx={{
        color: "#667eea",
        fontSize: "0.875rem",
        fontWeight: 'bold',
        mb: 1,
        ml: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 0.5
      }}>
        <GroupsIcon fontSize="small" />
        පැමිණීම
      </Typography>

      {/* Printing Category */}
      <Typography variant="caption" sx={{
        px: 2,
        py: 0.5,
        color: 'text.secondary',
        fontWeight: 'bold',
        fontSize: '0.65rem',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        display: 'block',
        backgroundColor: 'rgba(102, 126, 234, 0.08)',
        borderRadius: 1,
        mb: 0.5,
        ml: 2
      }}>
        මුද්‍රණය
      </Typography>
      <Button
        color="inherit"
        onClick={() => onMenuItemClick("/forms/MeetingSheet")}
        sx={{
          textTransform: "none",
          width: "100%",
          paddingLeft: "40px",
          mb: 0.5,
          justifyContent: 'flex-start',
          backgroundColor: 'rgba(102, 126, 234, 0.05)',
          '&:hover': { backgroundColor: 'rgba(102, 126, 234, 0.1)' },
          borderRadius: 1,
          py: 1,
          color: '#555'
        }}
      >
        📋 මහා සභාව ලේඛණය
      </Button>
      <Button
        color="inherit"
        onClick={() => onMenuItemClick("/forms/FuneralAttendanceSheet")}
        sx={{
          textTransform: "none",
          width: "100%",
          paddingLeft: "40px",
          mb: 0.5,
          justifyContent: 'flex-start',
          backgroundColor: 'rgba(102, 126, 234, 0.05)',
          '&:hover': { backgroundColor: 'rgba(102, 126, 234, 0.1)' },
          borderRadius: 1,
          py: 1,
          color: '#555'
        }}
      >
        📋 අවමංගල්‍ය පැමිණීම ලේඛණය
      </Button>
      <Button
        color="inherit"
        onClick={() => onMenuItemClick("/forms/CommonWorkAttendanceSheet")}
        sx={{
          textTransform: "none",
          width: "100%",
          paddingLeft: "40px",
          mb: 1,
          justifyContent: 'flex-start',
          backgroundColor: 'rgba(102, 126, 234, 0.05)',
          '&:hover': { backgroundColor: 'rgba(102, 126, 234, 0.1)' },
          borderRadius: 1,
          py: 1,
          color: '#555'
        }}
      >
        📋 පොදු වැඩ පැමිණීම ලේඛණය
      </Button>

      {/* Marking Category */}
      <Typography variant="caption" sx={{
        px: 2,
        py: 0.5,
        color: 'text.secondary',
        fontWeight: 'bold',
        fontSize: '0.65rem',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        display: 'block',
        backgroundColor: 'rgba(102, 126, 234, 0.08)',
        borderRadius: 1,
        mb: 0.5,
        ml: 2
      }}>
        සලකුණු කිරීම
      </Typography>
      <Button
        color="inherit"
        onClick={() => onMenuItemClick("/funeral/funeralAttendance")}
        sx={{
          textTransform: "none",
          width: "100%",
          paddingLeft: "40px",
          mb: 0.5,
          justifyContent: 'flex-start',
          backgroundColor: 'rgba(102, 126, 234, 0.05)',
          '&:hover': { backgroundColor: 'rgba(102, 126, 234, 0.1)' },
          borderRadius: 1,
          py: 1,
          color: '#555'
        }}
      >
        ✓ අවමංගල්‍ය උත්සවය
      </Button>
      <Button
        color="inherit"
        onClick={() => onMenuItemClick("/funeral/funeralWorkAttendance")}
        sx={{
          textTransform: "none",
          width: "100%",
          paddingLeft: "40px",
          mb: 0.5,
          justifyContent: 'flex-start',
          backgroundColor: 'rgba(102, 126, 234, 0.05)',
          '&:hover': { backgroundColor: 'rgba(102, 126, 234, 0.1)' },
          borderRadius: 1,
          py: 1,
          color: '#555'
        }}
      >
        ✓ සුසන භුමි කටයුතු
      </Button>
      <Button
        color="inherit"
        onClick={() => onMenuItemClick("/meeting/Attendance")}
        sx={{
          textTransform: "none",
          width: "100%",
          paddingLeft: "40px",
          mb: 0.5,
          justifyContent: 'flex-start',
          backgroundColor: 'rgba(102, 126, 234, 0.05)',
          '&:hover': { backgroundColor: 'rgba(102, 126, 234, 0.1)' },
          borderRadius: 1,
          py: 1,
          color: '#555'
        }}
      >
        ✓ මහා සභාව
      </Button>
      <Button
        color="inherit"
        onClick={() => onMenuItemClick("/commonworks/attendance")}
        sx={{
          textTransform: "none",
          width: "100%",
          paddingLeft: "40px",
          mb: 1,
          justifyContent: 'flex-start',
          backgroundColor: 'rgba(102, 126, 234, 0.05)',
          '&:hover': { backgroundColor: 'rgba(102, 126, 234, 0.1)' },
          borderRadius: 1,
          py: 1,
          color: '#555'
        }}
      >
        ✓ පොදු වැඩ
      </Button>

      {/* Monitoring Category */}
      <Typography variant="caption" sx={{
        px: 2,
        py: 0.5,
        color: 'text.secondary',
        fontWeight: 'bold',
        fontSize: '0.65rem',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        display: 'block',
        backgroundColor: 'rgba(102, 126, 234, 0.08)',
        borderRadius: 1,
        mb: 0.5,
        ml: 2
      }}>
        නිරීක්ෂණය
      </Typography>
      <Button
        color="inherit"
        onClick={() => onMenuItemClick("/reports/meetingAttendance")}
        sx={{
          textTransform: "none",
          width: "100%",
          paddingLeft: "40px",
          mb: 1.5,
          justifyContent: 'flex-start',
          backgroundColor: 'rgba(102, 126, 234, 0.05)',
          '&:hover': { backgroundColor: 'rgba(102, 126, 234, 0.1)' },
          borderRadius: 1,
          py: 1,
          color: '#555'
        }}
      >
        📊 මහා සභාව පැමිණීම
      </Button>

      {/* Funeral Section */}
      <Typography variant="body2" sx={{
        color: "#667eea",
        fontSize: "0.875rem",
        fontWeight: 'bold',
        mb: 1,
        ml: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 0.5
      }}>
        <MonetizationOnIcon fontSize="small" />
        අවමංගල්‍ය
      </Typography>
      <Button
        color="inherit"
        onClick={() => onMenuItemClick("/member/deathById")}
        sx={{
          textTransform: "none",
          width: "100%",
          paddingLeft: "40px",
          mb: 0.5,
          justifyContent: 'flex-start',
          backgroundColor: 'rgba(102, 126, 234, 0.05)',
          '&:hover': { backgroundColor: 'rgba(102, 126, 234, 0.1)' },
          borderRadius: 1,
          py: 1,
          color: '#555'
        }}
      >
        • ඇතුලත් කිරීම
      </Button>
      <Button
        color="inherit"
        onClick={() => onMenuItemClick("/funeral/assignment")}
        sx={{
          textTransform: "none",
          width: "100%",
          paddingLeft: "40px",
          mb: 0.5,
          justifyContent: 'flex-start',
          backgroundColor: 'rgba(102, 126, 234, 0.05)',
          '&:hover': { backgroundColor: 'rgba(102, 126, 234, 0.1)' },
          borderRadius: 1,
          py: 1,
          color: '#555'
        }}
      >
        • අවමංගල්‍ය පැවරීම
      </Button>

      {/* Member Information Section */}
      <Typography variant="body2" sx={{
        color: "#667eea",
        fontSize: "0.875rem",
        fontWeight: 'bold',
        mb: 1,
        ml: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 0.5
      }}>
        <PersonIcon fontSize="small" />
        සාමාජික තොරතුරු
      </Typography>
      <Button
        color="inherit"
        onClick={() => onMenuItemClick("/member/fullDetails")}
        sx={{
          textTransform: "none",
          width: "100%",
          paddingLeft: "40px",
          mb: 0.5,
          justifyContent: 'flex-start',
          backgroundColor: 'rgba(102, 126, 234, 0.05)',
          '&:hover': { backgroundColor: 'rgba(102, 126, 234, 0.1)' },
          borderRadius: 1,
          py: 1,
          color: '#555'
        }}
      >
        • සාමාජික තොරතුරු
      </Button>
      <Button
        color="inherit"
        onClick={() => onMenuItemClick("/member/due-list")}
        sx={{
          textTransform: "none",
          width: "100%",
          paddingLeft: "40px",
          mb: 1.5,
          justifyContent: 'flex-start',
          backgroundColor: 'rgba(102, 126, 234, 0.05)',
          '&:hover': { backgroundColor: 'rgba(102, 126, 234, 0.1)' },
          borderRadius: 1,
          py: 1,
          color: '#555'
        }}
      >
        • සාමාජික හිඟ ලැයිස්තුව
      </Button>

      {/* Membership Section */}
      <Typography variant="body2" sx={{
        color: "#667eea",
        fontSize: "0.875rem",
        fontWeight: 'bold',
        mb: 1,
        ml: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 0.5
      }}>
        <GroupsIcon fontSize="small" />
        සාමාජිකත්වය
      </Typography>
      <Button
        color="inherit"
        onClick={() => onMenuItemClick("/member/add-member")}
        sx={{
          textTransform: "none",
          width: "100%",
          paddingLeft: "40px",
          mb: 0.5,
          justifyContent: 'flex-start',
          backgroundColor: 'rgba(102, 126, 234, 0.05)',
          '&:hover': { backgroundColor: 'rgba(102, 126, 234, 0.1)' },
          borderRadius: 1,
          py: 1,
          color: '#555'
        }}
      >
        • සාමාජිකයෙකු ඇතුලත් කිරීම
      </Button>
      <Button
        color="inherit"
        onClick={() => onMenuItemClick("/member/update-member")}
        sx={{
          textTransform: "none",
          width: "100%",
          paddingLeft: "40px",
          mb: 0.5,
          justifyContent: 'flex-start',
          backgroundColor: 'rgba(102, 126, 234, 0.05)',
          '&:hover': { backgroundColor: 'rgba(102, 126, 234, 0.1)' },
          borderRadius: 1,
          py: 1,
          color: '#555'
        }}
      >
        • සාමාජික තොරතුරු යාවත්කාලීන කිරීම
      </Button>
      <Button
        color="inherit"
        onClick={() => onMenuItemClick("/member/search-by-area")}
        sx={{
          textTransform: "none",
          width: "100%",
          paddingLeft: "40px",
          mb: 0.5,
          justifyContent: 'flex-start',
          backgroundColor: 'rgba(102, 126, 234, 0.05)',
          '&:hover': { backgroundColor: 'rgba(102, 126, 234, 0.1)' },
          borderRadius: 1,
          py: 1,
          color: '#555'
        }}
      >
        • ප්‍රදේශය අනුව සෙවීම
      </Button>
      <Button
        color="inherit"
        onClick={() => onMenuItemClick("/member/search-by-id")}
        sx={{
          textTransform: "none",
          width: "100%",
          paddingLeft: "40px",
          mb: 0.5,
          justifyContent: 'flex-start',
          backgroundColor: 'rgba(156, 39, 176, 0.05)',
          '&:hover': { backgroundColor: 'rgba(156, 39, 176, 0.1)' },
          borderRadius: 1,
          py: 1,
          color: '#555'
        }}
      >
        • සාමාජික අංකය අනුව සෙවීම
      </Button>
      <Button
        color="inherit"
        onClick={() => onMenuItemClick("/member/search-by-name")}
        sx={{
          textTransform: "none",
          width: "100%",
          paddingLeft: "40px",
          mb: 2,
          justifyContent: 'flex-start',
          backgroundColor: 'rgba(102, 126, 234, 0.05)',
          '&:hover': { backgroundColor: 'rgba(102, 126, 234, 0.1)' },
          borderRadius: 1,
          py: 1,
          color: '#555'
        }}
      >
        • නම අනුව සෙවීම
      </Button>

      <Divider sx={{ my: 2, backgroundColor: 'rgba(102, 126, 234, 0.2)' }} />
    </Box>
  )
}
