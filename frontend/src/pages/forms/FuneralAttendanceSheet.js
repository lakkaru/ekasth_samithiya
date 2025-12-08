import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Container, Button, Dialog, DialogTitle, DialogContent, List, ListItem, ListItemText, ListItemButton } from '@mui/material';
import { Print as PrintIcon, Search as SearchIcon } from '@mui/icons-material';
import Layout from '../../components/layout';
import AuthComponent from '../../components/common/AuthComponent';

const FuneralAttendanceSheet = () => {
  const [funerals, setFunerals] = useState([]);
  const [selectedFuneral, setSelectedFuneral] = useState(null);
  const [members, setMembers] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [roles, setRoles] = useState([]);

  // Handle authentication state changes
  const handleAuthStateChange = ({ isAuthenticated, roles }) => {
    console.log("Auth state change:", { isAuthenticated, roles });
    setIsAuthenticated(isAuthenticated);
    setRoles(roles);
    
    // Fetch funerals when authenticated
    if (isAuthenticated) {
      fetchFunerals();
    }
  };

  // Fetch recent funerals
  const fetchFunerals = async () => {
    try {
      const response = await fetch(`${process.env.GATSBY_API_BASE_URL}/funeral/getAvailableFunerals`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const data = await response.json();
      console.log('Funerals data:', data); // Debug log
      if (data.funerals) {
        // Get last 10 funerals
        const recentFunerals = data.funerals.slice(0, 10); // Already sorted by date desc
        setFunerals(recentFunerals);
        console.log('Set funerals:', recentFunerals); // Debug log
      }
    } catch (error) {
      console.error('Error fetching funerals:', error);
    }
  };

  // Fetch members for funeral attendance
  const fetchMembers = async (funeralId) => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.GATSBY_API_BASE_URL}/member/getMembersForCommonWorkDocument`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const data = await response.json();
      console.log('Members data:', data); // Debug log
      if (data.success) {
        setMembers(data.members || []);
        console.log('Set members:', data.members?.length || 0); // Debug log
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Fetch funerals when component mounts if already authenticated
    if (isAuthenticated) {
      fetchFunerals();
    }
  }, [isAuthenticated]);

  const handleFuneralSelect = async (funeral) => {
    setSelectedFuneral(funeral);
    setDialogOpen(false);
    await fetchMembers(funeral._id);
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('si-LK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Function to get deceased name from funeral object (similar to funeralWorkAttendance.js)
  const getDeceasedName = (funeral) => {
    if (!funeral || !funeral.member_id) return "නොදන්නා";
    
    console.log("Getting deceased name for:", funeral.deceased_id, funeral.member_id._id);
    
    // If deceased_id matches member_id, it's the member themselves
    if (funeral.deceased_id && funeral.deceased_id.toString() === funeral.member_id._id.toString()) {
      return funeral.member_id.name || "නොදන්නා";
    }
    
    // Otherwise, find the dependent
    const dependent = funeral.member_id.dependents?.find(
      dep => dep._id && dep._id.toString() === funeral.deceased_id?.toString()
    );
    
    return dependent?.name || "නොදන්නා";
  };

  // Function to get deceased ID (member_id for member, dependent name for dependent)
  const getDeceasedId = (funeral) => {
    if (!funeral || !funeral.member_id) return "නොදන්නා";
    
    // If deceased_id matches member_id, return member_id
    if (funeral.deceased_id && funeral.deceased_id.toString() === funeral.member_id._id.toString()) {
      return funeral.member_id.member_id || "නොදන්නා";
    }
    
    // Otherwise, return member_id with dependent indicator
    return `${funeral.member_id.member_id} (පවුලේ සාමාජික)` || "නොදන්නා";
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

  const pages = selectedFuneral && members.length > 0 ? groupMembersIntoPages(members) : [];

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
                අවමංගල්‍ය පැමිණීම ලේඛණය
              </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 3 }}>
                  <Button
                    variant="contained"
                    startIcon={<SearchIcon />}
                    onClick={() => setDialogOpen(true)}
                  >
                    අවමංගල්‍යය තෝරන්න
                  </Button>
                  
                  {selectedFuneral && (
                    <Button
                      variant="outlined"
                      startIcon={<PrintIcon />}
                      onClick={handlePrint}
                    >
                      මුද්‍රණය කරන්න
                    </Button>
                  )}
                </Box>

                {selectedFuneral && (
                  <Paper sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5' }}>
                    <Typography variant="h6">තෝරාගත් අවමංගල්‍යය:</Typography>
                    <Typography><strong>මියගිය සාමාජික අංකය:</strong> {getDeceasedId(selectedFuneral)}</Typography>
                    <Typography><strong>නම:</strong> {getDeceasedName(selectedFuneral)}</Typography>
                    <Typography><strong>දිනය:</strong> {formatDate(selectedFuneral.date)}</Typography>
                    <Typography><strong>පිටු ගණන:</strong> {pages.length}</Typography>
                    <Typography><strong>සාමාජික ගණන:</strong> {members.length}</Typography>
                  </Paper>
                )}

                {selectedFuneral && members.length === 0 && !loading && (
                  <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary">
                      මෙම අවමංගල්‍යය සඳහා සාමාජික දත්ත සොයා ගත නොහැක
                    </Typography>
                  </Paper>
                )}

                {!selectedFuneral && (
                  <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary">
                      මුද්‍රණය සඳහා අවමංගල්‍යයක් තෝරන්න
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

          {/* Funeral Selection Dialog */}
          <Dialog 
            open={dialogOpen} 
            onClose={() => setDialogOpen(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>අවමංගල්‍යය තෝරන්න</DialogTitle>
            <DialogContent>
              {funerals.length === 0 ? (
                <Typography>කිසිදු අවමංගල්‍යයක් සොයා ගත නොහැක</Typography>
              ) : (
                <List>
                  {funerals.map((funeral) => {
                    console.log('Funeral object:', funeral); // Debug log
                    return (
                      <ListItem key={funeral._id} disablePadding>
                        <ListItemButton onClick={() => handleFuneralSelect(funeral)}>
                          <ListItemText
                            primary={`${getDeceasedName(funeral)} (${getDeceasedId(funeral)})`}
                            secondary={`${formatDate(funeral.date)} - ${funeral.member_id?.area} ${funeral.member_id?.name}`}
                          />
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </List>
              )}
            </DialogContent>
          </Dialog>

          {/* Printable Document */}
          {selectedFuneral && pages.length > 0 && (
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
                  {/* Page Header - Compact Single Row Layout */}
                  <Box sx={{ mb: 0.8, borderBottom: '2px solid #333', pb: 0.6 }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', textAlign: 'center', mb: 0.8 }}>
                      අවමංගල්‍ය පැමිණීම ලේඛණය
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
                          <strong>අංකය:</strong> {getDeceasedId(selectedFuneral)}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ fontSize: '11px' }}>
                          <strong>නම:</strong> {getDeceasedName(selectedFuneral)}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" sx={{ fontSize: '11px' }}>
                          <strong>දිනය:</strong> _____ / {formatDate(selectedFuneral.date).split(' ').slice(1).join(' ')}
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

export default FuneralAttendanceSheet;
