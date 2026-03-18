"use client";

import React, { useMemo } from "react";
import styled from "styled-components";
import { X } from "lucide-react";
import { useGetStudents } from "@/app/_querys";

interface Props {
  onClose: () => void;
  academyCode: string;
}

export default function ModalUnpaidList({ onClose, academyCode }: Props) {
  const { data: students = [], isLoading } = useGetStudents(academyCode);

  // 미납자(fee_yn !== 'Y')만 필터링
  const unpaidStudents = useMemo(() => {
    return students.filter((s: any) => s.fee_yn !== "Y");
  }, [students]);

  return (
    <Overlay onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <TitleGroup>
            <Title>원비 미납자 명단</Title>
            <SubTitle>
              현재 총{" "}
              <strong style={{ color: "#ef4444" }}>
                {unpaidStudents.length}명
              </strong>
              의 원비 미납자가 있습니다.
            </SubTitle>
          </TitleGroup>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </ModalHeader>

        <ListWrapper>
          {isLoading ? (
            <EmptyState>데이터를 불러오는 중입니다...</EmptyState>
          ) : unpaidStudents.length === 0 ? (
            <EmptyState>
              <span style={{ fontSize: "32px", marginBottom: "12px" }}>🎉</span>
              모든 원비가 수납되었습니다!
            </EmptyState>
          ) : (
            <UnpaidList>
              {unpaidStudents.map((student: any) => (
                <UnpaidItem key={student.id}>
                  <UnpaidInfo>
                    <UnpaidName>{student.name}</UnpaidName>
                    <UnpaidSubText>주 {student.count || 1}회</UnpaidSubText>
                    {student.parentphone && (
                      <>
                        <Divider />
                        <UnpaidSubText>{student.parentphone}</UnpaidSubText>
                      </>
                    )}
                  </UnpaidInfo>
                  <UnpaidBadge>미납</UnpaidBadge>
                </UnpaidItem>
              ))}
            </UnpaidList>
          )}
        </ListWrapper>
      </ModalContainer>
    </Overlay>
  );
}

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
  max-width: 480px;
  height: 70vh;
  max-height: 800px;
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

const ListWrapper = styled.div`
  flex: 1;
  overflow: auto;
  background-color: #f9fafb;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #d1d6db;
    border-radius: 3px;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #8b95a1;
  font-size: 15px;
  font-weight: 600;
`;

const UnpaidList = styled.div`
  display: flex;
  flex-direction: column;
  padding: 24px;
  gap: 12px;
`;

const UnpaidItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: white;
  border-radius: 16px;
  border: 1px solid #f0f0f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
`;

const UnpaidInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const UnpaidName = styled.span`
  font-size: 16px;
  font-weight: 700;
  color: #333d4b;
`;

const UnpaidSubText = styled.span`
  font-size: 13px;
  color: #8b95a1;
`;

const Divider = styled.div`
  width: 1px;
  height: 12px;
  background-color: #e5e8eb;
`;

const UnpaidBadge = styled.span`
  font-size: 12px;
  font-weight: 700;
  color: #ef4444;
  background: #fee2e2;
  padding: 6px 12px;
  border-radius: 8px;
`;
