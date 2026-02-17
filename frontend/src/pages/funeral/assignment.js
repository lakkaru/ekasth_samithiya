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
  FormControl,
  InputLabel,
  Alert,
  Chip,
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
  const [eligibleMembersPool, setEligibleMembersPool] = useState([]) // Full pool of eligible members
  const [nextMemberIndex, setNextMemberIndex] = useState(0) // Track position in circular array
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
  // Funeral selection states
  const [availableFunerals, setAvailableFunerals] = useState([])
  const [selectedFuneralId, setSelectedFuneralId] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [useExistingFuneral, setUseExistingFuneral] = useState(false)
  const [existingFuneralId, setExistingFuneralId] = useState(null)
  const [hasExistingAssignments, setHasExistingAssignments] = useState(false)
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

  // Load available funerals when authenticated
  useEffect(() => {
    if (isAuthenticated && roles.includes("vice-secretary")) {
      fetchAvailableFunerals()
    }
  }, [isAuthenticated, roles])

  // Fetch available funerals
  const fetchAvailableFunerals = async () => {
    try {
      setLoading(true)
      setError("")
      const response = await api.get(`${baseUrl}/funeral/getAvailableFunerals`)
      setAvailableFunerals(response.data.funerals || [])
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        setError("ඔබට මෙම තොරතුරු බලන්න අවසරයක් නොමැත")
        navigate("/login/user-login")
      } else {
        setError("අවමංගල්‍ය උත්සව ලබා ගැනීමේදී දෝෂයක් ඇති විය")
      }
    } finally {
      setLoading(false)
    }
  }

  // Handle funeral selection from dropdown
  const handleFuneralSelection = async (funeralId) => {
    setSelectedFuneralId(funeralId)
    if (!funeralId) {
      // Clear selection
      setUseExistingFuneral(false)
      setMember({})
      setMemberId("")
      setDeceasedOptions([])
      setSelectedDeceased("")
      setCemeteryAssignments([])
      setFuneralAssignments([])
      setRemovedMembers([])
      setReleasedMembers([])
      setAreaAdminInfo("")
      setAreaAdminHelperInfo("")
      return
    }

    try {
      setLoading(true)
      setError("")
      const response = await api.get(`${baseUrl}/funeral/getFuneralById/${funeralId}`)
      const funeral = response.data.funeral
      
      // Store the funeral ID for updates
      setExistingFuneralId(funeral._id)
      
      // Populate form with funeral data
      setUseExistingFuneral(true)
      
      // Set member info
      if (funeral.member_id) {
        setMember({
          _id: funeral.member_id._id,
          name: funeral.member_id.name,
          member_id: funeral.member_id.member_id,
          area: funeral.member_id.area,
        })
        setMemberId(funeral.member_id.member_id || "")
      }

      // Set deceased info
      if (funeral.member_id) {
        const deceased = []
        // Check if deceased is member or dependent
        if (funeral.deceased_id === funeral.member_id._id || funeral.deceased_id === "member") {
          deceased.push({
            name: funeral.member_id.name,
            id: "member",
            isMember: true,
          })
          setSelectedDeceased("member")
        } else if (funeral.member_id.dependents) {
          // Find the dependent
          const dependent = funeral.member_id.dependents.find(d => d._id === funeral.deceased_id)
          if (dependent) {
            deceased.push({
              name: dependent.name,
              id: dependent._id,
              isMember: false,
              relationship: dependent.relationship || "අවශ්‍ය නැත",
            })
            setSelectedDeceased(dependent._id)
          }
        }
        setDeceasedOptions(deceased)
      }

      // Set date
      if (funeral.date) {
        setSelectedDate(dayjs(funeral.date))
      }

      // Set assignments
      const hasAssignments = funeral.cemeteryAssignments?.length > 0 || funeral.funeralAssignments?.length > 0
      setHasExistingAssignments(hasAssignments)
      setCemeteryAssignments(funeral.cemeteryAssignments || [])
      setFuneralAssignments(funeral.funeralAssignments || [])
      setRemovedMembers(funeral.removedMembers || [])
      
      // If funeral has no assignments, mark as not using existing (so assignments can be generated)
      if (!hasAssignments) {
        setUseExistingFuneral(false)
      }

      // Fetch area admin info
      if (funeral.member_id?.area) {
        await fetchAreaAdminInfoForArea(funeral.member_id.area)
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setError("අවමංගල්‍ය උත්සවය සොයා ගත නොහැක")
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        setError("ඔබට මෙම තොරතුරු බලන්න අවසරයක් නොමැත")
        navigate("/login/user-login")
      } else {
        setError("අවමංගල්‍ය තොරතුරු ලබා ගැනීමේදී දෝෂයක් ඇති විය")
      }
    } finally {
      setLoading(false)
    }
  }

  // Fetch area admin info for a given area
  const fetchAreaAdminInfoForArea = async (area) => {
    if (area) {
      try {
        const adminResponse = await api.get(`${baseUrl}/admin-management/admin-structure`)
        const adminData = adminResponse.data
        
        if (adminData && adminData.admin) {
          const areaAdmin = adminData.admin.areaAdmins?.find(admin => admin.area === area)
          if (areaAdmin) {
            setAreaAdminInfo(`(${areaAdmin.memberId}) ${areaAdmin.name}`)
            
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
            const sortedHelpers = helpers
              .sort((a, b) => a.memberId - b.memberId)
              .map(helper => `(${helper.memberId}) ${helper.name}`)
            setAreaAdminHelperInfo(sortedHelpers.join(" සහ "))
          }
        }
      } catch (error) {
        console.error("Error fetching area admin info:", error)
      }
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
        let lastAssignedMember_id = 0
        let lastRemovedMember_ids = []
        let allMembers = []
        let allAdmins = []

        // Fetch the last assigned member
        const fetchLastAssignedMember = async () => {
          await api
            .get(`${baseUrl}/funeral/getLastAssignmentInfo`)
            .then(response => {
              lastAssignedMember_id = response.data.lastMember_id || 0
              lastRemovedMember_ids = response.data.removedMembers_ids || []
              // console.log("Last Member ID:", lastAssignedMember_id)
              // console.log("removedMembers:", lastRemovedMember_ids)}
            })
            .catch(error => {
              console.error("Error getting last assignment id:", error)
              // Set defaults if error
              lastAssignedMember_id = 0
              lastRemovedMember_ids = []
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
          // First, filter ALL active members
          const activeMembers = allMembers.filter(
            member =>
              member.status !== "free" &&
              member.status !== "funeral-free" &&
              member.status !== "attendance-free"
          )
          
          // Remove admins
          const membersWithoutAdmins = activeMembers.filter(
            member => !allAdmins.includes(member.member_id)
          )
          
          // Remove speaker-handlers from funeral assignments
          const eligibleMembers = membersWithoutAdmins.filter(
            member => !member.roles || !member.roles.includes("speaker-handler")
          )
          
          if (eligibleMembers.length === 0) {
            // Only clear assignments if not using existing funeral
            const hasLoadedAssignments = useExistingFuneral && 
                                       (cemeteryAssignments.length > 0 || funeralAssignments.length > 0);
            if (!hasLoadedAssignments) {
              setAllMembers([])
              setCemeteryAssignments([])
              setFuneralAssignments([])
              setReleasedMembers([])
            }
            setEligibleMembersPool([])
            setNextMemberIndex(0)
            return
          }

          // Always store the full eligible members pool (needed for remove functionality)
          setEligibleMembersPool(eligibleMembers)

          // Only generate new assignments if we don't already have them loaded from an existing funeral
          const hasLoadedAssignments = useExistingFuneral && 
                                       (cemeteryAssignments.length > 0 || funeralAssignments.length > 0);
          
          if (hasLoadedAssignments) {
            console.log("Using existing funeral assignments - already loaded, pool populated for remove functionality")
            // Still set nextMemberIndex to support removing members
            // Find the highest member_id in current assignments to set next index
            const allAssignedIds = [
              ...cemeteryAssignments.map(m => m.member_id),
              ...funeralAssignments.map(m => m.member_id)
            ]
            const maxAssignedId = Math.max(...allAssignedIds)
            const maxIndex = eligibleMembers.findIndex(m => m.member_id > maxAssignedId)
            setNextMemberIndex(maxIndex !== -1 ? maxIndex : 0)
            
            // Calculate released members for existing funeral based on assigned member ID range
            if (cemeteryAssignments.length > 0 || funeralAssignments.length > 0) {
              const minMemberId = Math.min(...allAssignedIds)
              const maxMemberId = Math.max(...allAssignedIds)
              
              const releasedMembers = allMembers.filter(
                member =>
                  member.member_id >= minMemberId &&
                  member.member_id <= maxMemberId &&
                  (member.status === "free" ||
                    member.status === "funeral-free" ||
                    member.status === "attendance-free")
              )
              setReleasedMembers(releasedMembers)
            }
            return
          }

          // For new assignments: include members beyond last assigned OR members who were removed from last funeral
          const candidateMembers = eligibleMembers.filter(
            member =>
              member.member_id > lastAssignedMember_id ||
              lastRemovedMember_ids.includes(member.member_id)
          )

          if (candidateMembers.length === 0) {
            // If no candidates, start from beginning
            const assignedMembers = eligibleMembers.slice(0, 40)
            setAllMembers(assignedMembers)
            setCemeteryAssignments(assignedMembers.slice(0, 20))
            setFuneralAssignments(assignedMembers.slice(20, 40))
            setNextMemberIndex(40 % eligibleMembers.length)
            
            if (assignedMembers.length > 0) {
              const minMemberId = Math.min(...assignedMembers.map(m => m.member_id))
              const maxMemberId = Math.max(...assignedMembers.map(m => m.member_id))
              const releasedMembers = allMembers.filter(
                member =>
                  member.member_id >= minMemberId &&
                  member.member_id <= maxMemberId &&
                  (member.status === "free" ||
                    member.status === "funeral-free" ||
                    member.status === "attendance-free")
              )
              setReleasedMembers(releasedMembers)
            } else {
              setReleasedMembers([])
            }
            return
          }

          // Find starting index - prioritize removed members from last funeral first
          let startIndex = 0
          if (lastRemovedMember_ids.length > 0) {
            // Start with the first removed member or first member after last assigned, whichever comes first
            const firstRemovedIndex = candidateMembers.findIndex(
              m => lastRemovedMember_ids.includes(m.member_id)
            )
            const firstAfterLastIndex = candidateMembers.findIndex(
              m => m.member_id > lastAssignedMember_id
            )
            
            if (firstRemovedIndex !== -1 && firstAfterLastIndex !== -1) {
              startIndex = Math.min(firstRemovedIndex, firstAfterLastIndex)
            } else if (firstRemovedIndex !== -1) {
              startIndex = firstRemovedIndex
            } else if (firstAfterLastIndex !== -1) {
              startIndex = firstAfterLastIndex
            }
          } else if (lastAssignedMember_id > 0) {
            // Find the index of the member right after the last assigned
            startIndex = candidateMembers.findIndex(
              member => member.member_id > lastAssignedMember_id
            )
            if (startIndex === -1) startIndex = 0
          }

          // Create a circular array to get 40 members from candidates, wrapping if needed
          const assignedMembers = []
          const membersNeeded = 40
          
          for (let i = 0; i < membersNeeded && candidateMembers.length > 0; i++) {
            const index = (startIndex + i) % candidateMembers.length
            assignedMembers.push(candidateMembers[index])
          }

          // Set the next index for when members are removed
          setNextMemberIndex((startIndex + membersNeeded) % eligibleMembers.length)

          // console.log('assignedMembers: ', assignedMembers)
          setAllMembers(assignedMembers)
          setCemeteryAssignments(assignedMembers.slice(0, 20)) // Assign first 20 to cemetery
          setFuneralAssignments(assignedMembers.slice(20, 40)) // Assign next 20 to funeral

          // Separate out 'free' or 'convenient' members within the assignment range
          if (assignedMembers.length > 0) {
            const minMemberId = Math.min(...assignedMembers.map(m => m.member_id))
            const maxMemberId = Math.max(...assignedMembers.map(m => m.member_id))
            
            const releasedMembers = allMembers.filter(
              member =>
                member.member_id >= minMemberId &&
                member.member_id <= maxMemberId &&
                (member.status === "free" ||
                  member.status === "funeral-free" ||
                  member.status === "attendance-free")
            )
            setReleasedMembers(releasedMembers)
          } else {
            setReleasedMembers([])
          }
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
    const deceasedName = deceasedOptions.find(opt => opt.id === selectedDeceased)?.name || 'නොදන්නා';
    const memberName = member.name || 'නොදන්නා';
    const memberId = member.member_id || '000';
    const memberArea = member.area || 'නොදන්නා';
    const funeralDate = selectedDate.format("YYYY/MM/DD");

    const selectedDeceasedObj = deceasedOptions.find(opt => opt.id === selectedDeceased);
    // Use actual relationship from dependent data or "සාමාජික" if it's the member
    const relationship = selectedDeceasedObj?.isMember ? "සාමාජික" : (selectedDeceasedObj?.relationship || "භාර්යාව");

    // Determine the appropriate gender term based on relationship
    let genderTerm = "මහත්මියගේ"; // Default for female
    if (relationship === "සාමාජික" || relationship === "පුත්‍රයා" || relationship === "පියා") {
      genderTerm = "මහතාගේ"; // Male
    } else if (relationship === "භාර්යාව" || relationship === "දුව" || relationship === "මව") {
      genderTerm = "මහත්මියගේ"; // Female
    }

    // Adjust text based on whether the deceased is a member or a dependent
    if (selectedDeceasedObj?.isMember) {
      return `විල්බගෙදර එක්සත් අවමංගල්‍යධාර සමිතිය ${memberArea} පදිංචිව සිටි සාමාජික අංක ${memberId} දරණ ${deceasedName} මහතා අභාවය ${funeralDate} දින ${areaAdminInfo} ගේ ප්‍රධානත්වයෙන් ${areaAdminHelperInfo} ගේ සහයෝගිත්වයෙන්.`;
    } else {
      return `විල්බගෙදර එක්සත් අවමංගල්‍යධාර සමිතිය ${memberArea.replace("පදිංචිව සිටි", "පදිංචි")} පදිංචි සාමාජික අංක ${memberId} දරණ ${memberName} මහතාගේ ${relationship} වන ${deceasedName} ${genderTerm} අභාවය ${funeralDate} දින ${areaAdminInfo} ගේ ප්‍රධානත්වයෙන් ${areaAdminHelperInfo} ගේ සහයෝගිත්වයෙන්.`;
    }
  }

  const getNextMember = () => {
    if (eligibleMembersPool.length === 0) return null
    
    // Find a member from the pool that's not already assigned or removed
    let attempts = 0
    let currentIndex = nextMemberIndex
    
    while (attempts < eligibleMembersPool.length) {
      const candidate = eligibleMembersPool[currentIndex]
      const isAlreadyAssigned = 
        cemeteryAssignments.some(m => m._id === candidate._id) ||
        funeralAssignments.some(m => m._id === candidate._id) ||
        removedMembers.some(m => m._id === candidate._id)
      
      if (!isAlreadyAssigned) {
        // Update the index for next time
        setNextMemberIndex((currentIndex + 1) % eligibleMembersPool.length)
        return candidate
      }
      
      currentIndex = (currentIndex + 1) % eligibleMembersPool.length
      attempts++
    }
    
    return null // All members are already assigned or removed
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

  const saveDuties = async () => {
    console.log("removed: ", removedMembers)
    
    const assignmentData = {
      date: selectedDate.format("YYYY-MM-DD"),
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
      })),
    }

    try {
      if (existingFuneralId) {
        // Update existing funeral
        const response = await api.put(
          `${baseUrl}/funeral/updateFuneralAssignments/${existingFuneralId}`,
          assignmentData
        )
        console.log("Funeral assignments updated successfully:", response.data)
        setHasExistingAssignments(true)
        alert("පැවරීම් යාවත්කාලින කර ඇත")
      } else {
        // Create new funeral
        const response = await api.post(`${baseUrl}/funeral/createFuneral`, {
          ...assignmentData,
          member_id: member._id,
          deceased_id: selectedDeceased,
        })
        console.log("Funeral duties saved successfully:", response.data)
        setExistingFuneralId(response.data._id)
        setHasExistingAssignments(true)
        alert("පැවරීම් සාර්ථකව සංරක්‍ෂිත කර ඇත")
      }
      
      // Optionally refresh the funeral list
      if (isAuthenticated && roles.includes("vice-secretary")) {
        fetchAvailableFunerals()
      }
    } catch (error) {
      console.error("Error saving funeral duties:", error)
      alert("පැවරීම් සංරක්‍ෂිත කිරීමේදී දෝෂයක් ඇති විය")
    }
  }

  const saveAsPDF = async () => {
    const input = document.getElementById("assignments-content");
    const headingText = generateHeadingText();

    if (!input) {
      console.error("Element with id 'assignments-content' not found.");
      alert("PDF ජනනය කිරීමට අසමත් විය. කරුණාකර පිටුව නැවත පූරණය කර නැවත උත්සාහ කරන්න.");
      return;
    }

    if (cemeteryAssignments.length === 0 && funeralAssignments.length === 0) {
      alert("පැවරීම් නොමැත. කරුණාකර පළමුව පැවරීම් ජනනය කරන්න.");
      return;
    }

    console.log("Starting PDF generation...");
    input.scrollIntoView({ behavior: "smooth", block: "center" });

    // Add a delay to allow for scrolling and rendering
    await new Promise(resolve => setTimeout(resolve, 2000));

    const originalStyles = [];
    let current = input;
    while (current && current !== document.body) {
      if (current.style.overflow) {
        originalStyles.push({ element: current, overflow: current.style.overflow });
        current.style.overflow = "visible";
      }
      current = current.parentElement;
    }

    try {
      console.log("Capturing content with html2canvas...");
      const canvas = await html2canvas(input, {
        scale: 3, // Increased scale for better quality
        useCORS: true,
        allowTaint: true,
        logging: true,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById("assignments-content");
          if (clonedElement) {
            clonedElement.style.transform = 'none';
            // Find all tables within the cloned element
            const tables = clonedElement.querySelectorAll("table");
            tables.forEach(table => {
              // Add margin bottom to tables
              table.style.marginBottom = '15px';

              // Increase font size and improve Sinhala rendering for all table cells
              const allCells = table.querySelectorAll("th, td");
              allCells.forEach(cell => {
                cell.style.fontSize = '20px';
                cell.style.fontFamily = "'Noto Sans Sinhala', Arial, sans-serif";
                cell.style.fontWeight = '500';
                cell.style.lineHeight = '1.4';
              });

              // Increase font size for member IDs
              const memberIdCells = table.querySelectorAll("td:first-child");
              memberIdCells.forEach(cell => {
                cell.style.fontSize = '24px'; // Match the size of special text
                cell.style.fontWeight = 'bold';
              });

              // Hide the column name 'Remove' while keeping the column structure
              const removeHeaders = table.querySelectorAll("th");
              removeHeaders.forEach(header => {
                if (header.textContent.trim() === 'Remove') {
                  header.style.visibility = 'hidden';
                }
              });
            });

            // Increase font size for headings
            const headings = clonedElement.querySelectorAll(".MuiTypography-root");
            headings.forEach(heading => {
              if (heading.textContent.includes("සුසාන භුමියේ කටයුතු") || heading.textContent.includes("දේහය ගෙනයාම")) {
                heading.style.fontSize = '24px';
                heading.style.fontWeight = 'bold';
              }
            });

            // Increase font size for special text
            const specialText = clonedElement.querySelectorAll(".MuiTypography-root, p, span");
            specialText.forEach(text => {
              if (text.textContent.includes("විශේෂයෙන් නිදහස් කල සාමාජිකයන්") || text.textContent.includes("සුසාන භුමි වැඩ වලින් නිදහස් සාමාජිකයන්")) {
                text.style.fontSize = '24px';
                text.style.fontWeight = 'bold';
              }
            });

            // Ensure proper Sinhala text rendering for all elements
            const allText = clonedElement.querySelectorAll("p, span, div, td, th");
            allText.forEach(element => {
              element.style.fontFamily = "'Noto Sans Sinhala', Arial, sans-serif";
              element.style.fontWeight = '500';
              element.style.lineHeight = '1.4';
            });
          }
        }
      });

      console.log("Canvas created with dimensions:", canvas.width, "x", canvas.height);
      if (canvas.width === 0 || canvas.height === 0) {
        console.error("Canvas has zero dimensions. Aborting PDF generation.");
        alert("PDF ජනනය කිරීමට අසමත් විය. අන්තර්ගතය දර්ශනය නොවේ.");
        return;
      }

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const leftMargin = 20;
      const rightMargin = 20;
      const topMargin = 25;
      const bottomMargin = 25;
      const contentWidth = pdfWidth - leftMargin - rightMargin;

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = imgWidth / imgHeight;
      let finalImgHeight = contentWidth / ratio;

      // Create a temporary div to render the heading and convert it to a canvas
      const headingDiv = document.createElement('div');
      // Use justify alignment for the heading
      headingDiv.innerHTML = `<p style="font-family: 'Noto Sans Sinhala', Arial, sans-serif; text-align: justify; padding: 0; margin: 0; line-height: 1.6;">${headingText}</p>`;
      headingDiv.style.width = `${contentWidth}mm`;
      headingDiv.style.position = 'absolute';
      headingDiv.style.left = '-9999px'; // Render off-screen
      document.body.appendChild(headingDiv);

      const headingCanvas = await html2canvas(headingDiv, { scale: 2, backgroundColor: null });
      document.body.removeChild(headingDiv);

      const headingImgData = headingCanvas.toDataURL("image/png");
      const headingImgHeight = (headingCanvas.height * contentWidth) / headingCanvas.width;

      // Add heading with 25mm top margin
      pdf.addImage(headingImgData, "PNG", leftMargin, topMargin, contentWidth, headingImgHeight);

      const contentStartY = topMargin + headingImgHeight + 5; // Start content after heading with a 5mm gap
      const availableContentHeight = pdfHeight - contentStartY - bottomMargin;

      // Check if content fits on the first page
      if (finalImgHeight <= availableContentHeight) {
        pdf.addImage(imgData, "PNG", leftMargin, contentStartY, contentWidth, finalImgHeight);
      } else { // Paginate if it doesn't fit
        let position = 0;
        const pageHeightInPixels = (availableContentHeight * imgWidth) / contentWidth;

        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = imgWidth;
        tempCanvas.height = pageHeightInPixels;

        let yPosOnPdf = contentStartY;
        let remainingHeight = imgHeight;

        while (remainingHeight > 0) {
          const sliceHeight = Math.min(pageHeightInPixels, remainingHeight);
          tempCanvas.height = sliceHeight;

          tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
          tempCtx.drawImage(canvas, 0, position, imgWidth, sliceHeight, 0, 0, tempCanvas.width, tempCanvas.height);

          const pageData = tempCanvas.toDataURL("image/png");
          const sliceImgHeightOnPdf = (sliceHeight * contentWidth) / imgWidth;

          if (yPosOnPdf + sliceImgHeightOnPdf > pdfHeight - bottomMargin) {
             pdf.addPage();
             yPosOnPdf = topMargin; // New page starts with 25mm top margin
          }

          pdf.addImage(pageData, "PNG", leftMargin, yPosOnPdf, contentWidth, sliceImgHeightOnPdf);

          position += sliceHeight;
          remainingHeight -= sliceHeight;
          yPosOnPdf += sliceImgHeightOnPdf + 5; // Add a small gap
        }
      }

      pdf.save(`assignments-${selectedDate.format("YYYY-MM-DD")}.pdf`);
      console.log("PDF saved successfully.");

    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("PDF ජනනය කිරීමේදී දෝෂයක් ඇති විය. වැඩි විස්තර සඳහා කරුණාකර console බලන්න.");
    } finally {
      // Restore original styles
      originalStyles.forEach(({ element, overflow }) => {
        element.style.overflow = overflow;
      });
      console.log("Original styles restored.");
    }
  }
  return (
    <Layout>
      <AuthComponent onAuthStateChange={handleAuthStateChange} />
      <section>
        <Typography variant="h6">විල්බාගෙදර එක්සත් අවමංගල්‍යාධාර සමිතිය - අවමංගල්‍ය පැවරීම්</Typography>
        
        {/* Funeral Selection Section */}
        {!autoPopulated && (
          <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
              පැවරුම් සඳහා අවමංගල්‍ය උත්සවයක් තෝරන්න
            </Typography>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
                {error}
              </Alert>
            )}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="funeral-select-label">අවමංගල්‍ය උත්සවය තෝරන්න</InputLabel>
              <Select
                labelId="funeral-select-label"
                value={selectedFuneralId}
                onChange={(e) => handleFuneralSelection(e.target.value)}
                label="අවමංගල්‍ය උත්සවය තෝරන්න"
                disabled={loading}
              >
                <MenuItem value="" disabled>
                  <em>කරුණාකර අවමංගල්‍යක් තෝරන්න</em>
                </MenuItem>
                {availableFunerals.map((funeral) => {
                  const memberName = funeral.member_id?.name || "නොදන්නා"
                  const memberId = funeral.member_id?.member_id || "N/A"
                  const date = funeral.date ? dayjs(funeral.date).format("YYYY/MM/DD") : "දිනය නැත"
                  return (
                    <MenuItem key={funeral._id} value={funeral._id}>
                      {`${date} - සාමාජික ${memberId} (${memberName})`}
                    </MenuItem>
                  )
                })}
              </Select>
            </FormControl>
            <Typography variant="caption" color="text.secondary">
              * ලැයිස්තුවෙන් අවමංගල්‍ය උත්සවයක් තෝරන්න
            </Typography>
          </Box>
        )}

        {/* Member Info Display - only show when funeral is selected or auto-populated */}
        {(autoPopulated || selectedFuneralId) && member.name && (
          <Box sx={{ mb: 2, p: 2, bgcolor: '#e3f2fd', borderRadius: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>සාමාජික විස්තර:</Typography>
              {hasExistingAssignments && (
                <Chip 
                  label="පැවරීම් සුරකින ලදී" 
                  color="success" 
                  size="small"
                  sx={{ fontWeight: 'bold' }}
                />
              )}
            </Box>
            <Typography variant="body1">සාමාජික අංකය: {member.member_id || "-"}</Typography>
            <Typography variant="body1">නම: {member.name || "-"}</Typography>
            {deceasedOptions.length > 0 && selectedDeceased && (
              <Typography variant="body1">මියගිය පුද්ගලයා: {deceasedOptions.find(d => d.id === selectedDeceased)?.name || "-"}</Typography>
            )}
          </Box>
        )}

        {/* Hidden member ID search section - kept for backward compatibility */}
        <Box
          sx={{
            display: "none",
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
              <Typography>අවමංගල්‍ය වූ සාමාජික අංකය</Typography>
              <TextField
                id="outlined-basic"
                label="Member ID"
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
        {/* Debug info */}
        {!selectedDeceased && !selectedFuneralId && cemeteryAssignments.length === 0 && (
          <Box sx={{ p: 2, bgcolor: '#fff3cd', borderRadius: 1, mb: 2 }}>
            <Typography color="warning">
              අවමංගල්‍ය උත්සවයක් තෝරන්න හෝ සාමාජික විස්තර පුරවන්න
            </Typography>
          </Box>
        )}
        {(selectedDeceased || (selectedFuneralId && (cemeteryAssignments.length > 0 || funeralAssignments.length > 0)) || (member.name && (cemeteryAssignments.length > 0 || funeralAssignments.length > 0))) && (
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
                  gap: "10px", // Reduced gap to increase horizontal space
                  alignItems: "stretch",
                  justifyContent: "space-evenly", // Changed to evenly distribute space
                  border: "1px solid #000",
                  margin: "0 auto",
                  maxWidth: "95%", // Increased max width to utilize more horizontal space
                  width: "100%", // Ensure full width usage
                }}
              >
                <Box sx={{ width: "48%", border: "1px solid #000" }}> {/* Adjusted width to 48% */}
                  <Typography
                    sx={{
                      textAlign: "center",
                      border: "1px solid #000",
                      mb: 0,
                    }}
                  >
                    සුසාන භුමියේ කටයුතු
                  </Typography>
                  <Box
                    sx={{
                      '& .MuiTableRow-root': {
                        height: '40px !important',
                        minHeight: '40px !important'
                      },
                      '& .MuiTableCell-root': {
                        padding: '4px 8px !important',
                        verticalAlign: 'middle'
                      }
                    }}
                  >
                    <StickyHeadTable
                      columnsArray={columnsArray}
                      dataArray={formatDataForTable(
                        cemeteryAssignments,
                        "cemetery"
                      )}
                      headingAlignment="center"
                      dataAlignment="left"
                      firstPage={20}
                      totalRow={false}
                      hidePagination={true}
                      borders={true}
                    />
                  </Box>
                </Box>
                <Box sx={{ width: "48%", border: "1px solid #000" }}> {/* Adjusted width to 48% */}
                  <Typography
                    sx={{
                      textAlign: "center",
                      border: "1px solid #000",
                      mb: 0,
                    }}
                  >
                    දේහය ගෙනයාම
                  </Typography>

                  <Box
                    sx={{
                      '& .MuiTableRow-root': {
                        height: '40px !important',
                        minHeight: '40px !important'
                      },
                      '& .MuiTableCell-root': {
                        padding: '4px 8px !important',
                        verticalAlign: 'middle'
                      }
                    }}
                  >
                    <StickyHeadTable
                      columnsArray={columnsArray}
                      dataArray={formatDataForTable(funeralAssignments, "parade")}
                      headingAlignment="center"
                      dataAlignment="left"
                      firstPage={20}
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
                <Button onClick={saveDuties} variant="contained" color={hasExistingAssignments ? "warning" : "primary"}>
                  {hasExistingAssignments ? "යාවත්කාල කරන්න" : "පැවරීම් සුරකින්න"}
                </Button>
              </Box>
            </Box>
          </Box>
        )}
      </section>
    </Layout>
  )
}
