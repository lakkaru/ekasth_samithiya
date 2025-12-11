import React, { useEffect, useState } from "react"
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  // Button,
  // Menu,
  // MenuItem,
  IconButton,
  // Divider,
  // Chip,
  Avatar,
  // Badge,
  // Paper,
  // Accordion,
  // AccordionSummary,
  // AccordionDetails,
} from "@mui/material"
import {
  Menu as MenuIcon,
  // Person as PersonIcon,
  AccountBalance as AccountBalanceIcon,
  // Groups as GroupsIcon,
  // Payment as PaymentIcon,
  // MonetizationOn as MonetizationOnIcon,
  // Assessment as AssessmentIcon,
  // Settings as SettingsIcon,
  // Logout as LogoutIcon,
  // Home as HomeIcon,
  // Edit as EditIcon,
  // ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material"
import { navigate } from "gatsby"
import loadable from "@loadable/component"

import api from "../../utils/api"
import DesktopButtons from "./header/DesktopMenus"
import MobileMenuButtons from "./header/MobileMenus"
import WelcomeMessage from "./header/WelcomeMessage"

const AuthComponent = loadable(() => import("../common/AuthComponent"))

const baseUrl = process.env.GATSBY_API_BASE_URL

// ...existing imports...

const Header = ({ siteTitle }) => {
  // ...existing state...
  // State for 'මුදල්' (Money) parent menu
  // const [moneyAnchorEl, setMoneyAnchorEl] = React.useState(null);
  // const handleMoneyMenuOpen = (event) => {
  //   setMoneyAnchorEl(event.currentTarget);
  // };
  // const handleMoneyMenuClose = () => {
  //   setMoneyAnchorEl(null);
  // };
  const [roles, setRoles] = useState([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [memberName, setMemberName] = useState("")
  const [memberId, setMemberId] = useState()
  const [hasLoan, setHasLoan] = useState(false)
  // const [memberAnchorEl, setMemberAnchorEl] = useState(null)
  // const [membershipAnchorEl, setMemberShipAnchorEl] = useState(null)
  // const [membershipViceSecAnchorEl, setMembershipViceSecAnchorEl] =
  //   useState(null)
  // const [attendanceAnchorEl, setAttendanceAnchorEl] = useState(null)
  // const [loanSchemeAnchorEl, setLoanSchemeAnchorEl] = useState(null)
  // const [receiptAnchorEl, setReceiptAnchorEl] = useState(null)
  // const [expenseAnchorEl, setExpenseAnchorEl] = useState(null)
  // const [reportAnchorEl, setReportAnchorEl] = useState(null)
  // const [funeralAnchorEl, setFuneralAnchorEl] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // const isViceSecretary = roles.includes("vice-secretary")
  // const isLoanTreasurer = roles.includes("loan-treasurer")
  // const isTreasurer = roles.includes("treasurer")
  // const isChairman = roles.includes("chairman")
  // const hasLoanAccess = isLoanTreasurer || isTreasurer

  // const handleMemberMenuOpen = event => setMemberAnchorEl(event.currentTarget)
  // const handleMemberMenuClose = () => setMemberAnchorEl(null)
  // const handleMembershipMenuOpen = event =>
  //   setMemberShipAnchorEl(event.currentTarget)
  // const handleMembershipMenuClose = () => setMemberShipAnchorEl(null)
  // const handleMembershipViceSecMenuOpen = event =>
  //   setMembershipViceSecAnchorEl(event.currentTarget)
  // const handleMembershipViceSecMenuClose = () =>
  //   setMembershipViceSecAnchorEl(null)
  // const handleAttendanceMenuOpen = event =>
  //   setAttendanceAnchorEl(event.currentTarget)
  // const handleAttendanceMenuClose = () => setAttendanceAnchorEl(null)
  // const handleLoanSchemeMenuOpen = event =>
  //   setLoanSchemeAnchorEl(event.currentTarget)
  // const handleLoanSchemeMenuClose = () => setLoanSchemeAnchorEl(null)
  // const handleReceiptMenuOpen = event => setReceiptAnchorEl(event.currentTarget)
  // const handleReceiptMenuClose = () => setReceiptAnchorEl(null)
  // const handleExpenseMenuOpen = event => setExpenseAnchorEl(event.currentTarget)
  // const handleExpenseMenuClose = () => setExpenseAnchorEl(null)

  // const handleReportMenuOpen = event => setReportAnchorEl(event.currentTarget)
  // const handleReportMenuClose = () => setReportAnchorEl(null)

  // const handleFuneralMenuOpen = event => setFuneralAnchorEl(event.currentTarget)
  // const handleFuneralMenuClose = () => setFuneralAnchorEl(null)

  const handleAuthStateChange = ({
    isAuthenticated,
    roles,
    memberName,
    member_id,
  }) => {
    setIsAuthenticated(isAuthenticated)
    setRoles(roles)
    setMemberName(memberName)
    setMemberId(member_id)
  }

  const handleLogout = () => {
    // Clear all state and localStorage
    localStorage.removeItem("authToken")
    setRoles([])
    setIsAuthenticated(false)
    setMemberName("")
    setMemberId("")
    setHasLoan(false)
    
    // Dispatch logout event to clear cached data
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent('userLoggedOut'))
    }
    
    navigate("/login/user-login")
  }

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const handleMobileNavigate = path => {
    setMobileMenuOpen(false)
    navigate(path)
  }
  useEffect(() => {
    // Only check for loan if user is authenticated and not an admin
    if (isAuthenticated) {
      // Check if user is admin - admin users don't need loan checking
      const isAdmin = roles.some(role => 
        ['super-admin', 'chairman', 'secretary', 'treasurer', 'vice-secretary', 'auditor', 'loan-treasurer', 'vice-chairman', 'speaker-handler'].includes(role)
      )
      
      if (!isAdmin) {
        api
          .get(`${baseUrl}/member/hasLoan`)
          .then(response => {
            console.log(response?.data.loan)
            setHasLoan(response?.data.loan)
          })
          .catch(error => {
            console.error("Axios error: ", error)
            setHasLoan(false) // Set to false on error
          })
      } else {
        // Admin users don't have loans
        setHasLoan(false)
      }
    } else {
      // Reset loan status when not authenticated
      setHasLoan(false)
    }
  }, [isAuthenticated, roles])

  return (
    <Box
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 1100,
        width: "100%",
      }}
    >
      <header>
        <AuthComponent onAuthStateChange={handleAuthStateChange} />
        <Box
          sx={{
            flexGrow: 1,
            maxWidth: "1024px",
            margin: "0 auto",
            width: "100%",
          }}
        >
          <AppBar
            position="static"
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              boxShadow: "0 4px 20px rgba(102, 126, 234, 0.3)",
            }}
          >
            <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
              <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
                <Avatar
                  sx={{
                    bgcolor: "white",
                    color: "#667eea",
                    mr: 2,
                    width: { xs: 32, sm: 40 },
                    height: { xs: 32, sm: 40 },
                  }}
                >
                  <AccountBalanceIcon
                    sx={{
                      fontSize: { xs: "1.25rem", sm: "1.5rem" },
                    }}
                  />
                </Avatar>
                <Typography
                  variant="h6"
                  sx={{
                    flexGrow: 1,
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: { xs: "1rem", sm: "1.25rem" },
                    color: "white",
                    textShadow: "0 2px 4px rgba(0,0,0,0.2)",
                  }}
                  onClick={() => navigate("/")}
                >
                  {siteTitle}
                </Typography>
              </Box>

              {/* Mobile Menu Button */}
              <IconButton
                color="inherit"
                sx={{
                  display: { xs: "block", sm: "none" },
                  bgcolor: "rgba(255,255,255,0.1)",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
                }}
                onClick={handleMobileMenuToggle}
              >
                <MenuIcon />
              </IconButton>

              {/* Desktop Buttons */}
              <DesktopButtons 
                isAuthenticated={isAuthenticated}
                roles={roles}
                memberName={memberName}
                memberId={memberId}
                hasLoan={hasLoan}
                handleLogout={handleLogout} 
              />

              {/* Mobile Menu */}
              {mobileMenuOpen && (
                <MobileMenuButtons 
                  isAuthenticated={isAuthenticated}
                  roles={roles}
                  memberName={memberName}
                  memberId={memberId}
                  hasLoan={hasLoan}
                  handleLogout={handleLogout}
                  handleMobileNavigate={handleMobileNavigate}
                />
              )}
            </Toolbar>
          </AppBar>
        </Box>
        <WelcomeMessage
          memberName={memberName}
          memberId={memberId}
          isAuthenticated={isAuthenticated}
        />
      </header>
    </Box>
  )
}

export default Header
