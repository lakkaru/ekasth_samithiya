import React, { useState } from "react"
import { navigate } from "gatsby"
import {
  Button,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material"
import { Info as InfoIcon } from "@mui/icons-material"

const InformationMenu = ({ isAuthenticated }) => {
  const [anchorEl, setAnchorEl] = useState(null)

  const handleMenuOpen = event => setAnchorEl(event.currentTarget)
  const handleMenuClose = () => setAnchorEl(null)

  if (!isAuthenticated) return null

  return (
    <>
      <Button
        variant="outlined"
        color="inherit"
        onClick={handleMenuOpen}
        startIcon={<InfoIcon sx={{ fontSize: "1rem" }} />}
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
        තොරතුරු
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            mt: 1,
            borderRadius: 2,
            boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
            minWidth: 200,
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
        <Typography
          variant="caption"
          sx={{
            px: 2,
            py: 0.5,
            color: "text.secondary",
            fontWeight: "bold",
            fontSize: "0.7rem",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            display: "block",
          }}
        >
          සාමාජිකත්ව
        </Typography>
        <MenuItem
          onClick={() => {
            navigate("/member/special-memberships")
            handleMenuClose()
          }}
        >
          ⭐ විශේෂ සාමාජිකත්ව
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate("/info/siblings")
            handleMenuClose()
          }}
        >
          👨‍👩‍👧 30% සමාජිකත්ව
        </MenuItem>
      </Menu>
    </>
  )
}

export default InformationMenu
