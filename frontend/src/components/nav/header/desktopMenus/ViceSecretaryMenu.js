import React, { useState } from "react"
import { navigate } from "gatsby"
import {
  Button,
  Menu,
  MenuItem,
  Divider,
  Typography,
} from "@mui/material"
import { Groups as GroupsIcon } from "@mui/icons-material"

const ViceSecretaryMenu = ({ isViceSecretary }) => {
  const [attendanceAnchorEl, setAttendanceAnchorEl] = useState(null)
  const [membershipAnchorEl, setMemberShipAnchorEl] = useState(null)
  const [membershipViceSecAnchorEl, setMembershipViceSecAnchorEl] = useState(null)
  const [memberInfoAnchorEl, setMemberInfoAnchorEl] = useState(null)

  const handleAttendanceMenuOpen = event => setAttendanceAnchorEl(event.currentTarget)
  const handleAttendanceMenuClose = () => setAttendanceAnchorEl(null)
  const handleMembershipMenuOpen = event => setMemberShipAnchorEl(event.currentTarget)
  const handleMembershipMenuClose = () => setMemberShipAnchorEl(null)
  const handleMembershipViceSecMenuOpen = event => setMembershipViceSecAnchorEl(event.currentTarget)
  const handleMembershipViceSecMenuClose = () => setMembershipViceSecAnchorEl(null)
  const handleMemberInfoMenuOpen = event => setMemberInfoAnchorEl(event.currentTarget)
  const handleMemberInfoMenuClose = () => setMemberInfoAnchorEl(null)

  if (!isViceSecretary) return null

  return (
    <>
      <Button
        variant="outlined"
        color="inherit"
        onClick={handleAttendanceMenuOpen}
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
        පැමිණීම
      </Button>
      <Menu
        anchorEl={attendanceAnchorEl}
        open={Boolean(attendanceAnchorEl)}
        onClose={handleAttendanceMenuClose}
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
        <Typography
          variant="caption"
          sx={{
            px: 2,
            py: 0.5,
            color: 'text.secondary',
            fontWeight: 'bold',
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          මුද්‍රණය
        </Typography>
        <MenuItem
          onClick={() => {
            navigate("/forms/MeetingSheet")
            handleAttendanceMenuClose()
          }}
        >
          📋 මහා සභාව පැමිණීම ලේඛණය
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate("/forms/attendance-vice-secretary")
            handleAttendanceMenuClose()
          }}
        >
          📋 මහා සභා පැමිණීම - (තහවුරු කිරීම)
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate("/forms/FuneralAttendanceSheet")
            handleAttendanceMenuClose()
          }}
        >
          📋 අවමංගල්‍ය පැමිණීමේ ලේඛණය
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate("/forms/CommonWorkAttendanceSheet")
            handleAttendanceMenuClose()
          }}
        >
          📋 පොදු වැඩ පැමිණීමේ ලේඛණය
        </MenuItem>
        
        <Divider sx={{ my: 1 }} />
        <Typography
          variant="caption"
          sx={{
            px: 2,
            py: 0.5,
            color: 'text.secondary',
            fontWeight: 'bold',
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          සලකුණු කිරීම
        </Typography>
        <MenuItem
          onClick={() => {
            navigate("/funeral/funeralAttendance")
            handleAttendanceMenuClose()
          }}
        >
          ✓ අවමංගල්‍ය උත්සවය
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate("/funeral/funeralWorkAttendance")
            handleAttendanceMenuClose()
          }}
        >
          ✓ සුසන භුමි කටයුතු
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate("/meeting/Attendance")
            handleAttendanceMenuClose()
          }}
        >
          ✓ මහා සභාව
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate("/commonworks/attendance")
            handleAttendanceMenuClose()
          }}
        >
          ✓ පොදු වැඩ
        </MenuItem>
        <Divider sx={{ my: 1 }} />
        <Typography
          variant="caption"
          sx={{
            px: 2,
            py: 0.5,
            color: 'text.secondary',
            fontWeight: 'bold',
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          නිරීක්ෂණය
        </Typography>
        <MenuItem
          onClick={() => {
            navigate("/reports/meetingAttendance")
            handleAttendanceMenuClose()
          }}
        >
          📊 මහා සභාව පැමිණීම
        </MenuItem>
      </Menu>

      <Button
        color="inherit"
        variant="outlined"
        onClick={handleMembershipMenuOpen}
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
        anchorEl={membershipAnchorEl}
        open={Boolean(membershipAnchorEl)}
        onClose={handleMembershipMenuClose}
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
            navigate("/member/deathById")
            handleMembershipMenuClose()
          }}
        >
          ඇතුලත් කිරීම
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate("/funeral/assignment")
            handleMembershipMenuClose()
          }}
        >
          අවමංගල්‍ය පැවරීම
        </MenuItem>
        <hr />
        <MenuItem
          onClick={() => {
            navigate("/funeral/collectionList")
            handleMembershipMenuClose()
          }}
        >
          අතිරේක ආධාර එකතු කිරීමේ ලැයිස්තුව
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate("/funeral/collectionMarking")
            handleMembershipMenuClose()
          }}
        >
          අතිරේක ආධාර සලකුණු කිරීමේ ලැයිස්තුව
        </MenuItem>
        {/* <MenuItem
          onClick={() => {
            navigate("/funeral/extraDue")
            handleMembershipMenuClose()
          }}
        >
          ද්‍රව්‍ය ආධාර හිඟ
        </MenuItem> */}
      </Menu>

      <Button
        color="inherit"
        variant="outlined"
        onClick={handleMemberInfoMenuOpen}
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
      <Menu
        anchorEl={memberInfoAnchorEl}
        open={Boolean(memberInfoAnchorEl)}
        onClose={handleMemberInfoMenuClose}
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
            navigate("/member/fullDetails")
            handleMemberInfoMenuClose()
          }}
        >
          සාමාජික තොරතුරු
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate("/member/due-list")
            handleMemberInfoMenuClose()
          }}
        >
          සාමාජික හිඟ ලැයිස්තුව
        </MenuItem>
      </Menu>

      <Button
        color="inherit"
        variant="outlined"
        onClick={() => navigate("/admin/whatsapp-bot")}
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
        WhatsApp Bot
      </Button>

      <Button
        color="inherit"
        variant="outlined"
        onClick={handleMembershipViceSecMenuOpen}
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
        සාමාජිකත්වය
      </Button>
      <Menu
        anchorEl={membershipViceSecAnchorEl}
        open={Boolean(membershipViceSecAnchorEl)}
        onClose={handleMembershipViceSecMenuClose}
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
            navigate("/member/add-member")
            handleMembershipViceSecMenuClose()
          }}
        >
          සාමාජිකයෙකු ඇතුලත් කිරීම
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate("/member/update-member")
            handleMembershipViceSecMenuClose()
          }}
        >
          සාමාජික තොරතුරු යාවත්කාලීන කිරීම
        </MenuItem>
        <hr />
        <MenuItem
          onClick={() => {
            navigate("/member/search-by-area")
            handleMembershipViceSecMenuClose()
          }}
        >

          ප්‍රදේශය අනුව සෙවීම
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate("/member/search-by-id")
            handleMembershipViceSecMenuClose()
          }}
        >
          සාමාජික අංකය අනුව සෙවීම
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate("/member/search-by-name")
            handleMembershipViceSecMenuClose()
          }}
        >
          නම අනුව සෙවීම
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate("/member/special-memberships")
            handleMembershipViceSecMenuClose()
          }}
        >
          <GroupsIcon sx={{ mr: 1, fontSize: 20 }} />
          විශේෂ සාමාජිකත්ව
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

export default ViceSecretaryMenu
