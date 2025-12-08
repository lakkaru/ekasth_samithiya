import React, { useEffect, useState, useRef } from "react"
import Layout from "../../components/layout"
import StickyHeadTable from "../../components/StickyHeadTable"
import { Box, Button, TextField } from "@mui/material"
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers"
import { DemoContainer } from "@mui/x-date-pickers/internals/demo"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import dayjs from "dayjs"
import { navigate } from "gatsby"

import api from "../../utils/api"
//un authorized access preventing
import loadable from "@loadable/component"
const AuthComponent = loadable(() =>
  import("../../components/common/AuthComponent")
)

const baseUrl = process.env.GATSBY_API_BASE_URL


export default function Receipts() {
  const columnsArray = [
    { id: "memberId", label: "සාමාජික අංකය" },
    { id: "name", label: "නම", minWidth: 250 },
    { id: "memPayment", label: "සාමාජික මුදල්" },
    { id: "finePayment", label: "හිග මුදල්" },
    { id: "totPayment", label: "එකතුව" },
    { id: "delete", label: "" },
  ]
  //un authorized access preventing
  const [roles, setRoles] = useState([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const [memberId, setMemberId] = useState("")
  const [memberData, setMemberData] = useState()
  const [membershipPayment, setMembershipPayment] = useState("")
  const [finePayment, setFinePayment] = useState("")
  const [paymentDate, setPaymentDate] = useState(dayjs())
  const [savingData, setSavingData] = useState(false)
  const [payments, setPayments] = useState([])

  const inputRef = useRef(null)

  //un authorized access preventing
  const handleAuthStateChange = ({ isAuthenticated, roles }) => {
    setIsAuthenticated(isAuthenticated)
    setRoles(roles)
    if (!isAuthenticated || (!roles.includes("treasurer") && !roles.includes("auditor"))) {
      navigate("/login/user-login")
    }
  }
  // console.log('logout:', logout)
  // console.log("isAuthenticated:", isAuthenticated)
  // console.log("roles:", roles)
  useEffect(() => {
    // Fetch today's payments when component mounts or date changes
    const fetchPayments = async () => {
      try {
        const response = await api.get(
          `${baseUrl}/account/receipts?date=${paymentDate.format('YYYY-MM-DD')}`
        )
        setPayments(response.data)
      } catch (error) {
        console.error("Error fetching payments:", error)
      }
    }

    fetchPayments()
  }, [paymentDate])

  const getMemberDueId = e => {
    if (e.target.value) {
      api
        .get(`${baseUrl}/member/due?member_id=${e.target.value}`)
        .then(response => {
          // console.log(response?.data)
          setMemberData(response?.data)
        })
        .catch(error => {
          console.error("Axios error: ", error)
        })
    }
  }

  const resetFields = () => {
    setMemberId("")
  }

  const handleNext = async () => {
    setSavingData(true)
    try {
      const paymentData = {
        date: paymentDate,
        memberId: memberId,
        member_Id: memberData.member._id,
        name: memberData.member.name || "N/A",
        memPayment: membershipPayment,
        finePayment: finePayment,
      }

      const response = await api.post(`${baseUrl}/account/receipts`, paymentData)
      
      // Refresh payments list
      const updatedPayments = await api.get(
        `${baseUrl}/account/receipts?date=${paymentDate.format('YYYY-MM-DD')}`
      )
      setPayments(updatedPayments.data)

      // Reset form
      if (inputRef.current) {
        inputRef.current.focus()
      }

      setMemberId("")
      setMemberData()
      setMembershipPayment("")
      setFinePayment("")
    } catch (error) {
      console.error("Error saving payment:", error)
    }
    setSavingData(false)
  }

  const handleDelete = async (date, memberId) => {
    try {
      await api.delete(`${baseUrl}/account/receipts/${date}/${memberId}`)
      
      // Refresh payments list
      const updatedPayments = await api.get(
        `${baseUrl}/account/receipts?date=${paymentDate.format('YYYY-MM-DD')}`
      )
      setPayments(updatedPayments.data)
    } catch (error) {
      console.error("Error deleting payment:", error)
    }
  }

  // Calculate totals from fetched payments
  let totalMemPayment = 0
  let totalFinePayment = 0

  payments.forEach(payment => {
    totalMemPayment += parseFloat(payment.memPayment || 0)
    totalFinePayment += parseFloat(payment.finePayment || 0)
  })

  const totalsRow = {
    memberId: "",
    name: "එකතුව",
    memPayment: totalMemPayment.toFixed(2),
    finePayment: totalFinePayment.toFixed(2),
    totPayment: (totalMemPayment + totalFinePayment).toFixed(2),
    delete: "",
  }

  let dataArray = [
    ...payments.map(payment => ({
      ...payment,
      memPayment: parseFloat(payment.memPayment || 0).toFixed(2),
      finePayment: parseFloat(payment.finePayment || 0).toFixed(2),
      totPayment: (
        parseFloat(payment.finePayment || 0) +
        parseFloat(payment.memPayment || 0)
      ).toFixed(2),
      delete: !roles.includes("auditor") ? (
        <Button
          variant="contained"
          color="error"
          onClick={() => handleDelete(
            payment.date,
            payment.member_Id
          )}
        >
          Delete
        </Button>
      ) : null,
    })),
    totalsRow,
  ]

  //calculate membership due if previous due is negative
  const membershipDue=memberData?.totalDue<=0?memberData?.membershipDue+memberData?.totalDue:memberData?.membershipDue;

  //calculate due if total due is negative
  const totalDue=memberData?.totalDue>0?memberData?.totalDue:'0'
  // Calculate dynamic states directly in the render logic
  // const memPayDisabled = !(
  //   memberData?.totalDue === 0 ||
  //   (finePayment && parseFloat(finePayment) >= memberData?.totalDue)
  // )
  console.log('totalDue: ', memberData?.totalDue)
  const nextDisabled =
    !memberData ||
    (!finePayment && !membershipPayment) ||
    parseFloat(finePayment || 0) < 0 ||
    parseFloat(membershipPayment || 0) < 0 ||
    savingData
    

  return (
    <Layout>
      <AuthComponent onAuthStateChange={handleAuthStateChange} />
      <section>
        {/* Hide payment form for auditors - they should only view data */}
        {!roles.includes("auditor") && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 3,
            }}
          >
            <TextField
              id="outlined-basic"
              inputRef={inputRef}
              label="සා. අංකය"
              variant="outlined"
              type="number"
              value={memberId}
              onChange={e => setMemberId(e.target.value)}
              onBlur={getMemberDueId}
              onFocus={resetFields}
              sx={{ maxWidth: "120px" }}
            />
            
            <TextField
              id="outlined-basic"
              label="සා. මුදල්"
              placeholder={String(membershipDue || "")}
              variant="outlined"
              type="number"
              value={membershipPayment}
              onChange={e => setMembershipPayment(e.target.value)}
              sx={{ maxWidth: "120px" }}
              // disabled={memPayDisabled}
            />
            <TextField
              id="outlined-basic"
              label="හිග මුදල්"
              placeholder={String(totalDue || "")}
              variant="outlined"
              type="number"
              value={finePayment}
              onChange={e => setFinePayment(e.target.value)}
              sx={{ maxWidth: "120px" }}
            />
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={nextDisabled}
            >
              Next
            </Button>
          </Box>
        )}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 4,
            padding: "10px 0px",
          }}
        >
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DemoContainer components={["DatePicker"]}>
              <DatePicker
                label={"ගෙවන දිනය"}
                value={paymentDate}
                onChange={newDate => setPaymentDate(newDate)}
                format="YYYY/MM/DD"
                maxDate={dayjs()}
              />
            </DemoContainer>
          </LocalizationProvider>
        </Box>
        <hr />
        <StickyHeadTable
          columnsArray={columnsArray}
          dataArray={dataArray}
          headingAlignment={"left"}
          dataAlignment={"left"}
        />
      </section>
    </Layout>
  )
}
