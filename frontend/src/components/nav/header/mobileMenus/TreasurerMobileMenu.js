import React from "react"
import { Box, Typography, Button, Divider, Accordion, AccordionSummary, AccordionDetails } from "@mui/material"
import { Payment as PaymentIcon, MonetizationOn as MonetizationOnIcon, Person as PersonIcon, ExpandMore as ExpandMoreIcon } from "@mui/icons-material"

export default function TreasurerMobileMenu({ isTreasurer, onMenuItemClick }) {
  if (!isTreasurer) return null

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" sx={{ 
        textAlign: "center", 
        color: "#00897b", 
        fontWeight: 'bold',
        mb: 2,
        py: 1,
        backgroundColor: 'rgba(0, 150, 136, 0.1)',
        borderRadius: 1
      }}>
        භාණ්ඩාගාරික
      </Typography>
      <Button
        color="inherit"
        onClick={() => onMenuItemClick("/member/fullDetails")}
        startIcon={<PersonIcon />}
        sx={{ 
          textTransform: "none", 
          width: "100%",
          mb: 2,
          justifyContent: 'flex-start',
          backgroundColor: 'rgba(0, 150, 136, 0.15)',
          border: '1px solid rgba(0, 150, 136, 0.2)',
          '&:hover': { 
            backgroundColor: 'rgba(0, 150, 136, 0.25)',
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

      {/* Grouped Financial Menu */}
      <Accordion
        sx={{
          mb: 2,
          backgroundColor: 'rgba(0, 150, 136, 0.1)',
          '&:before': { display: 'none' },
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: 'none',
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon sx={{ color: '#00897b' }} />}
          sx={{
            backgroundColor: 'rgba(0, 150, 136, 0.15)',
            borderRadius: 2,
            '&:hover': {
              backgroundColor: 'rgba(0, 150, 136, 0.25)',
            },
            minHeight: 56,
            '& .MuiAccordionSummary-content': {
              alignItems: 'center',
            }
          }}
        >
          <PaymentIcon sx={{ mr: 2, color: '#00897b' }} />
          <Typography sx={{ fontWeight: 'bold', color: '#333' }}>
            මුදල්
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0 }}>
          {/* Money Receipts Accordion */}
          <Accordion
            sx={{
              backgroundColor: 'transparent',
              '&:before': { display: 'none' },
              boxShadow: 'none',
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ color: '#666', fontSize: 20 }} />}
              sx={{
                backgroundColor: 'rgba(0, 150, 136, 0.05)',
                '&:hover': { backgroundColor: 'rgba(0, 150, 136, 0.1)' },
                minHeight: 48,
                pl: 4,
              }}
            >
              <Typography sx={{ fontWeight: 600, color: '#555' }}>
                මුදල් ලැබීම්
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0, pl: 6 }}>
              <Button
                color="inherit"
                onClick={() => onMenuItemClick("/account/receipts")}
                sx={{ 
                  textTransform: "none", 
                  width: "100%",
                  justifyContent: 'flex-start',
                  backgroundColor: 'rgba(0, 150, 136, 0.02)',
                  '&:hover': { backgroundColor: 'rgba(0, 150, 136, 0.05)' },
                  borderRadius: 1,
                  py: 1,
                  mb: 0.5,
                  color: '#555'
                }}
              >
                • සාමාජික මුදල්/හිඟ ලැබීම්
              </Button>
              <Button
                color="inherit"
                onClick={() => onMenuItemClick("/account/add-income")}
                sx={{ 
                  textTransform: "none", 
                  width: "100%",
                  justifyContent: 'flex-start',
                  backgroundColor: 'rgba(0, 150, 136, 0.02)',
                  '&:hover': { backgroundColor: 'rgba(0, 150, 136, 0.05)' },
                  borderRadius: 1,
                  py: 1,
                  mb: 0.5,
                  color: '#555'
                }}
              >
                • වෙනත් ආදායම් ඇතුලත් කරන්න
              </Button>
              <Button
                color="inherit"
                onClick={() => onMenuItemClick("/account/view-income")}
                sx={{ 
                  textTransform: "none", 
                  width: "100%",
                  justifyContent: 'flex-start',
                  backgroundColor: 'rgba(0, 150, 136, 0.02)',
                  '&:hover': { backgroundColor: 'rgba(0, 150, 136, 0.05)' },
                  borderRadius: 1,
                  py: 1,
                  mb: 1,
                  color: '#555'
                }}
              >
                • වෙනත් ආදායම් බලන්න
              </Button>
            </AccordionDetails>
          </Accordion>

          {/* Money Expenses Accordion */}
          <Accordion
            sx={{
              backgroundColor: 'transparent',
              '&:before': { display: 'none' },
              boxShadow: 'none',
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ color: '#666', fontSize: 20 }} />}
              sx={{
                backgroundColor: 'rgba(0, 150, 136, 0.05)',
                '&:hover': { backgroundColor: 'rgba(0, 150, 136, 0.1)' },
                minHeight: 48,
                pl: 4,
              }}
            >
              <Typography sx={{ fontWeight: 600, color: '#555' }}>
                මුදල් ගෙවීම්
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0, pl: 6 }}>
              <Button
                color="inherit"
                onClick={() => onMenuItemClick("/account/add-expense")}
                sx={{ 
                  textTransform: "none", 
                  width: "100%",
                  justifyContent: 'flex-start',
                  backgroundColor: 'rgba(0, 150, 136, 0.02)',
                  '&:hover': { backgroundColor: 'rgba(0, 150, 136, 0.05)' },
                  borderRadius: 1,
                  py: 1,
                  mb: 0.5,
                  color: '#555'
                }}
              >
                • වියදම් ඇතුලත් කරන්න
              </Button>
              <Button
                color="inherit"
                onClick={() => onMenuItemClick("/account/view-expenses")}
                sx={{ 
                  textTransform: "none", 
                  width: "100%",
                  justifyContent: 'flex-start',
                  backgroundColor: 'rgba(0, 150, 136, 0.02)',
                  '&:hover': { backgroundColor: 'rgba(0, 150, 136, 0.05)' },
                  borderRadius: 1,
                  py: 1,
                  mb: 1,
                  color: '#555'
                }}
              >
                • වියදම් බලන්න
              </Button>
            </AccordionDetails>
          </Accordion>

          {/* Reports Accordion */}
          <Accordion
            sx={{
              backgroundColor: 'transparent',
              '&:before': { display: 'none' },
              boxShadow: 'none',
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ color: '#666', fontSize: 20 }} />}
              sx={{
                backgroundColor: 'rgba(0, 150, 136, 0.05)',
                '&:hover': { backgroundColor: 'rgba(0, 150, 136, 0.1)' },
                minHeight: 48,
                pl: 4,
              }}
            >
              <Typography sx={{ fontWeight: 600, color: '#555' }}>
                වාර්තා
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0, pl: 6 }}>
              <Button
                color="inherit"
                onClick={() => onMenuItemClick("/account/monthly-report")}
                sx={{ 
                  textTransform: "none", 
                  width: "100%",
                  justifyContent: 'flex-start',
                  backgroundColor: 'rgba(0, 150, 136, 0.02)',
                  '&:hover': { backgroundColor: 'rgba(0, 150, 136, 0.05)' },
                  borderRadius: 1,
                  py: 1,
                  mb: 1,
                  color: '#555'
                }}
              >
                • මාසික ආදායම්/වියදම් වාර්තාව
              </Button>
            </AccordionDetails>
          </Accordion>
        </AccordionDetails>
      </Accordion>

      {/* Funeral Accordion */}
      <Accordion
        sx={{
          mb: 2,
          backgroundColor: 'rgba(0, 150, 136, 0.1)',
          '&:before': { display: 'none' },
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: 'none',
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon sx={{ color: '#00897b' }} />}
          sx={{
            backgroundColor: 'rgba(0, 150, 136, 0.15)',
            borderRadius: 2,
            '&:hover': {
              backgroundColor: 'rgba(0, 150, 136, 0.25)',
            },
            minHeight: 56,
            '& .MuiAccordionSummary-content': {
              alignItems: 'center',
            }
          }}
        >
          <MonetizationOnIcon sx={{ mr: 2, color: '#00897b' }} />
          <Typography sx={{ fontWeight: 'bold', color: '#333' }}>
            අවමංගල්‍ය
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0, pl: 2 }}>
          <Button
            color="inherit"
            onClick={() => onMenuItemClick("/funeral/extraDue")}
            sx={{ 
              textTransform: "none", 
              width: "100%",
              justifyContent: 'flex-start',
              backgroundColor: 'rgba(0, 150, 136, 0.02)',
              '&:hover': { backgroundColor: 'rgba(0, 150, 136, 0.05)' },
              borderRadius: 1,
              py: 1,
              mb: 1,
              color: '#555'
            }}
          >
            • ද්‍රව්‍ය ආධාර හිඟ
          </Button>
        </AccordionDetails>
      </Accordion>

      {/* Loan menu items for treasurers */}
      <Typography variant="body2" sx={{ 
        color: "#666", 
        fontSize: "0.875rem", 
        fontWeight: 'bold',
        mb: 1,
        ml: 2
      }}>
        ණය තොරතුරු
      </Typography>
      <Button
        color="inherit"
        onClick={() => onMenuItemClick("/loan/search")}
        sx={{ 
          textTransform: "none", 
          width: "100%", 
          paddingLeft: "40px",
          mb: 0.5,
          justifyContent: 'flex-start',
          backgroundColor: 'rgba(0, 150, 136, 0.05)',
          '&:hover': { backgroundColor: 'rgba(0, 150, 136, 0.1)' },
          borderRadius: 1,
          py: 1,
          color: '#555'
        }}
      >
        • ණය සෙවීම
      </Button>
      <Button
        color="inherit"
        onClick={() => onMenuItemClick("/loan/active-loans")}
        sx={{ 
          textTransform: "none", 
          width: "100%", 
          paddingLeft: "40px",
          mb: 2,
          justifyContent: 'flex-start',
          backgroundColor: 'rgba(0, 150, 136, 0.05)',
          '&:hover': { backgroundColor: 'rgba(0, 150, 136, 0.1)' },
          borderRadius: 1,
          py: 1,
          color: '#555'
        }}
      >
        • ක්‍රියාකාරී ණය
      </Button>
      <Divider sx={{ my: 2, backgroundColor: 'rgba(0, 150, 136, 0.2)' }} />
    </Box>
  )
}
