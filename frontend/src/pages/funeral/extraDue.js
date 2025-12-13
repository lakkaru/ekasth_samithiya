import React, { useState, useRef, useEffect } from "react"
import Layout from "../../components/layout"
import StickyHeadTable from "../../components/StickyHeadTable"
import {
  Grid2,
  TextField,
  Typography,
  Button,
  Box,
  Select,
  MenuItem,
  Paper,
  Card,
  CardContent,
  Container,
  Divider,
  CircularProgress,
  Alert,
  Chip,
} from "@mui/material"
import {
  Search as SearchIcon,
  Person as PersonIcon,
  Payment as PaymentIcon,
  LocalFlorist as FuneralIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material"

import { navigate } from "gatsby"
import api from "../../utils/api"
import loadable from "@loadable/component"
const AuthComponent = loadable(() =>
  import("../../components/common/AuthComponent")
)

const baseUrl = process.env.GATSBY_API_BASE_URL

export default function ExtraDue() {
  //un authorized access preventing
  const [roles, setRoles] = useState([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const [memberId, setMemberId] = useState("")
  const [member, setMember] = useState({})
  const [dueMemberId, setDueMemberId] = useState("")
  const [deceasedOptions, setDeceasedOptions] = useState([])
  const [availableFunerals, setAvailableFunerals] = useState([])

  // Fetch available funerals on mount so the treasurer can pick without searching
  useEffect(() => {
    let mounted = true
    api.get(`${baseUrl}/funeral/getAvailableFunerals`)
      .then(res => {
        if (!mounted) return
        const funerals = res?.data?.funerals || []
        setAvailableFunerals(funerals)
      })
      .catch(err => {
        console.warn('Could not fetch available funerals on mount:', err)
      })
    return () => { mounted = false }
  }, [])
  const [selectedDeceased, setSelectedDeceased] = useState("")
  const [amount, setAmount] = useState("")
  const [updateTrigger, setUpdateTrigger] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [error, setError] = useState("")
  const [lastAddedExtraDue, setLastAddedExtraDue] = useState(null)

  // const [dueData, setDueData] = useState(0)
  const [dataArray, setDataArray] = useState([])

  const inputRef = useRef(null)

  const columnsArray = [
    { id: "memberId", label: "සාමාජික අංකය", minWidth: 120 },
    { id: "name", label: "නම", minWidth: 250 },
    { id: "extraDue", label: "හිග මුදල (රු.)", minWidth: 150 },
    { id: "delete", label: "ක්‍රියාව", minWidth: 150 },
  ]

  const handleAuthStateChange = ({ isAuthenticated, roles }) => {
    setIsAuthenticated(isAuthenticated)
    setRoles(roles)
    if (!isAuthenticated || !(roles.includes("vice-secretary") || roles.includes("treasurer") || roles.includes("auditor"))) {
      navigate("/login/user-login")
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('si-LK', {
      style: 'currency',
      currency: 'LKR'
    }).format(Math.abs(amount) || 0)
  }

  const getMemberById = async () => {
    if (!memberId) {
      setError("සාමාජික අංකය ඇතුලත් කරන්න")
      return
    }

    setSearchLoading(true)
    setError("")
    
    try {
      const response = await api.get(`${baseUrl}/member/getMembershipDeathById?member_id=${memberId}`)
      const data = response?.data?.data || {}
      console.log(data.member)
      setMember(data.member || {})

      // Prepare deceased options
      const deceased = []
      if (data.member?.dateOfDeath) {
        deceased.push({
          name: data.member.name,
          id: "member",
          isMember: true,
        })
      }
      data.dependents.forEach(dependent => {
        if (dependent.dateOfDeath) {
          deceased.push({
            name: dependent.name,
            id: dependent._id,
            isMember: false,
          })
        }
      })
      setDeceasedOptions(deceased)
      setAvailableFunerals(prev => prev)
      
      if (deceased.length === 0) {
        setError("මෙම සාමාජිකයා සඳහා මරණ සටහන් නොමැත")
      }
    } catch (error) {
      console.error("Axios error: ", error)
      setError("සාමාජික තොරතුරු ලබා ගැනීමේදී දෝෂයක් ඇති විය")
    } finally {
      setSearchLoading(false)
    }
  }
  const handleSelectChange = event => {
    setSelectedDeceased(event.target.value)
    // console.log(event.target.value)
  }
  const nextDisabled = dueMemberId === "" || amount === ""

  const handleDelete = async (fine_id, member_id) => {
    console.log("fine_id: ", fine_id)
    console.log("member_id: ", member_id)

    const fineData = { member_id, fine_id }

    try {
      const res = await api.post(`${baseUrl}/member/deleteFine`, fineData)
      console.log(res)
      // Ensure re-render by updating state
      setUpdateTrigger(prev => !prev)
    } catch (err) {
      console.error("Error deleting fine:", err)
      setError("දඩ මුදල් ඉවත් කිරීමේදී දෝෂයක් ඇති විය")
    }
  }

  const resetForm = () => {
    setMemberId("")
    setMember({})
    setDeceasedOptions([])
    setSelectedDeceased("")
    setDueMemberId("")
    setAmount("")
    setDataArray([])
    setError("")
  }

  const handleNext = async () => {
    if (!dueMemberId || !amount) {
      setError("සාමාජික අංකය සහ මුදල ඇතුලත් කරන්න")
      return
    }

    setLoading(true)
    setError("")

    try {
      let dueData = {
        dueMemberId,
        amount,
        deceased_id: selectedDeceased,
      }

      const res = await api.post(`${baseUrl}/funeral/updateMemberExtraDueFines`, dueData)
      const updatedDue = res?.data?.updatedDue || null

      // Find funeral object for the selected deceased (if available)
      const matchingFuneral = (availableFunerals || []).find(fun => {
        const deceasedId = fun.deceased_id && fun.deceased_id._id ? fun.deceased_id._id : (fun.deceased_id || '');
        return String(deceasedId) === String(selectedDeceased);
      }) || null

      // Save last added extra due for confirmation display
      setLastAddedExtraDue({
        member_id: updatedDue?.member_id || dueMemberId,
        name: updatedDue?.name || '',
        amount: Number(amount),
        funeral: matchingFuneral,
        fines: updatedDue?.fines || []
      })

      // Clear form after successful submission
      setDueMemberId("")
      setAmount("")
      // Trigger re-render by updating state
      setUpdateTrigger(prev => !prev)
    } catch (error) {
      console.error("Error in handleNext:", error)
      setError("මුදල් ගෙවීමේදී දෝෂයක් ඇති විය")
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    if (selectedDeceased !== "") {
      api
        .get(
          `${baseUrl}/funeral/getFuneralExDueMembersByDeceasedId?deceased_id=${selectedDeceased}`
        )
        .then(res => {
          console.log(res.data.extraDueMembersPaidInfo)
          const addedDues = res.data.extraDueMembersPaidInfo
          setDataArray(
            addedDues.map(addedDue => ({
              ...addedDue,
              delete: !roles.includes("auditor") ? (
                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleDelete(addedDue.id, addedDue.memberId)}
                  sx={{
                    textTransform: "none",
                    borderRadius: "6px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                  }}
                >
                  ඉවත් කරන්න
                </Button>
              ) : null,
            }))
          )
        })
    }
  }, [selectedDeceased, updateTrigger])
  return (
    <Layout>
      <AuthComponent onAuthStateChange={handleAuthStateChange} />
      <Container maxWidth="lg" sx={{ padding: "20px" }}>
        {/* Page Header */}
        <Box sx={{ textAlign: "center", marginBottom: "40px" }}>
          <Typography
            variant="h4"
            gutterBottom
            sx={{ 
              fontWeight: "bold", 
              color: "#2c3e50",
              marginBottom: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <FuneralIcon sx={{ marginRight: "10px", fontSize: "2rem" }} />
            අවමංගල්‍ය අතිරේක ආධාර හිඟ
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            අවමංගල්‍ය සම්බන්ධ අතිරේක ආධාර හිඟ මුදල් කළමනාකරණය
          </Typography>
        </Box>

        {/* Error Display */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ marginBottom: "20px" }}
            onClose={() => setError("")}
          >
            {error}
          </Alert>
        )}

        {/* Member Search Section */}
        <Paper 
          elevation={4} 
          sx={{ 
            padding: "30px", 
            marginBottom: "30px", 
            borderRadius: "12px",
            border: "1px solid #e0e0e0"
          }}
        >
          <Typography 
            variant="h6" 
            sx={{ 
              marginBottom: "20px", 
              fontWeight: "bold", 
              color: "#2c3e50",
              display: "flex",
              alignItems: "center"
            }}
          >
            <PersonIcon sx={{ marginRight: "8px" }} />
            අවමංගල්‍ය සොයන්න
          </Typography>
          
          <Grid2 
            container 
            spacing={3} 
            alignItems="center"
          >
            <Grid2 size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="සාමාජික අංකය"
                variant="outlined"
                type="number"
                value={memberId}
                onChange={e => {
                  setMemberId(e.target.value)
                  setDeceasedOptions([])
                  setSelectedDeceased("")
                  setMember({})
                  setError("")
                }}
                placeholder="සාමාජික අංකය ඇතුලත් කරන්න"
                InputProps={{
                  startAdornment: <PersonIcon sx={{ mr: 1, color: "text.secondary" }} />
                }}
              />
            </Grid2>
            <Grid2 size={{ xs: 12, sm: 3 }}>
              <Button
                variant="contained"
                onClick={getMemberById}
                disabled={searchLoading || !memberId}
                startIcon={searchLoading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
                sx={{
                  height: "56px",
                  textTransform: "none",
                  borderRadius: "8px"
                }}
              >
                {searchLoading ? "සොයමින්..." : "සොයන්න"}
              </Button>
            </Grid2>
            <Grid2 size={{ xs: 12, sm: 5 }}>
              {/* Deceased options from searched member (if any) */}
              {member._id && (
                <Select
                  fullWidth
                  value={selectedDeceased}
                  onChange={handleSelectChange}
                  displayEmpty
                  sx={{ height: "56px", mb: 1 }}
                >
                  <MenuItem value="" disabled>
                    මියගිය පුද්ගලයා තෝරන්න
                  </MenuItem>
                  {deceasedOptions.map(option => (
                    <MenuItem key={option.id} value={option.id}>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <FuneralIcon sx={{ marginRight: "8px", color: "text.secondary" }} />
                        {option.name}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              )}

              {/* Always show available funerals selector (newest first) so treasurer can pick without searching a member */}
              {availableFunerals && availableFunerals.length > 0 && (
                <Select
                  fullWidth
                  value={selectedDeceased}
                  onChange={e => setSelectedDeceased(e.target.value)}
                  displayEmpty
                  sx={{ height: "56px" }}
                >
                  <MenuItem value="" disabled>
                    ලබා ගත හැකි අවමංගල්‍ය තෝරන්න
                  </MenuItem>
                  {availableFunerals.map(fun => {
                    const deceasedId = fun.deceased_id && fun.deceased_id._id ? fun.deceased_id._id : (fun.deceased_id || '')
                    const displayName = fun.member_id?.name || 'Unknown'
                    const dateStr = fun.date ? new Date(fun.date).toLocaleDateString() : ''
                    return (
                      <MenuItem key={fun._id} value={deceasedId}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <FuneralIcon sx={{ marginRight: '8px', color: 'text.secondary' }} />
                          <Box>
                            <div>{displayName}</div>
                            <div style={{ fontSize: '.8rem', color: '#666' }}>{dateStr}</div>
                          </Box>
                        </Box>
                      </MenuItem>
                    )
                  })}
                </Select>
              )}
            </Grid2>
          </Grid2>

          {/* Member Info Display */}
          {member.name && (
            <Card sx={{ marginTop: "20px", backgroundColor: "#f8f9fa" }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  සාමාජික තොරතුරු
                </Typography>
                <Grid2 container spacing={2}>
                  <Grid2 size={{ xs: 6, sm: 3 }}>
                    <Typography variant="body2" color="textSecondary">නම:</Typography>
                    <Typography variant="body1" fontWeight="bold">{member.name}</Typography>
                  </Grid2>
                  <Grid2 size={{ xs: 6, sm: 3 }}>
                    <Typography variant="body2" color="textSecondary">ප්‍රදේශය:</Typography>
                    <Typography variant="body1">{member.area || "නොමැත"}</Typography>
                  </Grid2>
                  <Grid2 size={{ xs: 6, sm: 3 }}>
                    <Typography variant="body2" color="textSecondary">ජංගම:</Typography>
                    <Typography variant="body1">{member.mob_tel || "නොමැත"}</Typography>
                  </Grid2>
                  <Grid2 size={{ xs: 6, sm: 3 }}>
                    <Typography variant="body2" color="textSecondary">නිවස:</Typography>
                    <Typography variant="body1">{member.res_tel || "නොමැත"}</Typography>
                  </Grid2>
                </Grid2>
              </CardContent>
            </Card>
          )}
        </Paper>
        {/* Add Extra Due Section - Hidden for auditors since they should only view data */}
        {selectedDeceased && !roles.includes("auditor") && (
          <Paper 
            elevation={4} 
            sx={{ 
              padding: "30px", 
              marginBottom: "30px", 
              borderRadius: "12px",
              border: "1px solid #e0e0e0",
              backgroundColor: "#fafafa"
            }}
          >
            <Typography 
              variant="h6" 
              sx={{ 
                marginBottom: "20px", 
                fontWeight: "bold", 
                color: "#2c3e50",
                display: "flex",
                alignItems: "center"
              }}
            >
              <AddIcon sx={{ marginRight: "8px" }} />
              අතිරේක ආධාර හිඟ මුදල් ඇතුලත් කරන්න
            </Typography>
            
            <Grid2 container spacing={3} alignItems="center">
              <Grid2 size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  inputRef={inputRef}
                  label="සාමාජික අංකය"
                  variant="outlined"
                  type="number"
                  value={dueMemberId}
                  onChange={e => setDueMemberId(e.target.value)}
                  placeholder="සා. අංකය"
                  InputProps={{
                    startAdornment: <PersonIcon sx={{ mr: 1, color: "text.secondary" }} />
                  }}
                />
              </Grid2>
              
              <Grid2 size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="මුදල (රු.)"
                  variant="outlined"
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="මුදල ඇතුලත් කරන්න"
                  InputProps={{
                    startAdornment: <PaymentIcon sx={{ mr: 1, color: "text.secondary" }} />
                  }}
                />
                {amount && (
                  <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: "block" }}>
                    ප්‍රදර්ශනය: {formatCurrency(amount)}
                  </Typography>
                )}
              </Grid2>
              
              <Grid2 size={{ xs: 12, sm: 4 }}>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={nextDisabled || loading}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
                  sx={{
                    height: "56px",
                    textTransform: "none",
                    borderRadius: "8px",
                    background: "linear-gradient(135deg, #4caf50 0%, #45a049 100%)"
                  }}
                >
                  {loading ? "ඇතුලත් කරමින්..." : "ඇතුලත් කරන්න"}
                </Button>
              </Grid2>
            </Grid2>
          </Paper>
        )}

        {/* Confirmation panel for last added extra due */}
        {lastAddedExtraDue && (
          <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2, backgroundColor: '#e8f5e9' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#2e7d32' }}>අතිරේක ආධාර හිඟ එකතු කරන ලදි</Typography>
            <Box sx={{ mt: 1 }}>
              <Typography><strong>සා. අංකය:</strong> {lastAddedExtraDue.member_id}</Typography>
              <Typography><strong>නම:</strong> {lastAddedExtraDue.name}</Typography>
              <Typography><strong>මුදල:</strong> {formatCurrency(lastAddedExtraDue.amount)}</Typography>
              {lastAddedExtraDue.funeral && (
                <Typography><strong>අවමංගල්‍යය:</strong> {lastAddedExtraDue.funeral.member_id?.name || '-'} ({new Date(lastAddedExtraDue.funeral.date).toLocaleDateString()})</Typography>
              )}
              <Box sx={{ mt: 2 }}>
                <Button variant="contained" color="primary" onClick={() => setLastAddedExtraDue(null)} sx={{ mr: 2 }}>හරි</Button>
                <Button variant="outlined" onClick={() => { setLastAddedExtraDue(null); resetForm(); }}>නව සෙවුමක්</Button>
              </Box>
            </Box>
          </Paper>
        )}

        <Divider sx={{ marginY: "30px" }} />

        {/* Extra Due Members Table */}
        {dataArray.length > 0 && (
          <Paper 
            elevation={4} 
            sx={{ 
              borderRadius: "12px",
              overflow: "hidden",
              border: "1px solid #e0e0e0"
            }}
          >
            <Box sx={{ 
              background: "linear-gradient(135deg, #ff9800 0%, #f57c00 100%)",
              color: "white",
              padding: "20px",
              textAlign: "center"
            }}>
              <Typography
                variant="h6"
                sx={{ 
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <PaymentIcon sx={{ marginRight: "8px" }} />
                අතිරේක ආධාර හිඟ සාමාජිකයන්
              </Typography>
            </Box>
            <Box sx={{ padding: "20px" }}>
              <StickyHeadTable
                columnsArray={columnsArray}
                dataArray={dataArray}
                headingAlignment={"center"}
                dataAlignment={"center"}
                totalRow={false}
              />
            </Box>
          </Paper>
        )}

        {/* No Data Display */}
        {selectedDeceased && dataArray.length === 0 && (
          <Paper 
            elevation={2} 
            sx={{ 
              padding: "40px", 
              textAlign: "center",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #f5f5f5 0%, #eeeeee 100%)"
            }}
          >
            <FuneralIcon sx={{ fontSize: 60, color: "#ccc", marginBottom: "20px" }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              අතිරේක ආධාර හිඟ සාමාජිකයන් නොමැත
            </Typography>
            <Typography variant="body2" color="textSecondary">
              මෙම අවමංගල්‍යය සඳහා අතිරේක ආධාර හිඟ සාමාජිකයන් මෙහි පෙන්වනු ඇත
            </Typography>
          </Paper>
        )}

        {/* Reset Button */}
        {(member.name || selectedDeceased || dataArray.length > 0) && (
          <Box sx={{ textAlign: "center", marginTop: "30px" }}>
            <Button
              variant="outlined"
              color="secondary"
              onClick={resetForm}
              sx={{
                textTransform: "none",
                borderRadius: "8px",
                paddingX: "30px",
                paddingY: "12px"
              }}
            >
              නව සෙවුමක් ආරම්භ කරන්න
            </Button>
          </Box>
        )}
      </Container>
    </Layout>
  )
}
