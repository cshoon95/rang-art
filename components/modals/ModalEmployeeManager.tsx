"use client";

import React, { useState, useTransition, useRef } from "react";
import styled from "styled-components";
import { useModalStore } from "@/store/modalStore";
import { useUpsertEmployee } from "@/app/_querys";
// ✅ 공통 Select 컴포넌트 Import (경로는 실제 파일 위치에 맞게 수정해주세요)
import Select from "../Select";

// --- 옵션 데이터 ---
const LEVEL_OPTIONS = [
  { value: "1", label: "원장" },
  { value: "2", label: "부원장" },
  { value: "3", label: "선생님" },
  { value: "4", label: "스탭" },
];

const STATE_OPTIONS = [
  { value: "Y", label: "재직" },
  { value: "N", label: "퇴사" },
  { value: "H", label: "휴직" },
];

interface Props {
  mode: "add" | "edit";
  academyCode: string;
  initialData?: any;
}

export default function ModalEmployeeManager({
  mode,
  academyCode,
  initialData,
}: Props) {
  const formatDateToInput = (str: string) => {
    if (!str || str.length < 8) return "";
    return str.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");
  };

  const [formData, setFormData] = useState({
    name: initialData?.NAME || "",
    userId: initialData?.ID || "",
    level: initialData?.LEVEL_CD || "3",
    tel: initialData?.TEL || "",
    birth: initialData?.BIRTH
      ? formatDateToInput(initialData.BIRTH)
      : "1990-01-01",
    salary: initialData?.SALARY || "",
    account: initialData?.ACCOUNT || "",
    state:
      initialData?.STATE === "O" ? "Y" : initialData?.STATE === "X" ? "N" : "Y",
    date: initialData?.DATE
      ? formatDateToInput(initialData.DATE)
      : new Date().toISOString().slice(0, 10),
    note: initialData?.NOTE || "",
  });

  const [nameError, setNameError] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [isPending, startTransition] = useTransition();
  const closeModal = useModalStore((state) => state.closeModal);

  // [가정] useUpsertEmployee 훅 사용
  const { mutate: mutateUpsertEmployee } = useUpsertEmployee(mode);

  const autoHyphen = (value: string) => {
    const raw = value.replace(/[^0-9]/g, "");
    if (raw.length < 4) return raw;
    if (raw.length < 8) return raw.replace(/(\d{3})(\d{1,4})/, "$1-$2");
    return raw.replace(/(\d{3})(\d{3,4})(\d{4})/, "$1-$2-$3").slice(0, 13);
  };

  const formatCurrency = (value: string | number) => {
    if (!value) return "";
    return Number(value).toLocaleString();
  };

  // ✅ 통합 핸들러 (Input, Textarea용)
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === "name" && value) setNameError(false);

    if (name === "tel") {
      setFormData((prev) => ({ ...prev, [name]: autoHyphen(value) }));
      return;
    }

    if (name === "salary") {
      const rawValue = value.replace(/[^0-9]/g, "");
      setFormData((prev) => ({ ...prev, salary: rawValue }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Select 컴포넌트 전용 핸들러 (타입 불일치 해결)
  // 공통 Select는 name prop을 받지 않고 onChange(e, value) 형태이므로
  // 여기서 name을 수동으로 지정하여 기존 handleChange와 로직을 맞춥니다.
  const handleSelectChange = (name: string, value: string | undefined) => {
    setFormData((prev) => ({ ...prev, [name]: value || "" }));
  };

  const handleSubmit = () => {
    if (!formData.name) {
      setNameError(true);
      nameInputRef.current?.focus();
      return;
    }

    const submitData = {
      ...formData,
      idx: initialData?.IDX,
      academyCode,
      birth: formData.birth.replace(/-/g, ""),
      date: formData.date.replace(/-/g, ""),
      tel: formData.tel.replace(/-/g, ""),
      updaterID: "admin",
    };

    mutateUpsertEmployee(submitData, {
      onSuccess: () => {
        closeModal();
      },
    });
  };

  return (
    <FormContainer>
      <div>
        <SectionTitle>기본 정보</SectionTitle>
        <Row>
          <InputGroup>
            <Label>
              이름 <RequiredMark>*</RequiredMark>
            </Label>
            <Input
              ref={nameInputRef}
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="직원 이름"
              $error={nameError}
            />
            {nameError && <ErrorMessage>이름을 입력해주세요.</ErrorMessage>}
          </InputGroup>
          <InputGroup>
            <Label>직급</Label>
            {/* ✅ 공통 Select 적용 */}
            <Select
              width="100%"
              options={LEVEL_OPTIONS}
              value={formData.level}
              onChange={(_, value) => handleSelectChange("level", value)}
            />
          </InputGroup>
        </Row>

        <Row>
          <InputGroup>
            <Label>연락처</Label>
            <Input
              name="tel"
              value={formData.tel}
              onChange={handleChange}
              placeholder="010-0000-0000"
              maxLength={13}
            />
          </InputGroup>
          <InputGroup>
            <Label>생년월일</Label>
            <Input
              type="date"
              name="birth"
              value={formData.birth}
              onChange={handleChange}
            />
          </InputGroup>
        </Row>

        <InputGroup>
          <Label>로그인 ID</Label>
          <Input
            name="userId"
            value={formData.userId}
            onChange={handleChange}
            placeholder="시스템 접속 아이디"
            disabled={mode === "edit"}
          />
        </InputGroup>
      </div>

      <Divider />

      <div>
        <SectionTitle>급여 및 계좌</SectionTitle>
        <Row>
          <InputGroup>
            <Label>월간 급여</Label>
            <InputWrapper>
              <Input
                name="salary"
                type="text"
                value={formatCurrency(formData.salary)}
                onChange={handleChange}
                placeholder="0"
                style={{ textAlign: "right", paddingRight: "30px" }}
              />
              <Unit>원</Unit>
            </InputWrapper>
          </InputGroup>
          <InputGroup>
            <Label>계좌번호</Label>
            <Input
              name="account"
              value={formData.account}
              onChange={handleChange}
              placeholder="은행명 계좌번호"
            />
          </InputGroup>
        </Row>
      </div>

      <Divider />

      <div>
        <SectionTitle>근무 정보</SectionTitle>
        <Row>
          <InputGroup>
            <Label>재직 상태</Label>
            {/* ✅ 공통 Select 적용 */}
            <Select
              width="100%"
              options={STATE_OPTIONS}
              value={formData.state}
              onChange={(_, value) => handleSelectChange("state", value)}
            />
          </InputGroup>
          <InputGroup>
            <Label>입사일</Label>
            <Input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
            />
          </InputGroup>
        </Row>

        <InputGroup>
          <Label>비고</Label>
          <TextArea
            name="note"
            rows={3}
            value={formData.note}
            onChange={handleChange}
            placeholder="특이사항, 메모"
          />
        </InputGroup>
      </div>

      <Footer>
        <SaveBtn onClick={handleSubmit} disabled={isPending}>
          {isPending ? "저장 중..." : "저장"}
        </SaveBtn>
      </Footer>
    </FormContainer>
  );
}

// --- Styles ---
const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 10px 10px 40px 4px;
  max-height: 70vh;
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
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid ${({ $error }) => ($error ? "#ef4444" : "#e5e8eb")};
  font-size: 15px;
  font-family: "Pretendard", sans-serif;
  transition: all 0.2s;
  box-sizing: border-box;
  background-color: #fff;
  color: #333d4b;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  height: 44px;
  line-height: 44px;

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
  &[type="date"] {
    display: block;
    align-items: center;
    padding-top: 0;
    padding-bottom: 0;
    font-family: inherit;
  }
  @media (max-width: 768px) {
    font-size: 16px;
    height: 42px;
    line-height: 42px;
  }
`;
const ErrorMessage = styled.span`
  font-size: 12px;
  color: #ef4444;
  font-weight: 500;
  margin-top: -4px;
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
const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f2f4f6;
`;
const SaveBtn = styled.button`
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: opacity 0.2s;
  background: #3182f6;
  color: white;
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  &:hover {
    opacity: 0.9;
  }
`;
