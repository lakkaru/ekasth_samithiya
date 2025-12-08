import React from "react"
import { Box, Typography, Button, Divider } from "@mui/material"
import { MonetizationOn as MonetizationOnIcon, Person as PersonIcon } from "@mui/icons-material"

export default function LoanMobileMenu({ hasLoanAccess, isLoanTreasurer, isTreasurer, onMenuItemClick }) {
  if (!hasLoanAccess || isTreasurer) return null

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
        ණය භාණ්ඩාගාරික
      </Typography>
      <Button
        color="inherit"
        onClick={() => onMenuItemClick("/member/fullDetails")}
        startIcon={<PersonIcon />}
        sx={{ 
          textTransform: "none", 
          width: "100%",
          mb: 2,
          justifyContent: 'flex-start',
          backgroundColor: 'rgba(102, 126, 234, 0.15)',
          border: '1px solid rgba(102, 126, 234, 0.2)',
          '&:hover': { 
            backgroundColor: 'rgba(102, 126, 234, 0.25)',
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
      <Typography variant="body2" sx={{ 
        color: "#666", 
        fontSize: "0.875rem", 
        fontWeight: 'bold',
        mb: 1,
        ml: 2
      }}>
        ණය තොරතුරු
      </Typography>
      <Button
        color="inherit"
        onClick={() => onMenuItemClick("/loan/new-loan")}
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
        • නව ණයක්
      </Button>
      <Button
        color="inherit"
        onClick={() => onMenuItemClick("/loan/search")}
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
        • ණය සෙවීම
      </Button>
      <Button
        color="inherit"
        onClick={() => onMenuItemClick("/loan/active-loans")}
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
        • ක්‍රියාකාරී ණය
      </Button>
      <Button
        color="inherit"
        onClick={() => onMenuItemClick("/loan/payments-report")}
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
        • ගෙවීම් වාර්තාව
      </Button>
      <Divider sx={{ my: 2, backgroundColor: 'rgba(102, 126, 234, 0.2)' }} />
    </Box>
  )
}
