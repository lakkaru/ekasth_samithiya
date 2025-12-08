import React, { useState } from "react"
import { Box, Button, TextField, MenuItem, Grid, Typography } from "@mui/material"
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import dayjs from "dayjs"

const relationshipOptions = [
  "පියා", "මව", "බිරිඳ", "සැමියා", "දුව", "පුතා", "සහෝදරයා", "සහෝදරිය", "කලත්‍රයාගේ පියා", "කලත්‍රයාගේ මව", "වෙනත්"
]

export default function DependentForm({ dependent, onChange, onRemove, showRemove }) {
  return (
    <Box sx={{ border: "1px solid #eee", borderRadius: 2, p: 2, mb: 2, background: "#fafafa" }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="නම"
            name="name"
            value={dependent.name}
            onChange={onChange}
            required
            placeholder="නම ඇතුලත් කරන්න"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            select
            label="සබඳතාවය"
            name="relationship"
            value={dependent.relationship}
            onChange={onChange}
            required
          >
            {relationshipOptions.map(opt => (
              <MenuItem key={opt} value={opt}>{opt}</MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="උපන් දිනය"
              value={dependent.birthday}
              onChange={date => onChange({ target: { name: "birthday", value: date } })}
              format="YYYY-MM-DD"
              slotProps={{ textField: { fullWidth: true } }}
            />
          </LocalizationProvider>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="ජාතික හැඳුනුම්පත් අංකය"
            name="nic"
            value={dependent.nic}
            onChange={onChange}
            placeholder="123456789V හෝ 123456789012"
          />
        </Grid>
        {/* <Grid item xs={12} sm={6}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="මරණ දිනය"
              value={dependent.dateOfDeath}
              onChange={date => onChange({ target: { name: "dateOfDeath", value: date } })}
              format="YYYY-MM-DD"
              slotProps={{ textField: { fullWidth: true } }}
            />
          </LocalizationProvider>
        </Grid> */}
        {showRemove && (
          <Grid item xs={12}>
            <Button color="error" variant="outlined" onClick={onRemove} sx={{ mt: 1 }}>
              ඉවත් කරන්න
            </Button>
          </Grid>
        )}
      </Grid>
    </Box>
  )
}
