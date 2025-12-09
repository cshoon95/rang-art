"use client";

import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useModalStore } from "@/store/modalStore";
import { RefreshCw, Search } from "lucide-react"; // Search 아이콘 추가
import { useToastStore } from "@/store/toastStore";
// 👇 카카오 주소찾기 훅 임포트
import { useDaumPostcodePopup } from "react-daum-postcode";
import { useUpsertBranch } from "@/api/branch/useBranchQuery";

interface Props {
  mode: "add" | "edit";
  initialData?: any;
}

// 1. 랜덤 코드 생성 함수
const generateRandomCode = () => {
  return "A" + Math.floor(100000 + Math.random() * 900000).toString();
};

export default function ModalBranchManager({ mode, initialData }: Props) {
  const [formData, setFormData] = useState({
    code: initialData?.code || "",
    name: initialData?.name || "",
    address: initialData?.address || "",
    detailAddress: initialData?.detail_address || "",
    tel: initialData?.tel || "",
    owner: initialData?.owner || "",
    businessNo: initialData?.business_no || "", // ✅ 상태 추가
  });

  const { addToast } = useToastStore();
  const { closeModal } = useModalStore();
  const { mutate: upsertBranch, isPending } = useUpsertBranch();

  // 👇 카카오 주소찾기 스크립트 로드
  const open = useDaumPostcodePopup(
    "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
  );

  // 2. 초기 코드 생성
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 👇 주소 검색 완료 핸들러
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

    // 주소 업데이트
    setFormData((prev) => ({ ...prev, address: fullAddress }));
  };

  // 👇 주소 검색 팝업 열기
  const handleAddressClick = () => {
    open({ onComplete: handleComplete });
  };

  const handleSubmit = () => {
    if (!formData.code || !formData.name) {
      addToast("지점명은 필수입니다.", "error");
      return;
    }

    // ✅ 더 이상 주소를 합치지 않고 그대로 보냅니다.
    // upsertBranchAction에서 detailAddress를 받아서 처리합니다.
    upsertBranch(formData, {
      onSuccess: () => closeModal(),
    });
  };

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

      {/* 👇 주소 입력 부분 수정 */}
      <InputGroup>
        <Label>주소</Label>
        <CodeInputWrapper>
          <Input
            name="address"
            value={formData.address}
            placeholder="주소를 검색하세요"
            readOnly // 직접 입력 방지 (검색 유도)
            onClick={handleAddressClick} // 클릭 시 검색창 오픈
            style={{ cursor: "pointer", backgroundColor: "#fff" }}
          />
          <IconButton onClick={handleAddressClick} type="button">
            <Search size={16} />
          </IconButton>
        </CodeInputWrapper>
        {/* 상세 주소 입력칸 (선택 사항) */}
        <Input
          name="detailAddress"
          value={formData.detailAddress}
          onChange={handleChange}
          placeholder="상세 주소 (예: 2층, 201호)"
          style={{ marginTop: "4px" }}
        />
      </InputGroup>

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
// 스타일 이름 변경: RefreshButton -> IconButton (범용 사용)
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
  margin-top: 10px;
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
