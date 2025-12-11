import * as React from "react"
import Paper from "@mui/material/Paper"
import Table from "@mui/material/Table"
import TableBody from "@mui/material/TableBody"
import TableCell from "@mui/material/TableCell"
import TableContainer from "@mui/material/TableContainer"
import TableHead from "@mui/material/TableHead"
import TablePagination from "@mui/material/TablePagination"
import TableRow from "@mui/material/TableRow"
import { Typography } from "@mui/material"

export default function StickyHeadTable({
 columnsArray,
  dataArray,
  headingAlignment,
  dataAlignment,
  firstPage,
  totalRow = true,
  hidePagination = false,
  headBorder = false,
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
          <TableHead >
            <TableRow >
              {columnsArray.map(column => (
                <TableCell
                  key={column.id}
                  align={headingAlignment || "right"}
                  sx={{
                    padding: "4px",
                    border: headBorder ? "1px solid black" : "none",
                    fontWeight: "bold",
                    minWidth: column.minWidth,
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
                    onClick={() => row.onClick && row.onClick()}
                    sx={{
                      border: borders ? "1px solid black" : "none",
                      borderBottom: "1px solid rgba(224, 224, 224, 1)",
                      cursor: row.onClick ? "pointer" : "default",
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
                    {columnsArray.map(column => {
                      const value = row[column.id]
                      return (
                        <TableCell
                          key={column.id}
                          align={dataAlignment || "right"}
                          sx={{
                            padding: "4px",
                            borderLeft: borders ? ".5px solid black" : "none",
                            borderRight: borders ? ".5px solid black" : "none",
                          }}
                        >
                          {column.format && typeof value === "string"
                            ? column.format(value)
                            : value}
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
