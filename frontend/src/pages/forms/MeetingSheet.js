import { Box, Grid2, Typography, Button } from "@mui/material"
import React, { useState, useEffect } from "react"

import Layout from "../../components/layout"
import SignChartTable from "../../components/common/SignChartTable"

import jsPDF from "jspdf"
import html2canvas from "html2canvas"

import api from "../../utils/api"
const baseUrl = process.env.GATSBY_API_BASE_URL

export default function MeetingSheet() {
  const [members, setMembers] = useState([])
  
  useEffect(() => {
    api.get(`${baseUrl}/forms/meeting-sign-due`).then(res => {
      setMembers(res.data)
      // console.log(res.data)
    })
  }, [])
  const generateDataArray = (members, startRange, endRange) => {
    const filteredMembers = members
      .filter(
        member => member.member_id >= startRange && member.member_id <= endRange
      )
      .map(member => ({
        member_id: member.member_id,
        totalDue: Math.max(member.totalDue ?? 0, 0) // Set totalDue to 0 if undefined or negative value
      }))

    const numRows = Math.ceil(filteredMembers.length / 3)

    return Array.from({ length: numRows }, (_, index) => ({
      id1: filteredMembers[index]?.member_id || "",
      sign1: filteredMembers[index]?.totalDue ?? "",

      id2: filteredMembers[index + numRows]?.member_id || "",
      sign2: filteredMembers[index + numRows]?.totalDue ?? "",

      id3: filteredMembers[index + numRows * 2]?.member_id || "",
      sign3: filteredMembers[index + numRows * 2]?.totalDue ?? "",
    }))
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
          <SignChartTable
            columnsArray={columnsArray}
            dataArray={dataArray100}
            borders={true}
            hidePagination={true}
            totalRow={false}
            // dataAlignment={"left"}
            firstPage={34}
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
          <SignChartTable
            columnsArray={columnsArray}
            dataArray={dataArray200}
            borders={true}
            hidePagination={true}
            totalRow={false}
            dataAlignment={"center"}
            firstPage={34}
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
          <SignChartTable
            columnsArray={columnsArray}
            dataArray={dataArray300}
            borders={true}
            hidePagination={true}
            totalRow={false}
            dataAlignment={"center"}
            firstPage={34}
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
