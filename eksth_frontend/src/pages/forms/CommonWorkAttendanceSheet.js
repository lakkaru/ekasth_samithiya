import React, { useState } from 'react';
import { Box, Typography, Paper, Container, Button, TextField } from '@mui/material';
import { Print as PrintIcon, CalendarToday as CalendarIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import Layout from '../../components/layout';
import AuthComponent from '../../components/common/AuthComponent';
import api from '../../utils/api';

const CommonWorkAttendanceSheet = () => {
  const [members, setMembers] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [workDescription, setWorkDescription] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [roles, setRoles] = useState([]);

  // Handle authentication state changes
  const handleAuthStateChange = ({ isAuthenticated, roles }) => {
    console.log("Auth state change:", { isAuthenticated, roles });
    setIsAuthenticated(isAuthenticated);
    setRoles(roles);
    
    // Fetch members when authenticated
    if (isAuthenticated) {
      fetchMembers();
    }
  };

  // Fetch all members (including deceased but grayed out)
  const fetchMembers = async () => {
    setLoading(true);
    try {
      const response = await api.get(`${process.env.GATSBY_API_BASE_URL}/member/getMembersForCommonWorkDocument`);
      
      if (response.data.success) {
        setMembers(response.data.members || []);
        console.log('Set members:', response.data.members?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    }
    setLoading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('si-LK', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    });
  };

  // Group members into three specific pages (1-100, 101-200, 201-300)
  const groupMembersIntoPages = (memberList) => {
    const pages = [];
    const ranges = [
      { start: 1, end: 100, title: '1-100' },
      { start: 101, end: 200, title: '101-200' },
      { start: 201, end: 300, title: '201-300' }
    ];
    
    ranges.forEach(range => {
      const pageMembers = memberList.filter(member => {
        const memberId = parseInt(member.member_id);
        return memberId >= range.start && memberId <= range.end;
      });
      
      if (pageMembers.length > 0) {
        pages.push({
          members: pageMembers,
          title: range.title,
          range: `${range.start}-${range.end}`
        });
      }
    });
    
    return pages;
  };

  const pages = members.length > 0 ? groupMembersIntoPages(members) : [];

  // Check if user has permission to access this page
  if (isAuthenticated && !roles.includes("vice-secretary")) {
    return (
      <Layout>
        <AuthComponent onAuthStateChange={handleAuthStateChange} />
        <Box sx={{ padding: "20px", textAlign: "center" }}>
          <Paper sx={{ padding: "40px", borderRadius: "10px", maxWidth: "600px", margin: "0 auto" }}>
            <Typography variant="h5" gutterBottom sx={{ color: "#f44336", marginBottom: "20px" }}>
              ප්‍රවේශ අවසරයක් නැත
            </Typography>
            <Typography variant="body1" sx={{ marginBottom: "20px" }}>
              මෙම පිටුවට ප්‍රවේශ වීමට ඔබට අවසර නැත. මෙම පිටුව උප ලේකම්වරුන්ට පමණක් ප්‍රවේශ විය හැක.
            </Typography>
          </Paper>
        </Box>
      </Layout>
    );
  }

  return (
    <>
      {/* Layout only for screen view */}
      <Box className="no-print">
        <Layout>
          <AuthComponent onAuthStateChange={handleAuthStateChange} />
          <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* Header - Hide on print */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h4" gutterBottom align="center">
                පොදු වැඩ පැමිණීම ලේඛණය
              </Typography>
                
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 3, flexWrap: 'wrap' }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="දිනය"
                    value={selectedDate}
                    onChange={(newValue) => setSelectedDate(newValue)}
                    renderInput={(params) => <TextField {...params} />}
                    sx={{ minWidth: 200 }}
                  />
                </LocalizationProvider>
                
                <TextField
                  label="කාරණය"
                  value={workDescription}
                  onChange={(e) => setWorkDescription(e.target.value)}
                  placeholder="වැඩ කාරණය විස්තර කරන්න..."
                  sx={{ minWidth: 300 }}
                />
                
                <Button
                  variant="outlined"
                  startIcon={<PrintIcon />}
                  onClick={handlePrint}
                  disabled={!workDescription.trim()}
                >
                  මුද්‍රණය කරන්න
                </Button>
              </Box>

              {selectedDate && workDescription.trim() && (
                <Paper sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5' }}>
                  <Typography variant="h6">මුද්‍රණ තොරතුරු:</Typography>
                  <Typography><strong>දිනය:</strong> {formatDate(selectedDate)}</Typography>
                  <Typography><strong>කාරණය:</strong> {workDescription}</Typography>
                  <Typography><strong>පිටු ගණන:</strong> {pages.length}</Typography>
                  <Typography><strong>සාමාජික ගණන:</strong> {members.length}</Typography>
                </Paper>
              )}

              {members.length === 0 && !loading && (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="h6" color="text.secondary">
                    සාමාජික දත්ත සොයා ගත නොහැක
                  </Typography>
                </Paper>
              )}

              {(!workDescription.trim() || !selectedDate) && (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="h6" color="text.secondary">
                    මුද්‍රණය සඳහා දිනය සහ කාරණය ඇතුලත් කරන්න
                  </Typography>
                </Paper>
              )}
            </Box>
          </Container>
        </Layout>
      </Box>

      {/* AuthComponent for print view */}
      <Box className="print-only" sx={{ display: 'none' }}>
        <AuthComponent onAuthStateChange={handleAuthStateChange} />
      </Box>

      {/* Printable Document */}
      {selectedDate && workDescription.trim() && pages.length > 0 && (
        <Box className="print-content" sx={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          '@media print': {
            display: 'block'
          }
        }}>
          {pages.map((page, pageIndex) => (
            <Paper 
              key={pageIndex}
              className="print-page"
              sx={{ 
                width: '210mm', // A4 width
                minHeight: '297mm', // A4 height  
                maxHeight: '297mm', // Prevent overflow
                p: '10mm', // Margins
                mb: 3,
                pageBreakAfter: pageIndex < pages.length - 1 ? 'always' : 'auto',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden', // Prevent content overflow
                '@media print': {
                  width: '100%',
                  height: '100vh',
                  maxHeight: '100vh',
                  minHeight: '100vh',
                  boxShadow: 'none',
                  m: 0,
                  p: '10mm',
                  pageBreakAfter: pageIndex < pages.length - 1 ? 'always' : 'auto'
                }
              }}
            >
              {/* Page Header */}
              <Box sx={{ mb: 0.8, borderBottom: '2px solid #333', pb: 0.6 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', textAlign: 'center', mb: 0.8 }}>
                  පැමිණීම ලේඛණය
                </Typography>
                
                {/* Single Row Info Layout */}
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr 1fr', 
                  gap: 2, 
                  fontSize: '11px'
                }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontSize: '11px' }}>
                      <strong>කාරණය:-</strong> {workDescription}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ fontSize: '11px' }}>
                      <strong>සාමාජික පරාසය:</strong> {page.range}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" sx={{ fontSize: '11px' }}>
                      <strong>දිනය:</strong> {formatDate(selectedDate)}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Two Column Layout */}
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: 2,
                flex: 1,
                alignItems: 'start',
                minHeight: 0 // Allow content to shrink
              }}>
                {[0, 1].map(columnIndex => {
                  const startIndex = Math.floor(page.members.length / 2) * columnIndex;
                  const endIndex = columnIndex === 0 ? Math.floor(page.members.length / 2) : page.members.length;
                  const columnMembers = page.members.slice(startIndex, endIndex);
                  
                  return (
                    <Box key={columnIndex}>
                      {/* Column Headers */}
                      <Box sx={{ 
                        display: 'grid', 
                        gridTemplateColumns: '45px 1fr 55px 50px',
                        gap: 0,
                        mb: 0.3
                      }}>
                        <Box sx={{ 
                          fontWeight: 'bold', 
                          textAlign: 'center', 
                          bgcolor: '#f0f0f0',
                          border: '1px solid #333',
                          p: 0.6,
                          fontSize: '12px'
                        }}>
                          අංකය
                        </Box>
                        <Box sx={{ 
                          fontWeight: 'bold', 
                          textAlign: 'center', 
                          bgcolor: '#f0f0f0',
                          border: '1px solid #333',
                          borderLeft: 'none',
                          p: 0.6,
                          fontSize: '12px'
                        }}>
                          නම
                        </Box>
                        <Box sx={{ 
                          fontWeight: 'bold', 
                          textAlign: 'left', 
                          bgcolor: '#f0f0f0',
                          border: '1px solid #333',
                          borderLeft: 'none',
                          p: 0.6,
                          fontSize: '12px'
                        }}>
                          ප්‍රදේශය
                        </Box>
                        <Box sx={{ 
                          fontWeight: 'bold', 
                          textAlign: 'center', 
                          bgcolor: '#f0f0f0',
                          border: '1px solid #333',
                          borderLeft: 'none',
                          p: 0.6,
                          fontSize: '12px'
                        }}>
                          ✓
                        </Box>
                      </Box>

                      {/* Column Data */}
                      <Box sx={{ 
                        display: 'grid', 
                        gridTemplateColumns: '45px 1fr 55px 50px',
                        gap: 0
                      }}>
                        {columnMembers.map((member, memberIndex) => {
                          // Determine if member should be grayed out (only officers and status-based exemptions)
                          const isGrayedOut = member.status === 'free' || 
                                            member.status === 'attendance-free' ||
                                            member.isOfficer;
                          
                          // Determine if row should be blank (deactivated/deceased members)
                          const isBlankRow = member.isDeactivated || member.isDeceased;
                          
                          const rowStyle = isGrayedOut ? { 
                            bgcolor: '#e8e8e8', 
                            color: '#666',
                            fontStyle: 'italic'
                          } : {};
                          const isLastRow = memberIndex === columnMembers.length - 1;

                          return (
                            <React.Fragment key={member.member_id}>
                              <Box sx={{ 
                                textAlign: 'center', 
                                border: '1px solid #333',
                                borderTop: memberIndex === 0 ? '1px solid #333' : 'none',
                                borderBottom: isLastRow ? '1px solid #333' : '1px solid #ccc',
                                p: 0.3,
                                fontSize: '11px',
                                minHeight: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                ...rowStyle 
                              }}>
                                {member.member_id}
                              </Box>
                              <Box sx={{ 
                                pl: 0.8,
                                border: '1px solid #333',
                                borderLeft: 'none',
                                borderTop: memberIndex === 0 ? '1px solid #333' : 'none',
                                borderBottom: isLastRow ? '1px solid #333' : '1px solid #ccc',
                                p: 0.3,
                                fontSize: '10px',
                                minHeight: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                ...rowStyle,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {isBlankRow ? '' : member.name}
                              </Box>
                              <Box sx={{ 
                                textAlign: 'left',
                                border: '1px solid #333',
                                borderLeft: 'none',
                                borderTop: memberIndex === 0 ? '1px solid #333' : 'none',
                                borderBottom: isLastRow ? '1px solid #333' : '1px solid #ccc',
                                p: 0.3,
                                fontSize: '9px',
                                minHeight: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                ...rowStyle,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {isBlankRow ? '' : member.area}
                              </Box>
                              <Box sx={{ 
                                textAlign: 'center',
                                border: '1px solid #333',
                                borderLeft: 'none',
                                borderTop: memberIndex === 0 ? '1px solid #333' : 'none',
                                borderBottom: isLastRow ? '1px solid #333' : '1px solid #ccc',
                                p: 0.3,
                                minHeight: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                ...rowStyle
                              }}>
                                {!isBlankRow && isGrayedOut ? (
                                  <Typography variant="caption" sx={{ color: '#888', fontSize: '8px', fontWeight: 'bold' }}>
                                    {member.status === 'free' ? 'නිදහස්' : 
                                     member.status === 'attendance-free' ? 'පැ.නිදහස්' :
                                     member.isOfficer ? 'නිලධාරී' : ''}
                                  </Typography>
                                ) : null}
                              </Box>
                            </React.Fragment>
                          );
                        })}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* Hide navigation bar and other non-print elements */
          .no-print,
          header,
          nav,
          footer,
          .MuiAppBar-root,
          .gatsby-skip-here {
            display: none !important;
          }
          
          /* Hide all Layout components during print */
          .layout-header,
          [data-testid="header"],
          [role="banner"] {
            display: none !important;
          }
          
          .print-content {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            display: block !important;
          }
          
          /* Ensure each page fits properly */
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          
          /* Page break settings */
          .print-page {
            page-break-after: always;
            page-break-inside: avoid;
            height: calc(100vh - 16mm);
            max-height: calc(100vh - 16mm);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            box-sizing: border-box;
          }
          
          .print-page:last-child {
            page-break-after: auto;
          }
          
          /* Ensure content distribution */
          .print-page > div:last-child {
            flex: 1;
            min-height: 0;
            overflow: hidden;
          }
        }
        
        @media screen {
          .print-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
          }
        }
      `}</style>
    </>
  );
};

export default CommonWorkAttendanceSheet;
