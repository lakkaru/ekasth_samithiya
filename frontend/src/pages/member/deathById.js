import React, { useState } from "react"
import Layout from "../../components/layout"
import { Box, Button, TextField, Typography, Radio } from "@mui/material"
import StickyHeadTable from "../../components/StickyHeadTable"
import BasicDatePicker from "../../components/common/basicDatePicker"
import dayjs from "dayjs"

import { navigate } from "gatsby"
import api from "../../utils/api"
import loadable from "@loadable/component"
const AuthComponent = loadable(() =>
  import("../../components/common/AuthComponent")
)

const baseUrl = process.env.GATSBY_API_BASE_URL

export default function DeathById() {
  //un authorized access preventing
  const [roles, setRoles] = useState([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const [memberId, setMemberId] = useState("")
  //   const [member, setMember] = useState({})
  const [familyRegister, setFamilyRegister] = useState([])
  const [selectedDeath, setSelectedDeath] = useState(null) 
  const [selectedDate, setSelectedDate] = useState(dayjs()) 
  const [funeral, setFuneral] = useState(false) 
  const [disableAdd, setDisableAdd] = useState(false)

  const handleAuthStateChange = ({ isAuthenticated, roles }) => {
    setIsAuthenticated(isAuthenticated)
    setRoles(roles)
    if (!isAuthenticated || !roles.includes("vice-secretary")) {
      navigate("/login/user-login")
    }
  }

  // Table columns definition
  const columnsArray = [
    { id: "name", label: "පවුල් නම ලේඛනය", minWidth: 170 },
    { id: "relationship", label: "නෑකම", minWidth: 100 },
    { id: "select", label: "මරණය", minWidth: 50 }, // Column for radio buttons
  ]

  // Fetch member and family data by member ID
  const getMemberById = () => {
    console.log(memberId)
    if (!memberId) return // Prevent fetching if no ID is provided
    api
      .get(`${baseUrl}/member/getFamily/${memberId}`)
      .then(response => {
        // console.log("API Response:", response.data) // Debug API response
        // setMember(response?.data?.member || {})
        setFamilyRegister(response?.data?.FamilyRegister || [])
      })
      .catch(error => {
        console.error("Axios error:", error)
      })
  }

  // console.log(familyRegister)
  // Map family data and conditionally render the radio button
  const dataArray = familyRegister.map((familyMember, index) => ({
    ...familyMember,
    select: !familyMember.dateOfDeath ? (
      <Radio
        checked={selectedDeath === index}
        // Toggle selection: clicking an already-selected radio will unselect
        onClick={() => {
          setSelectedDeath(prev => (prev === index ? null : index))
          setDisableAdd(false)
        }}
        value={index}
        name="death-selection"
      />
    ) : (
      // Show formatted date and provide a small button to remove/clear the death
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography variant="body2">{dayjs(familyMember.dateOfDeath).format("DD/MMM/YYYY")}</Typography>
        <Button
          size="small"
          variant="outlined"
          onClick={() => handleRemoveDeath(index)}
        >
          ඉවත් කරන්න
        </Button>
      </Box>
    ), // Show date if already dead
  }))

  //   console.log("Mapped Data Array:", dataArray) // Debug mapped data array
  // console.log('selected death: ', selectedDeath)
  //   console.log("selected death: ", familyRegister[selectedDeath])

  const handleAdd = () => {
    if (selectedDeath === 0) {
      //   console.log("member death")
      api.post(`${baseUrl}/member/updateDiedStatus`, {
        _id: familyRegister[0]._id,
        dateOfDeath: selectedDate,
      })
        .then(response => {
          console.log("Death updated.")
          // disable add UI until user selects another person
          setDisableAdd(true)
          // create a funeral event for this death
          const payload = {
            date: selectedDate ? selectedDate.toISOString() : null,
            member_id: familyRegister[0]._id,
            deceased_id: "member",
            cemeteryAssignments: [],
            funeralAssignments: [],
            removedMembers: [],
          }
          api
            .post(`${baseUrl}/funeral/createFuneral`, payload)
            .then(() => {
              setFuneral(true)
            })
            .catch(err => {
              console.error('Error creating funeral:', err)
            })
        })
        .catch(error => {
          console.error("Death update error:", error)
        })
    } else {
      //   console.log("family member death")
      api.post(`${baseUrl}/member/updateDependentDiedStatus`, {
        _id: familyRegister[selectedDeath]._id,
        dateOfDeath: selectedDate,
      })
        .then(response => {
          console.log("Dependent death updated.")
          // disable add UI until user selects another person
          setDisableAdd(true)
          // create funeral for dependent death (member_id is main member)
          const payload = {
            date: selectedDate ? selectedDate.toISOString() : null,
            member_id: familyRegister[0]._id,
            deceased_id: familyRegister[selectedDeath]._id,
            cemeteryAssignments: [],
            funeralAssignments: [],
            removedMembers: [],
          }
          api
            .post(`${baseUrl}/funeral/createFuneral`, payload)
            .then(() => {
              setFuneral(true)
            })
            .catch(err => {
              console.error('Error creating funeral for dependent:', err)
            })
        })
        .catch(error => {
          console.error("Dependent death update error:", error)
        })
    }
    getMemberById()
  }

  // Remove/clear death for member or dependent
  const handleRemoveDeath = index => {
    if (index === 0) {
      // Clear member death
      api
        .post(`${baseUrl}/member/updateDiedStatus`, {
          _id: familyRegister[0]._id,
          dateOfDeath: null,
        })
        .then(() => {
          // refresh
          setSelectedDeath(null)
          setSelectedDate(dayjs())
          setFuneral(false)
          setDisableAdd(false)
          // delete associated funeral (if any)
          api
            .post(`${baseUrl}/funeral/deleteFuneralByDeceasedId`, { deceased_id: familyRegister[0]._id })
            .catch(err => console.warn('No funeral to delete or delete failed:', err))
            .finally(() => getMemberById())
        })
        .catch(err => {
          console.error("Error clearing member death:", err)
        })
    } else {
      // Clear dependent death
      api
        .post(`${baseUrl}/member/updateDependentDiedStatus`, {
          _id: familyRegister[index]._id,
          dateOfDeath: null,
        })
        .then(() => {
          setSelectedDeath(null)
          setSelectedDate(dayjs())
          setFuneral(false)
          setDisableAdd(false)
            // delete associated funeral for dependent (if any)
            api
              .post(`${baseUrl}/funeral/deleteFuneralByDeceasedId`, { deceased_id: familyRegister[index]._id })
              .catch(err => console.warn('No funeral to delete or delete failed:', err))
              .finally(() => getMemberById())
        })
        .catch(err => {
          console.error("Error clearing dependent death:", err)
        })
    }
  }

  const handleFuneral = () => {
    console.log("Funeral")
    navigate("/funeral/assignment")
  }

  return (
    <Layout>
      <AuthComponent onAuthStateChange={handleAuthStateChange} />
      <section>
        {/* Search Section */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            padding: "20px",
            gap: 1,
          }}
        >
          {/* <Typography>සාමාජික අංකය</Typography> */}
          <TextField
            id="outlined-basic"
            label="සාමාජික අංකය"
            variant="outlined"
            type="number"
            value={memberId}
            onChange={e => {
              setMemberId(e.target.value)
              setFamilyRegister([])
            }}
            inputProps={{
              min: 0, // Optional: Set minimum value if needed
              style: {
                MozAppearance: "textfield", // For Firefox
              },
            }}
            sx={{
              maxWidth: "150px",
              "& input[type=number]": {
                MozAppearance: "textfield", // Fix for Firefox
              },
              "& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button":
                {
                  WebkitAppearance: "auto", // Ensure arrows are visible in Chrome/Edge
                },
            }}
          />

          <Button variant="contained" onClick={getMemberById}>
            Search
          </Button>
          {familyRegister[selectedDeath] && !disableAdd && (
            <>
              <Typography
                sx={{ textAlign: "right" }}
              >{`${familyRegister[selectedDeath]?.name} ගේ මරණය`}</Typography>
              <BasicDatePicker
                heading={"දිනය"}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
              ></BasicDatePicker>
              <Button variant="contained" onClick={handleAdd}>
                Add
              </Button>
            </>
          )}
        </Box>
        <hr />

        {/* Family Table */}
        <StickyHeadTable
          columnsArray={columnsArray}
          dataArray={dataArray}
          headingAlignment={"left"}
          dataAlignment={"left"}
          totalRow={false}
        />
        {funeral && (
          <Button variant="contained" onClick={handleFuneral}>
            අවමංගල්‍ය පැවරුම්
          </Button>
        )}
      </section>
    </Layout>
  )
}
