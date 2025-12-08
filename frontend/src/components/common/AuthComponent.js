import React, { useEffect, useState } from "react"
import { navigate } from "gatsby"
import { Box, CircularProgress, Alert } from "@mui/material"
const { jwtDecode } = require("jwt-decode")

const AuthComponent = ({ children, allowedRoles = [], onAuthStateChange }) => {
  const [roles, setRoles] = useState([])
  const [userType, setUserType] = useState("")
  const [memberName, setMemberName] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    checkAuth()
    
    // Listen for custom login events
    const handleLoginEvent = () => {
      setTimeout(() => {
        checkAuth()
      }, 100) // Reduced delay but still allow token storage
    }
    
    if (typeof window !== "undefined") {
      window.addEventListener('userLoggedIn', handleLoginEvent)
      
      return () => {
        window.removeEventListener('userLoggedIn', handleLoginEvent)
      }
    }
  }, [])

  const checkAuth = () => {
    let token = ""
    if (typeof window !== "undefined") {
      token = localStorage.getItem("authToken")
    }

    if (token) {
      try {
        const decodedToken = jwtDecode(token)
        const expirationTime = decodedToken.exp * 1000
        const timeRemaining = expirationTime - Date.now()

        if (timeRemaining > 0) {
          const userRoles = decodedToken.roles || []
          const tokenUserType = decodedToken.userType || "member"
          
          setRoles(userRoles)
          setUserType(tokenUserType)
          setMemberName(decodedToken.name || "")
          setIsAuthenticated(true)
          
          // Check if user has required permissions
          if (allowedRoles.length === 0 || allowedRoles.some(role => userRoles.includes(role))) {
            setHasAccess(true)
          } else {
            setHasAccess(false)
          }

          if (onAuthStateChange) {
            onAuthStateChange({
              isAuthenticated: true,
              roles: userRoles,
              userType: tokenUserType,
              memberName: decodedToken.name || "",
              member_id: decodedToken.member_id
            })
          }
        } else {
          handleLogout()
        }
      } catch (error) {
        console.error("Error decoding token:", error)
        handleLogout()
      }
    } else {
      // No token found - user is not authenticated
      handleLogout()
    }
    setIsLoading(false)
  }

  const handleLogout = () => {
    localStorage.removeItem("authToken")
    setRoles([])
    setUserType("")
    setIsAuthenticated(false)
    setHasAccess(false)
    
    // Dispatch logout event to clear any cached data
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent('userLoggedOut'))
    }
    
    if (onAuthStateChange) {
      onAuthStateChange({ 
        isAuthenticated: false, 
        roles: [], 
        userType: "",
        memberName: "" 
      })
    }
    
    // Only redirect to login if not on landing page or login pages
    if (typeof window !== "undefined" && 
        !window.location.pathname.includes('/login/') && 
        window.location.pathname !== '/') {
      navigate("/login/user-login")
    }
  }

  if (isLoading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    )
  }

  if (!isAuthenticated) {
    // Only redirect to login if we're not already on a login page or the landing page
    if (typeof window !== "undefined" && 
        !window.location.pathname.includes('/login/') && 
        window.location.pathname !== '/') {
      navigate("/login/user-login")
    }
    return null
  }

  if (!hasAccess) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        p={3}
      >
        <Alert severity="error">
          You do not have permission to access this page. Required roles: {allowedRoles.join(', ')}
        </Alert>
      </Box>
    )
  }

  // If we have children components, render them
  if (children) {
    return <>{children}</>
  }

  // If no children but used for state management only
  return null
}

export default AuthComponent
