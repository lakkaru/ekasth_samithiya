import React, { useState } from "react"
import { navigate } from "gatsby"
import { Button, Menu, MenuItem, Divider } from "@mui/material"

export default function LoanMenu({ hasLoanAccess, isLoanTreasurer, isTreasurer }) {
  const [loanSchemeAnchorEl, setLoanSchemeAnchorEl] = useState(null)

  const handleLoanSchemeMenuOpen = event =>
    setLoanSchemeAnchorEl(event.currentTarget)
  const handleLoanSchemeMenuClose = () => setLoanSchemeAnchorEl(null)

  if (!hasLoanAccess) return null

  return (
    <>
      {/* Show Member Details only for loan-treasurer, not for treasurer (treasurer has it in their own section) */}
      {isLoanTreasurer && !isTreasurer && (
        <Button
          color="inherit"
          onClick={() => navigate("/member/fullDetails")}
          sx={{
            textTransform: "none",
            backgroundColor: "rgba(255,255,255,0.1)",
            "&:hover": {
              backgroundColor: "rgba(255,255,255,0.2)",
            },
            borderRadius: 3,
            px: 2,
          }}
        >
          සාමාජික තොරතුරු
        </Button>
      )}
      <Button
        color="inherit"
        onClick={handleLoanSchemeMenuOpen}
        sx={{
          textTransform: "none",
          backgroundColor: "rgba(255,255,255,0.1)",
          "&:hover": {
            backgroundColor: "rgba(255,255,255,0.2)",
          },
          borderRadius: 3,
          px: 2,
        }}
      >
        ණය තොරතුරු
      </Button>
      <Menu
        anchorEl={loanSchemeAnchorEl}
        open={Boolean(loanSchemeAnchorEl)}
        onClose={handleLoanSchemeMenuClose}
        PaperProps={{
          sx: {
            mt: 1,
            borderRadius: 2,
            boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
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
        {/* Show New Loan only for loan-treasurer, not for treasurer */}
        {isLoanTreasurer && !isTreasurer && (
          <MenuItem
            onClick={() => {
              navigate("/loan/new-loan")
              handleLoanSchemeMenuClose()
            }}
          >
            නව ණයක්
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            navigate("/loan/search")
            handleLoanSchemeMenuClose()
          }}
        >
          ණය සෙවීම
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate("/loan/active-loans")
            handleLoanSchemeMenuClose()
          }}
        >
          ක්‍රියාකාරී ණය
        </MenuItem>
        {/* Show Payments Report only for loan-treasurer, not for treasurer */}
        {isLoanTreasurer && !isTreasurer && (
          <MenuItem
            onClick={() => {
              navigate("/loan/payments-report")
              handleLoanSchemeMenuClose()
            }}
          >
            ගෙවීම් වාර්තාව
          </MenuItem>
        )}
      </Menu>
      <Divider
        orientation="vertical"
        flexItem
        sx={{
          bgcolor: "rgba(255,255,255,0.3)",
          mx: 2,
          height: 32,
          alignSelf: "center",
        }}
      />
    </>
  )
}
