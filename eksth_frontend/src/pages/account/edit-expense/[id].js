import React, { useState, useEffect } from "react"
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid2,
  Alert,
  Snackbar,
  CircularProgress
} from "@mui/material"
import { DatePicker } from "@mui/x-date-pickers/DatePicker"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"
import { navigate } from "gatsby"

import Layout from "../../../components/layout"
import AuthComponent from "../../../components/common/AuthComponent"
import api from "../../../utils/api"

const baseUrl = process.env.GATSBY_API_BASE_URL

export default function EditExpense({ params }) {
  const expenseId = params.id
  
  const [roles, setRoles] = useState([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [alert, setAlert] = useState({ open: false, message: "", severity: "success" })

  // Form data
  const [formData, setFormData] = useState({
    date: null,
    category: "",
    description: "",
    amount: "",
    paidTo: "",
    beneficiaryMemberId: ""
  })

  // Category definitions
  const memberBenefitCategories = [
    "මරණ ප්‍රතිලාභ ගෙවීම්",
    "ක්ෂණික ප්‍රතිලාභ ගෙවීම්",
    "මළවුන් රැගෙන යාමේ ගාස්තු",
    "ද්‍රව්‍ය ආධාර හිග"
  ]

  const serviceCategories = [
    "කූඩාරම් හසුරුවීම - කම්කරු ගාස්තු",
    "පිඟන් නිකුත් කිරීම",
    "පුටු නිකුත් කිරීම",
    "බුෆේ සෙට් නිකුත් කිරීම",
    "ශබ්ද විකාශන හසුරුවීම",
    "විදුලි බිල්පත්"
  ]

  const standardCategories = [
    "බැංකු තැන්පතු",
    "කාර්යාල වියදම්",
    "සංස්ථාගත වියදම්",
    "වෙනත්"
  ]

  const allCategories = [...memberBenefitCategories, ...serviceCategories, ...standardCategories]

  const handleAuthStateChange = ({ isAuthenticated, roles }) => {
    setIsAuthenticated(isAuthenticated)
    setRoles(roles)
    if (!isAuthenticated || !roles.includes("treasurer")) {
      navigate("/login/user-login")
    }
  }

  const showAlert = (message, severity) => {
    setAlert({ open: true, message, severity })
  }

  const handleCloseAlert = () => {
    setAlert({ open: false, message: "", severity: "success" })
  }

  // Load expense data
  useEffect(() => {
    const fetchExpense = async () => {
      if (!isAuthenticated || !roles.includes("treasurer")) return
      
      try {
        const response = await api.get(`${baseUrl}/account/expense/${expenseId}`)
        
        if (response.data.success) {
          const expense = response.data.expense
          setFormData({
            date: new Date(expense.date),
            category: expense.category || "",
            description: expense.description || "",
            amount: expense.amount.toString(),
            paidTo: expense.paidTo || "",
            beneficiaryMemberId: expense.beneficiaryMemberId ? expense.beneficiaryMemberId.toString() : ""
          })
        }
      } catch (error) {
        console.error("Error fetching expense:", error)
        showAlert("වියදම ලබා ගැනීමේදී දෝෂයක් සිදුවිය", "error")
      } finally {
        setLoading(false)
      }
    }

    fetchExpense()
  }, [isAuthenticated, roles, expenseId])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateForm = () => {
    const { date, category, amount, description, paidTo, beneficiaryMemberId } = formData

    if (!date || !category || !amount) {
      showAlert("දිනය, ප්‍රවර්ගය සහ මුදල අවශ්‍ය වේ", "error")
      return false
    }

    if (isNaN(amount) || parseFloat(amount) <= 0) {
      showAlert("වලංගු මුදල් ප්‍රමාණයක් ඇතුලත් කරන්න", "error")
      return false
    }

    const isMemberBenefit = memberBenefitCategories.includes(category)
    const isService = serviceCategories.includes(category)

    if (isMemberBenefit) {
      if (!beneficiaryMemberId || parseInt(beneficiaryMemberId) <= 0) {
        showAlert("මෙම ප්‍රවර්ගය සඳහා ප්‍රතිලාභ ලබන සාමාජික අංකය අවශ්‍ය වේ", "error")
        return false
      }
    } else if (isService) {
      if (!description.trim()) {
        showAlert("මෙම ප්‍රවර්ගය සඳහා විස්තරය අවශ්‍ය වේ", "error")
        return false
      }
    } else {
      if (!description.trim() || !paidTo.trim()) {
        showAlert("මෙම ප්‍රවර්ගය සඳහා විස්තරය සහ ගෙවන ලද තැන අවශ්‍ය වේ", "error")
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setSubmitting(true)
    
    try {
      const response = await api.put(`${baseUrl}/account/expense/${expenseId}`, {
        date: formData.date.toISOString(),
        category: formData.category,
        description: formData.description,
        amount: parseFloat(formData.amount),
        paidTo: formData.paidTo,
        beneficiaryMemberId: formData.beneficiaryMemberId ? parseInt(formData.beneficiaryMemberId) : undefined
      })

      if (response.data.success) {
        showAlert("වියදම සාර්ථකව යාවත්කාලීන කරන ලදී", "success")
        setTimeout(() => {
          navigate("/account/view-expenses")
        }, 2000)
      }
    } catch (error) {
      console.error("Error updating expense:", error)
      showAlert("වියදම යාවත්කාලීන කිරීමේදී දෝෂයක් සිදුවිය: " + (error.response?.data?.error || error.message), "error")
    } finally {
      setSubmitting(false)
    }
  }

  // Determine which fields to show based on category
  const isMemberBenefit = memberBenefitCategories.includes(formData.category)
  const isService = serviceCategories.includes(formData.category)

  if (!isAuthenticated) {
    return (
      <Layout>
        <AuthComponent onAuthStateChange={handleAuthStateChange} />
        <Box sx={{ padding: "20px", textAlign: "center" }}>
          <Typography>පුරනය වන්න...</Typography>
        </Box>
      </Layout>
    )
  }

  if (loading) {
    return (
      <Layout>
        <AuthComponent onAuthStateChange={handleAuthStateChange} />
        <Box sx={{ padding: "20px", textAlign: "center" }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>වියදම ලබා ගනිමින්...</Typography>
        </Box>
      </Layout>
    )
  }

  return (
    <Layout>
      <AuthComponent onAuthStateChange={handleAuthStateChange} />
      <section style={{ padding: "20px" }}>
        <Box sx={{ maxWidth: "800px", margin: "0 auto" }}>
          <Paper sx={{ padding: "30px", borderRadius: "10px" }}>
            <Typography
              variant="h4"
              gutterBottom
              sx={{ textAlign: "center", marginBottom: "30px", color: "#2c3e50" }}
            >
              වියදම සංස්කරණය කරන්න
            </Typography>

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <form onSubmit={handleSubmit}>
                <Grid2 container spacing={3}>
                  {/* Date */}
                  <Grid2 size={{ xs: 12, sm: 6 }}>
                    <DatePicker
                      label="දිනය *"
                      value={formData.date}
                      onChange={(newValue) => handleInputChange("date", newValue)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          required: true
                        },
                      }}
                    />
                  </Grid2>

                  {/* Category */}
                  <Grid2 size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth required>
                      <InputLabel>ප්‍රවර්ගය</InputLabel>
                      <Select
                        value={formData.category}
                        label="ප්‍රවර්ගය"
                        onChange={(e) => handleInputChange("category", e.target.value)}
                      >
                        <MenuItem disabled>
                          <em>සාමාජික ප්‍රතිලාභ</em>
                        </MenuItem>
                        {memberBenefitCategories.map((category) => (
                          <MenuItem key={category} value={category}>
                            {category}
                          </MenuItem>
                        ))}
                        <MenuItem disabled>
                          <em>සේවා</em>
                        </MenuItem>
                        {serviceCategories.map((category) => (
                          <MenuItem key={category} value={category}>
                            {category}
                          </MenuItem>
                        ))}
                        <MenuItem disabled>
                          <em>සාමාන්‍ය</em>
                        </MenuItem>
                        {standardCategories.map((category) => (
                          <MenuItem key={category} value={category}>
                            {category}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid2>

                  {/* Amount */}
                  <Grid2 size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      required
                      type="number"
                      label="මුදල (LKR)"
                      value={formData.amount}
                      onChange={(e) => handleInputChange("amount", e.target.value)}
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                  </Grid2>

                  {/* Conditional Fields */}
                  {isMemberBenefit && (
                    <Grid2 size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        required
                        type="number"
                        label="ප්‍රතිලාභ ලබන සාමාජික අංකය"
                        value={formData.beneficiaryMemberId}
                        onChange={(e) => handleInputChange("beneficiaryMemberId", e.target.value)}
                        inputProps={{ min: 1 }}
                      />
                    </Grid2>
                  )}

                  {(isService || (!isMemberBenefit && !isService)) && (
                    <Grid2 size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        required={isService || (!isMemberBenefit && !isService)}
                        multiline
                        rows={3}
                        label="විස්තරය"
                        value={formData.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                      />
                    </Grid2>
                  )}

                  {!isMemberBenefit && !isService && (
                    <Grid2 size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        required
                        label="ගෙවන ලද තැන"
                        value={formData.paidTo}
                        onChange={(e) => handleInputChange("paidTo", e.target.value)}
                      />
                    </Grid2>
                  )}

                  {/* Submit Button */}
                  <Grid2 size={{ xs: 12 }}>
                    <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
                      <Button
                        type="button"
                        variant="outlined"
                        onClick={() => navigate("/account/view-expenses")}
                        disabled={submitting}
                      >
                        අවලංගු කරන්න
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={submitting}
                        sx={{ minWidth: "150px" }}
                      >
                        {submitting ? "යාවත්කාලීන කරමින්..." : "යාවත්කාලීන කරන්න"}
                      </Button>
                    </Box>
                  </Grid2>
                </Grid2>
              </form>
            </LocalizationProvider>
          </Paper>
        </Box>
      </section>

      {/* Alert Snackbar */}
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleCloseAlert} severity={alert.severity}>
          {alert.message}
        </Alert>
      </Snackbar>
    </Layout>
  )
}