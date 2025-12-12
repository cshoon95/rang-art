"use client";

import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { replaceOnlyNum } from "@/utils/format";
import { PaymentType } from "@/app/_types/type";
import {
  useInsertPaymentIncomeData,
  useInsertPaymentExpenditureData,
} from "@/app/_querys";

// --- Main Component ---
interface Props {
  type: PaymentType;
  academyCode: string;
  userId: string;
  onClose: () => void;
}

export default function PaymentAddModal({
  type,
  academyCode,
  userId,
  onClose,
}: Props) {
  const { mutateAsync: insertIncome, isPending: isIncomeLoading } =
    useInsertPaymentIncomeData();
  const { mutateAsync: insertExpenditure, isPending: isExpLoading } =
    useInsertPaymentExpenditureData();

  // Refs for focusing
  const dateRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  // Error state
  const [errors, setErrors] = useState({
    date: false,
    name: false,
    amount: false,
  });

  // Today (KST)
  const today = new Date();
  const offset = today.getTimezoneOffset() * 60000;
  const todayDate = new Date(today.getTime() - offset)
    .toISOString()
    .split("T")[0];

  const [formData, setFormData] = useState({
    date: todayDate,
    name: "",
    amount: "",
    category: "", // Input으로 변경되므로 기본값 빈 문자열
    note: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: false }));
    }

    if (name === "amount") {
      const num = replaceOnlyNum(value);
      setFormData((prev) => ({
        ...prev,
        [name]: num ? Number(num).toLocaleString() : "",
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.date) {
      setErrors((prev) => ({ ...prev, date: true }));
      dateRef.current?.focus();
      return;
    }
    if (!formData.name) {
      setErrors((prev) => ({ ...prev, name: true }));
      nameRef.current?.focus();
      return;
    }
    if (!formData.amount) {
      setErrors((prev) => ({ ...prev, amount: true }));
      amountRef.current?.focus();
      return;
    }

    const cleanAmount = replaceOnlyNum(formData.amount);
    const [year, month, day] = formData.date.split("-");

    try {
      if (type === "income") {
        await insertIncome({
          year,
          month,
          day,
          name: formData.name,
          fee: cleanAmount,
          card: formData.category || "카드", // 기본값 설정 (입력 없으면 '카드')
          note: formData.note,
          register: "N",
          registerID: userId,
          academyCode,
        });
      } else {
        await insertExpenditure({
          year,
          month,
          day,
          item: formData.name,
          amount: cleanAmount,
          kind: formData.category || "기타", // 기본값 설정
          note: formData.note,
          email: userId,
          registerID: userId,
          academyCode,
        });
      }
      onClose();
    } catch (e) {
      console.error(e);
      alert("저장에 실패했습니다.");
    }
  };

  const isLoading = isIncomeLoading || isExpLoading;

  return (
    <Overlay onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <Title>{type === "income" ? "수입 등록" : "지출 등록"}</Title>
          <CloseButton onClick={onClose}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </CloseButton>
        </ModalHeader>

        <FormContainer>
          <div>
            <SectionTitle>기본 정보</SectionTitle>
            <InputGroup>
              <Label>
                날짜 <RequiredMark>*</RequiredMark>
              </Label>
              <Input
                ref={dateRef}
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                $error={errors.date}
              />
              {errors.date && <ErrorMessage>날짜를 선택해주세요.</ErrorMessage>}
            </InputGroup>

            <InputGroup>
              <Label>
                {type === "income" ? "이름" : "지출 내역"}{" "}
                <RequiredMark>*</RequiredMark>
              </Label>
              <Input
                ref={nameRef}
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={
                  type === "income" ? "학생 이름" : "예: 사무용품 구매"
                }
                $error={errors.name}
              />
              {errors.name && (
                <ErrorMessage>필수 입력 항목입니다.</ErrorMessage>
              )}
            </InputGroup>
          </div>

          <Divider />

          <div>
            <SectionTitle>금액 및 상세</SectionTitle>
            <Row>
              <InputGroup>
                <Label>
                  금액 <RequiredMark>*</RequiredMark>
                </Label>
                <InputWrapper>
                  <Input
                    ref={amountRef}
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    placeholder="0"
                    $error={errors.amount}
                    style={{
                      textAlign: "right",
                      paddingRight: "30px",
                      fontWeight: "bold",
                      color: type === "income" ? "#3182f6" : "#e11d48",
                    }}
                  />
                  <Unit>원</Unit>
                </InputWrapper>
                {errors.amount && (
                  <ErrorMessage>금액을 입력해주세요.</ErrorMessage>
                )}
              </InputGroup>

              <InputGroup>
                <Label>{type === "income" ? "결제 수단" : "분류"}</Label>
                {/* 🌟 [수정] CustomSelect 제거 -> Input으로 변경 */}
                <Input
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  placeholder={
                    type === "income" ? "예: 카드, 현금" : "예: 식비, 비품"
                  }
                />
              </InputGroup>
            </Row>

            <InputGroup>
              <Label>비고</Label>
              <TextArea
                name="note"
                rows={3}
                value={formData.note}
                onChange={handleChange} // TextArea 타입도 처리하도록 handleChange 수정됨
                placeholder="특이사항 입력"
              />
            </InputGroup>
          </div>

          <Footer>
            <CancelBtn onClick={onClose}>취소</CancelBtn>
            <SaveBtn onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? "저장 중..." : "저장"}
            </SaveBtn>
          </Footer>
        </FormContainer>
      </ModalContainer>
    </Overlay>
  );
}

// --- Styles (ModalCustomerManager 스타일 유지) ---

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  z-index: 1000;
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
  max-width: 480px;
  border-radius: 24px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  max-height: 85vh;
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
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f2f4f6;
  background-color: #fff;
`;

const Title = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: #191f28;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #8b95a1;
  padding: 4px;
  &:hover {
    color: #333;
  }
`;

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 24px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #ddd;
    border-radius: 4px;
  }
`;

const SectionTitle = styled.h3`
  font-size: 15px;
  font-weight: 700;
  color: #333d4b;
  margin-top: 0;
  margin-bottom: 12px;
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid #f2f4f6;
  margin: 0;
`;

const Row = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  &:last-child {
    margin-bottom: 0;
  }
  > div {
    flex: 1;
  }
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
  &:last-child {
    margin-bottom: 0;
  }
`;

const Label = styled.label`
  font-size: 13px;
  font-weight: 600;
  color: #6b7684;
`;

const RequiredMark = styled.span`
  color: #ef4444;
  margin-left: 2px;
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
`;

const Unit = styled.span`
  position: absolute;
  right: 12px;
  font-size: 14px;
  color: #6b7684;
  pointer-events: none;
`;

const Input = styled.input<{ $error?: boolean }>`
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid ${({ $error }) => ($error ? "#ef4444" : "#e5e8eb")};
  font-size: 15px;
  font-family: "Pretendard", sans-serif;
  transition: all 0.2s;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${({ $error }) => ($error ? "#ef4444" : "#3182f6")};
    box-shadow: 0 0 0 2px
      ${({ $error }) =>
        $error ? "rgba(239, 68, 68, 0.1)" : "rgba(49, 130, 246, 0.1)"};
  }
  &::placeholder {
    color: #b0b8c1;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e5e8eb;
  font-size: 15px;
  resize: none;
  font-family: "Pretendard", sans-serif;
  line-height: 1.5;
  box-sizing: border-box;
  &:focus {
    outline: none;
    border-color: #3182f6;
  }
`;

const ErrorMessage = styled.span`
  font-size: 12px;
  color: #ef4444;
  font-weight: 500;
  margin-top: -4px;
`;

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
  padding-top: 20px;
  border-top: 1px solid #f2f4f6;
`;

const Button = styled.button`
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: opacity 0.2s;
  font-size: 15px;
  &:hover {
    opacity: 0.9;
  }
`;

const CancelBtn = styled(Button)`
  background: white;
  color: #6b7684;
  border: 1px solid #e5e8eb;
  &:hover {
    background: #f2f4f6;
  }
`;

const SaveBtn = styled(Button)`
  background: #3182f6;
  color: white;
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;
