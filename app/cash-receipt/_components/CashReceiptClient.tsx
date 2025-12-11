"use client";

import React, { useState, useMemo } from "react";
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
} from "@/api/payment/usePaymentQuery";

interface Props {
  academyCode: string;
  userId: string;
}

export default function CashReceiptClient({ academyCode, userId }: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear().toString());
  const [month, setMonth] = useState(
    String(today.getMonth() + 1).padStart(2, "0")
  );
  const [searchText, setSearchText] = useState("");

  const { data: rows = [], isLoading } = useGetCashReceiptList(
    academyCode,
    year,
    month
  );
  const { mutate: updateCashReceipt } = useUpdateCashReceipt();
  const { mutateAsync: updateBatch } = useUpdateCashReceiptBatch();
  const { openModal } = useModalStore();

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const filteredRows = useMemo(() => {
    if (!searchText) return rows;
    return rows.filter(
      (row: any) =>
        row.name.includes(searchText) ||
        extractInitialConsonants(row.name).includes(searchText)
    );
  }, [rows, searchText]);

  const toggleSelect = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredRows.length && filteredRows.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRows.map((r: any) => r.id)));
    }
  };

  const handleBatchIssue = () => {
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
  };

  const handleBlur = (
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
  };

  const toggleRegister = (id: number, name: string, currentVal: string) => {
    const newVal = currentVal === "Y" ? "N" : "Y";
    updateCashReceipt({
      id,
      name,
      field: "register",
      value: newVal,
      academyCode,
      updaterId: userId,
    });
  };

  const formatDate = (y: string, m: string, d: string) =>
    !y || !m || !d ? "-" : `${y}-${m}-${d}`;

  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const y = String(today.getFullYear() - i);
    return { label: `${y}년`, value: y };
  });

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, "0");
    return { label: `${m}월`, value: m };
  });

  return (
    <>
      {isLoading ? (
        <CashReceiptSkeleton />
      ) : (
        <Container>
          <Header>
            <PageTitleWithStar title={<Title>현금영수증 관리</Title>} />

            <Controls>
              {/* 1. 연도 */}
              <Select
                options={yearOptions}
                value={year}
                onChange={setYear}
                width="90px" // 모바일 고려 조금 줄임
              />
              {/* 2. 월 */}
              <Select
                options={monthOptions}
                value={month}
                onChange={setMonth}
                width="80px" // 모바일 고려 조금 줄임
              />
              {/* 3. 검색창 */}
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
              <Table>
                <thead>
                  <tr>
                    <Th style={{ width: "50px", textAlign: "center" }}>
                      <CheckBoxButton
                        onClick={toggleSelectAll}
                        className={
                          selectedIds.size === filteredRows.length &&
                          filteredRows.length > 0
                            ? "checked"
                            : ""
                        }
                      >
                        {selectedIds.size === filteredRows.length &&
                        filteredRows.length > 0 ? (
                          <CheckSquare size={20} />
                        ) : (
                          <Square size={20} />
                        )}
                      </CheckBoxButton>
                    </Th>
                    <Th style={{ width: "100px", textAlign: "center" }}>
                      상태
                    </Th>
                    <Th style={{ width: "140px" }}>날짜</Th>
                    <Th style={{ width: "100px" }}>이름</Th>
                    <Th style={{ width: "150px" }}>현금영수증 번호</Th>
                    <Th style={{ width: "120px", textAlign: "right" }}>금액</Th>
                    <Th>비고</Th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <Td
                        colSpan={7}
                        style={{ textAlign: "center", padding: "40px" }}
                      >
                        로딩 중...
                      </Td>
                    </tr>
                  ) : filteredRows.length === 0 ? (
                    <tr>
                      <Td
                        colSpan={7}
                        style={{
                          textAlign: "center",
                          padding: "40px",
                          color: "#888",
                        }}
                      >
                        데이터가 없습니다.
                      </Td>
                    </tr>
                  ) : (
                    filteredRows.map((row: any) => (
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
                            onClick={() =>
                              toggleRegister(row.id, row.name, row.register)
                            }
                          >
                            {row.register === "Y" ? "발행" : "미발행"}
                          </Badge>
                        </Td>
                        <Td>
                          <Input
                            defaultValue={formatDate(
                              row.year,
                              row.month,
                              row.day
                            )}
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
                            defaultValue={replaceHyphenFormat(
                              row.cash_number,
                              "phone"
                            )}
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
                            defaultValue={
                              Number(row.fee).toLocaleString() + "원"
                            }
                            style={{
                              textAlign: "right",
                              fontWeight: 700,
                              color: "#3182f6",
                            }}
                            onBlur={(e) =>
                              handleBlur(
                                row.id,
                                row.name,
                                "fee",
                                e.target.value,
                                row.fee
                              )
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
                    ))
                  )}
                </tbody>
              </Table>
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
      )}
    </>
  );
}

// --- Styles ---

const Container = styled.div`
  padding: 32px;
  background-color: #f9f9fb;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
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

// ✅ [수정] 컨트롤 영역 스타일: 줄바꿈 금지(nowrap) + 모바일 100%
const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap; /* 줄바꿈 절대 금지 */

  @media (max-width: 768px) {
    width: 50%; /* 모바일에서 꽉 채우기 */
    margin-top: 4px; /* 타이틀과 약간 띄우기 */
  }
`;

// ✅ [수정] 검색창 스타일: 남는 공간 채우기 (flex: 1)
const SearchWrapper = styled.div`
  display: flex;
  align-items: center;
  background: #fff;
  padding: 0 10px;
  border-radius: 12px;
  width: 180px; /* PC 기본 너비 */
  height: 40px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  border: 1px solid #e5e8eb;
  transition: all 0.2s;

  /* 모바일 대응: 남는 공간 모두 차지 */
  @media (max-width: 768px) {
    /* flex: 1; */
    width: auto;
    min-width: 100%; /* flex 자식 오버플로우 방지 */
  }

  &:focus-within {
    border-color: #3182f6;
  }
`;

const SearchInput = styled.input`
  border: none;
  outline: none;
  width: 100%;
  margin-left: 6px;
  font-size: 14px;
  background: transparent;
  min-width: 0; /* input 크기 줄어들 수 있게 함 */

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

// ... (Table, Th, Td, Tr, Input, Badge, CheckBoxButton 스타일 기존 동일)
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
