import React, { useState, useEffect } from "react"
import {
    Box,
    Button,
    Typography,
    Alert,
    Snackbar,
    Paper,
    CircularProgress,
} from "@mui/material"
import {
    AttachMoney as MoneyIcon,
} from "@mui/icons-material"
import Layout from "../../components/layout"
import StickyHeadTable from "../../components/StickyHeadTable"
import { navigate } from "gatsby"
import api from "../../utils/api"

//un authorized access preventing
import loadable from "@loadable/component"
const AuthComponent = loadable(() =>
    import("../../components/common/AuthComponent")
)

const baseUrl = process.env.GATSBY_API_BASE_URL

export default function DueList() {
    //un authorized access preventing
    const [roles, setRoles] = useState([])
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    const [alert, setAlert] = useState({ open: false, message: "", severity: "success" })
    const [loading, setLoading] = useState(false)
    const [members, setMembers] = useState([])

    const handleAuthStateChange = ({ isAuthenticated, roles }) => {
        setIsAuthenticated(isAuthenticated)
        setRoles(roles)
        const allowedRoles = ["vice-secretary", "treasurer"]
        if (!isAuthenticated || !roles.some(role => allowedRoles.includes(role))) {
            navigate("/login/user-login")
        }
    }

    const handleCloseAlert = () => {
        setAlert({ ...alert, open: false })
    }

    const showAlert = (message, severity = "success") => {
        setAlert({ open: true, message, severity })
    }

    // Fetch all members due on component mount
    useEffect(() => {
        if (isAuthenticated) {
            fetchMembersDue()
        }
    }, [isAuthenticated])

    const fetchMembersDue = async () => {
        setLoading(true)
        try {
            const response = await api.get(`${baseUrl}/member/getAllMembersDue`)

            if (response.data.success) {
                setMembers(response.data.members || [])
                showAlert(`සාමාජිකයන් ${response.data.count} දෙනෙකුගේ විස්තර ලබා ගන්නා ලදී`, "success")
            }
        } catch (error) {
            console.error("Error fetching members due:", error)
            const errorMessage = error.response?.data?.message || "සාමාජික හිඟ විස්තර ලබා ගැනීමේදී දෝෂයක් සිදුවිය"
            showAlert(errorMessage, "error")
            setMembers([])
        } finally {
            setLoading(false)
        }
    }

    // Table columns definition
    const columnsArray = [
        { id: "member_id", label: "සා.අංකය", minWidth: 80 },
        { id: "name", label: "නම", minWidth: 200 },
        { id: "status", label: "තත්ත්වය", minWidth: 100 },
        { id: "amount", label: "මුදල", minWidth: 120, align: "right" },
    ]

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('si-LK', {
            style: 'currency',
            currency: 'LKR',
            minimumFractionDigits: 2
        }).format(Math.abs(amount) || 0)
    }

    // Map member data for table display with color coding
    const tableData = members.map(member => {
        const isDue = member.totalDue > 0
        const isExtra = member.totalDue < 0
        const isZero = member.totalDue === 0

        let statusColor = '#666'
        let statusEmoji = '⚪'
        let statusText = 'හිඟ'

        if (isDue) {
            statusColor = '#d32f2f'
            statusEmoji = '🔴'
            statusText = 'හිඟ'
        } else if (isExtra) {
            statusColor = '#2e7d32'
            statusEmoji = '🟢'
            statusText = 'ඉතිරි'
        }

        return {
            member_id: member.member_id,
            name: member.name,
            status: (
                <Box sx={{ color: statusColor, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <span>{statusEmoji}</span>
                    <span>{statusText}</span>
                </Box>
            ),
            amount: (
                <Box sx={{ color: statusColor, fontWeight: 'bold' }}>
                    {formatCurrency(member.totalDue)}
                </Box>
            ),
            onClick: () => navigate(`/member/fullDetails?memberId=${member.member_id}`)
        }
    })

    // Calculate summary statistics
    const totalDue = members.filter(m => m.totalDue > 0).reduce((sum, m) => sum + m.totalDue, 0)
    const totalExtra = members.filter(m => m.totalDue < 0).reduce((sum, m) => sum + Math.abs(m.totalDue), 0)
    const dueCount = members.filter(m => m.totalDue > 0).length
    const extraCount = members.filter(m => m.totalDue < 0).length
    const zeroCount = members.filter(m => m.totalDue === 0).length

    return (
        <Layout>
            <AuthComponent onAuthStateChange={handleAuthStateChange} />
            <section>
                <Snackbar
                    open={alert.open}
                    autoHideDuration={6000}
                    onClose={handleCloseAlert}
                    anchorOrigin={{ vertical: "top", horizontal: "center" }}
                    sx={{ marginTop: "25vh" }}
                >
                    <Alert onClose={handleCloseAlert} severity={alert.severity}>
                        {alert.message}
                    </Alert>
                </Snackbar>

                <Box
                    sx={{
                        maxWidth: "1200px",
                        margin: "20px auto",
                        padding: "20px",
                    }}
                >
                    <Typography
                        variant="h5"
                        sx={{ marginBottom: "20px", textAlign: "center", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}
                    >
                        <MoneyIcon />
                        සියලු සාමාජික හිඟ/ඉතිරි ලැයිස්තුව
                    </Typography>

                    {/* Summary Section */}
                    <Paper elevation={2} sx={{ padding: "20px", marginBottom: "20px", bgcolor: '#f5f7fa' }}>
                        <Typography variant="h6" sx={{ marginBottom: "15px" }}>
                            සාරාංශය
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                            <Box>
                                <Typography variant="body2" color="text.secondary">මුළු සාමාජිකයන්</Typography>
                                <Typography variant="h6">{members.length} දෙනා</Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">හිඟ ඇති සාමාජිකයන්</Typography>
                                <Typography variant="h6" sx={{ color: '#d32f2f' }}>🔴 {dueCount} දෙනා</Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">ඉතිරි ඇති සාමාජිකයන්</Typography>
                                <Typography variant="h6" sx={{ color: '#2e7d32' }}>🟢 {extraCount} දෙනා</Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">හිඟ නැති සාමාජිකයන්</Typography>
                                <Typography variant="h6">⚪ {zeroCount} දෙනා</Typography>
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 2, pt: 2, borderTop: '1px solid #ddd' }}>
                            <Box>
                                <Typography variant="body2" color="text.secondary">මුළු හිඟ මුදල</Typography>
                                <Typography variant="h6" sx={{ color: '#d32f2f' }}>{formatCurrency(totalDue)}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">මුළු ඉතිරි මුදල</Typography>
                                <Typography variant="h6" sx={{ color: '#2e7d32' }}>{formatCurrency(totalExtra)}</Typography>
                            </Box>
                        </Box>
                    </Paper>

                    {/* Refresh Button */}
                    <Box sx={{ marginBottom: "20px", display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={fetchMembersDue}
                            disabled={loading}
                            sx={{ textTransform: "none" }}
                        >
                            {loading ? "යාවත්කාලීන කරමින්..." : "යාවත්කාලීන කරන්න"}
                        </Button>
                    </Box>

                    {/* Results Section */}
                    <Paper elevation={3} sx={{ padding: "20px" }}>
                        <Typography variant="h6" sx={{ marginBottom: "15px" }}>
                            සාමාජික ලැයිස්තුව
                        </Typography>

                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                                <CircularProgress />
                            </Box>
                        ) : members.length > 0 ? (
                            <StickyHeadTable
                                columnsArray={columnsArray}
                                dataArray={tableData}
                                headingAlignment="left"
                                dataAlignment="left"
                                totalRow={false}
                                hidePagination={false}
                            />
                        ) : (
                            <Box
                                sx={{
                                    textAlign: "center",
                                    padding: "40px",
                                    color: "text.secondary",
                                }}
                            >
                                <Typography variant="body1">
                                    සාමාජික විස්තර ලබා ගත නොහැකි විය
                                </Typography>
                            </Box>
                        )}
                    </Paper>
                </Box>
            </section>
        </Layout>
    )
}
