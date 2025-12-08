import React, { useEffect, useState } from "react"
import Layout from "../components/layout"
import { Box, Paper, Link, Typography, List, ListItem, ListItemText, CircularProgress, Grid, Card, CardContent, Avatar, Badge, Divider } from "@mui/material"
import HomeIcon from '@mui/icons-material/Home';
import PeopleIcon from '@mui/icons-material/People';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import WorkOffIcon from '@mui/icons-material/WorkOff';
import api from "../utils/api"

const baseUrl = process.env.GATSBY_API_BASE_URL

export default function Index() {
  const [freeMembers, setFreeMembers] = useState([])
  const [attendanceFree, setAttendanceFree] = useState([])
  const [funeralFree, setFuneralFree] = useState([])
  const [totalActiveMembers, setTotalActiveMembers] = useState(0)
  const [loadingFree, setLoadingFree] = useState(false)

  useEffect(() => {
    const fetchFree = async () => {
      setLoadingFree(true)
      try {
  const res = await api.get(`${baseUrl}/member/freePublic`)
        const data = res.data
        if (data && data.success) {
          // Backwards-compatible: older endpoint returned `members`
          if (data.members) {
            setFreeMembers(data.members || [])
          } else {
            setFreeMembers(data.free || [])
            setAttendanceFree(data.attendanceFree || [])
            setFuneralFree(data.funeralFree || [])
            setTotalActiveMembers(data.counts?.totalActive || 0)
          }
        } else {
          console.warn('Unexpected freePublic response', data)
        }
      } catch (e) {
        console.error('Error loading free members', e)
      } finally {
        setLoadingFree(false)
      }
    }

    fetchFree()
  }, [])

  return (
    <Layout>
      <Box sx={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' }}>
        <Box sx={{ width: { xs: '95%', sm: '90%', lg: '80%' }, mx: 'auto', mt: { xs: 4, sm: 8 } }}>
          {/* Welcome Section */}
          <Paper elevation={8} sx={{ p: { xs: 3, sm: 4 }, borderRadius: 3, textAlign: 'center', bgcolor: 'white', mb: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <Box sx={{ bgcolor: '#1976d2', borderRadius: '50%', width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3, boxShadow: 3 }}>
                <HomeIcon sx={{ color: 'white', fontSize: 40 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 2, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                විල්බාගෙදර එක්සත් අවමංගල්‍යාධාර සමිතියේ වෙබ් පද්ධතිය වෙත ඔබව සාදරයෙන් පිළිගනිමු
              </Typography>
            </Box>
            <Typography sx={{ fontSize: { xs: '1rem', sm: '1.1rem' }, mb: 3, color: '#555', lineHeight: 1.6 }}>
              මෙම පද්ධතිය වෙත &nbsp;
              <Link href="/login/user-login" underline="hover" sx={{ cursor: 'pointer', color: 'primary.main', fontWeight: 'bold' }}>
                 ඇතුළු වී
              </Link>
              , සාමාජික ඔබගේ තොරතුරු වල නිවැරදිතාවය පිරික්සන්න.
            </Typography>
            <Typography sx={{ fontSize: { xs: '.9rem', sm: '1rem' }, mb: 3, color: '#555', lineHeight: 1.6 }}>
              ඔබ මෙම පද්ධතිය භාවිතයේදී සිදුවිය යුතු වෙනස් කමක් දකින්නේ නම් කරුණාකර අපව
              <Link href="https://wa.me/94715316597" target="_blank" rel="noopener noreferrer" underline="hover" color="primary" sx={{ fontWeight: 'bold', ml: 1, mr: 1 }}>
                WhatsApp (0715316597)
              </Link>
              දැනුවත් කරන්න.
            </Typography>
            <Link href="https://docs.google.com/document/d/1W7AZcMk_7kmMhI2NpcIBDO3Dy-2W65rIqXK2i2y-4vk/edit?usp=sharing" target="_blank" rel="noopener noreferrer" underline="hover" sx={{ fontSize: { xs: '1rem', sm: '1.1rem' }, color: 'secondary.main', fontWeight: 'bold' }}>
              📄 සමිති ව්‍යවස්ථාව
            </Link>
          </Paper>

          {/* Special memberships have been moved to a protected page
          <Typography sx={{ textAlign: 'center', color: 'text.secondary', mb: 4 }}>
            විශේෂ සාමාජිකත්වයන් දැක්වීම දැන් ආරක්ෂිත පිටුවක ඇත. කරුණාකර&nbsp;
            <Link href="/login/user-login" underline="hover">ඇතුළත් ව</Link>&nbsp;ව OS පසු
            <strong>Member → Special memberships</strong> මෙනුවෙන් ප්‍රවේශ වන්න.
          </Typography> */}
        </Box>
      </Box>
    </Layout>
  )
}
