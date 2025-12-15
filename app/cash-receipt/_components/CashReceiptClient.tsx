"use client";

import React, { useState, useMemo, useCallback } from "react";
import styled, { css } from "styled-components";
import { Search as SearchIcon, CheckSquare, Square } from "lucide-react";

import {
  replaceHyphenFormat,
  replaceOnlyNum,
  extractInitialConsonants,
} from "@/utils/format";
import PageTitleWithStar from "@/components/PageTitleWithStar";
import Select from "@/components/Select";
import { useModalStore } from "@/store/modalStore";
import CashReceiptSkeleton from "./CashReceiptSkeleton";
import {
  useGetCashReceiptList,
  useUpdateCashReceipt,
  useUpdateCashReceiptBatch,
} from "@/app/_querys";

interface Props {
  academyCode: string;
  userId: string;
}

// --- Helper Functions ---
const formatDate = (y: string, m: string, d: string) =>
  !y || !m || !d ? "-" : `${y}-${m}-${d}`;

// --- Sub Component: Table (렌더링 최적화) ---
const CashReceiptTable = React.memo(
  ({
    data,
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    toggleRegister,
    handleBlur,
    year,
  }: any) => {
    if (data.length === 0) {
      return <EmptyMessage>데이터가 없습니다.</EmptyMessage>;
    }

    return (
      <Table>
        <thead>
          <tr>
            <Th style={{ width: "50px", textAlign: "center" }}>
              <CheckBoxButton
                onClick={toggleSelectAll}
                className={
                  selectedIds.size === data.length && data.length > 0
                    ? "checked"
                    : ""
                }
              >
                {selectedIds.size === data.length && data.length > 0 ? (
                  <CheckSquare size={20} />
                ) : (
                  <Square size={20} />
                )}
              </CheckBoxButton>
            </Th>
            <Th style={{ width: "100px", textAlign: "center" }}>상태</Th>
            <Th style={{ width: "140px" }}>날짜</Th>
            <Th style={{ width: "100px" }}>이름</Th>
            <Th style={{ width: "150px" }}>현금영수증 번호</Th>
            <Th style={{ width: "120px", textAlign: "right" }}>금액</Th>
            <Th>비고</Th>
          </tr>
        </thead>
        <tbody>
          {data.map((row: any) => (
            <Tr key={row.id} $isSelected={selectedIds.has(row.id)}>
              <Td style={{ textAlign: "center" }}>
                <CheckBoxButton
                  onClick={() => toggleSelect(row.id)}
                  className={selectedIds.has(row.id) ? "checked" : ""}
                >
                  {selectedIds.has(row.id) ? (
                    <CheckSquare size={20} />
                  ) : (
                    <Square size={20} />
                  )}
                </CheckBoxButton>
              </Td>
              <Td style={{ textAlign: "center" }}>
                <Badge
                  $active={row.register === "Y"}
                  onClick={() => toggleRegister(row.id, row.name, row.register)}
                >
                  {row.register === "Y" ? "발행" : "미발행"}
                </Badge>
              </Td>
              <Td>
                <Input
                  defaultValue={formatDate(row.year, row.month, row.day)}
                  onBlur={(e) =>
                    handleBlur(
                      row.id,
                      row.name,
                      "date",
                      e.target.value,
                      formatDate(row.year, row.month, row.day)
                    )
                  }
                  placeholder="YYYY-MM-DD"
                />
              </Td>
              <Td style={{ fontWeight: 600 }}>{row.name}</Td>
              <Td>
                <Input
                  defaultValue={replaceHyphenFormat(row.cash_number, "phone")}
                  placeholder="번호 입력"
                  onBlur={(e) =>
                    handleBlur(
                      row.id,
                      row.name,
                      "cash_number",
                      e.target.value,
                      row.cash_number
                    )
                  }
                />
              </Td>
              <Td style={{ textAlign: "right" }}>
                <Input
                  defaultValue={Number(row.fee).toLocaleString() + "원"}
                  style={{
                    textAlign: "right",
                    fontWeight: 700,
                    color: "#3182f6",
                  }}
                  onBlur={(e) =>
                    handleBlur(row.id, row.name, "fee", e.target.value, row.fee)
                  }
                />
              </Td>
              <Td>
                <Input
                  defaultValue={row.note}
                  placeholder="메모"
                  onBlur={(e) =>
                    handleBlur(
                      row.id,
                      row.name,
                      "note",
                      e.target.value,
                      row.note
                    )
                  }
                />
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    );
  }
);
CashReceiptTable.displayName = "CashReceiptTable";

// --- Main Component ---

export default function CashReceiptClient({ academyCode, userId }: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear().toString());
  const [month, setMonth] = useState(
    String(today.getMonth() + 1).padStart(2, "0")
  );
  const [searchText, setSearchText] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const { data: rows = [], isLoading } = useGetCashReceiptList(
    academyCode,
    year,
    month
  );
  const { mutate: updateCashReceipt } = useUpdateCashReceipt();
  const { mutateAsync: updateBatch } = useUpdateCashReceiptBatch();
  const { openModal } = useModalStore();

  // 1. 데이터 필터링 (useMemo)
  const filteredRows = useMemo(() => {
    if (!searchText) return rows;
    return rows.filter(
      (row: any) =>
        row.name.includes(searchText) ||
        extractInitialConsonants(row.name).includes(searchText)
    );
  }, [rows, searchText]);

  // 2. 옵션 데이터 (useMemo)
  const yearOptions = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => {
        const y = String(today.getFullYear() - i);
        return { label: `${y}년`, value: y };
      }),
    []
  );

  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const m = String(i + 1).padStart(2, "0");
        return { label: `${m}월`, value: m };
      }),
    []
  );

  // Handlers (useCallback)
  const toggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredRows.length && filteredRows.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRows.map((r: any) => r.id)));
    }
  }, [selectedIds, filteredRows]);

  const handleBatchIssue = useCallback(() => {
    if (selectedIds.size === 0) return;

    openModal({
      title: "일괄 발행",
      content: `선택한 ${selectedIds.size}건을 '발행 완료' 처리하시겠어요?`,
      type: "CONFIRM",
      onConfirm: async () => {
        await updateBatch({
          ids: Array.from(selectedIds),
          value: "Y",
          updaterId: userId,
          academyCode,
        });
        setSelectedIds(new Set());
      },
    });
  }, [selectedIds, updateBatch, userId, academyCode, openModal]);

  const handleBlur = useCallback(
    (
      id: number,
      name: string,
      field: string,
      value: string,
      originalValue: any
    ) => {
      let finalValue = value;
      if (value === String(originalValue)) return;

      if (field === "date") {
        const num = replaceOnlyNum(value);
        if (num.length === 4)
          finalValue = `${year}${num.substring(0, 2)}${num.substring(2, 4)}`;
        else if (num.length === 8) finalValue = num;
        else return;
      } else if (field === "fee" || field === "cash_number") {
        finalValue = replaceOnlyNum(value);
      }

      updateCashReceipt({
        id,
        name,
        field,
        value: finalValue,
        academyCode,
        updaterId: userId,
      });
    },
    [year, updateCashReceipt, academyCode, userId]
  );

  const toggleRegister = useCallback(
    (id: number, name: string, currentVal: string) => {
      const newVal = currentVal === "Y" ? "N" : "Y";
      updateCashReceipt({
        id,
        name,
        field: "register",
        value: newVal,
        academyCode,
        updaterId: userId,
      });
    },
    [updateCashReceipt, academyCode, userId]
  );

  // Select Change Handlers
  const handleYearChange = useCallback(
    (_: any, v?: string) => v && setYear(v),
    []
  );
  const handleMonthChange = useCallback(
    (_: any, v?: string) => v && setMonth(v),
    []
  );

  if (isLoading) return <CashReceiptSkeleton />;

  return (
    <Container>
      <Header>
        <PageTitleWithStar title={<Title>현금영수증</Title>} />
        <Controls>
          <Select
            options={yearOptions}
            value={year}
            onChange={handleYearChange}
            width="90px"
          />
          <Select
            options={monthOptions}
            value={month}
            onChange={handleMonthChange}
            width="80px"
          />
          <SearchWrapper>
            <SearchIcon size={18} color="#94a3b8" />
            <SearchInput
              placeholder="이름"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </SearchWrapper>
        </Controls>
      </Header>

      <ContentArea>
        <TableContainer>
          <CashReceiptTable
            data={filteredRows}
            selectedIds={selectedIds}
            toggleSelect={toggleSelect}
            toggleSelectAll={toggleSelectAll}
            toggleRegister={toggleRegister}
            handleBlur={handleBlur}
            year={year}
          />
        </TableContainer>

        <ActionFooter>
          <FooterText>
            {selectedIds.size > 0
              ? `${selectedIds.size}건 선택됨`
              : "선택된 항목 없음"}
          </FooterText>
          <ActionButton
            onClick={handleBatchIssue}
            disabled={selectedIds.size === 0}
          >
            일괄 발행 처리
          </ActionButton>
        </ActionFooter>
      </ContentArea>
    </Container>
  );
}

// --------------------------------------------------------------------------
// ✨ Styles (기존과 동일)
// --------------------------------------------------------------------------

const Container = styled.div`
  padding: 32px;
  display: flex;
  background-color: white;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(224, 224, 224, 0.4);
  border-radius: 24px;
  gap: 24px;
  @media (max-width: 600px) {
    padding: 16px;
  }
`;
const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
`;
const Title = styled.h1`
  font-size: 26px;
  font-weight: 800;
  color: #191f28;
  margin: 0;
`;
const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
  @media (max-width: 768px) {
    width: 100%; /* 모바일에서 꽉 채우기 */
    margin-top: 4px;
    justify-content: flex-end;
  }
`;
const SearchWrapper = styled.div`
  display: flex;
  align-items: center;
  background: #fff;
  padding: 0 10px;
  border-radius: 12px;
  width: 180px;
  height: 40px; /* Select 높이와 통일 (보통 38~42px) */
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  border: 1px solid #e5e8eb;
  transition: all 0.2s;
  &:focus-within {
    border-color: #3182f6;
  }
  @media (max-width: 768px) {
    flex: 1; /* 남는 공간 채우기 */
    min-width: 120px;
  }
`;
const SearchInput = styled.input`
  border: none;
  outline: none;
  width: 100%;
  margin-left: 6px;
  font-size: 14px;
  background: transparent;
  min-width: 0;
  &::placeholder {
    color: #b0b8c1;
  }
`;
const ContentArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;
const TableContainer = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
  overflow-x: auto;
  border: 1px solid #e5e8eb;
  min-height: 500px;
`;
const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
`;
const Th = styled.th`
  padding: 16px;
  text-align: left;
  font-size: 14px;
  font-weight: 600;
  color: #8b95a1;
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e8eb;
  white-space: nowrap;
`;
const Td = styled.td`
  padding: 12px 16px;
  border-bottom: 1px solid #f2f4f6;
  font-size: 15px;
  color: #333;
  vertical-align: middle;
`;
const Tr = styled.tr<{ $isSelected?: boolean }>`
  background-color: ${(props) => (props.$isSelected ? "#f0f9ff" : "white")};
  transition: background-color 0.1s;
  &:hover {
    background-color: ${(props) => (props.$isSelected ? "#e0f2fe" : "#f9fafb")};
  }
`;
const Input = styled.input`
  width: 100%;
  padding: 8px;
  border: 1px solid transparent;
  border-radius: 8px;
  font-size: 14px;
  background-color: transparent;
  transition: all 0.2s;
  &:focus {
    background-color: #fff;
    border-color: #3182f6;
    box-shadow: 0 0 0 2px rgba(49, 130, 246, 0.1);
    outline: none;
  }
  &:hover {
    background-color: #f9fafb;
  }
`;
const Badge = styled.button<{ $active: boolean }>`
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  background-color: ${({ $active }) => ($active ? "#e8f3ff" : "#fff0f0")};
  color: ${({ $active }) => ($active ? "#3182f6" : "#e11d48")};
  transition: all 0.2s;
  &:hover {
    opacity: 0.8;
  }
`;
const CheckBoxButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #d1d6db;
  transition: color 0.2s;
  &.checked {
    color: #3182f6;
  }
  &:hover {
    color: #3182f6;
  }
`;
const ActionFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  padding: 0 8px;
`;
const FooterText = styled.span`
  font-size: 15px;
  font-weight: 600;
  color: #4e5968;
`;
const ActionButton = styled.button`
  padding: 10px 20px;
  border-radius: 8px;
  background-color: #3182f6;
  color: white;
  font-weight: 700;
  border: none;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(49, 130, 246, 0.2);
  transition: all 0.2s;
  &:hover {
    background-color: #1b64da;
    transform: translateY(-2px);
  }
  &:disabled {
    background-color: #e5e8eb;
    color: #b0b8c1;
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
  }
`;
const EmptyMessage = styled.div`
  padding: 40px;
  text-align: center;
  color: #888;
`;
