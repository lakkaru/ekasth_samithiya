import React, { useEffect, useState } from "react"
import Layout from "../../components/layout"
import loadable from "@loadable/component"
import { Box, Card, CardContent, Typography, Grid, Avatar, Badge, Divider, List, ListItem, ListItemText, CircularProgress } from "@mui/material"
import PeopleIcon from '@mui/icons-material/People'
import EventBusyIcon from '@mui/icons-material/EventBusy'
import WorkOffIcon from '@mui/icons-material/WorkOff'
import api from "../../utils/api"
import { navigate } from "gatsby"

const AuthComponent = loadable(() => import("../../components/common/AuthComponent"))

// api already has baseURL configured via src/utils/api.js

export default function SpecialMemberships() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [roles, setRoles] = useState([])

  const [freeMembers, setFreeMembers] = useState([])
  const [attendanceFree, setAttendanceFree] = useState([])
  const [funeralFree, setFuneralFree] = useState([])
  const [totalActiveMembers, setTotalActiveMembers] = useState(0)
  const [loadingFree, setLoadingFree] = useState(false)

  const handleAuthStateChange = ({ isAuthenticated, roles }) => {
    setIsAuthenticated(isAuthenticated)
    setRoles(roles)
    if (!isAuthenticated) {
      navigate('/login/user-login')
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return
    const fetchFree = async () => {
      setLoadingFree(true)
      try {
  // reuse public endpoint but page is protected by AuthComponent
  const res = await api.get(`/member/freePublic`)
        const data = res.data
        if (data && data.success) {
          setFreeMembers(data.free || [])
          setAttendanceFree(data.attendanceFree || [])
          setFuneralFree(data.funeralFree || [])
          setTotalActiveMembers(data.counts?.totalActive || 0)
        }
      } catch (e) {
        console.error('Error loading free members', e)
      } finally {
        setLoadingFree(false)
      }
    }

    fetchFree()
  }, [isAuthenticated])

  return (
    <Layout>
      <AuthComponent onAuthStateChange={handleAuthStateChange} />
      <Box sx={{ minHeight: '80vh', display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Box sx={{ width: { xs: '95%', sm: '90%', lg: '80%' }, mx: 'auto' }}>
          <Typography variant="h5" sx={{ mb: 3, textAlign: 'center', color: '#1976d2' }}>
            විශේෂ සාමාජිකත්වයන් (සමිති සාමාජිකත්වය - {totalActiveMembers})
          </Typography>

          <Grid container spacing={3} sx={{ pb: { xs: 4, sm: 6 } }}>
            <Grid item xs={12} md={4}>
              <Card elevation={4} sx={{ height: '100%', borderRadius: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: '#4caf50', mr: 2 }}>
                      <PeopleIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                        පුර්ණ නිදහස් සාමාජිකයින්
                      </Typography>
                      <Badge badgeContent={freeMembers.length} color="primary" sx={{ '& .MuiBadge-badge': { fontSize: '0.9rem', fontWeight: 'bold' } }} />
                    </Box>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  {loadingFree ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : (
                    <List dense sx={{ maxHeight: 300, overflowY: 'auto' }}>
                      {freeMembers.length === 0 ? (
                        <ListItem>
                          <ListItemText primary="කිසිදු සාමාජිකයෙකු නැත" sx={{ textAlign: 'center', color: 'text.secondary', fontStyle: 'italic' }} />
                        </ListItem>
                      ) : (
                        freeMembers.map(m => (
                          <ListItem key={`free-${m.member_id}`} sx={{ borderRadius: 1, '&:hover': { bgcolor: '#f5f5f5' } }}>
                            <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem', bgcolor: '#4caf50', mr: 2 }}>{m.name ? m.name.charAt(0).toUpperCase() : m.member_id.toString().slice(-1)}</Avatar>
                            <ListItemText primary={`${m.member_id} — ${m.name || '---'}`} secondary={m.area} primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 'medium' }} secondaryTypographyProps={{ fontSize: '0.8rem' }} />
                          </ListItem>
                        ))
                      )}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card elevation={4} sx={{ height: '100%', borderRadius: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: '#ff9800', mr: 2 }}>
                      <EventBusyIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#ff9800' }}>සහභාගීත්ව නිදහස්</Typography>
                      <Badge badgeContent={attendanceFree.length} color="warning" sx={{ '& .MuiBadge-badge': { fontSize: '0.9rem', fontWeight: 'bold' } }} />
                    </Box>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  {loadingFree ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : (
                    <List dense sx={{ maxHeight: 300, overflowY: 'auto' }}>
                      {attendanceFree.length === 0 ? (
                        <ListItem>
                          <ListItemText primary="කිසිදු සාමාජිකයෙකු නැත" sx={{ textAlign: 'center', color: 'text.secondary', fontStyle: 'italic' }} />
                        </ListItem>
                      ) : (
                        attendanceFree.map(m => (
                          <ListItem key={`att-${m.member_id}`} sx={{ borderRadius: 1, '&:hover': { bgcolor: '#f5f5f5' } }}>
                            <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem', bgcolor: '#ff9800', mr: 2 }}>{m.name ? m.name.charAt(0).toUpperCase() : m.member_id.toString().slice(-1)}</Avatar>
                            <ListItemText primary={`${m.member_id} — ${m.name || '---'}`} secondary={m.area} primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 'medium' }} secondaryTypographyProps={{ fontSize: '0.8rem' }} />
                          </ListItem>
                        ))
                      )}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card elevation={4} sx={{ height: '100%', borderRadius: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: '#9c27b0', mr: 2 }}>
                      <WorkOffIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#9c27b0' }}>අවමංගල්‍ය කටයුතු නිදහස්</Typography>
                      <Badge badgeContent={funeralFree.length} color="secondary" sx={{ '& .MuiBadge-badge': { fontSize: '0.9rem', fontWeight: 'bold' } }} />
                    </Box>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  {loadingFree ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : (
                    <List dense sx={{ maxHeight: 300, overflowY: 'auto' }}>
                      {funeralFree.length === 0 ? (
                        <ListItem>
                          <ListItemText primary="කිසිදු සාමාජිකයෙකු නැත" sx={{ textAlign: 'center', color: 'text.secondary', fontStyle: 'italic' }} />
                        </ListItem>
                      ) : (
                        funeralFree.map(m => (
                          <ListItem key={`fun-${m.member_id}`} sx={{ borderRadius: 1, '&:hover': { bgcolor: '#f5f5f5' } }}>
                            <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem', bgcolor: '#9c27b0', mr: 2 }}>{m.name ? m.name.charAt(0).toUpperCase() : m.member_id.toString().slice(-1)}</Avatar>
                            <ListItemText primary={`${m.member_id} — ${m.name || '---'}`} secondary={m.area} primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 'medium' }} secondaryTypographyProps={{ fontSize: '0.8rem' }} />
                          </ListItem>
                        ))
                      )}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Layout>
  )
}
