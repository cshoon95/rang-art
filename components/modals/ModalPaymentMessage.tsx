"use client";

import React, { useState, useEffect } from "react";
import styled, { css } from "styled-components";
import { X, CheckSquare, Square, Check, AlertCircle } from "lucide-react";
import {
  replaceHyphenFormat,
  replaceOnlyNum,
  replaceUnitMoney,
} from "@/utils/format";
import { convertDateFormat } from "@/utils/date";
import { useModalStore } from "@/store/modalStore";
import { useUpdatePaymentStatusBatch } from "@/app/_querys";
import { updateCustomerAction } from "@/app/_actions/customers"; // 🌟 서버 액션 직접 Import

// --- Styled Components ---
const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: fadeIn 0.2s ease-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const ModalContainer = styled.div`
  background: white;
  width: 100%;
  max-width: 900px;
  height: 85vh;
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

const ModalHeader = styled.div`
  padding: 24px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f2f4f6;
  background-color: white;
  flex-shrink: 0;
`;

const TitleGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Title = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: #191f28;
  margin: 0;
`;

const SubTitle = styled.span`
  font-size: 14px;
  color: #8b95a1;
`;

const CloseButton = styled.button`
  background: #f2f4f6;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #4e5968;
  transition: all 0.2s;
  &:hover {
    background: #e5e8eb;
    color: #191f28;
  }
`;

/* 테이블 영역 */
const TableWrapper = styled.div`
  flex: 1;
  overflow: auto;
  position: relative;

  &::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #d1d6db;
    border-radius: 5px;
    border: 2px solid white;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  min-width: 700px;
`;

const Th = styled.th<{ $width?: string }>`
  background-color: #f9fafb;
  color: #4e5968;
  padding: 14px 16px;
  font-size: 13px;
  font-weight: 600;
  text-align: left;
  border-bottom: 1px solid #e5e8eb;
  position: sticky;
  top: 0;
  z-index: 10;
  white-space: nowrap;
  width: ${(props) => props.$width || "auto"};

  &:first-child {
    text-align: center;
    width: 60px;
  }
`;

const Tr = styled.tr<{ $isSelected?: boolean }>`
  background-color: ${(props) => (props.$isSelected ? "#f0f9ff" : "white")};
  transition: background-color 0.1s;

  &:hover {
    background-color: ${(props) => (props.$isSelected ? "#e0f2fe" : "#f9fafb")};
  }
`;

const Td = styled.td`
  padding: 16px;
  border-bottom: 1px solid #f2f4f6;
  font-size: 14px;
  color: #333d4b;
  vertical-align: middle;

  &:first-child {
    text-align: center;
  }
`;

/* 텍스트 스타일링 */
const NameText = styled.div`
  font-weight: 700;
  color: #191f28;
  font-size: 15px;
`;

const DateText = styled.div`
  font-size: 13px;
  color: #8b95a1;
  font-family: monospace;
`;

const MoneyText = styled.div`
  font-weight: 700;
  color: #3182f6;
  font-size: 15px;
  letter-spacing: -0.5px;
`;

/* 상태 배지 */
const StatusBadge = styled.button<{ $isPaid: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.2s;

  ${({ $isPaid }) =>
    $isPaid
      ? css`
          background-color: #e8f3ff;
          color: #3182f6;
          &:hover {
            background-color: #dbeafe;
          }
        `
      : css`
          background-color: #fff0f0;
          color: #e11d48;
          &:hover {
            background-color: #ffe4e6;
          }
        `}
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

const Footer = styled.div`
  padding: 20px 32px;
  border-top: 1px solid #f2f4f6;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background-color: white;
`;

const ActionButton = styled.button`
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  background-color: #3182f6;
  color: white;
  transition: background-color 0.2s;

  &:hover {
    background-color: #1b64da;
  }
  &:disabled {
    background-color: #e5e8eb;
    color: #b0b8c1;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #8b95a1;
  gap: 12px;
  padding: 60px 0;
`;

const FilterToggle = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid ${({ $active }) => ($active ? "#3182f6" : "#e5e8eb")};
  background-color: ${({ $active }) => ($active ? "#e8f3ff" : "#fff")};
  color: ${({ $active }) => ($active ? "#3182f6" : "#4e5968")};
  cursor: pointer;
  transition: all 0.2s;
`;

// --- Interface ---
interface Props {
  messageList: any[];
  isLoading: boolean;
  onClose: () => void;
  academyCode: string;
  userId: string;
}

export default function ModalPaymentMessage({
  messageList,
  isLoading,
  onClose,
  academyCode,
  userId,
}: Props) {
  const [rows, setRows] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [filterUnpaid, setFilterUnpaid] = useState(false); // 🌟 필터 상태 추가
  const { openModal } = useModalStore();

  // 일괄 업데이트 훅
  const { mutateAsync: updateBatch } = useUpdatePaymentStatusBatch();

  // 단건 업데이트 훅 (import 경로에 맞게 사용 중인 훅으로 변경 필요할 수 있음)
  // const { mutateAsync: updateSingle } = useUpdateCustomerStatus();

  // 1. 데이터 가공
  useEffect(() => {
    if (messageList) {
      const processed = messageList.map((item) => ({
        ...item,
        displayDate: item.date
          ? convertDateFormat(
              replaceHyphenFormat(item.date, "date"),
              "YY.MM.DD",
            )
          : "-",
        displayFee: item.fee
          ? replaceUnitMoney(Number(replaceOnlyNum(String(item.fee))))
          : "0원",
        feeYn: item.fee_yn === "Y", // DB값에 따라 초기화
      }));
      setRows(processed);
    }
  }, [messageList]);

  // 2. 체크박스 로직
  const toggleSelect = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  // 🌟 필터링 적용 (미납/미발신인 경우 feeYn === false)
  const displayedRows = filterUnpaid ? rows.filter((r) => !r.feeYn) : rows;

  const toggleSelectAll = () => {
    if (selectedIds.size === displayedRows.length && displayedRows.length > 0)
      setSelectedIds(new Set());
    else setSelectedIds(new Set(displayedRows.map((r) => r.id)));
  };

  // 3. 개별 상태 변경 (Optimistic UI - 실제 반영은 Send 버튼에서 일괄처리하거나 여기서 API 호출 가능)
  const handleFeeYnChange = async (id: number, currentVal: boolean) => {
    const nextVal = !currentVal;

    // 1. UI 먼저 즉시 업데이트 (Optimistic Update)
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, feeYn: nextVal } : r)),
    );

    // 2. DB에 실제 반영 요청 (서버 액션 직접 호출)
    try {
      await updateCustomerAction({
        id: id,
        field: "fee_yn",
        value: nextVal ? "Y" : "N",
        updaterID: userId,
        academyCode: academyCode,
      });
    } catch (e) {
      console.error("상태 변경 실패:", e);
      // 실패 시 UI 롤백
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, feeYn: currentVal } : r)),
      );
    }
  };

  // 4. 문자 전송 및 일괄 업데이트
  const handleSendMessages = async () => {
    const targets = rows.filter((r) => selectedIds.has(r.id));
    if (targets.length === 0) return;

    openModal({
      title: "상태 변경",
      hideFooter: false,
      content: `총 ${targets.length}명의 상태를 업데이트하시겠습니까?`,
      type: "CONFIRM",
      onConfirm: async () => {
        try {
          // (1) 문자 발송 요청
          const payload = targets.map((t) => ({
            name: t.name,
            phone: t.phone || "01000000000", // phone 컬럼 확인 필요
            fee: t.displayFee,
          }));

          // (2) DB 상태 일괄 업데이트
          const targetIds = targets.map((t) => t.id);

          await updateBatch({
            ids: targetIds,
            key: "msg_yn", // 업데이트할 컬럼 (비즈니스 로직에 맞게 수정: 'msg_yn' or 'fee_yn')
            value: "T", // 업데이트할 값
            updaterId: userId,
            academyCode: academyCode,
          });

          // alert(`${smsRes.count}건 전송 및 상태 업데이트 완료! 🚀`);
          onClose();
        } catch (error: any) {
          console.error(error);
          alert(error.message || "작업 중 오류가 발생했습니다.");
        }
      },
    });
  };

  return (
    <Overlay onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <ModalHeader>
          <TitleGroup>
            <Title>결제 알림 전송</Title>
            <SubTitle>
              총{" "}
              <strong style={{ color: "#3182f6" }}>
                {displayedRows.length}명
              </strong>
              의 미발신 내역이 조회되었습니다.
            </SubTitle>
          </TitleGroup>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            {/* 🌟 미납/미발신 전용 필터 버튼 */}
            <FilterToggle
              $active={filterUnpaid}
              onClick={() => {
                setFilterUnpaid(!filterUnpaid);
                setSelectedIds(new Set()); // 필터 변경 시 전체선택 해제
              }}
            >
              <AlertCircle size={16} /> 미발신(미납)만 보기
            </FilterToggle>
            <CloseButton onClick={onClose}>
              <X size={20} />
            </CloseButton>
          </div>
        </ModalHeader>

        {/* 바디 (테이블) */}
        <TableWrapper>
          {isLoading ? (
            <EmptyState>데이터를 불러오는 중입니다...</EmptyState>
          ) : displayedRows.length === 0 ? (
            <EmptyState>
              <AlertCircle size={48} strokeWidth={1.5} />
              <span>전송할 대상이 없습니다.</span>
            </EmptyState>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>
                    <CheckBoxButton
                      onClick={toggleSelectAll}
                      className={
                        selectedIds.size === displayedRows.length &&
                        displayedRows.length > 0
                          ? "checked"
                          : ""
                      }
                    >
                      {selectedIds.size === displayedRows.length &&
                      displayedRows.length > 0 ? (
                        <CheckSquare size={22} fill="#e8f3ff" />
                      ) : (
                        <Square size={22} />
                      )}
                    </CheckBoxButton>
                  </Th>
                  <Th>이름</Th>
                  <Th>기준일</Th>
                  <Th>청구 금액</Th>
                  <Th>횟수</Th>
                  <Th style={{ textAlign: "center" }}>상태</Th>
                  <Th>비고</Th>
                </tr>
              </thead>
              <tbody>
                {displayedRows.map((row) => (
                  <Tr key={row.id} $isSelected={selectedIds.has(row.id)}>
                    <Td>
                      <CheckBoxButton
                        onClick={() => toggleSelect(row.id)}
                        className={selectedIds.has(row.id) ? "checked" : ""}
                      >
                        {selectedIds.has(row.id) ? (
                          <CheckSquare size={22} fill="#e8f3ff" />
                        ) : (
                          <Square size={22} />
                        )}
                      </CheckBoxButton>
                    </Td>
                    <Td>
                      <NameText>{row.name}</NameText>
                    </Td>
                    <Td>
                      <DateText>{row.displayDate}</DateText>
                    </Td>
                    <Td>
                      <MoneyText>{row.displayFee}</MoneyText>
                    </Td>
                    <Td style={{ color: "#6b7684" }}>{row.count}</Td>

                    {/* 상태 (납부 완료 여부 - 클릭 시 토글) */}
                    <Td style={{ textAlign: "center" }}>
                      <StatusBadge
                        $isPaid={row.feeYn}
                        onClick={() => handleFeeYnChange(row.id, row.feeYn)}
                      >
                        {row.feeYn ? "발신 완료" : "미발신"}
                      </StatusBadge>
                    </Td>

                    <Td style={{ color: "#8b95a1", fontSize: "13px" }}>
                      {row.note}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </TableWrapper>

        {/* 푸터 (액션 버튼) */}
        <Footer>
          <span
            style={{
              flex: 1,
              alignSelf: "center",
              fontSize: "14px",
              color: "#6b7684",
            }}
          >
            {selectedIds.size}명 선택됨
          </span>
          <ActionButton
            onClick={handleSendMessages}
            disabled={selectedIds.size === 0}
          >
            상태 변경하기
          </ActionButton>
        </Footer>
      </ModalContainer>
    </Overlay>
  );
}
