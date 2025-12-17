import React, { useState, useEffect } from "react"

import Layout from "../../components/layout"
import BasicDatePicker from "../../components/common/basicDatePicker"
import {
  Box,
  Button,
  TextField,
  Typography,
  Select,
  MenuItem,
} from "@mui/material"
import StickyHeadTable from "../../components/StickyHeadTable" // Import the StickyHeadTable component
import dayjs from "dayjs"

import jsPDF from "jspdf"
import html2canvas from "html2canvas"
// Import font for Sinhala support
import "jspdf/dist/jspdf.es.min.js"

import { navigate } from "gatsby"
import { useLocation } from "@reach/router"
import api from "../../utils/api"
import loadable from "@loadable/component"
const AuthComponent = loadable(() =>
  import("../../components/common/AuthComponent")
)

const baseUrl = process.env.GATSBY_API_BASE_URL

// const Axios = require("axios")

export default function Assignment() {
  //un authorized access preventing
  const [roles, setRoles] = useState([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const [memberId, setMemberId] = useState("")
  const [cemeteryAssignments, setCemeteryAssignments] = useState([])
  const [funeralAssignments, setFuneralAssignments] = useState([])
  const [allMembers, setAllMembers] = useState([])
  // const [dependents, setDependents] = useState([])
  const [member, setMember] = useState({})
  const [deceasedOptions, setDeceasedOptions] = useState([])
  const [selectedDeceased, setSelectedDeceased] = useState("")
  const [removedMembers, setRemovedMembers] = useState([]) // Track removed members
  const [releasedMembers, setReleasedMembers] = useState([]) // Track members with status 'free' or 'convenient'
  const [selectedDate, setSelectedDate] = useState(dayjs())
  const [areaAdminInfo, setAreaAdminInfo] = useState("") // Store area admin info for preview
  const [areaAdminHelperInfo, setAreaAdminHelperInfo] = useState("") // Store area admin helper info
  const location = useLocation()
  const [autoPopulated, setAutoPopulated] = useState(false)
  // If auto-populated and members list is available, try to resolve numeric member_id from fetched members
  useEffect(() => {
    if (autoPopulated && member && member._id && allMembers && allMembers.length > 0) {
      const found = allMembers.find(m => String(m._id) === String(member._id))
      if (found && found.member_id) {
        setMemberId(found.member_id)
        // also set member.member_id for display
        setMember(prev => ({ ...prev, member_id: found.member_id }))
      }
    }
  }, [autoPopulated, allMembers])

  const handleAuthStateChange = ({ isAuthenticated, roles }) => {
    setIsAuthenticated(isAuthenticated)
    setRoles(roles)
    if (!isAuthenticated || !roles.includes("vice-secretary")) {
      navigate("/login/user-login")
    }
  }
  useEffect(() => {
    // If navigated here with state to auto-populate (from deathById), use passed member/deceased/date
    try {
      if (!autoPopulated) {
        const loc = location
        const navState = loc && loc.state ? loc.state : (typeof window !== 'undefined' && window.history && window.history.state ? window.history.state : null)
        if (navState && navState.autoPopulate) {
          const { member: navMember, deceased: navDeceased, date } = navState
          if (navMember) {
            // Use passed member object without extra API calls
            setMember({
              _id: navMember._id,
              name: navMember.name,
              member_id: navMember.member_id,
              area: navMember.area,
            })
              // populate memberId input so it is visible in the form
              const navMemberId = navMember.member_id || navMember.memberId || navMember.member_id?.toString()
              if (navMemberId) setMemberId(String(navMemberId))

            const deceased = []
            if (navDeceased) {
              deceased.push(navDeceased)
            }
            setDeceasedOptions(deceased)
            if (navDeceased) setSelectedDeceased(navDeceased.id)
            if (date) setSelectedDate(dayjs(date))
            setAutoPopulated(true)
          }
        }
      }
    } catch (e) {
      // ignore
    }
    const fetchData = async () => {
      try {
        let lastAssignedMember_id
        let lastRemovedMember_ids
        let allMembers = []
        let allAdmins = []

        // Fetch the last assigned member
        const fetchLastAssignedMember = async () => {
          await api
            .get(`${baseUrl}/funeral/getLastAssignmentInfo`)
            .then(response => {
              lastAssignedMember_id = response.data.lastMember_id
              lastRemovedMember_ids = response.data.removedMembers_ids
              // console.log("Last Member ID:", lastAssignedMember_id)
              // console.log("removedMembers:", lastRemovedMember_ids)}
            })
            .catch(error => {
              console.error("Error getting last assignment id:", error)
            })
        }

        // Fetch all members
        const fetchMembers = async () => {
          await api
            .get(`${baseUrl}/member/getActiveMembers`)
            .then(response => {
              // console.log('allMembers: ',response.data.data)
              allMembers = response.data.data
            })
            .catch(error => {
              console.error("Error getting all members from DB:", error)
            })
        }
        // Fetch admins and area admins from Admin model
        const fetchAdmins = async () => {
          try {
            // Get all admins/officers from Admin model
            const adminResponse = await api.get(`${baseUrl}/admin-management/admin-structure`)
            const adminData = adminResponse.data
            
            // Extract member IDs of all officers for exclusion from assignments
            if (adminData && adminData.admin) {
              const admin = adminData.admin
              allAdmins = [
                admin.chairman?.memberId,
                admin.secretary?.memberId,
                admin.treasurer?.memberId,
                admin.loanTreasurer?.memberId,
                admin.viceSecretary?.memberId,
                admin.viceChairman?.memberId,
                admin.auditor?.memberId,
                admin.speakerHandler?.memberId
              ].filter(Boolean)
              
              // Only add area admins and helpers from the deceased member's area
              if (member.area) {
                const memberAreaAdmin = admin.areaAdmins?.find(areaAdmin => areaAdmin.area === member.area)
                if (memberAreaAdmin) {
                  if (memberAreaAdmin.memberId) allAdmins.push(memberAreaAdmin.memberId)
                  if (memberAreaAdmin.helper1?.memberId) allAdmins.push(memberAreaAdmin.helper1.memberId)
                  if (memberAreaAdmin.helper2?.memberId) allAdmins.push(memberAreaAdmin.helper2.memberId)
                }
              }
            }
          } catch (error) {
            console.error("Error getting admins from Admin model:", error)
            // Fallback to old method if Admin model fails
            if (member.area) {
              try {
                const response = await api.get(`${baseUrl}/member/getAdminsForFuneral?area=${member.area}`)
                allAdmins = response.data
              } catch (fallbackError) {
                console.error("Error with fallback admin fetch:", fallbackError)
              }
            }
          }
        }

        const filterMembers = () => {
          // Filter members beyond the last assigned member
          // and adding last removed members

          const nextMembers = allMembers.filter(
            member =>
              member.member_id > lastAssignedMember_id ||
              lastRemovedMember_ids.includes(member.member_id)
          )
          // console.log('nextMembers: ',nextMembers)

          // Members who are not free or convenient
          const activeMembers = nextMembers.filter(
            member =>
              member.status !== "free" &&
              member.status !== "funeral-free" &&
              member.status !== "attendance-free"
          )
          // console.log('activeMembers: ',activeMembers)
          //removing admins
          // console.log('allAdmins: ',allAdmins)
          const membersWithoutAdmins = activeMembers.filter(
            member => !allAdmins.includes(member.member_id)
          )
          
          // Remove speaker-handlers from funeral assignments
          const filteredMembers = membersWithoutAdmins.filter(
            member => !member.roles || !member.roles.includes("speaker-handler")
          )
          // console.log("lastRemovedMember_ids", lastRemovedMember_ids)

          // console.log('filteredMembers: ',filteredMembers)
          setAllMembers(filteredMembers)
          setCemeteryAssignments(filteredMembers.slice(0, 15)) // Assign first 15 to cemetery
          setFuneralAssignments(filteredMembers.slice(15, 30)) // Assign next 15 to funeral

          // Separate out 'free' or 'convenient' members
          const releasedMembers = nextMembers.filter(
            member =>
              member.member_id <= filteredMembers[30].member_id &&
              (member.status === "free" ||
                member.status === "funeral-free" ||
                member.status === "attendance-free")
          )
          setReleasedMembers(releasedMembers)
          // console.log('releasedMembers: ', releasedMembers)
        }
        // Execute sequentially
        await fetchLastAssignedMember()
        await fetchMembers()
        await fetchAdmins()
        filterMembers()
        // await nextMembers()
      } catch (error) {
        console.error("Error fetching data:", error)
      }
    }

    fetchData()
  }, [member.area])

  const getMemberById = e => {
    // console.log('search:', memberId)
    api
      .get(`${baseUrl}/member/getMembershipDeathById?member_id=${memberId}`)
      .then(response => {
        const data = response?.data?.data || {}
        console.log(data.member)
        setMember(data.member || {})
        // setDependents(data.dependents || [])

        // Prepare deceased options
        const deceased = []
        // console.log(data.member?.dateOfDeath)
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
              relationship: dependent.relationship || "අවශ්‍ය නැත", // Get relationship from dependent
            })
          }
        })
        setDeceasedOptions(deceased)
      })
      .catch(error => {
        console.error("Axios error: ", error)
      })
  }

  const handleSelectChange = event => {
    setSelectedDeceased(event.target.value)
    // Fetch area admin info when deceased is selected
    fetchAreaAdminInfo()
  }

  const fetchAreaAdminInfo = async () => {
    if (member.area) {
      try {
        // Get all admin data from Admin model
        const adminResponse = await api.get(`${baseUrl}/admin-management/admin-structure`)
        const adminData = adminResponse.data
        
        if (adminData && adminData.admin) {
          // Find the area admin that matches the member's area
          const areaAdmin = adminData.admin.areaAdmins?.find(admin => admin.area === member.area)
          console.log('areaAdmin:', areaAdmin)
          if (areaAdmin) {
            // Set area admin info (member ID and name)
            setAreaAdminInfo(`(${areaAdmin.memberId}) ${areaAdmin.name}`)
            
            // Set area admin helper info
            const helpers = []
            if (areaAdmin.helper1?.memberId && areaAdmin.helper1?.name) {
              helpers.push({
                memberId: areaAdmin.helper1.memberId,
                name: areaAdmin.helper1.name
              })
            }
            if (areaAdmin.helper2?.memberId && areaAdmin.helper2?.name) {
              helpers.push({
                memberId: areaAdmin.helper2.memberId,
                name: areaAdmin.helper2.name
              })
            }
            // Sort helpers by member ID and format with parentheses
            const sortedHelpers = helpers
              .sort((a, b) => a.memberId - b.memberId)
              .map(helper => `(${helper.memberId}) ${helper.name}`)
            setAreaAdminHelperInfo(sortedHelpers.join(" සහ "))
          } else {
            console.log(`No area admin found for area: ${member.area}`)
            setAreaAdminInfo("")
            setAreaAdminHelperInfo("")
          }
        }
      } catch (error) {
        console.error("Error fetching area admin info:", error)
        // Fallback to old method
        try {
          const adminResponse = await api.get(`${baseUrl}/member/getAdminsForFuneral?area=${member.area}`)
          if (adminResponse.data && adminResponse.data.length > 0) {
            const areaAdminId = adminResponse.data[0]
            const adminDetailsResponse = await api.get(`${baseUrl}/member/getMembershipDeathById?member_id=${areaAdminId}`)
            const adminData = adminDetailsResponse.data?.data?.member
            if (adminData) {
              setAreaAdminInfo(`කාරක සභික අංක ${adminData.member_id} ${adminData.name}`)
              setAreaAdminHelperInfo("") // No helper info in fallback method
            }
          }
        } catch (fallbackError) {
          console.error("Error with fallback admin fetch:", fallbackError)
          setAreaAdminInfo("")
          setAreaAdminHelperInfo("")
        }
      }
    }
  }

  const generateHeadingText = () => {
    const deceasedName = deceasedOptions.find(opt => opt.id === selectedDeceased)?.name || ''
    const memberName = member.name || ''
    const memberId = member.member_id || ''
    const memberArea = member.area || ''
    const funeralDate = selectedDate.format("YYYY/MM/DD")
    
    const selectedDeceasedObj = deceasedOptions.find(opt => opt.id === selectedDeceased)
    // Use actual relationship from dependent data or "සාමාජික" if it's the member
    const relationship = selectedDeceasedObj?.isMember ? "සාමාජික" : (selectedDeceasedObj?.relationship || "භාර්යාව")
    
    // Determine the appropriate gender term based on relationship
    let genderTerm = "මහත්මියගේ" // Default for female
    if (relationship === "සාමාජික" || relationship === "පුත්‍රයා" || relationship === "පියා") {
      genderTerm = "මහතාගේ" // Male
    } else if (relationship === "භාර්යාව" || relationship === "දුව" || relationship === "මව") {
      genderTerm = "මහත්මියගේ" // Female
    }

    return `විල්බගෙදර එක්සත් අවමංගල්‍යධාර සමිතිය  විල්බාගෙදර වැව් ඉහල ගංගොඩ පදිංචිව සිටි සාමාජික අංක ${memberId} දරණ ${memberName} මහතාගේ ${relationship} වන ${deceasedName} ${genderTerm} අභාවය ${funeralDate} දින ${memberArea} ${areaAdminInfo} ගේ ප්‍රධානත්වයෙන් ${areaAdminHelperInfo} ගේ සහයෝගිත්වයෙන්.`
  }

  const getNextMember = () => {
    return allMembers.find(
      member =>
        !cemeteryAssignments.includes(member) &&
        !funeralAssignments.includes(member) &&
        !removedMembers.includes(member)
    )
  }

  const handleRemoveMember = (type, index) => {
    if (type === "cemetery") {
      const updatedDiggers = [...cemeteryAssignments]
      const removedMember = updatedDiggers.splice(index, 1)[0]
      setRemovedMembers([...removedMembers, removedMember])

      // Move top member from parade to diggers
      const updatedParade = [...funeralAssignments]
      if (updatedParade.length > 0) {
        const paradeTopMember = updatedParade.shift()
        updatedDiggers.push(paradeTopMember)
      }

      // Add new member to parade
      const nextMember = getNextMember()
      if (nextMember) updatedParade.push(nextMember)

      setCemeteryAssignments(updatedDiggers)
      setFuneralAssignments(updatedParade)
    } else if (type === "parade") {
      const updatedParade = [...funeralAssignments]
      const removedMember = updatedParade.splice(index, 1)[0]
      setRemovedMembers([...removedMembers, removedMember])

      // Add new member to parade
      const nextMember = getNextMember()
      if (nextMember) updatedParade.push(nextMember)

      setFuneralAssignments(updatedParade)
    }
  }

  const formatName = (name) => {
    if (!name) return ""
    
    // If name is longer than 20 characters, try to create initials
    if (name.length > 20) {
      const words = name.split(' ')
      if (words.length > 1) {
        // Take first word full and make initials from rest
        const firstName = words[0]
        const initials = words.slice(1).map(word => word.charAt(0).toUpperCase()).join(' ')
        return `${firstName} ${initials}`
      }
    }
    return name
  }

  const columnsArray = [
    { 
      id: "member_id", 
      label: "සා. අංකය"
    },
    { 
      id: "name", 
      label: "නම",
      minWidth: 120,
      renderCell: (value) => (
        <div style={{ 
          fontSize: value && value.length > 20 ? '0.75rem' : '0.875rem',
          lineHeight: '1.2',
          wordBreak: 'break-word',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {formatName(value)}
        </div>
      )
    },
    {
      id: "remove",
      label: "Remove",
      renderCell: (row, index, type) => (
        <Button
          variant="outlined"
          color="inherit"
          sx={{ width: "20px", height: "20px" }}
          onClick={() => handleRemoveMember(type, index)}
        ></Button>
      ),
    },
  ]

  const formatDataForTable = (dataArray, type) =>
    dataArray.map((member, index) => ({
      member_id: member.member_id,
      name: member.name,
      remove: (
        <Button
          variant="outlined"
          color="inherit"
          sx={{ height: "30px" }}
          onClick={() => handleRemoveMember(type, index)}
        ></Button>
      ),
    }))

  const saveDuties = () => {
    console.log("removed: ", removedMembers)
    api
      .post(`${baseUrl}/funeral/createFuneral`, {
        date: selectedDate.format("YYYY-MM-DD"),
        member_id: member._id,
        deceased_id: selectedDeceased,
        cemeteryAssignments: cemeteryAssignments.map(member => ({
          _id: member._id,
          member_id: member.member_id,
          name: member.name,
        })),
        funeralAssignments: funeralAssignments.map(member => ({
          _id: member._id,
          member_id: member.member_id,
          name: member.name,
        })),
        removedMembers: removedMembers.map(member => ({
          _id: member._id,
          member_id: member.member_id,
          name: member.name,
        })), // Include removed members
      })
      .then(response => {
        console.log("Funeral duties saved successfully:", response.data)
        setSelectedDeceased("")
        setRemovedMembers([])
        setReleasedMembers([])
        setCemeteryAssignments([])
        setFuneralAssignments([])
      })
      .catch(error => {
        console.error("Error saving funeral duties:", error)
      })
  }

  const saveAsPDF = async () => {
    try {
      console.log("Starting PDF generation...")
      
      // Create a temporary div for the heading with A4 margins
      const headingDiv = document.createElement('div')
      headingDiv.style.cssText = `
        width: 210mm;
        max-width: 794px;
        padding: 25mm 20mm;
        margin: 0 auto;
        font-family: 'Noto Sans Sinhala', 'Iskoola Pota', 'Malithi Web', Arial, sans-serif;
        font-size: 16px;
        line-height: 1.5;
        background: white;
        color: black;
        box-sizing: border-box;
        font-feature-settings: 'liga', 'clig', 'kern';
        text-rendering: optimizeLegibility;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      `
      
      // Create centered title and content
      const titleElement = document.createElement('h3')
      titleElement.style.cssText = 'text-align: center; margin-bottom: 20px; font-weight: bold; text-decoration: underline;'
      titleElement.textContent = 'විල්බගෙදර එක්සත් අවමංගල්‍යධාර සමිතිය'
      
      const contentElement = document.createElement('p')
      contentElement.style.cssText = 'text-align: justify; margin: 0; line-height: 1.6;'
      const headingText = generateHeadingText()
      // Remove the title from the beginning of the text since we're adding it separately
      const contentText = headingText.replace('විල්බගෙදර එක්සත් අවමංගල්‍යධාර සමිතිය  ', '')
      contentElement.textContent = contentText
      
      headingDiv.appendChild(titleElement)
      headingDiv.appendChild(contentElement)
      document.body.appendChild(headingDiv)

      // Wait a moment for fonts to load properly
      await new Promise(resolve => setTimeout(resolve, 1000))

      console.log("Converting heading to canvas...")
      // Convert heading to canvas
      const headingCanvas = await html2canvas(headingDiv, { 
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: true,
        letterRendering: true,
        fontEmbedCSS: true,
        foreignObjectRendering: true
      })
      document.body.removeChild(headingDiv)
      console.log("Heading canvas dimensions:", headingCanvas.width, headingCanvas.height)

      // Convert assignments content to canvas
      const input = document.getElementById("assignments-content")
      if (!input) {
        console.error("assignments-content element not found!")
        return
      }
      
      console.log("Converting assignments content to canvas...")
      console.log("Input element:", input)
      console.log("Input element dimensions:", input.offsetWidth, input.offsetHeight)
      
      const contentCanvas = await html2canvas(input, { 
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: true,
        letterRendering: true,
        fontEmbedCSS: true,
        foreignObjectRendering: true,
        onclone: (clonedDoc) => {
          console.log("Document cloned for canvas generation")
          const clonedElement = clonedDoc.getElementById("assignments-content")
          if (clonedElement) {
            console.log("Cloned element found:", clonedElement.offsetWidth, clonedElement.offsetHeight)
          } else {
            console.error("Cloned element not found!")
          }
        }
      })
      
      console.log("Content canvas dimensions:", contentCanvas.width, contentCanvas.height)

      // Create PDF
      const pdf = new jsPDF("p", "mm", "a4")
      
      // Add heading image
      const headingImgData = headingCanvas.toDataURL("image/png")
      const headingWidth = 210 // A4 width
      const headingHeight = (headingCanvas.height * headingWidth) / headingCanvas.width
      console.log("Adding heading to PDF:", headingWidth, headingHeight)
      pdf.addImage(headingImgData, "PNG", 0, 10, headingWidth, headingHeight)
      
      // Add content image
      const contentImgData = contentCanvas.toDataURL("image/png")
      const contentWidth = 210
      const contentHeight = (contentCanvas.height * contentWidth) / contentCanvas.width
      const yPosition = 10 + headingHeight + 10 // After heading + some margin
      console.log("Adding content to PDF:", contentWidth, contentHeight, "at position:", yPosition)
      
      pdf.addImage(contentImgData, "PNG", 0, yPosition, contentWidth, contentHeight)
      
      console.log("Saving PDF...")
      pdf.save(`assignments-${selectedDate.format("YYYY-MM-DD")}.pdf`)
    } catch (error) {
      console.error("Error generating PDF:", error)
      // Fallback to simple PDF generation
      const input = document.getElementById("assignments-content")
      if (input) {
        console.log("Trying fallback PDF generation...")
        html2canvas(input, { 
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: true,
          letterRendering: true,
          fontEmbedCSS: true,
          foreignObjectRendering: true
        }).then(canvas => {
          console.log("Fallback canvas dimensions:", canvas.width, canvas.height)
          const imgData = canvas.toDataURL("image/png")
          const pdf = new jsPDF("p", "mm", "a4")
          const imgWidth = 210
          const imgHeight = (canvas.height * imgWidth) / canvas.width
          pdf.addImage(imgData, "PNG", 0, 15, imgWidth, imgHeight)
          pdf.save(`assignments-${selectedDate.format("YYYY-MM-DD")}.pdf`)
        }).catch(fallbackError => {
          console.error("Fallback PDF generation also failed:", fallbackError)
        })
      } else {
        console.error("assignments-content element not found for fallback!")
      }
    }
  }
  return (
    <Layout>
      <AuthComponent onAuthStateChange={handleAuthStateChange} />
      <section>
        <Typography variant="h6">විල්බාගෙදර එක්සත් අවමංගල්‍යාධාර සමිතිය</Typography>
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            padding: "20px",
            gap: "50px",
          }}
        >
          {autoPopulated ? (
            // Show concise info when coming from deathById (auto-populated)
            <Box>
              <Typography variant="subtitle1">සාමාජික අංකය: {member.member_id || (memberId ? memberId : (member._id ? member._id : "-"))}</Typography>
              <Typography variant="subtitle2">නම: {member.name || "-"}</Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>මියගිය පුද්ගලයා: {deceasedOptions[0]?.name || "-"}</Typography>
            </Box>
          ) : (
            <>
              <Typography>සාමාජික අංකය</Typography>
              <TextField
                id="outlined-basic"
                label="Your ID"
                variant="outlined"
                type="number"
                value={memberId}
                onChange={e => {
                  setMemberId(e.target.value)
                  setDeceasedOptions([])
                }}
                // onBlur={getMemberById}
              />
              <Button variant="contained" onClick={getMemberById}>
                Search
              </Button>
              <Box>
                {/* <Typography>Deceased Options</Typography> */}
                <Select
                  value={selectedDeceased}
                  onChange={handleSelectChange}
                  fullWidth
                  displayEmpty
                >
                  <MenuItem value="" disabled>
                    තෝරන්න
                  </MenuItem>
                  {deceasedOptions.map(option => (
                    <MenuItem key={option.id} value={option.id}>
                      {option.isMember ? `${option.name}` : `${option.name}`}
                    </MenuItem>
                  ))}
                </Select>
              </Box>
            </>
          )}
        </Box>
        <hr />
        {selectedDeceased && (
          <Box>
            {/* Heading Preview */}
            <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1, border: '1px solid #ddd' }}>
              <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                PDF මාතෘකාව පෙරදසුන
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  lineHeight: 1.6, 
                  fontWeight: 'medium',
                  fontFamily: '"Noto Sans Sinhala", Arial, sans-serif'
                }}
              >
                {generateHeadingText()}
              </Typography>
            </Box>

            <Box id="assignments-content">
              {/* assignments */}
              <Box
                sx={{
                  display: "flex",
                  gap: "20px",
                  alignItems: "stretch",
                  justifyContent: "space-between",
                  border: "1px solid #000",
                  margin: "0 auto",
                  maxWidth: "90%",
                  width: "fit-content",
                }}
              >
                <Box sx={{ width: "50%", border: "1px solid #000" }}>
                  <Typography
                    sx={{
                      textAlign: "center",
                      // mb: 2,
                      border: "1px solid #000",
                      mb: 0,
                    }}
                  >
                    සුසාන භුමියේ කටයුතු
                  </Typography>
                  <Box sx={{ 
                    '& .MuiTableRow-root': { 
                      height: '40px !important',
                      minHeight: '40px !important' 
                    },
                    '& .MuiTableCell-root': {
                      padding: '4px 8px !important',
                      verticalAlign: 'middle'
                    }
                  }}>
                    <StickyHeadTable
                      columnsArray={columnsArray}
                      dataArray={formatDataForTable(
                        cemeteryAssignments,
                        "cemetery"
                      )}
                      headingAlignment="center"
                      dataAlignment="left"
                      firstPage={15}
                      totalRow={false}
                      hidePagination={true}
                      borders={true}
                    />
                  </Box>
                </Box>
                <Box sx={{ width: "50%", border: "1px solid #000" }}>
                  <Typography
                    sx={{
                      textAlign: "center",
                      // mb: 2,
                      border: "1px solid #000",
                      mb: 0,
                    }}
                  >
                    දේහය ගෙනයාම
                  </Typography>

                  <Box sx={{ 
                    '& .MuiTableRow-root': { 
                      height: '40px !important',
                      minHeight: '40px !important' 
                    },
                    '& .MuiTableCell-root': {
                      padding: '4px 8px !important',
                      verticalAlign: 'middle'
                    }
                  }}>
                    <StickyHeadTable
                      columnsArray={columnsArray}
                      dataArray={formatDataForTable(funeralAssignments, "parade")}
                      headingAlignment="center"
                      dataAlignment="left"
                      firstPage={15}
                      totalRow={false}
                      hidePagination={true}
                      borders={true}
                    />
                  </Box>
                </Box>
              </Box>
              {/* released members */}
              <Box>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Typography>විශේෂයෙන් නිදහස් කල සාමාජිකයන් :- </Typography>
                  <Box sx={{ display: "flex" }}>
                    {removedMembers.map((val, key) => {
                      return (
                        <Typography key={key}>{val.member_id}, </Typography>
                      )
                    })}
                  </Box>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Typography>
                    සුසාන භුමි වැඩ වලින් නිදහස් සාමාජිකයන් : -{" "}
                  </Typography>
                  <Box sx={{ display: "flex" }}>
                    {releasedMembers.map((val, key) => {
                      return (
                        <Typography key={key}>{val.member_id}, </Typography>
                      )
                    })}
                  </Box>
                </Box>
              </Box>
            </Box>
            {/* actions */}
            <Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                }}
              >
                <BasicDatePicker
                  heading="Select Date"
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                />
                <Button onClick={saveAsPDF} variant="contained">
                  Download PDF
                </Button>
                <Button onClick={saveDuties} variant="contained">
                  Save Funeral Duties
                </Button>
              </Box>
            </Box>
          </Box>
        )}
      </section>
    </Layout>
  )
}
