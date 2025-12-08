import * as React from "react"
import Paper from "@mui/material/Paper"
import Table from "@mui/material/Table"
import TableBody from "@mui/material/TableBody"
import TableCell from "@mui/material/TableCell"
import TableContainer from "@mui/material/TableContainer"
import TableHead from "@mui/material/TableHead"
import TablePagination from "@mui/material/TablePagination"
import TableRow from "@mui/material/TableRow"
import { Box } from "@mui/material"

export default function SignChartTable({
  columnsArray,
  dataArray,
  headingAlignment,
  dataAlignment,
  firstPage,
  totalRow = true,
  hidePagination = false,
  borders = false,
}) {
  const [data, setData] = React.useState([])

  React.useEffect(() => {
    if (dataArray) {
      setData(dataArray)
    }
  }, [dataArray])

  const [page, setPage] = React.useState(0)
  const [rowsPerPage, setRowsPerPage] = React.useState(firstPage || 10)

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = event => {
    setRowsPerPage(+event.target.value)
    setPage(0)
  }

  return (
    <Paper sx={{ width: "100%", overflow: "hidden" }}>
      <TableContainer>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              {/* <TableCell
                align="center"
                sx={{ padding: "4px", border: borders ? "1px solid black" : "none" }}
              >
                #
              </TableCell> */}
              {columnsArray.map(column => (
                <TableCell
                  key={column.id}
                  align={headingAlignment || "right"}
                  sx={{
                    padding: "4px",
                    border: borders ? "1px solid black" : "none",
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
            {data
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row, index) => {
                const isLastRow = page * rowsPerPage + index + 1 === data.length
                return (
                  <TableRow
                    hover
                    role="checkbox"
                    tabIndex={-1}
                    key={index}
                    sx={{
                      border: borders ? "1px solid black" : "none",
                      fontWeight: isLastRow ? "bold" : "normal",
                      backgroundColor: isLastRow
                        ? totalRow
                          ? "teal"
                          : "inherit"
                        : "inherit",
                      color: isLastRow
                        ? totalRow
                          ? "white"
                          : "inherit"
                        : "inherit",
                      "& .MuiTableCell-root": {
                        color: isLastRow
                          ? totalRow
                            ? "white"
                            : "inherit"
                          : "inherit",
                      },
                    }}
                  >
                    {/* <TableCell
                      align="center"
                      sx={{ padding: "4px", border: borders ? "1px solid black" : "none" }}
                    >
                      {isLastRow
                        ? totalRow
                          ? ""
                          : page * rowsPerPage + index + 1
                        : page * rowsPerPage + index + 1}
                    </TableCell> */}
                    {columnsArray.map((column, colIndex) => {
                      const value = row[column.id]

                      // Determine text color
                      let textColor = "black"
                      if (typeof value === "number") {
                        textColor =
                          value > 6000
                            ? "black"
                            : value > 0
                            ? "#888888"
                            : "#c0c0c0"
                      } else if (
                        typeof value === "string" &&
                        value.includes("Warning")
                      ) {
                        textColor = "blue"
                      }

                      return (
                        <TableCell
                          key={column.id}
                          align={column.align || dataAlignment || "right"}
                          sx={{
                            padding: "0px",
                            border: borders ? ".5px solid black" : "none",

                            color: column.color ? `${textColor}` : "inherit",
                          }}
                        >
                          {[0, 2, 4].includes(colIndex) ? (
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: "50%",
                                // border: "2px solid black",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                margin: "0 auto", // center the circle in the cell
                                fontSize: "1.2em",
                                fontWeight: "bold",
                              }}
                            >
                              {column.format && typeof value === "string"
                                ? column.format(value)
                                : value}
                            </Box>
                          ) : column.format && typeof value === "string" ? (
                            column.format(value)
                          ) : (
                            value
                          )}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                )
              })}
          </TableBody>
        </Table>
      </TableContainer>
      {!hidePagination && (
        <TablePagination
          rowsPerPageOptions={[firstPage || 10, 25, 100]}
          component="div"
          count={data.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      )}
    </Paper>
  )
}
