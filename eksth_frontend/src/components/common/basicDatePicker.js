import * as React from "react";
import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
// import dayjs from "dayjs";

export default function BasicDatePicker({heading, selectedDate, setSelectedDate}) {
  // const [selectedDate, setSelectedDate] = React.useState(dayjs()); // Initialize with today's date

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DemoContainer components={["DatePicker"]}>
        <DatePicker
          label={heading}
          value={selectedDate}
          onChange={(newValue) => setSelectedDate(newValue)} // Update state on change
           format="YYYY/MM/DD"
          sx={{ 
            border:'none'
           }}
        />
      </DemoContainer>
    </LocalizationProvider>
  );
}
