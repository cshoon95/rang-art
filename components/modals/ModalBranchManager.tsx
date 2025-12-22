"use client";

import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useModalStore } from "@/store/modalStore";
import { RefreshCw, Search, X } from "lucide-react"; // X 아이콘 추가
import { useToastStore } from "@/store/toastStore";
import DaumPostcodeEmbed from "react-daum-postcode"; // ✅ Embed 컴포넌트 사용
import { useUpsertBranch } from "@/app/_querys";

interface Props {
  mode: "add" | "edit";
  initialData?: any;
}

const generateRandomCode = () => {
  return "A" + Math.floor(100000 + Math.random() * 900000).toString();
};

const FEE_COUNTS = [1, 2, 3, 4, 5];

export default function ModalBranchManager({ mode, initialData }: Props) {
  // ✅ 주소 검색창 열림 상태 관리
  const [isPostcodeOpen, setIsPostcodeOpen] = useState(false);

  const [formData, setFormData] = useState({
    code: initialData?.code || "",
    name: initialData?.name || "",
    address: initialData?.address || "",
    detailAddress: initialData?.detail_address || "",
    tel: initialData?.tel || "",
    owner: initialData?.owner || "",
    businessNo: initialData?.business_no || "",
    count1: initialData?.count1 ? String(initialData.count1) : "0",
    count2: initialData?.count2 ? String(initialData.count2) : "0",
    count3: initialData?.count3 ? String(initialData.count3) : "0",
    count4: initialData?.count4 ? String(initialData.count4) : "0",
    count5: initialData?.count5 ? String(initialData.count5) : "0",
  });

  const { addToast } = useToastStore();
  const { closeModal } = useModalStore();
  const { mutate: upsertBranch, isPending } = useUpsertBranch();

  useEffect(() => {
    if (mode === "add" && !formData.code) {
      setFormData((prev) => ({ ...prev, code: generateRandomCode() }));
    }
  }, [mode]);

  const handleRegenerateCode = () => {
    if (mode === "add") {
      setFormData((prev) => ({ ...prev, code: generateRandomCode() }));
    }
  };

  const formatCurrency = (val: string) => {
    if (!val) return "";
    return Number(val).toLocaleString();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.startsWith("count")) {
      const rawValue = value.replace(/[^0-9]/g, "");
      setFormData((prev) => ({ ...prev, [name]: rawValue }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ 주소 검색 완료 핸들러
  const handleComplete = (data: any) => {
    let fullAddress = data.address;
    let extraAddress = "";

    if (data.addressType === "R") {
      if (data.bname !== "") {
        extraAddress += data.bname;
      }
      if (data.buildingName !== "") {
        extraAddress +=
          extraAddress !== "" ? `, ${data.buildingName}` : data.buildingName;
      }
      fullAddress += extraAddress !== "" ? ` (${extraAddress})` : "";
    }

    setFormData((prev) => ({ ...prev, address: fullAddress }));
    setIsPostcodeOpen(false); // 검색창 닫기
  };

  const handleSubmit = () => {
    if (!formData.code || !formData.name) {
      addToast("지점명은 필수입니다.", "error");
      return;
    }

    const submitData = {
      ...formData,
      count1: Number(formData.count1 || 0),
      count2: Number(formData.count2 || 0),
      count3: Number(formData.count3 || 0),
      count4: Number(formData.count4 || 0),
      count5: Number(formData.count5 || 0),
    };

    upsertBranch(submitData, {
      onSuccess: () => closeModal(),
    });
  };

  // --------------------------------------------------------
  // ✅ 1. 주소 검색 화면 (PostcodeEmbed View)
  // --------------------------------------------------------
  if (isPostcodeOpen) {
    return (
      <PostcodeContainer>
        <PostcodeHeader>
          <SectionTitle>주소 검색</SectionTitle>
          <CloseIconButton onClick={() => setIsPostcodeOpen(false)}>
            <X size={24} />
          </CloseIconButton>
        </PostcodeHeader>
        <DaumPostcodeEmbed
          onComplete={handleComplete}
          style={{ height: "400px", width: "100%" }}
          autoClose={false}
        />
      </PostcodeContainer>
    );
  }

  // --------------------------------------------------------
  // ✅ 2. 기본 입력 폼 화면 (Default View)
  // --------------------------------------------------------
  return (
    <FormContainer>
      <SectionTitle>지점 기본 정보</SectionTitle>
      <InputGroup>
        <Label>
          지점 코드 <Required>*</Required>
        </Label>
        <CodeInputWrapper>
          <Input
            name="code"
            value={formData.code}
            onChange={handleChange}
            placeholder="자동 생성됩니다"
            readOnly
            style={{
              backgroundColor: "#f2f4f6",
              color: "#666",
              cursor: "default",
            }}
          />
          {mode === "add" && (
            <IconButton onClick={handleRegenerateCode} type="button">
              <RefreshCw size={16} />
            </IconButton>
          )}
        </CodeInputWrapper>
      </InputGroup>

      <InputGroup>
        <Label>
          지점명 <Required>*</Required>
        </Label>
        <Input
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="예: 무료체험, 강남점"
        />
      </InputGroup>

      <InputGroup>
        <Label>원장</Label>
        <Input
          name="owner"
          value={formData.owner}
          onChange={handleChange}
          placeholder="원장 성함"
        />
      </InputGroup>

      <Divider />

      <SectionTitle>상세 정보</SectionTitle>
      <InputGroup>
        <Label>사업자 등록번호</Label>
        <Input
          name="businessNo"
          value={formData.businessNo}
          onChange={handleChange}
          placeholder="000-00-00000"
        />
      </InputGroup>

      <InputGroup>
        <Label>연락처</Label>
        <Input
          name="tel"
          value={formData.tel}
          onChange={handleChange}
          placeholder="02-0000-0000"
        />
      </InputGroup>

      <InputGroup>
        <Label>주소</Label>
        <CodeInputWrapper>
          <Input
            name="address"
            value={formData.address}
            placeholder="주소를 검색하세요"
            readOnly
            onClick={() => setIsPostcodeOpen(true)} // ✅ 검색창 열기
            style={{ cursor: "pointer", backgroundColor: "#fff" }}
          />
          <IconButton onClick={() => setIsPostcodeOpen(true)} type="button">
            <Search size={16} />
          </IconButton>
        </CodeInputWrapper>
        <Input
          name="detailAddress"
          value={formData.detailAddress}
          onChange={handleChange}
          placeholder="상세 주소 (예: 2층, 201호)"
          style={{ marginTop: "4px" }}
        />
      </InputGroup>

      <Divider />

      <SectionTitle>회비 설정 (주 n회)</SectionTitle>
      <FeeGrid>
        {FEE_COUNTS.map((num) => (
          <InputGroup key={`count${num}`}>
            <Label>주 {num}회</Label>
            <InputWrapper>
              <Input
                name={`count${num}`}
                // @ts-ignore
                value={formatCurrency(formData[`count${num}`])}
                onChange={handleChange}
                style={{ textAlign: "right", paddingRight: "30px" }}
                placeholder="0"
              />
              <Unit>원</Unit>
            </InputWrapper>
          </InputGroup>
        ))}
      </FeeGrid>

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
  gap: 20px;
  padding: 10px 4px;
`;

/* ✅ 주소 검색창 전용 컨테이너 스타일 */
const PostcodeContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 10px 4px;
  animation: fadeIn 0.2s ease-out;
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const PostcodeHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f2f4f6;
`;

const CloseIconButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: #8b95a1;
  transition: 0.2s;
  &:hover {
    color: #333;
    background-color: #f2f4f6;
    border-radius: 50%;
  }
`;

const SectionTitle = styled.h3`
  font-size: 15px;
  font-weight: 700;
  color: #333d4b;
`;
const Divider = styled.hr`
  border: none;
  border-top: 1px solid #f2f4f6;
  margin: 10px 0;
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
const Required = styled.span`
  color: #ef4444;
  margin-left: 2px;
`;
const Input = styled.input`
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e5e8eb;
  font-size: 15px;
  font-family: "Pretendard", sans-serif;
  box-sizing: border-box;
  &:focus {
    outline: none;
    border-color: #3182f6;
    box-shadow: 0 0 0 2px rgba(49, 130, 246, 0.1);
  }
  &::placeholder {
    color: #b0b8c1;
  }
`;
const CodeInputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;
const IconButton = styled.button`
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  color: #8b95a1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 50%;
  transition: all 0.2s;
  &:hover {
    background-color: #e5e8eb;
    color: #333;
  }
`;
const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px; /* 버튼 사이 간격 추가 */
  margin-top: 16px; /* 본문과의 간격 */

  /* 📱 PWA & 모바일 대응 */
  @media (max-width: 768px) {
    /* 하단 홈 바 영역을 고려하여 넉넉한 여백 제공 */
    /* 기본 여백(16px) + Safe Area + 추가 여백(8px) */
    padding-bottom: calc(24px + env(safe-area-inset-bottom));

    /* 모바일에서는 버튼을 꽉 채우거나 중앙 정렬하는 경우가 많음 (선택 사항) */
    /* justify-content: center; */

    /* 만약 푸터가 화면 하단에 고정된 형태라면 아래 속성 추가 */
    /* background: white; */
    /* padding-left: 20px; */
    /* padding-right: 20px; */
  }
`;
const SaveBtn = styled.button`
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  background: #3182f6;
  color: white;
  transition: opacity 0.2s;
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  &:hover {
    opacity: 0.9;
  }
`;
const FeeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
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
  color: #8b95a1;
  pointer-events: none;
`;
