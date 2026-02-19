import { Box, Grid2, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material"
import React, { useState, useEffect } from "react"

import Layout from "../../components/layout"

import jsPDF from "jspdf"
import html2canvas from "html2canvas"

import api from "../../utils/api"
const baseUrl = process.env.GATSBY_API_BASE_URL

// Custom table component for meeting sign sheet
const MeetingSignTable = ({ columnsArray, dataArray }) => {
  // Debug: Check if any rows have hasAbsent flags
  React.useEffect(() => {
    const rowsWithAbsents = dataArray.filter(row => 
      row.hasAbsent1 || row.hasAbsent2 || row.hasAbsent3
    )
    if (rowsWithAbsents.length > 0) {
      console.log("Table rendering with absents:", rowsWithAbsents.map((row, idx) => ({
        rowIndex: idx,
        id1: row.id1, hasAbsent1: row.hasAbsent1,
        id2: row.id2, hasAbsent2: row.hasAbsent2,
        id3: row.id3, hasAbsent3: row.hasAbsent3,
      })))
    }
  }, [dataArray])

  return (
    <Paper sx={{ width: "100%", overflow: "hidden" }}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {columnsArray.map(column => (
                <TableCell
                  key={column.id}
                  align="center"
                  sx={{
                    padding: "4px",
                    border: "1px solid black",
                    minWidth: column.minWidth,
                    textAlign: "center",
                  }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {dataArray.map((row, index) => (
              <TableRow key={index} sx={{ border: "1px solid black" }}>
                {columnsArray.map((column, colIndex) => {
                  const value = row[column.id]
                  const isIdColumn = [0, 2, 4].includes(colIndex)
                  const hasAbsentFlag = row[`hasAbsent${Math.floor(colIndex / 2) + 1}`]
                  
                  // Debug: Log when we should show a border
                  if (isIdColumn && hasAbsentFlag && index === 0) {
                    console.log(`Should show red border for column ${colIndex}, member ID: ${value}, hasAbsentFlag:`, hasAbsentFlag)
                  }

                  return (
                    <TableCell
                      key={column.id}
                      align={column.align || "center"}
                      sx={{
                        padding: "0px",
                        border: ".5px solid black",
                        color: column.color || "inherit",
                      }}
                    >
                      {isIdColumn ? (
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            border: hasAbsentFlag ? "2px solid #d32f2f" : "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto",
                            fontSize: "1.2em",
                            fontWeight: "bold",
                          }}
                        >
                          {value}
                        </Box>
                      ) : (
                        value
                      )}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  )
}

export default function MeetingSheet() {
  const [members, setMembers] = useState([])
  
  useEffect(() => {
    api.get(`${baseUrl}/forms/meeting-sign-due`).then(res => {
      setMembers(res.data)
      console.log("Total members received:", res.data.length)
      const withAbsents = res.data.filter(m => m.hasConsecutiveAbsents)
      console.log("Members with consecutive absents:", withAbsents.length)
      if (withAbsents.length > 0) {
        console.log("Sample members with absents:", withAbsents.slice(0, 10).map(m => ({ id: m.member_id, hasAbsents: m.hasConsecutiveAbsents })))
      }
    })
  }, [])
  const generateDataArray = (members, startRange, endRange) => {
    const filteredMembers = members
      .filter(
        member => member.member_id >= startRange && member.member_id <= endRange
      )
      .map(member => ({
        member_id: member.member_id,
        hasConsecutiveAbsents: member.hasConsecutiveAbsents || false
      }))

    const numRows = Math.ceil(filteredMembers.length / 3)
    
    const dataArray = Array.from({ length: numRows }, (_, index) => ({
      id1: filteredMembers[index]?.member_id || "",
      hasAbsent1: filteredMembers[index]?.hasConsecutiveAbsents || false,
      sign1: "",

      id2: filteredMembers[index + numRows]?.member_id || "",
      hasAbsent2: filteredMembers[index + numRows]?.hasConsecutiveAbsents || false,
      sign2: "",

      id3: filteredMembers[index + numRows * 2]?.member_id || "",
      hasAbsent3: filteredMembers[index + numRows * 2]?.hasConsecutiveAbsents || false,
      sign3: "",
    }))
    
    // Debug: Log members with absents in this range
    const withAbsentsInRange = filteredMembers.filter(m => m.hasConsecutiveAbsents)
    if (withAbsentsInRange.length > 0) {
      console.log(`Range ${startRange}-${endRange}: ${withAbsentsInRange.length} members with absents:`, withAbsentsInRange.map(m => m.member_id))
    }
    
    return dataArray
  }

  
  const dataArray100 = generateDataArray(members, 1, 100)
  const dataArray200 = generateDataArray(members, 101, 200)
  const dataArray300 = generateDataArray(members, 201, 300)

  // console.log(dataArray100)

  const columnsArray = [
    { id: "id1", label: "සා. අංකය", minWidth: 50, align: "center" },
    {
      id: "sign1",
      label: "අත්සන",
      minWidth: 150,
      align: "left",
      color: "#999999",
      fontWeight: "bold",
    },
    { id: "id2", label: "සා. අංකය", minWidth: 50, align: "center" },
    {
      id: "sign2",
      label: "අත්සන",
      minWidth: 150,
      align: "left",
      color: "#999999",
    },
    { id: "id3", label: "සා. අංකය", minWidth: 50, align: "center" },
    {
      id: "sign3",
      label: "අත්සන",
      minWidth: 150,
      align: "left",
      color: "#999999",
    },
  ]
  const pagesToBeSaved = ["100-content", "200-content", "300-content"];

const saveAsPDF = () => {
  const pdf = new jsPDF("p", "mm", "a4");

  pagesToBeSaved.forEach((contentId, index) => {
    const input = document.getElementById(contentId); // Target the content
    html2canvas(input, { scale: 2 }).then(canvas => {
      const imgData = canvas.toDataURL("image/png");
      const imgWidth = 210; // A4 width in mm - 1.5 " margin
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Define custom margins (in mm)
      const marginTop = 5; // Top margin
      const marginLeft = 45; // Left margin
      const marginRight = 10; // Right margin (can be used for adjustment)

      // Add image to the first page or a new page
      if (index > 0) {
        pdf.addPage(); // Add a new page if not the first page
      }

      pdf.addImage(
        imgData,
        "PNG",
        marginLeft,
        marginTop,
        imgWidth - marginLeft - marginRight,
        imgHeight
      );

      // If it's the last page, save the PDF
      if (index === pagesToBeSaved.length - 1) {
        pdf.save("SignSheet.pdf");
      }
    });
  });
};


  return (
    <Layout>
      {/* 1 to 100 */}
      <Box id="100-content">
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: "bold",
              textAlign: "center",
              textDecoration: "underline",
            }}
          >
            විල්බාගෙදර එක්සත් අවමංගල්‍යාධාර සමිතිය
          </Typography>
          
          <Box sx={{ display: "flex", gap: 5, mb: "4px" }}>
          <Typography
            // variant="p"
            sx={{
              fontWeight: "bold",
            }}
          >
            මහා සභාවට සහභාගිත්වය
          </Typography>
            <Typography variant="p">
              දිනය:- {new Date().getFullYear()}/
              {(new Date().getMonth() + 1).toString().padStart(2, "0")}
              /..........
            </Typography>
            <Typography variant="p" sx={{}}>
              සාමාජික සංඛ්‍යාව:- ..........
            </Typography>
          </Box>
        </Box>
        <Box sx={{ mb: 3 }}>
          <MeetingSignTable
            columnsArray={columnsArray}
            dataArray={dataArray100}
          />
        </Box>
      </Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: "30px" }}>
        <Button onClick={saveAsPDF} variant="contained">
          Save as PDF
        </Button>
      </Box>
      {/* 101 to 200 */}
      <Box id="200-content">
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: "bold",
              textAlign: "center",
              textDecoration: "underline",
            }}
          >
            විල්බාගෙදර එක්සත් අවමංගල්‍යාධාර සමිතිය
          </Typography>
          
          <Box sx={{ display: "flex", gap: 5, mb: "4px" }}>
          <Typography
            // variant="p"
            sx={{
              fontWeight: "bold",
            }}
          >
            මහා සභාවට සහභාගිත්වය
          </Typography>
            <Typography variant="p">
              දිනය:- {new Date().getFullYear()}/
              {(new Date().getMonth() + 1).toString().padStart(2, "0")}
              /..........
            </Typography>
            <Typography variant="p" sx={{}}>
              සාමාජික සංඛ්‍යාව:- ..........
            </Typography>
          </Box>
        </Box>
        <Box sx={{ mb: 3 }}>
          <MeetingSignTable
            columnsArray={columnsArray}
            dataArray={dataArray200}
          />
        </Box>
      </Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: "30px" }}>
        <Button onClick={ saveAsPDF} variant="contained">
          Save as PDF
        </Button>
      </Box>
      {/* 201 to 300 */}
      <Box id="300-content">
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: "bold",
              textAlign: "center",
              textDecoration: "underline",
            }}
          >
            විල්බාගෙදර එක්සත් අවමංගල්‍යාධාර සමිතිය
          </Typography>
          
          <Box sx={{ display: "flex", gap: 5, mb: "4px" }}>
          <Typography
            // variant="p"
            sx={{
              fontWeight: "bold",
            }}
          >
            මහා සභාවට සහභාගිත්වය
          </Typography>
            <Typography variant="p">
              දිනය:- {new Date().getFullYear()}/
              {(new Date().getMonth() + 1).toString().padStart(2, "0")}
              /..........
            </Typography>
            <Typography variant="p">සාමාජික සංඛ්‍යාව:- ..........</Typography>
          </Box>
        </Box>
        <Box sx={{ mb: 3 }}>
          <MeetingSignTable
            columnsArray={columnsArray}
            dataArray={dataArray300}
          />
        </Box>
      </Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: "30px" }}>
        <Button onClick={saveAsPDF} variant="contained">
          Save as PDF
        </Button>
      </Box>
    </Layout>
  )
}
