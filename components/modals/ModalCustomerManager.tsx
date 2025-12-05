"use client";

import React, { useState, useTransition, useRef, useEffect } from "react";
import styled from "styled-components";
import { useModalStore } from "@/store/modalStore";
import {
  useUpsertCustomer,
  useDeleteCustomer,
} from "@/api/customers/useCustomersQuery";
import { FEE_LIST } from "@/utils/list";

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

// --- 커스텀 셀렉트 컴포넌트 ---
function CustomSelect({ name, value, options, onChange, placeholder }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt: any) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    const fakeEvent = {
      target: {
        name: name,
        value: optionValue,
      },
    } as any;

    onChange(fakeEvent);
    setIsOpen(false);
  };

  return (
    <SelectWrapper ref={wrapperRef}>
      <SelectTrigger
        $isOpen={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <span style={{ color: selectedOption ? "#333d4b" : "#b0b8c1" }}>
          {selectedOption ? selectedOption.label : placeholder || "선택"}
        </span>
        <ArrowIcon $isOpen={isOpen}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M2.5 4.5L6 8L9.5 4.5"
              stroke={isOpen ? "#3182f6" : "#8B95A1"}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </ArrowIcon>
      </SelectTrigger>

      {isOpen && (
        <DropdownList>
          {options.map((opt: any) => (
            <DropdownItem
              key={opt.value}
              $isSelected={opt.value === value}
              onClick={() => handleSelect(opt.value)}
            >
              {opt.label}
            </DropdownItem>
          ))}
        </DropdownList>
      )}
    </SelectWrapper>
  );
}

interface Props {
  mode: "add" | "edit";
  academyCode: string;
  initialData?: any;
  userRole?: string;
}

export default function ModalCustomerManager({
  mode,
  academyCode,
  initialData,
  userRole,
}: Props) {
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
    fee: initialData?.fee
      ? String(initialData.fee)
      : FEE_LIST
      ? FEE_LIST["1"] || "90000"
      : "90000",
    state: initialData?.state || "0",
    date: initialData?.date
      ? formatDateToInput(initialData.date)
      : new Date().toISOString().slice(0, 10),
    discharge: initialData?.discharge
      ? formatDateToInput(initialData.discharge)
      : new Date().toISOString().slice(0, 10),
    note: initialData?.note || "",
  });

  // 이름 필드 에러 상태
  const [nameError, setNameError] = useState(false);

  // [수정 1] 포커싱을 위한 Ref 생성
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [isPending, startTransition] = useTransition();
  const closeModal = useModalStore((state) => state.closeModal);
  const { mutate: mutateUpsertCustomer } = useUpsertCustomer(mode);
  const deleteMutation = useDeleteCustomer();

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
      const autoFee = FEE_LIST[value] || "";
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

  const handleSubmit = () => {
    if (!formData.name) {
      setNameError(true);
      // [수정 2] 이름 입력창으로 포커스 이동
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
      <div>
        <SectionTitle>기본 정보</SectionTitle>
        <Row>
          <InputGroup>
            <Label>
              이름 <RequiredMark>*</RequiredMark>
            </Label>
            {/* [수정 3] ref 연결 */}
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
            <CustomSelect
              name="sex"
              value={formData.sex}
              options={SEX_OPTIONS}
              onChange={handleChange}
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
            <CustomSelect
              name="state"
              value={formData.state}
              options={STATE_OPTIONS}
              onChange={handleChange}
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
            <CustomSelect
              name="count"
              value={formData.count}
              options={COUNT_OPTIONS}
              onChange={handleChange}
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

      <Footer>
        <SaveBtn onClick={handleSubmit} disabled={isPending}>
          {isPending ? "저장 중..." : "저장"}
        </SaveBtn>
      </Footer>
    </FormContainer>
  );
}

// --- Styles ---

const SelectWrapper = styled.div`
  position: relative;
  width: 100%;
`;

const SelectTrigger = styled.button<{ $isOpen: boolean }>`
  width: 100%;
  padding: 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid ${({ $isOpen }) => ($isOpen ? "#3182f6" : "#e5e8eb")};
  font-size: 15px;
  font-family: "Pretendard", sans-serif;
  text-align: left;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s;
  box-shadow: ${({ $isOpen }) =>
    $isOpen ? "0 0 0 3px rgba(49, 130, 246, 0.1)" : "none"};

  &:hover {
    background-color: #f9fafb;
    border-color: ${({ $isOpen }) => ($isOpen ? "#3182f6" : "#cdd2d8")};
  }
`;

const ArrowIcon = styled.div<{ $isOpen: boolean }>`
  display: flex;
  align-items: center;
  transform: ${({ $isOpen }) => ($isOpen ? "rotate(180deg)" : "rotate(0deg)")};
  transition: transform 0.2s ease;
`;

const DropdownList = styled.ul`
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  margin-top: 4px;
  padding: 6px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e8eb;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  z-index: 100;
  max-height: 200px;
  overflow-y: auto;
  list-style: none;
  box-sizing: border-box;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #ddd;
    border-radius: 4px;
  }
`;

const DropdownItem = styled.li<{ $isSelected: boolean }>`
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 15px;
  color: ${({ $isSelected }) => ($isSelected ? "#3182f6" : "#333d4b")};
  font-weight: ${({ $isSelected }) => ($isSelected ? "600" : "400")};
  background-color: ${({ $isSelected }) =>
    $isSelected ? "#e8f3ff" : "transparent"};
  cursor: pointer;
  transition: background-color 0.1s;

  &:hover {
    background-color: ${({ $isSelected }) =>
      $isSelected ? "#e8f3ff" : "#f2f4f6"};
  }
`;

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
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;
