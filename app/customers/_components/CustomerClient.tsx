// "use client";

// import React, { useState, useEffect, useTransition } from "react";
// import {
//   DataGrid,
//   GridRowSelectionModel,
//   GridRowsProp,
//   GridRowModel,
// } from "@mui/x-data-grid";
// import { styled } from "@mui/material/styles";
// import { useDataStore } from "@/shared-store";
// import { useShallow } from "zustand/react/shallow";
// import { useAlert, useChip, useModal } from "@/shared-hooks";
// import { Box, TextField, InputAdornment, IconButton } from "@mui/material";
// import SearchIcon from "@mui/icons-material/Search";
// import ClearIcon from "@mui/icons-material/Clear";
// import { updateCustomerAction } from "@/api/customers/actions"; // Server Action
// import {
//   classCount,
//   customersColumns,
//   customersHideColumn,
//   extractInitialConsonants,
//   getColumnVisibilityModel,
//   getTodayFormattedDate,
//   isEmptyArr,
//   replaceOnlyNum,
//   replaceHypenFormat,
//   daysBetween,
//   getAge,
//   getLabel,
//   gender,
//   getCustomerState,
// } from "@/shared-utils";

// interface Props {
//   initialCustomers: any[];
// }

// export default function CustomerClient({ initialCustomers }: Props) {
//   const { showAlert } = useAlert();
//   const { showChip } = useChip();
//   const { hideModal } = useModal();
//   const [searchText, setSearchText] = useState("");
//   const [rows, setRows] = useState<GridRowsProp>([]);
//   const [isPending, startTransition] = useTransition();

//   const {
//     loginInfo: { academyCode, id },
//     setSelectedGridInfo,
//   } = useDataStore(useShallow((state) => state));

//   // 데이터 가공 및 필터링
//   useEffect(() => {
//     if (initialCustomers) {
//       // 데이터 포맷팅 (기존 select 로직 적용)
//       const formattedData = initialCustomers.map((item: any) => ({
//         ...item,
//         ID: item.ID || 0,
//         TEL: (item.TEL && replaceHypenFormat(item.TEL, "phone")) || "",
//         DDAY: "D+" + (item.DATE && daysBetween(item.DATE)) || "",
//         DATE: (item.DATE && replaceHypenFormat(item.DATE, "date")) || "",
//         DISCHARGE:
//           (item.DISCHARGE && replaceHypenFormat(item.DISCHARGE, "date")) || "",
//         FEE: item.FEE, // 필요한 경우 포맷팅
//         PARENTPHONE:
//           (item.PARENTPHONE &&
//             item.PARENTPHONE !== "010 " &&
//             replaceHypenFormat(item.PARENTPHONE, "phone")) ||
//           "",
//         BIRTH: (item.BIRTH && replaceHypenFormat(item.BIRTH, "date")) || "",
//         AGE: getAge(item.BIRTH),
//         SEX: getLabel(gender, item.SEX),
//         STATE: getCustomerState(item.STATE),
//         COUNT: getLabel(classCount, item.COUNT),
//       }));

//       // 검색 필터링
//       let filteredData = formattedData;
//       if (searchText) {
//         filteredData = formattedData.filter((item: any) => {
//           return (
//             extractInitialConsonants(item.NAME).includes(searchText) ||
//             item.NAME.includes(searchText)
//           );
//         });
//       }

//       setRows(filteredData);
//     }
//   }, [initialCustomers, searchText]);

//   const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     setSearchText(event.target.value);
//   };

//   const handleOnSelectionModelChange = (ids: GridRowSelectionModel) => {
//     const selectedIDs = new Set(ids);
//     const selectedRows = rows.filter((row) => selectedIDs.has(row.ID));
//     setSelectedGridInfo([...selectedRows]);
//   };

//   // 셀 수정 핸들러 (Server Action 호출)
//   const processRowUpdate = async (
//     newRow: GridRowModel,
//     oldRow: GridRowModel
//   ) => {
//     const { ID: idx, ...updatedFields } = newRow;
//     let updateField = "";

//     // 변경된 필드 찾기
//     for (let key in updatedFields) {
//       if (updatedFields[key] !== oldRow[key]) {
//         updateField = key;
//         break;
//       }
//     }

//     if (!updateField) return oldRow;

//     let value = newRow[updateField];

//     // 유효성 검사 및 값 변환 (기존 로직 유지)
//     if (
//       ["TEL", "PARENTPHONE"].includes(updateField) &&
//       replaceOnlyNum(value).length !== 11
//     ) {
//       showAlert("휴대폰 번호를 정확히 입력해 주세요.");
//       return oldRow;
//     }

//     if (updateField === "DISCHARGE" && newRow.STATE !== "퇴원") {
//       showAlert("퇴원인 학생만 수정이 가능해요.");
//       return oldRow;
//     }

//     if (
//       [
//         "BIRTH",
//         "COUNT",
//         "TEL",
//         "PARENTPHONE",
//         "DATE",
//         "DISCHARGE",
//         "CASH_NUMBER",
//       ].includes(updateField)
//     ) {
//       value = replaceOnlyNum(value);
//     }

//     if (updateField === "STATE") {
//       switch (value) {
//         case "재원":
//           value = "0";
//           break;
//         case "휴원":
//           value = "1";
//           break;
//         case "퇴원":
//           value = "2";
//           break;
//         case "대기":
//           value = "3";
//           break;
//       }
//     }

//     if (updateField === "SEX") {
//       value = value === "여자" ? "F" : "M";
//     }

//     // Server Action 호출 (비동기 처리)
//     startTransition(async () => {
//       await updateCustomerAction({
//         id: idx,
//         key: updateField,
//         value: value,
//         updaterID: id,
//         academyCode: academyCode,
//       });

//       // 추가 로직: 수강 횟수 변경 시 회비 자동 수정
//       if (updateField === "COUNT") {
//         const amountValue = classCount.filter((v) => v.value === value);
//         if (!isEmptyArr(amountValue)) {
//           await updateCustomerAction({
//             id: idx,
//             key: "FEE",
//             value: String(amountValue[0].amount),
//             updaterID: id,
//             academyCode,
//           });
//         }
//       }

//       // 추가 로직: 퇴원 처리 시 퇴원일 자동 입력
//       if (updateField === "STATE" && value === "2") {
//         await updateCustomerAction({
//           id: idx,
//           key: "DISCHARGE",
//           value: getTodayFormattedDate(),
//           updaterID: id,
//           academyCode,
//         });
//       }

//       showChip("수정이 완료되었어요.");
//     });

//     return { ...newRow, [updateField]: value };
//   };

//   return (
//     <Box sx={{ p: 2 }}>
//       <SearchContainer>
//         <TextField
//           size="small"
//           label="검색"
//           value={searchText}
//           onChange={handleSearchChange}
//           variant="outlined"
//           sx={{ width: "200px" }}
//           InputProps={{
//             endAdornment: (
//               <InputAdornment position="end">
//                 {searchText ? (
//                   <IconButton size="small" onClick={() => setSearchText("")}>
//                     <ClearIcon />
//                   </IconButton>
//                 ) : (
//                   <IconButton size="small">
//                     <SearchIcon />
//                   </IconButton>
//                 )}
//               </InputAdornment>
//             ),
//           }}
//         />
//       </SearchContainer>

//       <StyledDataGrid
//         rows={rows}
//         columns={customersColumns}
//         getRowId={(row) => row.ID}
//         processRowUpdate={processRowUpdate}
//         onRowSelectionModelChange={handleOnSelectionModelChange}
//         columnVisibilityModel={getColumnVisibilityModel(customersHideColumn)}
//         checkboxSelection
//         autoPageSize
//         sx={{ height: "calc(100vh - 100px)", backgroundColor: "#fff" }}
//       />
//     </Box>
//   );
// }

// // --- Styles ---

// const StyledDataGrid = styled(DataGrid)(({ theme }) => ({
//   border: "none",
//   "& .MuiDataGrid-columnHeaders": {
//     backgroundColor: "#f8fafc",
//     color: "#1e293b",
//     fontSize: "0.9rem",
//     fontWeight: 700,
//   },
//   "& .MuiDataGrid-row:hover": {
//     backgroundColor: "#f1f5f9",
//   },
//   "& .MuiDataGrid-cell": {
//     borderBottom: "1px solid #f1f5f9",
//   },
// }));

// const SearchContainer = styled(Box)(() => ({
//   display: "flex",
//   alignItems: "center",
//   justifyContent: "flex-end",
//   marginBottom: "16px",
// }));
