import React, { useState } from "react"
import { navigate } from "gatsby"
import {
  Button,
  Menu,
  MenuItem,
  Divider,
  Avatar,
  Badge,
} from "@mui/material"
import {
  Payment as PaymentIcon,
  MonetizationOn as MonetizationOnIcon,
  AccountBalance as AccountBalanceIcon,
  Logout as LogoutIcon,
  Home as HomeIcon,
  Edit as EditIcon,
} from "@mui/icons-material"

const UserAccountMenu = ({ memberName, hasLoan, handleLogout }) => {
  const [memberAnchorEl, setMemberAnchorEl] = useState(null)

  const handleMemberMenuOpen = event => setMemberAnchorEl(event.currentTarget)
  const handleMemberMenuClose = () => setMemberAnchorEl(null)

  return (
    <>
      <Button
        color="inherit"
        onClick={handleMemberMenuOpen}
        sx={{
          textTransform: "none",
          backgroundColor: "rgba(255,255,255,0.1)",
          "&:hover": {
            backgroundColor: "rgba(255,255,255,0.2)",
          },
          borderRadius: 3,
          px: 2,
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <Avatar
          sx={{
            width: 24,
            height: 24,
            bgcolor: "white",
            color: "#667eea",
            fontSize: "0.75rem",
            mr: 1,
          }}
        >
          {memberName.charAt(0).toUpperCase()}
        </Avatar>
        මගේ ගිණුම
      </Button>
      <Menu
        anchorEl={memberAnchorEl}
        open={Boolean(memberAnchorEl)}
        onClose={handleMemberMenuClose}
        anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
        PaperProps={{
          sx: {
            mt: 1,
            borderRadius: 2,
            boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
            minWidth: 220,
            "& .MuiMenuItem-root": {
              py: 1.5,
              px: 2,
              borderRadius: 1,
              mx: 1,
              my: 0.5,
              "&:hover": {
                backgroundColor: "rgba(102, 126, 234, 0.1)",
              },
            },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            navigate("/member/home")
            handleMemberMenuClose()
          }}
        >
          <HomeIcon sx={{ mr: 1, fontSize: 20 }} />
          මුල් පිටුව
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate("/member/profile-edit")
            handleMemberMenuClose()
          }}
        >
          <EditIcon sx={{ mr: 1, fontSize: 20 }} />
          ගිණුම සංස්කරණය
        </MenuItem>
        <Divider sx={{ my: 1 }} />
        {/* Member financial services moved here */}
        <MenuItem
          onClick={() => {
            navigate("/member/payments")
            handleMemberMenuClose()
          }}
        >
          <PaymentIcon sx={{ mr: 1, fontSize: 20 }} />
          මුදල් ගෙවීම්
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate("/member/fines")
            handleMemberMenuClose()
          }}
        >
          <MonetizationOnIcon sx={{ mr: 1, fontSize: 20 }} />
          දඩ මුදල්
        </MenuItem>
        {/* Special memberships moved to Vice Secretary menu */}
        {hasLoan && (
          <MenuItem
            onClick={() => {
              navigate("/member/loan")
              handleMemberMenuClose()
            }}
            sx={{
              backgroundColor: "rgba(255,152,0,0.1)",
              "&:hover": {
                backgroundColor: "rgba(255,152,0,0.2)",
              },
            }}
          >
            <AccountBalanceIcon
              sx={{ mr: 1, fontSize: 20, color: "#ff9800" }}
            />
            ණය
            <Badge
              variant="dot"
              color="warning"
              sx={{
                ml: 1,
                "& .MuiBadge-badge": {
                  backgroundColor: "#ff9800",
                },
              }}
            />
          </MenuItem>
        )}
        <Divider sx={{ my: 1 }} />
        <MenuItem
          onClick={() => {
            handleLogout()
            handleMemberMenuClose()
          }}
          sx={{
            color: "#f44336",
            "&:hover": {
              backgroundColor: "rgba(244, 67, 54, 0.1)",
            },
          }}
        >
          <LogoutIcon sx={{ mr: 1, fontSize: 20 }} />
          ඉවත් වන්න
        </MenuItem>
      </Menu>
    </>
  )
}

export default UserAccountMenu
