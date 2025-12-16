"use client";

import React, { useState, useMemo, useEffect } from "react";
import styled, { css } from "styled-components";
import {
  Search,
  X as XIcon,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";
import {
  extractInitialConsonants,
  replaceFirstPadZero,
  replaceOnlyNum,
} from "@/utils/format";
import PaymentDeleteModal from "./PaymentDeleteModal";
import { MessageCircle, Bell, Plus } from "lucide-react";
import PaymentAddModal from "./PaymentAddModal";
import { usePaymentList, useUpsertPayment } from "@/app/_querys";
import { PaymentType } from "@/app/_types/type";
import PaymentGridSkeleton from "./PaymentGridSkeleton";

// --- Logic ---
interface Props {
  year: string;
  month: string;
  type: PaymentType;
  academyCode: string;
  userId: string;
}

export default function PaymentGrid({
  year,
  month,
  type,
  academyCode,
  userId,
}: Props) {
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false); // 🌟 추가 모달 상태

  const { data: rows = [], isLoading } = usePaymentList(
    year,
    month,
    type,
    academyCode
  );
  const { mutate: upsertPayment } = useUpsertPayment(type);

  // 화면 크기에 따른 페이지당 아이템 수 조절
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setItemsPerPage(5);
      } else {
        setItemsPerPage(9);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 검색어 변경 시 1페이지로
  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, year, month, type, itemsPerPage]);

  const filteredRows = useMemo(() => {
    if (!searchText) return rows;
    return rows.filter((row: any) => {
      const targetName = type === "income" ? row.name : row.item;
      if (!targetName) return false;
      return (
        targetName.includes(searchText) ||
        extractInitialConsonants(targetName).includes(searchText)
      );
    });
  }, [rows, searchText, type]);

  const totalPages = Math.ceil(filteredRows.length / itemsPerPage);
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredRows.slice(start, end);
  }, [filteredRows, currentPage, itemsPerPage]);

  // 🌟 [수정] onBlur 핸들러: 값 비교 및 포맷 제거 후 저장
  const handleBlur = (
    id: number,
    field: string,
    value: string,
    originalValue: any
  ) => {
    let rawValue = value;
    let rawOriginal = String(originalValue);

    // 금액과 날짜는 포맷을 제거하고 숫자만 비교
    if (field === "fee" || field === "amount") {
      rawValue = replaceOnlyNum(value);
      rawOriginal = replaceOnlyNum(String(originalValue));
    } else if (field === "day") {
      rawValue = replaceFirstPadZero(replaceOnlyNum(value));
      rawOriginal = replaceFirstPadZero(replaceOnlyNum(String(originalValue)));
    }

    if (rawValue === rawOriginal) return;

    const payload: any = {
      id,
      year,
      month,
      day: field === "day" ? rawValue : undefined,
      academy_code: academyCode,
      updater_id: userId,
      [field]: rawValue,
    };

    upsertPayment(payload);
  };

  const toggleRegister = (row: any) => {
    const newVal = row.register === "Y" ? "N" : "Y";
    upsertPayment({
      id: row.id,
      year,
      month,
      day: row.day,
      academy_code: academyCode,
      updater_id: userId,
      register: newVal,
    });
  };

  const formatDateDisplay = (day: string) => {
    if (!day) return "";
    const cleanDay = replaceFirstPadZero(day);
    const cleanMonth = replaceFirstPadZero(month);
    return `${cleanMonth}월 ${cleanDay}일`;
  };

  const formatCurrency = (val: number | string | undefined) => {
    if (!val) return "";
    const num = Number(replaceOnlyNum(String(val)));
    if (isNaN(num)) return "";
    return num.toLocaleString() + "원";
  };

  if (isLoading) {
    return <PaymentGridSkeleton />;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Toolbar>
        <LeftGroup>
          <SectionTitle>
            {type === "income" ? "수입 목록" : "지출 목록"}
          </SectionTitle>
          <AddButton onClick={() => setIsAddModalOpen(true)} title="내역 추가">
            <Plus size={18} />
          </AddButton>
        </LeftGroup>

        <SearchInputWrapper>
          <SearchInput
            placeholder={type === "income" ? "이름 검색..." : "내역 검색..."}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <SearchIconWrapper onClick={() => setSearchText("")}>
            {searchText ? <XIcon size={16} /> : <Search size={16} />}
          </SearchIconWrapper>
        </SearchInputWrapper>
      </Toolbar>

      <TableContainer>
        <Table>
          <Thead>
            <tr>
              <Th $isFirst style={{ width: "100px" }}>
                날짜
              </Th>
              {type === "income" ? (
                <>
                  <Th style={{ width: "100px" }}>이름</Th>
                  <Th style={{ width: "120px", textAlign: "right" }}>금액</Th>
                  <Th style={{ width: "100px", textAlign: "center" }}>
                    현금영수증
                  </Th>
                  <Th style={{ width: "100px" }}>결제수단</Th>
                  <Th style={{ minWidth: "150px" }}>비고</Th>
                </>
              ) : (
                <>
                  <Th style={{ width: "150px" }}>지출 내역</Th>
                  <Th style={{ width: "120px", textAlign: "right" }}>금액</Th>
                  <Th style={{ width: "100px" }}>분류</Th>
                  <Th style={{ minWidth: "150px" }}>비고</Th>
                </>
              )}
              <Th style={{ width: "50px" }}></Th>
            </tr>
          </Thead>
          <tbody>
            {paginatedRows.length === 0 ? (
              <tr>
                <Td
                  colSpan={7}
                  style={{
                    textAlign: "center",
                    padding: "60px 0",
                    color: "#8b95a1",
                  }}
                >
                  {searchText ? "검색 결과가 없습니다." : "데이터가 없습니다."}
                </Td>
              </tr>
            ) : (
              paginatedRows.map((row: any) => (
                <Tr key={row.id}>
                  {/* 🌟 Key Prop 추가로 갱신 보장 */}
                  <Td $isFirst>
                    <CellInput
                      key={`day-${row.id}-${row.day}`}
                      defaultValue={formatDateDisplay(row.day)}
                      onFocus={(e) => (e.target.value = row.day)}
                      onBlur={(e) => {
                        const val = e.target.value;
                        handleBlur(row.id, "day", val, row.day);
                        e.target.value = formatDateDisplay(
                          replaceFirstPadZero(replaceOnlyNum(val))
                        );
                      }}
                      placeholder={formatDateDisplay(row.day)}
                    />
                  </Td>

                  {type === "income" ? (
                    <>
                      <Td>
                        <CellInput
                          key={`name-${row.id}-${row.name}`}
                          defaultValue={row.name}
                          onBlur={(e) =>
                            handleBlur(row.id, "name", e.target.value, row.name)
                          }
                          style={{ fontWeight: 600 }}
                        />
                      </Td>
                      <Td style={{ textAlign: "right" }}>
                        <CellInput
                          key={`fee-${row.id}-${row.fee}`}
                          $align="right"
                          defaultValue={formatCurrency(row.fee)}
                          placeholder="0원"
                          onFocus={(e) =>
                            (e.target.value = row.fee ? String(row.fee) : "")
                          }
                          onBlur={(e) => {
                            const val = e.target.value;
                            handleBlur(row.id, "fee", val, row.fee);
                            e.target.value = formatCurrency(
                              Number(replaceOnlyNum(val))
                            );
                          }}
                          style={{ color: "#3182f6", fontWeight: 700 }}
                        />
                      </Td>
                      <Td style={{ textAlign: "center" }}>
                        <Badge
                          $type={row.register || "N"}
                          onClick={() => toggleRegister(row)}
                        >
                          {row.register === "Y" ? "발행완료" : "미발행"}
                        </Badge>
                      </Td>
                      <Td>
                        <CellInput
                          key={`card-${row.id}-${row.card}`}
                          defaultValue={row.card}
                          placeholder="-"
                          onBlur={(e) =>
                            handleBlur(row.id, "card", e.target.value, row.card)
                          }
                        />
                      </Td>
                    </>
                  ) : (
                    <>
                      <Td>
                        <CellInput
                          key={`item-${row.id}-${row.item}`}
                          defaultValue={row.item}
                          onBlur={(e) =>
                            handleBlur(row.id, "item", e.target.value, row.item)
                          }
                          style={{ fontWeight: 600 }}
                        />
                      </Td>
                      <Td style={{ textAlign: "right" }}>
                        <CellInput
                          key={`amount-${row.id}-${row.amount}`}
                          $align="right"
                          defaultValue={formatCurrency(row.amount)}
                          placeholder="0원"
                          onFocus={(e) =>
                            (e.target.value = row.amount
                              ? String(row.amount)
                              : "")
                          }
                          onBlur={(e) => {
                            const val = e.target.value;
                            handleBlur(row.id, "amount", val, row.amount);
                            e.target.value = formatCurrency(
                              Number(replaceOnlyNum(val))
                            );
                          }}
                          style={{ color: "#e11d48", fontWeight: 700 }}
                        />
                      </Td>
                      <Td>
                        <CellInput
                          key={`kind-${row.id}-${row.kind}`}
                          defaultValue={row.kind}
                          placeholder="-"
                          onBlur={(e) =>
                            handleBlur(row.id, "kind", e.target.value, row.kind)
                          }
                        />
                      </Td>
                    </>
                  )}

                  <Td>
                    <CellInput
                      key={`note-${row.id}-${row.note}`}
                      defaultValue={row.note}
                      placeholder="메모 입력"
                      onBlur={(e) =>
                        handleBlur(row.id, "note", e.target.value, row.note)
                      }
                      style={{ color: "#8b95a1" }}
                    />
                  </Td>

                  {/* 삭제 버튼 */}
                  <Td style={{ textAlign: "center" }}>
                    <DeleteButton onClick={() => setDeleteTargetId(row.id)}>
                      <Trash2 size={16} />
                    </DeleteButton>
                  </Td>
                </Tr>
              ))
            )}
          </tbody>
        </Table>
      </TableContainer>

      {filteredRows.length > 0 && (
        <PaginationWrapper>
          <PageButton
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={16} />
          </PageButton>
          <span style={{ fontSize: "14px", fontWeight: 500, color: "#666" }}>
            {currentPage} / {totalPages}
          </span>
          <PageButton
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight size={16} />
          </PageButton>
        </PaginationWrapper>
      )}

      {/* 삭제 모달 */}
      {deleteTargetId && (
        <PaymentDeleteModal
          id={deleteTargetId}
          type={type}
          academyCode={academyCode}
          onClose={() => setDeleteTargetId(null)}
        />
      )}

      {isAddModalOpen && (
        <PaymentAddModal
          type={type}
          academyCode={academyCode}
          userId={userId}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}
    </div>
  );
}

// --- Styles ---
const Toolbar = styled.div`
  display: flex;
  justify-content: space-between; /* 양 끝 배치 */
  align-items: center;
  margin-bottom: 16px;
  gap: 12px;
`;

/* 🌟 [추가] 타이틀과 버튼을 묶는 왼쪽 그룹 */
const LeftGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: #191f28;
  margin: 0;
  white-space: nowrap;
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background-color: #3182f6;
  color: white;
  border: none;
  border-radius: 8px; /* 둥근 사각형 */
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #1b64da;
  }
`;

const SearchInputWrapper = styled.div`
  position: relative;
  width: 240px;

  /* 모바일 대응: 공간이 부족하면 줄어들거나 100% 차지 */
  @media (max-width: 600px) {
    /* flex: 1;  <-- 필요시 주석 해제하여 남는 공간 다 채우게 가능 */
    width: 160px; /* 너무 작아지지 않게 */
  }
`;

const SearchInput = styled.input`
  width: 100%;
  height: 40px;
  padding: 0 40px 0 16px;
  border-radius: 12px;
  border: 1px solid #e5e8eb;
  background-color: #f9fafb;
  font-size: 14px;
  transition: all 0.2s;
  &:focus {
    background-color: #fff;
    border-color: #3182f6;
    box-shadow: 0 0 0 3px rgba(49, 130, 246, 0.1);
    outline: none;
  }
`;

const SearchIconWrapper = styled.div`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #8b95a1;
  display: flex;
  align-items: center;
  cursor: pointer;
`;

const TableContainer = styled.div`
  overflow-x: auto;
  width: 100%;

  /* 높이 반응형 설정 */
  min-height: 500px;
  @media (max-width: 768px) {
    min-height: 300px;
  }

  &::-webkit-scrollbar {
    height: 8px;
    width: 8px;
  }
  &::-webkit-scrollbar-thumb {
    background: #e5e8eb;
    border-radius: 4px;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  min-width: 700px;
`;

const Thead = styled.thead`
  background-color: #f9fafb;
`;

const Th = styled.th<{ $isFirst?: boolean }>`
  padding: 12px 16px;
  text-align: left;
  font-size: 13px;
  font-weight: 600;
  color: #8b95a1;
  border-bottom: 1px solid #e5e8eb;
  white-space: nowrap;
  background-color: #f9fafb;

  /* 상단 고정 */
  position: sticky;
  top: 0;
  z-index: 10;

  /* 첫 번째 열 고정 */
  ${(props) =>
    props.$isFirst &&
    css`
      left: 0;
      z-index: 20;
      border-right: 1px solid #e5e8eb;
    `}
`;

const Tr = styled.tr`
  transition: background-color 0.1s;
  &:hover {
    background-color: #fdfdfd;
  }
`;

const Td = styled.td<{ $isFirst?: boolean }>`
  padding: 10px 16px;
  border-bottom: 1px solid #f2f4f6;
  font-size: 15px;
  color: #333d4b;
  vertical-align: middle;
  background-color: #fff;

  /* 첫 번째 열 고정 */
  ${(props) =>
    props.$isFirst &&
    css`
      position: sticky;
      left: 0;
      z-index: 5;
      border-right: 1px solid #f2f4f6;
      background-color: #fff;
    `}
`;

const CellInput = styled.input<{ $align?: string }>`
  width: 100%;
  border: none;
  background: transparent;
  font-size: 15px;
  color: inherit;
  font-weight: inherit;
  text-align: ${({ $align }) => $align || "left"};
  padding: 4px 0;
  border-radius: 4px;

  &:focus {
    background-color: #e8f3ff;
    outline: none;
    color: #3182f6;
    padding: 4px 8px;
    margin: 0 -8px;
  }
  &::placeholder {
    color: #d1d6db;
  }
`;

const Badge = styled.span<{ $type: "Y" | "N" }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  background-color: ${({ $type }) => ($type === "Y" ? "#e8f3ff" : "#fff0f0")};
  color: ${({ $type }) => ($type === "Y" ? "#3182f6" : "#e11d48")};
  cursor: pointer;
  transition: opacity 0.2s;
  &:hover {
    opacity: 0.8;
  }
`;

const DeleteButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    background-color: #fee2e2;
    color: #ef4444;
  }
`;

const PaginationWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 24px;
`;

const PageButton = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 6px;
  border: 1px solid ${({ $active }) => ($active ? "#3182f6" : "#e5e8eb")};
  background-color: ${({ $active }) => ($active ? "#3182f6" : "#fff")};
  color: ${({ $active }) => ($active ? "#fff" : "#4e5968")};
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background-color: ${({ $active }) => ($active ? "#1b64da" : "#f9fafb")};
    border-color: ${({ $active }) => ($active ? "#1b64da" : "#d1d6db")};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background-color: #f2f4f6;
  }
`;
