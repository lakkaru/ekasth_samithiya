import React, { useEffect, useState } from "react"
import Layout from "../../components/layout"
import loadable from "@loadable/component"
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
} from "@mui/material"
import PeopleIcon from "@mui/icons-material/People"
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom"
import api from "../../utils/api"
import { navigate } from "gatsby"

const AuthComponent = loadable(() =>
  import("../../components/common/AuthComponent")
)

const baseUrl = process.env.GATSBY_API_BASE_URL

export default function SiblingsInfoPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleAuthStateChange = ({ isAuthenticated }) => {
    setIsAuthenticated(isAuthenticated)
    if (!isAuthenticated) {
      navigate("/login/user-login")
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return
    const fetchData = async () => {
      setLoading(true)
      try {
        const res = await api.get(`${baseUrl}/member/withSiblings`)
        if (res.data && res.data.success) {
          setMembers(res.data.members || [])
        }
      } catch (e) {
        console.error("Error loading siblings data", e)
        setError("දත්ත ලබා ගැනීමේ දෝෂයක් ඇත. නැවත උත්සාහ කරන්න.")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [isAuthenticated])

  return (
    <Layout>
      <AuthComponent onAuthStateChange={handleAuthStateChange} />
      <Box sx={{ maxWidth: 900, mx: "auto", px: { xs: 1, sm: 2 }, py: 3 }}>
        {/* Header */}
        <Paper
          elevation={3}
          sx={{
            p: { xs: 2, sm: 3 },
            mb: 3,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            borderRadius: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar
              sx={{
                bgcolor: "rgba(255,255,255,0.2)",
                width: 52,
                height: 52,
              }}
            >
              <FamilyRestroomIcon sx={{ fontSize: 30 }} />
            </Avatar>
            <Box>
              <Typography
                variant="h5"
                fontWeight="bold"
                sx={{ lineHeight: 1.2 }}
              >
                30% සමාජිකත්ව
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
                සහෝදර / සහෝදරී යැපෙන්නන් සහිත සාමාජිකයන්
              </Typography>
            </Box>
          </Box>
          {!loading && members.length > 0 && (
            <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Chip
                icon={<PeopleIcon />}
                label={`සාමාජිකයින් ${members.length} දෙනෙක්`}
                sx={{
                  bgcolor: "rgba(255,255,255,0.2)",
                  color: "white",
                  fontWeight: "bold",
                  "& .MuiChip-icon": { color: "white" },
                }}
              />
            </Box>
          )}
        </Paper>

        {/* Loading */}
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error */}
        {!loading && error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* No data */}
        {!loading && !error && members.length === 0 && (
          <Alert severity="info">
            සහෝදර / සහෝදරී යැපෙන්නන් සහිත සාමාජිකයන් සොයා ගත නොහැකි විය.
          </Alert>
        )}

        {/* Data table */}
        {!loading && members.length > 0 && (
          <TableContainer
            component={Paper}
            elevation={2}
            sx={{ borderRadius: 2 }}
          >
            <Table size="small">
              <TableHead>
                <TableRow
                  sx={{
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  }}
                >
                  <TableCell
                    sx={{ color: "white", fontWeight: "bold", width: 80 }}
                  >
                    අංකය
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                    සාමාජිකයා
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                    ප්‍රදේශය
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                    සහෝදර / සහෝදරී
                  </TableCell>
                  <TableCell
                    sx={{
                      color: "white",
                      fontWeight: "bold",
                      textAlign: "center",
                    }}
                  >
                    ගණන
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {members.map((m, idx) => (
                  <TableRow
                    key={m.member_id}
                    sx={{
                      backgroundColor:
                        idx % 2 === 0
                          ? "rgba(102, 126, 234, 0.04)"
                          : "white",
                      "&:hover": {
                        backgroundColor: "rgba(102, 126, 234, 0.08)",
                      },
                    }}
                  >
                    <TableCell>
                      <Chip
                        label={`#${m.member_id}`}
                        size="small"
                        sx={{
                          bgcolor: "rgba(102,126,234,0.12)",
                          color: "#667eea",
                          fontWeight: "bold",
                          fontSize: "0.75rem",
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {m.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {m.area || "-"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 0.5,
                        }}
                      >
                        {m.siblings.map((s, si) => (
                          <Box
                            key={si}
                            sx={{ display: "flex", alignItems: "center", gap: 1 }}
                          >
                            <Typography variant="body2">{s.name}</Typography>
                            <Chip
                              label={s.relationship}
                              size="small"
                              variant="outlined"
                              sx={{
                                fontSize: "0.7rem",
                                height: 20,
                                borderColor: "#764ba2",
                                color: "#764ba2",
                              }}
                            />
                          </Box>
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ textAlign: "center" }}>
                      <Chip
                        label={m.siblingsCount}
                        size="small"
                        sx={{
                          bgcolor: "#764ba2",
                          color: "white",
                          fontWeight: "bold",
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Note */}
        {!loading && members.length > 0 && (
          <Paper
            elevation={1}
            sx={{
              mt: 3,
              p: 2,
              bgcolor: "rgba(102, 126, 234, 0.06)",
              borderRadius: 2,
              borderLeft: "4px solid #667eea",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              <strong>සටහන:</strong> ඉහළ ලැයිස්තුවේ ඇති සාමාජිකයන්ගේ මාසික
              සාමාජිකත්ව ගෙවීම, සහෝදර / සහෝදරී සංඛ්‍යාවට අනුව 30% බැගින්
              ඉහළ යයි.
            </Typography>
          </Paper>
        )}
      </Box>
    </Layout>
  )
}
