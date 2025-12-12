import React, { useState } from "react"
import { navigate } from "gatsby"
import {
  Button,
  Menu,
  MenuItem,
  Divider,
} from "@mui/material"
// Icons removed from startIcon props to simplify menu buttons

const AuditorMenu = ({ isAuditor }) => {
  const [accountAnchorEl, setAccountAnchorEl] = useState(null)
  const [loanAnchorEl, setLoanAnchorEl] = useState(null)
  const [funeralAnchorEl, setFuneralAnchorEl] = useState(null)

  const handleAccountMenuOpen = event => setAccountAnchorEl(event.currentTarget)
  const handleAccountMenuClose = () => setAccountAnchorEl(null)
  const handleLoanMenuOpen = event => setLoanAnchorEl(event.currentTarget)
  const handleLoanMenuClose = () => setLoanAnchorEl(null)
  const handleFuneralMenuOpen = event => setFuneralAnchorEl(event.currentTarget)
  const handleFuneralMenuClose = () => setFuneralAnchorEl(null)

  if (!isAuditor) return null

  return (
    <>
      <Button
        color="inherit"
        variant="outlined"
        onClick={() => navigate("/member/fullDetails")}
        sx={{
          textTransform: "none",
          borderColor: "rgba(255,255,255,0.3)",
          backgroundColor: "rgba(255,255,255,0.1)",
          "&:hover": {
            borderColor: "rgba(255,255,255,0.5)",
            backgroundColor: "rgba(255,255,255,0.2)",
          },
        }}
      >
        සාමාජික තොරතුරු
      </Button>

      <Button
        variant="outlined"
        color="inherit"
        onClick={handleLoanMenuOpen}
        sx={{
          textTransform: "none",
          borderColor: "rgba(255,255,255,0.3)",
          backgroundColor: "rgba(255,255,255,0.1)",
          "&:hover": {
            borderColor: "rgba(255,255,255,0.5)",
            backgroundColor: "rgba(255,255,255,0.2)",
          },
        }}
      >
        ණය
      </Button>
      <Menu
        anchorEl={loanAnchorEl}
        open={Boolean(loanAnchorEl)}
        onClose={handleLoanMenuClose}
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
        <MenuItem
          onClick={() => {
            navigate("/loan/search")
            handleLoanMenuClose()
          }}
        >
          ණය සෙවීම
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate("/loan/active-loans")
            handleLoanMenuClose()
          }}
        >
          සක්‍රීය ණය
        </MenuItem>
      </Menu>

      <Button
        color="inherit"
        variant="outlined"
        onClick={handleAccountMenuOpen}
        sx={{
          textTransform: "none",
          borderColor: "rgba(255,255,255,0.3)",
          backgroundColor: "rgba(255,255,255,0.1)",
          "&:hover": {
            borderColor: "rgba(255,255,255,0.5)",
            backgroundColor: "rgba(255,255,255,0.2)",
          },
        }}
      >
        ගිණුම්
      </Button>
      <Menu
        anchorEl={accountAnchorEl}
        open={Boolean(accountAnchorEl)}
        onClose={handleAccountMenuClose}
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
        <MenuItem
          onClick={() => {
            navigate("/account/receipts")
            handleAccountMenuClose()
          }}
        >
          ලදුපත්
        </MenuItem>
        <Divider sx={{ my: 1 }} />
        <MenuItem
          onClick={() => {
            navigate("/account/view-income")
            handleAccountMenuClose()
          }}
        >
          ආදායම් දර්ශනය
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate("/account/view-expenses")
            handleAccountMenuClose()
          }}
        >
          වියදම් දර්ශනය
        </MenuItem>
        <Divider sx={{ my: 1 }} />
        <MenuItem
          onClick={() => {
            navigate("/account/monthly-report")
            handleAccountMenuClose()
          }}
        >
          මාසික වාර්තාව
        </MenuItem>
      </Menu>

      <Button
        variant="outlined"
        color="inherit"
        onClick={handleFuneralMenuOpen}
        sx={{
          textTransform: "none",
          borderColor: "rgba(255,255,255,0.3)",
          backgroundColor: "rgba(255,255,255,0.1)",
          "&:hover": {
            borderColor: "rgba(255,255,255,0.5)",
            backgroundColor: "rgba(255,255,255,0.2)",
          },
        }}
      >
        අවමංගල්‍ය
      </Button>
      <Menu
        anchorEl={funeralAnchorEl}
        open={Boolean(funeralAnchorEl)}
        onClose={handleFuneralMenuClose}
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
        <MenuItem
          onClick={() => {
            navigate("/funeral/extraDue")
            handleFuneralMenuClose()
          }}
        >
          ද්‍රව්‍ය ආධාර හිඟ
        </MenuItem>
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

export default AuditorMenu
