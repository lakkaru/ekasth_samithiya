import React from "react"
import { Box, Typography, Button, Divider } from "@mui/material"
import {
  Person as PersonIcon,
  MonetizationOn as MonetizationOnIcon,
  AccountBalance as AccountBalanceIcon,
  Assessment as AssessmentIcon,
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
  Receipt as ReceiptIcon,
  TrendingDown as TrendingDownIcon,
  BarChart as BarChartIcon,
  Warning as WarningIcon,
} from "@mui/icons-material"

const AuditorMobileMenu = ({ isAuditor, onMenuItemClick }) => {
  if (!isAuditor) return null

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
        විගණක
      </Typography>

      {/* Member Info */}
      <Button
        color="inherit"
        onClick={() => onMenuItemClick("/member/fullDetails")}
        startIcon={<PersonIcon />}
        sx={{ 
          textTransform: "none", 
          width: "100%",
          mb: 1,
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

      {/* Loan Section */}
      <Typography variant="body2" sx={{ 
        color: "#667eea", 
        fontSize: "0.875rem", 
        fontWeight: 'bold',
        mb: 1,
        mt: 2,
        ml: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 0.5
      }}>
        <MonetizationOnIcon fontSize="small" />
        ණය
      </Typography>
      <Button
        color="inherit"
        onClick={() => onMenuItemClick("/loan/search")}
        startIcon={<SearchIcon />}
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
        ණය සෙවීම
      </Button>
      <Button
        color="inherit"
        onClick={() => onMenuItemClick("/loan/active-loans")}
        startIcon={<TrendingUpIcon />}
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
        සක්‍රීය ණය
      </Button>

      {/* Account Section */}
      <Typography variant="body2" sx={{ 
        color: "#667eea", 
        fontSize: "0.875rem", 
        fontWeight: 'bold',
        mb: 1,
        mt: 2,
        ml: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 0.5
      }}>
        <AccountBalanceIcon fontSize="small" />
        ගිණුම්
      </Typography>
      <Button
        color="inherit"
        onClick={() => onMenuItemClick("/account/receipts")}
        startIcon={<ReceiptIcon />}
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
        ලදුපත්
      </Button>
      <Button
        color="inherit"
        onClick={() => onMenuItemClick("/account/view-income")}
        startIcon={<TrendingUpIcon />}
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
        ආදායම් දර්ශනය
      </Button>
      <Button
        color="inherit"
        onClick={() => onMenuItemClick("/account/view-expenses")}
        startIcon={<TrendingDownIcon />}
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
        වියදම් දර්ශනය
      </Button>
      <Button
        color="inherit"
        onClick={() => onMenuItemClick("/account/monthly-report")}
        startIcon={<BarChartIcon />}
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
        මාසික වාර්තාව
      </Button>

      {/* Funeral Section */}
      <Typography variant="body2" sx={{ 
        color: "#667eea", 
        fontSize: "0.875rem", 
        fontWeight: 'bold',
        mb: 1,
        mt: 2,
        ml: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 0.5
      }}>
        <AssessmentIcon fontSize="small" />
        අවමංගල්‍ය
      </Typography>
      <Button
        color="inherit"
        onClick={() => onMenuItemClick("/funeral/extraDue")}
        startIcon={<WarningIcon />}
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
        ද්‍රව්‍ය ආධාර හිඟ
      </Button>

      <Divider sx={{ my: 2 }} />
    </Box>
  )
}

export default AuditorMobileMenu
