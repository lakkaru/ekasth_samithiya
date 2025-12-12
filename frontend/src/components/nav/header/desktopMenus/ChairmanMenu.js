import React from "react"
import { navigate } from "gatsby"
import { Button, Divider } from "@mui/material"
// Icons removed from startIcon props to simplify menu buttons

export default function ChairmanMenu({ isChairman }) {
  if (!isChairman) return null

  return (
    <>
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
      <Button
        color="inherit"
        onClick={() => navigate("/loan/active-loans")}
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
        ක්‍රියාකාරී ණය
      </Button>
      <Button
        color="inherit"
        onClick={() => navigate("/reports/meetingAttendance")}
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
        මහා සභාව පැමිණීම
      </Button>
      <Button
        color="inherit"
        onClick={() => navigate("/account/monthly-report")}
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
        මාසික ආදායම්/වියදම් වාර්තාව
      </Button>
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
