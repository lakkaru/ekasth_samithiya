import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material"
import React, { useState, useEffect } from "react"

import Layout from "../../components/layout"

import PrintIcon from "@mui/icons-material/Print"

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
                  const colNum = Math.floor(colIndex / 2) + 1
                  const hasAbsentFlag = row[`hasAbsent${colNum}`]
                  const isNoMember = row[`noMember${colNum}`]
                  const isSignColumn = [1, 3, 5].includes(colIndex)

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
                        value ? (
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: "50%",
                              border: hasAbsentFlag ? "1px solid black" : "none",
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
                        ) : null
                      ) : isSignColumn && isNoMember ? (
                        <Box sx={{ pl: "6px", color: "#aaa", fontStyle: "italic", fontSize: "0.85em" }}>
                          No member
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
    })
  }, [])

  const ROWS_PER_PAGE = 34
  const COLS = 3
  const MEMBERS_PER_PAGE = ROWS_PER_PAGE * COLS

  // Build a full sequential list from ID 1 to max member_id.
  // Gaps (IDs with no member) are marked noMember: true.
  const memberMap = new Map(members.map(m => [m.member_id, m]))
  const maxId = members.length > 0 ? Math.max(...members.map(m => m.member_id)) : 0
  const fullList = Array.from({ length: maxId }, (_, i) => {
    const id = i + 1
    const m = memberMap.get(id)
    return m
      ? { member_id: id, hasConsecutiveAbsents: m.hasConsecutiveAbsents || false, noMember: false }
      : { member_id: id, hasConsecutiveAbsents: false, noMember: true }
  })

  // Split into pages of MEMBERS_PER_PAGE each
  const pages = []
  for (let i = 0; i < fullList.length; i += MEMBERS_PER_PAGE) {
    pages.push(fullList.slice(i, i + MEMBERS_PER_PAGE))
  }

  // Build 34-row data array from a slice of up to 102 entries
  const buildPageData = (slice) => {
    return Array.from({ length: ROWS_PER_PAGE }, (_, row) => ({
      id1:      slice[row]?.member_id || "",
      hasAbsent1: slice[row]?.hasConsecutiveAbsents || false,
      noMember1:  slice[row]?.noMember || false,
      sign1: "",
      id2:      slice[row + ROWS_PER_PAGE]?.member_id || "",
      hasAbsent2: slice[row + ROWS_PER_PAGE]?.hasConsecutiveAbsents || false,
      noMember2:  slice[row + ROWS_PER_PAGE]?.noMember || false,
      sign2: "",
      id3:      slice[row + ROWS_PER_PAGE * 2]?.member_id || "",
      hasAbsent3: slice[row + ROWS_PER_PAGE * 2]?.hasConsecutiveAbsents || false,
      noMember3:  slice[row + ROWS_PER_PAGE * 2]?.noMember || false,
      sign3: "",
    }))
  }

  const columnsArray = [
    { id: "id1", label: "සා. අංකය", minWidth: 50, align: "center" },
    { id: "sign1", label: "අත්සන", minWidth: 150, align: "left", color: "#999999" },
    { id: "id2", label: "සා. අංකය", minWidth: 50, align: "center" },
    { id: "sign2", label: "අත්සන", minWidth: 150, align: "left", color: "#999999" },
    { id: "id3", label: "සා. අංකය", minWidth: 50, align: "center" },
    { id: "sign3", label: "අත්සන", minWidth: 150, align: "left", color: "#999999" },
  ]

  const handlePrint = () => window.print()

  const PageHeading = () => (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: "bold", textAlign: "center", textDecoration: "underline" }}>
        විල්බාගෙදර එක්සත් අවමංගල්‍යාධාර සමිතිය
      </Typography>
      <Box sx={{ display: "flex", gap: 5, mb: "4px" }}>
        <Typography sx={{ fontWeight: "bold" }}>මහා සභාවට සහභාගිත්වය</Typography>
        <Typography>
          දිනය:- {new Date().getFullYear()}/
          {(new Date().getMonth() + 1).toString().padStart(2, "0")}
          /..........
        </Typography>
        <Typography>සාමාජික සංඛ්‍යාව:- ..........</Typography>
      </Box>
    </Box>
  )

  return (
    <Layout>
      <style>{`
        @media print {
          @page {
            margin-top: 10mm;
            margin-right: 10mm;
            margin-bottom: 10mm;
            margin-left: 25mm;
          }
          header, footer { display: none !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      <Box className="no-print" sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button onClick={handlePrint} variant="contained" startIcon={<PrintIcon />}>
          Print
        </Button>
      </Box>

      <Box id="print-area">
        {pages.map((pageMembers, i) => (
          <Box
            key={i}
            sx={i > 0 ? { '@media print': { pageBreakBefore: 'always', breakBefore: 'page' } } : {}}
          >
            <PageHeading />
            <Box sx={{ mb: 3 }}>
              <MeetingSignTable columnsArray={columnsArray} dataArray={buildPageData(pageMembers)} />
            </Box>
          </Box>
        ))}
      </Box>
    </Layout>
  )
}
