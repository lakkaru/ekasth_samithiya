import React, { useState } from "react"
import { navigate } from "gatsby"
import {
  Button,
  Menu,
  MenuItem,
  Divider,
} from "@mui/material"
import {
  Payment as PaymentIcon,
  MonetizationOn as MonetizationOnIcon,
  Person as PersonIcon,
} from "@mui/icons-material"

const TreasurerMenu = ({ isTreasurer }) => {
  const [moneyAnchorEl, setMoneyAnchorEl] = useState(null)
  const [receiptAnchorEl, setReceiptAnchorEl] = useState(null)
  const [expenseAnchorEl, setExpenseAnchorEl] = useState(null)
  const [reportAnchorEl, setReportAnchorEl] = useState(null)
  const [funeralAnchorEl, setFuneralAnchorEl] = useState(null)
  const [memberInfoAnchorEl, setMemberInfoAnchorEl] = useState(null)

  const handleMoneyMenuOpen = event => setMoneyAnchorEl(event.currentTarget)
  const handleMoneyMenuClose = () => setMoneyAnchorEl(null)
  const handleReceiptMenuOpen = event => setReceiptAnchorEl(event.currentTarget)
  const handleReceiptMenuClose = () => setReceiptAnchorEl(null)
  const handleExpenseMenuOpen = event => setExpenseAnchorEl(event.currentTarget)
  const handleExpenseMenuClose = () => setExpenseAnchorEl(null)
  const handleReportMenuOpen = event => setReportAnchorEl(event.currentTarget)
  const handleReportMenuClose = () => setReportAnchorEl(null)
  const handleFuneralMenuOpen = event => setFuneralAnchorEl(event.currentTarget)
  const handleFuneralMenuClose = () => setFuneralAnchorEl(null)
  const handleMemberInfoMenuOpen = event => setMemberInfoAnchorEl(event.currentTarget)
  const handleMemberInfoMenuClose = () => setMemberInfoAnchorEl(null)

  if (!isTreasurer) return null

  return (
    <>
      <Button
        color="inherit"
        onClick={handleMoneyMenuOpen}
        startIcon={<PaymentIcon />}
        sx={{
          textTransform: "none",
          backgroundColor: "rgba(255,255,255,0.1)",
          "&:hover": {
            backgroundColor: "rgba(255,255,255,0.2)",
          },
        }}
      >
        මුදල්
      </Button>
      <Menu
        anchorEl={moneyAnchorEl}
        open={Boolean(moneyAnchorEl)}
        onClose={handleMoneyMenuClose}
        PaperProps={{
          sx: {
            mt: 1,
            borderRadius: 2,
            boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
            minWidth: 260,
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
          onClick={handleReceiptMenuOpen}
          sx={{ fontWeight: 600 }}
        >
          මුදල් ලැබීම්
        </MenuItem>
        <Menu
          anchorEl={receiptAnchorEl}
          open={Boolean(receiptAnchorEl)}
          onClose={handleReceiptMenuClose}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
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
              navigate("/account/receipts")
              handleReceiptMenuClose()
              handleMoneyMenuClose()
            }}
          >
            සාමාජික මුදල්/හිඟ ලැබීම්
          </MenuItem>
          <MenuItem
            onClick={() => {
              navigate("/account/add-income")
              handleReceiptMenuClose()
              handleMoneyMenuClose()
            }}
          >
            වෙනත් ආදායම් ඇතුලත් කරන්න
          </MenuItem>
          <MenuItem
            onClick={() => {
              navigate("/account/view-income")
              handleReceiptMenuClose()
              handleMoneyMenuClose()
            }}
          >
            වෙනත් ආදායම් බලන්න
          </MenuItem>
        </Menu>
        <MenuItem
          onClick={handleExpenseMenuOpen}
          sx={{ fontWeight: 600 }}
        >
          මුදල් ගෙවීම්
        </MenuItem>
        <Menu
          anchorEl={expenseAnchorEl}
          open={Boolean(expenseAnchorEl)}
          onClose={handleExpenseMenuClose}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
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
              navigate("/account/add-expense")
              handleExpenseMenuClose()
              handleMoneyMenuClose()
            }}
          >
            වියදම් ඇතුලත් කරන්න
          </MenuItem>
          <MenuItem
            onClick={() => {
              navigate("/account/view-expenses")
              handleExpenseMenuClose()
              handleMoneyMenuClose()
            }}
          >
            වියදම් බලන්න
          </MenuItem>
        </Menu>
        <MenuItem
          onClick={handleReportMenuOpen}
          sx={{ fontWeight: 600 }}
        >
          වාර්තා
        </MenuItem>
        <Menu
          anchorEl={reportAnchorEl}
          open={Boolean(reportAnchorEl)}
          onClose={handleReportMenuClose}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
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
              navigate("/account/monthly-report")
              handleReportMenuClose()
              handleMoneyMenuClose()
            }}
          >
            මාසික ආදායම්/වියදම් වාර්තාව
          </MenuItem>
        </Menu>
      </Menu>

      <Button
        color="inherit"
        onClick={handleFuneralMenuOpen}
        startIcon={<MonetizationOnIcon />}
        sx={{
          textTransform: "none",
          backgroundColor: "rgba(255,255,255,0.1)",
          "&:hover": {
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
            navigate("/funeral/extraDue")
            handleFuneralMenuClose()
          }}
        >
          ද්‍රව්‍ය ආධාර හිඟ
        </MenuItem>
      </Menu>

      <Button
        color="inherit"
        onClick={handleMemberInfoMenuOpen}
        startIcon={<PersonIcon />}
        sx={{
          textTransform: "none",
          backgroundColor: "rgba(255,255,255,0.1)",
          "&:hover": {
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

export default TreasurerMenu
