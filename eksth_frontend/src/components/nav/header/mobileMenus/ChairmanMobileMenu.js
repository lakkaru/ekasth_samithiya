import React from "react"
import { Box, Typography, Button, Divider } from "@mui/material"
import { Person as PersonIcon, AccountBalance as AccountBalanceIcon, Groups as GroupsIcon, Assessment as AssessmentIcon } from "@mui/icons-material"

export default function ChairmanMobileMenu({ isChairman, onMenuItemClick }) {
  if (!isChairman) return null

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" sx={{ 
        textAlign: "center", 
        color: "#e91e63", 
        fontWeight: 'bold',
        mb: 2,
        py: 1,
        backgroundColor: 'rgba(233, 30, 99, 0.1)',
        borderRadius: 1
      }}>
        සභාපති
      </Typography>
      <Button
        color="inherit"
        onClick={() => onMenuItemClick("/member/fullDetails")}
        startIcon={<PersonIcon />}
        sx={{ 
          textTransform: "none", 
          width: "100%",
          mb: 1,
          justifyContent: 'flex-start',
          backgroundColor: 'rgba(233, 30, 99, 0.15)',
          border: '1px solid rgba(233, 30, 99, 0.2)',
          '&:hover': { 
            backgroundColor: 'rgba(233, 30, 99, 0.25)',
            transform: 'translateX(2px)'
          },
          borderRadius: 2,
          py: 1.5,
          color: '#333',
          transition: 'all 0.2s ease'
        }}
      >
        සාමාජික තොරතුරු
      </Button>
      <Button
        color="inherit"
        onClick={() => onMenuItemClick("/loan/active-loans")}
        startIcon={<AccountBalanceIcon />}
        sx={{ 
          textTransform: "none", 
          width: "100%",
          mb: 1,
          justifyContent: 'flex-start',
          backgroundColor: 'rgba(233, 30, 99, 0.15)',
          border: '1px solid rgba(233, 30, 99, 0.2)',
          '&:hover': { 
            backgroundColor: 'rgba(233, 30, 99, 0.25)',
            transform: 'translateX(2px)'
          },
          borderRadius: 2,
          py: 1.5,
          color: '#333',
          transition: 'all 0.2s ease'
        }}
      >
        ක්‍රියාකාරී ණය
      </Button>
      <Button
        color="inherit"
        onClick={() => onMenuItemClick("/reports/meetingAttendance")}
        startIcon={<GroupsIcon />}
        sx={{ 
          textTransform: "none", 
          width: "100%",
          mb: 1,
          justifyContent: 'flex-start',
          backgroundColor: 'rgba(233, 30, 99, 0.15)',
          border: '1px solid rgba(233, 30, 99, 0.2)',
          '&:hover': { 
            backgroundColor: 'rgba(233, 30, 99, 0.25)',
            transform: 'translateX(2px)'
          },
          borderRadius: 2,
          py: 1.5,
          color: '#333',
          transition: 'all 0.2s ease'
        }}
      >
        මහා සභාව පැමිණීම
      </Button>
      <Button
        color="inherit"
        onClick={() => onMenuItemClick("/account/monthly-report")}
        startIcon={<AssessmentIcon />}
        sx={{ 
          textTransform: "none", 
          width: "100%",
          mb: 2,
          justifyContent: 'flex-start',
          backgroundColor: 'rgba(233, 30, 99, 0.15)',
          border: '1px solid rgba(233, 30, 99, 0.2)',
          '&:hover': { 
            backgroundColor: 'rgba(233, 30, 99, 0.25)',
            transform: 'translateX(2px)'
          },
          borderRadius: 2,
          py: 1.5,
          color: '#333',
          transition: 'all 0.2s ease'
        }}
      >
        මාසික ආදායම්/වියදම් වාර්තාව
      </Button>
      <Divider sx={{ my: 2, backgroundColor: 'rgba(233, 30, 99, 0.2)' }} />
    </Box>
  )
}
