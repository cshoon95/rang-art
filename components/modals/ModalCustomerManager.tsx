"use client";

import React, { useState, useTransition, useRef, useEffect } from "react";
import styled from "styled-components";
import { useModalStore } from "@/store/modalStore";
import {
  useBranchCount,
  useUpsertCustomer,
  useDeleteCustomer,
} from "@/app/_querys";
import Select from "../Select";

// --- 옵션 데이터 정의 ---
const SEX_OPTIONS = [
  { value: "남자", label: "남자" },
  { value: "여자", label: "여자" },
];

const STATE_OPTIONS = [
  { value: "0", label: "재원" },
  { value: "1", label: "휴원" },
  { value: "2", label: "퇴원" },
  { value: "3", label: "대기" },
];

const COUNT_OPTIONS = [
  { value: "", label: "선택" },
  { value: "1", label: "1회" },
  { value: "2", label: "2회" },
  { value: "3", label: "3회" },
  { value: "4", label: "4회" },
  { value: "5", label: "5회" },
];

interface Props {
  mode: "add" | "edit";
  academyCode: string;
  initialData?: any;
}

export default function ModalCustomerManager({
  mode,
  academyCode,
  initialData,
}: Props) {
  const { data: branchData } = useBranchCount(academyCode);

  const formatDateToInput = (str: string) => {
    if (!str || str.length !== 8) return "";
    return str.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");
  };

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    sex: initialData?.sex === "M" ? "남자" : "여자",
    birth: initialData?.birth
      ? formatDateToInput(initialData.birth)
      : "2020-01-01",
    tel: initialData?.tel || "",
    school: initialData?.school || "",
    parentName: initialData?.parentname || "",
    parentPhone: initialData?.parentphone || "",
    cashNumber: initialData?.cash_number || "",
    count: initialData?.count || "1",
    fee: initialData?.fee ? String(initialData.fee) : "",
    state: initialData?.state || "0",
    date: initialData?.date
      ? formatDateToInput(initialData.date)
      : new Date().toISOString().slice(0, 10),
    discharge: initialData?.discharge
      ? formatDateToInput(initialData.discharge)
      : new Date().toISOString().slice(0, 10),
    note: initialData?.note || "",
  });

  const [nameError, setNameError] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [isPending, startTransition] = useTransition();
  const closeModal = useModalStore((state) => state.closeModal);
  const { mutate: mutateUpsertCustomer } = useUpsertCustomer(mode);

  // 데이터가 로드되었고 'add' 모드일 때 기본(1회) 수강료 자동 세팅
  useEffect(() => {
    if (mode === "add" && branchData && !initialData) {
      if (formData.fee === "" || formData.fee === "0") {
        const defaultFee = branchData.count1 || "0";
        setFormData((prev) => ({ ...prev, fee: String(defaultFee) }));
      }
    }
  }, [branchData, mode, initialData]);

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

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === "name" && value) {
      setNameError(false);
    }

    if (name === "count") {
      let autoFee = "";
      if (branchData && value) {
        const key = `count${value}`;
        autoFee = String((branchData as any)[key] || "");
      }
      setFormData((prev) => ({
        ...prev,
        count: value,
        fee: autoFee,
      }));
      return;
    }

    if (name === "fee") {
      const rawValue = value.replace(/[^0-9]/g, "");
      setFormData((prev) => ({ ...prev, fee: rawValue }));
      return;
    }

    if (name === "tel" || name === "parentPhone") {
      setFormData((prev) => ({ ...prev, [name]: autoHyphen(value) }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string | undefined) => {
    const fakeEvent = {
      target: {
        name: name,
        value: value || "",
      },
    } as React.ChangeEvent<HTMLInputElement>;
    handleChange(fakeEvent);
  };

  const handleSubmit = () => {
    if (!formData.name) {
      setNameError(true);
      nameInputRef.current?.focus();
      return;
    }

    const submitData = {
      ...formData,
      id: initialData?.id,
      prevName: initialData?.name,
      academyCode,
      registerID: "admin",
      birth: formData.birth.replace(/-/g, ""),
      date: formData.date.replace(/-/g, ""),
      discharge: formData.discharge.replace(/-/g, ""),
      fee: formData.fee.replace(/[^0-9]/g, ""),
      tel: formData.tel.replace(/-/g, ""),
      parentPhone: formData.parentPhone.replace(/-/g, ""),
    };

    mutateUpsertCustomer(submitData, {
      onSuccess: () => {
        closeModal();
      },
    });
  };

  return (
    <FormContainer>
      {/* 1. 스크롤 영역 (입력 필드들) */}
      <ScrollArea>
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
                placeholder="이름을 입력해주세요"
                $error={nameError}
              />
              {nameError && <ErrorMessage>이름을 입력해주세요.</ErrorMessage>}
            </InputGroup>
            <InputGroup>
              <Label>성별</Label>
              <Select
                width="100%"
                options={SEX_OPTIONS}
                value={formData.sex}
                onChange={(_, val) => handleSelectChange("sex", val)}
              />
            </InputGroup>
          </Row>
          <Row>
            <InputGroup>
              <Label>생년월일</Label>
              <Input
                type="date"
                name="birth"
                value={formData.birth}
                onChange={handleChange}
              />
            </InputGroup>
            <InputGroup>
              <Label>학교</Label>
              <Input
                name="school"
                value={formData.school}
                onChange={handleChange}
                placeholder="학교명"
              />
            </InputGroup>
          </Row>
          <InputGroup>
            <Label>학생 연락처</Label>
            <Input
              name="tel"
              value={formData.tel}
              onChange={handleChange}
              placeholder="010-0000-0000"
              maxLength={13}
            />
          </InputGroup>
        </div>

        <Divider />

        <div>
          <SectionTitle>보호자 정보</SectionTitle>
          <Row>
            <InputGroup>
              <Label>부모님 성함</Label>
              <Input
                name="parentName"
                value={formData.parentName}
                onChange={handleChange}
                placeholder="보호자 성함"
              />
            </InputGroup>
            <InputGroup>
              <Label>부모님 연락처</Label>
              <Input
                name="parentPhone"
                value={formData.parentPhone}
                onChange={handleChange}
                placeholder="010-0000-0000"
                maxLength={13}
              />
            </InputGroup>
          </Row>
          <InputGroup>
            <Label>현금영수증 번호</Label>
            <Input
              name="cashNumber"
              value={formData.cashNumber}
              onChange={handleChange}
              placeholder="현금영수증 번호"
            />
          </InputGroup>
        </div>

        <Divider />

        <div>
          <SectionTitle>등록 정보</SectionTitle>
          <Row>
            <InputGroup>
              <Label>상태</Label>
              <Select
                width="100%"
                options={STATE_OPTIONS}
                value={formData.state}
                onChange={(_, val) => handleSelectChange("state", val)}
              />
            </InputGroup>
            <InputGroup>
              <Label>등록일</Label>
              <Input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
              />
            </InputGroup>
          </Row>

          {formData.state === "2" && (
            <InputGroup style={{ marginBottom: 12 }}>
              <Label>퇴원일</Label>
              <Input
                type="date"
                name="discharge"
                value={formData.discharge}
                onChange={handleChange}
              />
            </InputGroup>
          )}

          <Row>
            <InputGroup>
              <Label>수강횟수 (주)</Label>
              <Select
                width="100%"
                options={COUNT_OPTIONS}
                value={formData.count}
                onChange={(_, val) => handleSelectChange("count", val)}
              />
            </InputGroup>
            <InputGroup>
              <Label>회비</Label>
              <InputWrapper>
                <Input
                  name="fee"
                  type="text"
                  value={formatCurrency(formData.fee)}
                  onChange={handleChange}
                  placeholder="0"
                  style={{ textAlign: "right", paddingRight: "30px" }}
                />
                <Unit>원</Unit>
              </InputWrapper>
            </InputGroup>
          </Row>

          <InputGroup>
            <Label>비고</Label>
            <TextArea
              name="note"
              rows={3}
              value={formData.note}
              onChange={handleChange}
              placeholder="특이사항 입력"
            />
          </InputGroup>
        </div>
      </ScrollArea>

      {/* 2. 고정 푸터 영역 */}
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
  height: 70vh; /* ✅ 높이 고정 (화면 비율에 맞게 조절 가능) */
  max-height: 800px;
  background-color: white;

  @media (max-width: 768px) {
    height: 80vh; /* 모바일에서는 더 높게 */
  }
`;

const ScrollArea = styled.div`
  flex: 1; /* 남은 영역 모두 차지 */
  overflow-y: auto; /* 내부 스크롤 */
  padding: 10px 10px 20px 4px; /* 패딩 이동 */
  display: flex;
  flex-direction: column;
  gap: 24px;

  /* 스크롤바 커스텀 */
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #ddd;
    border-radius: 4px;
  }
`;

const Footer = styled.div`
  flex-shrink: 0; /* 찌그러짐 방지 */
  padding-top: 4px;
  border-top: 1px solid #f2f4f6;
  background: white;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  z-index: 10;

  /* PWA 하단 안전 영역 */
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
`;

/* 나머지 스타일들은 그대로 유지 */
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

const Button = styled.button`
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: opacity 0.2s;
  &:hover {
    opacity: 0.9;
  }
`;

const SaveBtn = styled(Button)`
  background: #3182f6;
  color: white;
  width: 100%; /* 모바일에서 버튼 꽉 차게 */
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;
