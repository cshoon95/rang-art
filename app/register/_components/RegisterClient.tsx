"use client";

import React, { useState, useMemo, useEffect } from "react";
import styled, { css } from "styled-components";
import {
  Search as SearchIcon,
  ChevronLeft,
  ChevronRight,
  Download,
  LayoutList,
  Calendar,
} from "lucide-react";
import { replaceMoneyKr, extractInitialConsonants } from "@/utils/format";
import { useRegisterReport } from "@/api/register/useRegisterQuery";
import * as XLSX from "xlsx";
import ModalCertificate from "@/components/modals/ModalCertificate";
import { useModalStore } from "@/store/modalStore";
import PageTitleWithStar from "@/components/PageTitleWithStar";

interface Props {
  academyCode: string;
}

const MONTHS = Array.from({ length: 12 }, (_, i) =>
  String(i + 1).padStart(2, "0")
);

// 기본값 (PC/태블릿 기준)
const DEFAULT_ITEMS_PER_PAGE = 10;

export default function RegisterClient({ academyCode }: Props) {
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [searchText, setSearchText] = useState("");

  // ✅ 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);

  // 뷰 모드 상태 (기본값: 전체보기)
  const [viewMode, setViewMode] = useState<"all" | "current">("all");
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0");

  const { openModal } = useModalStore();
  const { data, isLoading } = useRegisterReport(academyCode, year);

  const reportData = data?.list || [];
  const monthTotals = data?.monthTotals || {};
  const grandTotal = data?.grandTotal || 0;

  // 🌟 [추가] 화면 크기에 따른 페이지당 아이템 수 조절
  useEffect(() => {
    const handleResize = () => {
      // 모바일(768px 미만)에서는 7개, 그 외(아이패드 등)는 10개
      if (window.innerWidth < 768) {
        setItemsPerPage(8);
      } else {
        setItemsPerPage(10);
      }
    };

    // 초기 실행
    handleResize();

    // 리사이즈 이벤트 등록
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // itemsPerPage가 바뀌면 현재 페이지를 1페이지로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  // 1. 검색 필터링
  const filteredData = useMemo(() => {
    if (!searchText) return reportData;
    return reportData.filter((item: any) => {
      return (
        item.name.includes(searchText) ||
        extractInitialConsonants(item.name).includes(searchText)
      );
    });
  }, [reportData, searchText]);

  // ✅ 검색어가 변경되면 페이지를 1로 초기화
  useEffect(() => {
    setCurrentPage(1);
  }, [searchText]);

  // ✅ 2. 페이지네이션 데이터 계산 (동적 itemsPerPage 사용)
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const handleNameDoubleClick = (name: string) => {
    openModal({
      title: "납입증명서 발급",
      content: (
        <ModalCertificate academyCode={academyCode} year={year} name={name} />
      ),
      type: "FULL",
      hideFooter: true,
    });
  };

  const handleYearChange = (diff: number) => {
    setYear((prev) => (parseInt(prev) + diff).toString());
  };

  const handleExcelDownload = () => {
    if (filteredData.length === 0) {
      alert("다운로드할 데이터가 없습니다.");
      return;
    }
    const excelData: any[][] = [];
    const headerRow = ["이름", ...MONTHS.map((m) => `${Number(m)}월`), "합계"];
    excelData.push(headerRow);
    const totalRow = [
      "월별 합계",
      ...MONTHS.map((m) => monthTotals[m] || 0),
      grandTotal,
    ];
    excelData.push(totalRow);
    filteredData.forEach((row: any) => {
      const rowData = [
        row.name,
        ...MONTHS.map((m) => row.months[m]?.fee || 0),
        row.totalSum,
      ];
      excelData.push(rowData);
    });
    const worksheet = XLSX.utils.aoa_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "등록부");
    XLSX.writeFile(workbook, `등록부_${year}.xlsx`);
  };

  const displayedMonths = useMemo(() => {
    if (viewMode === "current") {
      return [currentMonth];
    }
    return MONTHS;
  }, [viewMode, currentMonth]);

  // ✅ 페이지 번호 배열 생성
  const getPageNumbers = () => {
    const pageNumbers = [];
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);

    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    return pageNumbers;
  };

  return (
    <Container>
      <Header>
        <TitleArea>
          <PageTitleWithStar title={<Title>등록부</Title>} />
          <YearController>
            <YearBtn onClick={() => handleYearChange(-1)}>
              <ChevronLeft size={20} />
            </YearBtn>
            <YearText>{year}년</YearText>
            <YearBtn onClick={() => handleYearChange(1)}>
              <ChevronRight size={20} />
            </YearBtn>
          </YearController>
        </TitleArea>

        <Controls>
          <MobileViewToggle
            onClick={() => setViewMode(viewMode === "all" ? "current" : "all")}
          >
            {viewMode === "all" ? (
              <Calendar size={18} />
            ) : (
              <LayoutList size={18} />
            )}
            <span>{viewMode === "all" ? "이번달" : "전체"}</span>
          </MobileViewToggle>

          <SearchWrapper>
            <SearchIcon size={18} color="#94a3b8" />
            <SearchInput
              placeholder="이름 검색..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </SearchWrapper>
          <ExcelButton onClick={handleExcelDownload}>
            <Download size={18} /> 엑셀 저장
          </ExcelButton>
        </Controls>
      </Header>

      <TableContainer>
        <Table $isCurrentView={viewMode === "current"}>
          <Thead>
            <tr style={{ height: "50px" }}>
              <StickyThLeft>이름</StickyThLeft>
              {displayedMonths.map((m) => (
                <Th key={m}>{Number(m)}월</Th>
              ))}
              <StickyThRight>합계</StickyThRight>
            </tr>
            <TotalRow>
              <StickyTdLeftTotal>월별 합계</StickyTdLeftTotal>
              {displayedMonths.map((m) => (
                <TotalTd key={m}>
                  {monthTotals[m] ? replaceMoneyKr(monthTotals[m]) : "-"}
                </TotalTd>
              ))}
              <StickyTdRightTotal>
                {replaceMoneyKr(grandTotal)}
              </StickyTdRightTotal>
            </TotalRow>
          </Thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={14}
                  style={{
                    padding: "40px",
                    textAlign: "center",
                    color: "#888",
                  }}
                >
                  데이터를 불러오는 중입니다...
                </td>
              </tr>
            ) : filteredData.length > 0 ? (
              // ✅ 페이지네이션된 데이터 렌더링
              paginatedData.map((row: any) => (
                <tr key={row.name}>
                  <StickyTdLeft
                    onDoubleClick={() => handleNameDoubleClick(row.name)}
                    style={{
                      cursor: "pointer",
                      color: "#3182f6",
                      textDecoration: "underline",
                    }}
                  >
                    {row.name}
                  </StickyTdLeft>

                  {displayedMonths.map((m) => {
                    const cellData = row.months[m];
                    return (
                      <Td key={m} $hasData={!!cellData?.fee}>
                        {cellData?.fee ? (
                          <CellContent>
                            <DateText>
                              {Number(m)}월 {cellData.day}일
                            </DateText>
                            <FeeText>{replaceMoneyKr(cellData.fee)}</FeeText>
                          </CellContent>
                        ) : (
                          ""
                        )}
                      </Td>
                    );
                  })}

                  <StickyTdRight>{replaceMoneyKr(row.totalSum)}</StickyTdRight>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={14}
                  style={{
                    padding: "40px",
                    textAlign: "center",
                    color: "#888",
                  }}
                >
                  데이터가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </TableContainer>

      {/* ✅ 페이지네이션 UI */}
      {!isLoading && filteredData.length > 0 && (
        <PaginationWrapper>
          <PageButton
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={16} />
          </PageButton>

          {getPageNumbers().map((pageNum) => (
            <PageNumber
              key={pageNum}
              $active={pageNum === currentPage}
              onClick={() => setCurrentPage(pageNum)}
            >
              {pageNum}
            </PageNumber>
          ))}

          <PageButton
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
          >
            <ChevronRight size={16} />
          </PageButton>
        </PaginationWrapper>
      )}
    </Container>
  );
}

// --- Styles ---

const Container = styled.div`
  padding: 24px;
  background-color: #f2f4f6;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 20px;
  @media (max-width: 768px) {
    padding: 16px;
    margin-bottom: 50px;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
`;

const TitleArea = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 800;
  color: #191f28;
  margin: 0;
`;

const YearController = styled.div`
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 12px;
  padding: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
`;

const YearBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  color: #64748b;
  &:hover {
    color: #3182f6;
  }
`;

const YearText = styled.span`
  font-size: 16px;
  font-weight: 700;
  color: #333;
  margin: 0 8px;
`;

const Controls = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  width: 100%;
  justify-content: end;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-between;
  }
`;

const MobileViewToggle = styled.button`
  display: none;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  height: 40px;
  border-radius: 12px;
  background-color: #fff;
  border: 1px solid #e5e8eb;
  color: #4e5968;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

  @media (max-width: 768px) {
    display: flex;
  }
`;

const SearchWrapper = styled.div`
  display: flex;
  align-items: center;
  background: #fff;
  padding: 0 12px;
  border-radius: 12px;
  width: 200px;
  height: 40px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  border: 1px solid #e5e8eb;
  transition: all 0.2s;
  &:focus-within {
    border-color: #3182f6;
    width: 240px;
  }
  @media (max-width: 768px) {
    flex: 1;
    width: auto;
    &:focus-within {
      width: auto;
    }
  }
`;

const SearchInput = styled.input`
  border: none;
  outline: none;
  width: 100%;
  margin-left: 8px;
  font-size: 14px;
  &::placeholder {
    color: #b0b8c1;
  }
`;

const ExcelButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 16px;
  height: 40px;
  border-radius: 12px;
  background-color: #10b981;
  color: white;
  border: none;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(16, 185, 129, 0.2);
  transition: all 0.2s;
  &:hover {
    background-color: #059669;
    transform: translateY(-1px);
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

const TableContainer = styled.div`
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
  overflow: auto;
  min-height: 500px;
  border: 1px solid #e5e8eb;
  position: relative;

  &::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #cbd5e1;
    border-radius: 5px;
    border: 2px solid #fff;
  }
  &::-webkit-scrollbar-corner {
    background-color: #fff;
  }
`;

const Table = styled.table<{ $isCurrentView?: boolean }>`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  min-width: ${(props) => (props.$isCurrentView ? "100%" : "1400px")};
`;
const Thead = styled.thead`
  position: sticky;
  top: 0;
  z-index: 20;
  background-color: #f8fafc;
`;
const cellBase = css`
  padding: 10px 8px;
  text-align: center;
  font-size: 13px;
  border-bottom: 1px solid #f1f5f9;
  border-right: 1px solid #f1f5f9;
  white-space: nowrap;
`;
const Th = styled.th`
  ${cellBase} background-color: #f1f5f9;
  color: #64748b;
  font-weight: 700;
  border-bottom: 2px solid #e2e8f0;
`;
const TotalRow = styled.tr`
  background-color: #fffbeb;
  font-weight: 800;
  color: #b45309;
  td {
    border-bottom: 2px solid #e2e8f0;
  }
`;
const stickyStyle = css`
  position: sticky;
  z-index: 10;
  background-color: #fff;
  border-right: 2px solid #e2e8f0;
`;
const StickyThLeft = styled(Th)`
  ${stickyStyle} left: 0;
  width: 80px;
  min-width: 80px;
  z-index: 30;
  background-color: #f1f5f9;
`;
const StickyThRight = styled(Th)`
  ${stickyStyle} right: 0;
  width: 100px;
  min-width: 100px;
  z-index: 30;
  background-color: #f1f5f9;
  border-right: none;
  border-left: 2px solid #e2e8f0;
`;
const StickyTdLeft = styled.td`
  ${cellBase};
  ${stickyStyle};
  left: 0;
  font-weight: 700;
  color: #334155;

  tr:nth-child(even) & {
    background-color: #f8fafc;
  }
  tr:hover & {
    background-color: #e0f2fe;
  }
`;

const StickyTdRight = styled.td`
  ${cellBase};
  ${stickyStyle};
  right: 0;
  font-weight: 800;
  color: #3182f6;
  background-color: #f0f9ff;
  border-left: 2px solid #e2e8f0;
  border-right: none;
`;

const StickyTdLeftTotal = styled(StickyTdLeft)`
  background-color: #fffbeb !important;
  color: #b45309;
  z-index: 25;
`;

const StickyTdRightTotal = styled(StickyTdRight)`
  background-color: #fffbeb;
  color: #b45309;
  z-index: 25;
`;

const Td = styled.td<{ $hasData?: boolean }>`
  ${cellBase};
  color: #333;
  transition: background-color 0.2s;
  background-color: ${(props) => (props.$hasData ? "#f0f9ff" : "transparent")};

  tr:hover & {
    background-color: #f1f5f9;
  }

  ${(props) =>
    props.$hasData &&
    css`
      &:hover {
        background-color: #e0f2fe !important;
      }
    `}
`;

const TotalTd = styled.td`
  ${cellBase};
`;

const CellContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;
  justify-content: center;
`;

const DateText = styled.span`
  font-size: 11px;
  color: #64748b;
  font-weight: 500;
`;

const FeeText = styled.span`
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
`;

const PaginationWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  padding-bottom: 20px;
`;

const PageButton = styled.button`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e5e8eb;
  background-color: white;
  border-radius: 8px;
  cursor: pointer;
  color: #333;
  transition: all 0.2s;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background-color: #f9fafb;
  }

  &:hover:not(:disabled) {
    background-color: #f2f4f6;
    border-color: #d1d5db;
  }
`;

const PageNumber = styled.button<{ $active?: boolean }>`
  min-width: 32px;
  height: 32px;
  padding: 0 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 14px;
  font-weight: ${(props) => (props.$active ? "700" : "500")};
  cursor: pointer;
  border: ${(props) => (props.$active ? "none" : "1px solid #e5e8eb")};
  background-color: ${(props) => (props.$active ? "#3182f6" : "white")};
  color: ${(props) => (props.$active ? "white" : "#333")};
  transition: all 0.2s;

  &:hover {
    ${(props) =>
      !props.$active &&
      css`
        background-color: #f2f4f6;
        border-color: #d1d5db;
      `}
  }
`;
