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

  const [member, setMember] = useState({})
  const [dueMemberId, setDueMemberId] = useState("")
  const [deceasedOptions, setDeceasedOptions] = useState([])
  const [availableFunerals, setAvailableFunerals] = useState([])
  const [selectedFuneralId, setSelectedFuneralId] = useState("")

  // Fetch available funerals on mount so the treasurer can pick without searching
  useEffect(() => {
    let mounted = true
    api
      .get(`${baseUrl}/funeral/getAvailableFunerals`)
      .then(res => {
        if (!mounted) return
        const funerals = res?.data?.funerals || []
        setAvailableFunerals(funerals)
      })
      .catch(err => {
        console.warn("Could not fetch available funerals on mount:", err)
      })
    return () => {
      mounted = false
    }
  }, [])

  // Helper: derive deceased name from a funeral doc. deceased_id may be the member id
  // or a dependent id. getAvailableFunerals populates `member_id` and its `dependents`.
  const getDeceasedName = fun => {
    if (!fun) return ""
    const deceasedId =
      fun.deceased_id && fun.deceased_id._id
        ? String(fun.deceased_id._id)
        : String(fun.deceased_id || "")
    if (fun.member_id && String(fun.member_id._id) === deceasedId) {
      return fun.member_id.name || ""
    }
    const dep = ((fun.member_id && fun.member_id.dependents) || []).find(
      d => String(d._id) === deceasedId
    )
    if (dep) return dep.name || ""
    if (
      fun.deceased_id &&
      typeof fun.deceased_id === "object" &&
      fun.deceased_id.name
    )
      return fun.deceased_id.name
    return ""
  }

  // Return relationship string for the deceased (e.g. dependent.relationship or 'සාමාජිකයා' when the member is deceased)
  const getDeceasedRelationship = fun => {
    if (!fun) return ""
    const deceasedId =
      fun.deceased_id && fun.deceased_id._id
        ? String(fun.deceased_id._id)
        : String(fun.deceased_id || "")
    // If deceased is the member themself
    if (fun.member_id && String(fun.member_id._id) === deceasedId) {
      return "සාමාජිකයා"
    }
    // find dependent
    const dep = ((fun.member_id && fun.member_id.dependents) || []).find(
      d => String(d._id) === deceasedId
    )
    if (dep && dep.relationship) return dep.relationship
    // if funeral.deceased_id is populated as an object with relationship
    if (
      fun.deceased_id &&
      typeof fun.deceased_id === "object" &&
      fun.deceased_id.relationship
    )
      return fun.deceased_id.relationship
    return ""
  }
  // Format a date as DD/Mon/YYYY (e.g. 12/Jan/2025). Returns empty string for falsy values
  const formatDate = d => {
    if (!d) return ""
    const date = new Date(d)
    if (isNaN(date)) return ""
    const dd = String(date.getDate()).padStart(2, "0")
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ]
    const mon = monthNames[date.getMonth()] || ""
    const yyyy = date.getFullYear()
    return `${dd}/${mon}/${yyyy}`
  }
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
    if (
      !isAuthenticated ||
      !(
        roles.includes("vice-secretary") ||
        roles.includes("treasurer") ||
        roles.includes("auditor")
      )
    ) {
      navigate("/login/user-login")
    }
  }

  const formatCurrency = amount => {
    return new Intl.NumberFormat("si-LK", {
      style: "currency",
      currency: "LKR",
    }).format(Math.abs(amount) || 0)
  }

  // Member search removed — treasurer can select funerals directly
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
      // derive deceased_id from selected funeral
      const selectedFun = (availableFunerals || []).find(
        f => String(f._id) === String(selectedFuneralId)
      )
      const deceasedIdToSend = selectedFun
        ? selectedFun.deceased_id && selectedFun.deceased_id._id
          ? selectedFun.deceased_id._id
          : selectedFun.deceased_id || ""
        : selectedDeceased
      let dueData = {
        dueMemberId,
        amount,
        deceased_id: deceasedIdToSend,
      }

      const res = await api.post(
        `${baseUrl}/funeral/updateMemberExtraDueFines`,
        dueData
      )
      const updatedDue = res?.data?.updatedDue || null

      // Find funeral object for the selected deceased (if available)
      const matchingFuneral =
        (availableFunerals || []).find(
          fun => String(fun._id) === String(selectedFuneralId)
        ) || null

      // Save last added extra due for confirmation display
      setLastAddedExtraDue({
        member_id: updatedDue?.member_id || dueMemberId,
        name: updatedDue?.name || "",
        amount: Number(amount),
        funeral: matchingFuneral,
        fines: updatedDue?.fines || [],
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
    // When a funeral is selected, derive its deceased_id and load extraDue members
    if (!selectedFuneralId) return
    const fun = (availableFunerals || []).find(
      f => String(f._id) === String(selectedFuneralId)
    )
    if (!fun) return
    const deceasedId =
      fun.deceased_id && fun.deceased_id._id
        ? fun.deceased_id._id
        : fun.deceased_id || ""
    setSelectedDeceased(deceasedId)
    api
      .get(
        `${baseUrl}/funeral/getFuneralExDueMembersByDeceasedId?deceased_id=${deceasedId}`
      )
      .then(res => {
        const addedDues = res.data.extraDueMembersPaidInfo || []
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
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
              >
                ඉවත් කරන්න
              </Button>
            ) : null,
          }))
        )
      })
      .catch(err =>
        console.error("Error loading extraDue members for funeral:", err)
      )
  }, [selectedFuneralId, updateTrigger, availableFunerals])
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
              justifyContent: "center",
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
            border: "1px solid #e0e0e0",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              marginBottom: "20px",
              fontWeight: "bold",
              color: "#2c3e50",
              display: "flex",
              alignItems: "center",
            }}
          >
            <PersonIcon sx={{ marginRight: "8px" }} />
            අවමංගල්‍ය සොයන්න
          </Typography>

          <Grid2 container spacing={3} alignItems="flex-start">
            <Grid2 size={{ xs: 12, sm: 6 }}>
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
                        <FuneralIcon
                          sx={{ marginRight: "8px", color: "text.secondary" }}
                        />
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
                  value={selectedFuneralId}
                  onChange={e => setSelectedFuneralId(e.target.value)}
                  displayEmpty
                  sx={{ height: "56px" }}
                >
                  <MenuItem value="" disabled>
                    ලබා ගත හැකි අවමංගල්‍ය තෝරන්න
                  </MenuItem>
                  {availableFunerals.map(fun => {
                    const dateStr = fun.date ? formatDate(fun.date) : ""
                    const displayName = fun.member_id?.name || "Unknown"
                    const memberId = fun.member_id?.member_id || ""
                    return (
                      <MenuItem key={fun._id} value={fun._id}>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <FuneralIcon sx={{ marginRight: "8px", color: "text.secondary" }} />
                          <Box>
                            <div style={{ fontWeight: 700 }}>{memberId} - {displayName}</div>
                            {dateStr && (
                              <div style={{ fontSize: ".8rem", color: "#666" }}>{dateStr}</div>
                            )}
                          </Box>
                        </Box>
                      </MenuItem>
                    )
                  })}
                </Select>
              )}
            </Grid2>

            {/* Deceased person details next to select box for horizontal layout */}
            <Grid2 size={{ xs: 12, sm: 6 }}>
              {selectedFuneralId &&
                (() => {
                  const fun = (availableFunerals || []).find(
                    f => String(f._id) === String(selectedFuneralId)
                  )
                  if (!fun) return null
                  const deceasedName = getDeceasedName(fun)
                  const relationship = getDeceasedRelationship(fun)
                  const areaText = fun.member_id?.area || ""
                  const dateText = fun.date ? formatDate(fun.date) : ""
                  const secondLineParts = []
                  if (areaText) secondLineParts.push(areaText)
                  if (dateText) secondLineParts.push(dateText)
                  // const secondLine = secondLineParts.join(' · ')
                  return (
                    <Card sx={{ backgroundColor: "#fffde7", height: "100%" }}>
                      <CardContent
                        sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 700, mb: 0.5 }}
                        >
                          මියගිය පුද්ගලයා :- {deceasedName}
                          {relationship ? ` — (${relationship})` : ""}
                        </Typography>
                        {/* {secondLine && (
                          <Typography variant="body2" sx={{ color: '#666', mt: 0.25 }}>
                            {secondLine}
                          </Typography>
                        )} */}
                      </CardContent>
                    </Card>
                  )
                })()}
            </Grid2>
          </Grid2>

          {/* Member info display removed — selection is via available funerals */}
        </Paper>
        {/* Add Extra Due Section - Hidden for auditors since they should only view data */}
        {selectedFuneralId && !roles.includes("auditor") && (
          <Paper
            elevation={4}
            sx={{
              padding: "30px",
              marginBottom: "30px",
              borderRadius: "12px",
              border: "1px solid #e0e0e0",
              backgroundColor: "#fafafa",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                marginBottom: "20px",
                fontWeight: "bold",
                color: "#2c3e50",
                display: "flex",
                alignItems: "center",
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
                    startAdornment: (
                      <PersonIcon sx={{ mr: 1, color: "text.secondary" }} />
                    ),
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
                    startAdornment: (
                      <PaymentIcon sx={{ mr: 1, color: "text.secondary" }} />
                    ),
                  }}
                />
                {/* Amount preview removed - value shown in the table below */}
              </Grid2>

              <Grid2 size={{ xs: 12, sm: 4 }}>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={nextDisabled || loading}
                  startIcon={
                    loading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <AddIcon />
                    )
                  }
                  sx={{
                    height: "56px",
                    textTransform: "none",
                    borderRadius: "8px",
                    background:
                      "linear-gradient(135deg, #4caf50 0%, #45a049 100%)",
                  }}
                >
                  {loading ? "ඇතුලත් කරමින්..." : "ඇතුලත් කරන්න"}
                </Button>
              </Grid2>
            </Grid2>
          </Paper>
        )}

        {/* Confirmation panel removed: extra due entries are visible in the table below */}

        <Divider sx={{ marginY: "30px" }} />

        {/* Extra Due Members Table */}
        {dataArray.length > 0 && (
          <Paper
            elevation={4}
            sx={{
              borderRadius: "12px",
              overflow: "hidden",
              border: "1px solid #e0e0e0",
            }}
          >
            <Box
              sx={{
                background: "linear-gradient(135deg, #ff9800 0%, #f57c00 100%)",
                color: "white",
                padding: "20px",
                textAlign: "center",
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
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
              background: "linear-gradient(135deg, #f5f5f5 0%, #eeeeee 100%)",
            }}
          >
            <FuneralIcon
              sx={{ fontSize: 60, color: "#ccc", marginBottom: "20px" }}
            />
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
                paddingY: "12px",
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
