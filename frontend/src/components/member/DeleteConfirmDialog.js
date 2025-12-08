import React from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
} from "@mui/material"
import { Warning as WarningIcon } from "@mui/icons-material"

export default function DeleteConfirmDialog({ 
  open, 
  onClose, 
  onConfirm, 
  member,
  memberName, 
  memberId,
  loading = false 
}) {
  // Use member object if provided, otherwise use individual props
  const name = member?.name || memberName
  const id = member?.member_id || memberId
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ 
        background: "#f44336", 
        color: "white",
        textAlign: "center"
      }}>
        <WarningIcon sx={{ mr: 1, verticalAlign: "middle" }} />
        සාමාජිකයා මකන්න
      </DialogTitle>
      
      <DialogContent sx={{ pt: 3 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          මෙම ක්‍රියාව ආපසු හැරවිය නොහැක!
        </Alert>
        
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            ඔබට විශ්වාසද මෙම සාමාජිකයා මකා දැමීමට?
          </Typography>
          
          <Box sx={{ 
            p: 2, 
            backgroundColor: "#f5f5f5", 
            borderRadius: 1, 
            border: "1px solid #ddd",
            mt: 2
          }}>
            <Typography variant="body1" fontWeight="bold">
              සාමාජික අංකය: {id}
            </Typography>
            <Typography variant="body1" fontWeight="bold" color="primary">
              නම: {name}
            </Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            මෙම සාමාජිකයා සහ ඔහුගේ/ඇයගේ සියලුම යැපෙන්නන්ගේ තොරතුරු ස්ථිරවම මකා දැමෙනු ඇත.
            සියලුම ගෙවීම්, ණය සහ අවමංගල්‍ය වාර්තා ද ඉවත් වනු ඇත.
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 2, backgroundColor: "#f5f5f5", justifyContent: "center" }}>
        <Button 
          onClick={onClose} 
          color="secondary"
          variant="outlined"
          disabled={loading}
          sx={{ textTransform: "none", minWidth: 100 }}
        >
          අවලංගු කරන්න
        </Button>
        <Button 
          onClick={() => onConfirm(id)}
          variant="contained"
          color="error"
          disabled={loading}
          sx={{ textTransform: "none", minWidth: 100 }}
        >
          {loading ? "මකමින්..." : "ඔව්, මකන්න"}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
