import React from "react"
import { Box, Typography, Button, Divider } from "@mui/material"
import { Info as InfoIcon, FamilyRestroom as FamilyRestroomIcon, Stars as StarsIcon } from "@mui/icons-material"

const InformationMobileMenu = ({ isAuthenticated, onMenuItemClick }) => {
  if (!isAuthenticated) return null

  return (
    <Box sx={{ mb: 3 }}>
      <Divider sx={{ mb: 2, backgroundColor: "rgba(102, 126, 234, 0.2)" }} />
      <Typography
        variant="subtitle2"
        sx={{
          textAlign: "center",
          color: "#667eea",
          fontWeight: "bold",
          mb: 2,
          py: 1,
          backgroundColor: "rgba(102, 126, 234, 0.1)",
          borderRadius: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 0.5,
        }}
      >
        <InfoIcon fontSize="small" />
        තොරතුරු
      </Typography>

      <Button
        color="inherit"
        onClick={() => onMenuItemClick("/member/special-memberships")}
        startIcon={<StarsIcon />}
        sx={{
          textTransform: "none",
          width: "100%",
          mb: 1,
          justifyContent: "flex-start",
          backgroundColor: "rgba(156, 39, 176, 0.15)",
          border: "1px solid rgba(156, 39, 176, 0.2)",
          "&:hover": {
            backgroundColor: "rgba(156, 39, 176, 0.25)",
            transform: "translateX(2px)",
          },
          borderRadius: 2,
          py: 1.5,
          color: "#333",
          transition: "all 0.2s ease",
        }}
      >
        විශේෂ සාමාජිකත්ව
      </Button>

      <Button
        color="inherit"
        onClick={() => onMenuItemClick("/info/siblings")}
        startIcon={<FamilyRestroomIcon />}
        sx={{
          textTransform: "none",
          width: "100%",
          mb: 1,
          justifyContent: "flex-start",
          backgroundColor: "rgba(102, 126, 234, 0.15)",
          border: "1px solid rgba(102, 126, 234, 0.2)",
          "&:hover": {
            backgroundColor: "rgba(102, 126, 234, 0.25)",
            transform: "translateX(2px)",
          },
          borderRadius: 2,
          py: 1.5,
          color: "#333",
          transition: "all 0.2s ease",
        }}
      >
        30% සමාජිකත්ව
      </Button>
    </Box>
  )
}

export default InformationMobileMenu
