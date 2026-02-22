import React, { useState } from "react"
import { navigate } from "gatsby"

import {
  Box,
  Typography,
  Button,
  Divider,
  Avatar,
  Badge,
  Paper,
} from "@mui/material"
import {
  Person as PersonIcon,
  AccountBalance as AccountBalanceIcon,
  Payment as PaymentIcon,
  MonetizationOn as MonetizationOnIcon,
  Logout as LogoutIcon,
  Home as HomeIcon,
  Edit as EditIcon,
} from "@mui/icons-material"

// Import role-specific mobile menu components
import ViceSecretaryMobileMenu from "./mobileMenus/ViceSecretaryMobileMenu"
import TreasurerMobileMenu from "./mobileMenus/TreasurerMobileMenu"
import LoanMobileMenu from "./mobileMenus/LoanMobileMenu"
import ChairmanMobileMenu from "./mobileMenus/ChairmanMobileMenu"
import AuditorMobileMenu from "./mobileMenus/AuditorMobileMenu"
import SuperAdminMobileMenu from "./mobileMenus/SuperAdminMobileMenu"
import InformationMobileMenu from "./mobileMenus/InformationMobileMenu"

export default function MobileMenuButtons({
  isAuthenticated,
  roles,
  memberName,
  memberId,
  hasLoan,
  handleLogout,
  handleMobileNavigate
}) {
  const isViceSecretary = roles.includes("vice-secretary")
  const isLoanTreasurer = roles.includes("loan-treasurer")
  const isTreasurer = roles.includes("treasurer")
  const isChairman = roles.includes("chairman")
  const isAuditor = roles.includes("auditor")
  const isSuperAdmin = roles.includes("super-admin")
  const hasLoanAccess = isLoanTreasurer || isTreasurer

  const handleMenuItemClick = (path) => {
    handleMobileNavigate(path)
  }

  return (
     <Paper
                elevation={8}
                sx={{
                  position: "absolute",
                  top: "100%",
                  left: "0",
                  right: "0",
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
                  zIndex: 1000,
                  display: { xs: "block", sm: "none" },
                  borderRadius: 0,
                  borderTop: '3px solid #667eea',
                  borderBottom: '1px solid rgba(0,0,0,0.1)',
                  maxHeight: 'calc(100vh - 64px)',
                  overflowY: 'auto'
                }}
              >
                {isAuthenticated && (
                  <Box sx={{ p: 2 }}>
                    {/* User Info Header */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1.5, 
                      mb: 3,
                      p: 2,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: 2,
                      color: 'white'
                    }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'white', color: '#667eea', fontSize: '0.875rem' }}>
                        {memberName.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {memberName}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          සාමාජික අංකය: #{memberId}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Super Admin Menu */}
                    <SuperAdminMobileMenu
                      isSuperAdmin={isSuperAdmin}
                      handleMenuItemClick={handleMenuItemClick}
                      handleLogout={handleLogout}
                    />

                    {/* Vice Secretary Menu */}
                    <ViceSecretaryMobileMenu 
                      isViceSecretary={isViceSecretary}
                      onMenuItemClick={handleMenuItemClick}
                    />

                    {/* Chairman Menu */}
                    <ChairmanMobileMenu
                      isChairman={isChairman}
                      onMenuItemClick={handleMenuItemClick}
                    />

                    {/* Loan Access Menu */}
                    <LoanMobileMenu
                      hasLoanAccess={hasLoanAccess}
                      isLoanTreasurer={isLoanTreasurer}
                      isTreasurer={isTreasurer}
                      onMenuItemClick={handleMenuItemClick}
                    />

                    {/* Treasurer Menu */}
                    <TreasurerMobileMenu
                      isTreasurer={isTreasurer}
                      onMenuItemClick={handleMenuItemClick}
                    />

                    {/* Auditor Menu */}
                    <AuditorMobileMenu
                      isAuditor={isAuditor}
                      onMenuItemClick={handleMenuItemClick}
                    />
                    
                    {/* Information Menu - visible to all authenticated members */}
                    <InformationMobileMenu
                      isAuthenticated={!isSuperAdmin}
                      onMenuItemClick={handleMenuItemClick}
                    />
                    
                    {/* Common Member Account & Services - Hide for super admin */}
                    {!isSuperAdmin && (
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ 
                          color: "#666", 
                          fontSize: "0.875rem", 
                          fontWeight: 'bold',
                          mb: 2,
                          ml: 1
                        }}>
                          මගේ ගිණුම
                        </Typography>
                      <Button
                        color="inherit"
                        onClick={() => handleMenuItemClick("/member/home")}
                        startIcon={<HomeIcon />}
                        sx={{ 
                          textTransform: "none",
                          width: "100%",
                          mb: 1,
                          justifyContent: 'flex-start',
                          backgroundColor: 'rgba(33, 150, 243, 0.15)',
                          border: '1px solid rgba(33, 150, 243, 0.2)',
                          '&:hover': { 
                            backgroundColor: 'rgba(33, 150, 243, 0.25)',
                            transform: 'translateX(2px)'
                          },
                          borderRadius: 2,
                          py: 1.5,
                          color: '#333',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        මුල් පිටුව
                      </Button>
                      <Button
                        color="inherit"
                        onClick={() => handleMenuItemClick("/member/profile-edit")}
                        startIcon={<EditIcon />}
                        sx={{ 
                          textTransform: "none",
                          width: "100%",
                          mb: 1,
                          justifyContent: 'flex-start',
                          backgroundColor: 'rgba(33, 150, 243, 0.15)',
                          border: '1px solid rgba(33, 150, 243, 0.2)',
                          '&:hover': { 
                            backgroundColor: 'rgba(33, 150, 243, 0.25)',
                            transform: 'translateX(2px)'
                          },
                          borderRadius: 2,
                          py: 1.5,
                          color: '#333',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        ගිණුම සංස්කරණය
                      </Button>
                      
                      {/* Divider for member financial services */}
                      <Divider sx={{ my: 2, backgroundColor: 'rgba(33, 150, 243, 0.2)' }} />
                      
                      {/* Member Financial Services */}
                      <Button
                        color="inherit"
                        onClick={() => handleMenuItemClick("/member/payments")}
                        startIcon={<PaymentIcon />}
                        sx={{ 
                          textTransform: "none", 
                          width: "100%",
                          mb: 1,
                          justifyContent: 'flex-start',
                          backgroundColor: 'rgba(76, 175, 80, 0.15)',
                          border: '1px solid rgba(76, 175, 80, 0.2)',
                          '&:hover': { 
                            backgroundColor: 'rgba(76, 175, 80, 0.25)',
                            transform: 'translateX(2px)'
                          },
                          borderRadius: 2,
                          py: 1.5,
                          color: '#333',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        මුදල් ගෙවීම්
                      </Button>
                      <Button
                        color="inherit"
                        onClick={() => handleMenuItemClick("/member/fines")}
                        startIcon={<MonetizationOnIcon />}
                        sx={{ 
                          textTransform: "none", 
                          width: "100%",
                          mb: 1,
                          justifyContent: 'flex-start',
                          backgroundColor: 'rgba(255, 152, 0, 0.15)',
                          border: '1px solid rgba(255, 152, 0, 0.2)',
                          '&:hover': { 
                            backgroundColor: 'rgba(255, 152, 0, 0.25)',
                            transform: 'translateX(2px)'
                          },
                          borderRadius: 2,
                          py: 1.5,
                          color: '#333',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        දඩ මුදල්
                      </Button>
                      {/* Special memberships moved to vice-secretary menu */}
                      {hasLoan && (
                        <Badge 
                          variant="dot" 
                          color="warning" 
                          sx={{
                            width: '100%',
                            '& .MuiBadge-badge': {
                              backgroundColor: '#ff9800',
                            }
                          }}
                        >
                          <Button
                            color="inherit"
                            onClick={() => handleMenuItemClick("/member/loan")}
                            startIcon={<AccountBalanceIcon />}
                            sx={{ 
                              textTransform: "none",
                              width: "100%",
                              mb: 1,
                              justifyContent: 'flex-start',
                              backgroundColor: 'rgba(255,152,0,0.15)',
                              border: '1px solid rgba(255,152,0,0.2)',
                              '&:hover': { 
                                backgroundColor: 'rgba(255,152,0,0.25)',
                                transform: 'translateX(2px)'
                              },
                              borderRadius: 2,
                              py: 1.5,
                              color: '#333',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            ණය <span style={{ marginLeft: 'auto', fontSize: '0.75rem' }}>● ක්‍රියාත්මක</span>
                          </Button>
                        </Badge>
                      )}
                      
                      {/* Logout button */}
                      <Divider sx={{ my: 2, backgroundColor: 'rgba(33, 150, 243, 0.2)' }} />
                      <Button
                        color="inherit"
                        onClick={handleLogout}
                        startIcon={<LogoutIcon />}
                        sx={{ 
                          textTransform: "none",
                          width: "100%",
                          justifyContent: 'flex-start',
                          backgroundColor: 'rgba(244, 67, 54, 0.1)',
                          '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.2)' },
                          borderRadius: 2,
                          py: 1.5,
                          color: '#d32f2f'
                        }}
                      >
                        ඉවත් වන්න
                      </Button>
                    </Box>
                  )}
                  </Box>
                )}
                {!isAuthenticated && (
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Button
                      color="inherit"
                      onClick={() => handleMenuItemClick("/login/user-login")}
                      startIcon={<PersonIcon />}
                      sx={{
                        textTransform: "none",
                        width: "100%",
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        '&:hover': { backgroundColor: 'rgba(102, 126, 234, 0.2)' },
                        borderRadius: 2,
                        py: 2,
                        color: '#333',
                        fontWeight: 'bold'
                      }}
                    >
                      ප්‍රවේශය
                    </Button>
                  </Box>
                )}
              </Paper>
  )
}
