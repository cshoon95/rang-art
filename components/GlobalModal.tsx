"use client";

import React from "react";
import styled, { keyframes, css } from "styled-components";
import { useModalStore } from "@/store/modalStore";
import { X } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

export default function GlobalModal() {
  const {
    isOpen,
    type,
    title,
    content,
    okText,
    cancelText,
    hideFooter,
    onConfirm,
    closeModal,
  } = useModalStore(
    useShallow((state) => ({
      isOpen: state.isOpen,
      type: state.type,
      title: state.title,
      content: state.content,
      okText: state.okText,
      cancelText: state.cancelText,
      hideFooter: state.hideFooter,
      onConfirm: state.onConfirm,
      closeModal: state.closeModal,
    }))
  );
  if (!isOpen) return null;

  console.log("hideFooter", hideFooter);

  // 확인 버튼 핸들러
  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    closeModal();
  };

  // 타입별 컨텐츠 렌더링
  return (
    <Overlay onClick={closeModal}>
      <ModalContainer $type={type} onClick={(e) => e.stopPropagation()}>
        {/* 1. 헤더 (ALERT 제외하고 표시) */}
        {type !== "ALERT" && type !== "CONFIRM" && (
          <ModalHeader>
            <Title>{title}</Title>
            <CloseButton onClick={closeModal}>
              <X size={24} />
            </CloseButton>
          </ModalHeader>
        )}

        {/* 2. 본문 (ALERT/CONFIRM은 제목이 본문에 포함됨) */}
        <ModalBody $type={type}>
          {(type === "ALERT" || type === "CONFIRM") && title && (
            <AlertTitle>{title}</AlertTitle>
          )}
          {/* content가 문자열이면 텍스트로, 컴포넌트면 그대로 렌더링 */}
          <ContentWrapper>{content}</ContentWrapper>
        </ModalBody>

        {/* 3. 푸터 (버튼 영역) */}
        {!hideFooter && (
          <ModalFooter>
            {(type === "CONFIRM" || type === "FULL") && (
              <CancelButton onClick={closeModal}>{cancelText}</CancelButton>
            )}
            {/* ALERT, CONFIRM은 항상 확인 버튼 있음. SIMPLE, FULL은 선택 사항 */}
            {(type === "ALERT" || type === "CONFIRM" || onConfirm) && (
              <ConfirmButton
                onClick={handleConfirm}
                $fullWidth={type === "ALERT"}
              >
                {okText}
              </ConfirmButton>
            )}
          </ModalFooter>
        )}
      </ModalContainer>
    </Overlay>
  );
}

// --- Styles ---

const fadeIn = keyframes`
  from { opacity: 0; } to { opacity: 1; }
`;

const slideUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: ${fadeIn} 0.2s ease-out;
`;

const ModalContainer = styled.div<{ $type: string }>`
  background: white;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  animation: ${slideUp} 0.3s cubic-bezier(0.16, 1, 0.3, 1);

  /* 타입별 스타일 분기 */
  ${({ $type }) => {
    switch ($type) {
      case "ALERT":
      case "CONFIRM":
        return css`
          width: 320px;
          border-radius: 20px;
          text-align: center;
        `;
      case "FULL":
        return css`
          width: 100%;
          height: 100%; /* 전체 화면 */
          border-radius: 0;
          max-width: none;

          @media (min-width: 768px) {
            width: 600px;
            height: auto;
            max-height: 90vh;
            border-radius: 24px;
          }
        `;
      case "SIMPLE":
      default:
        return css`
          width: 100%;
          max-width: 420px;
          border-radius: 24px;
          max-height: 85vh;
        `;
    }
  }}
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
`;

const Title = styled.h3`
  font-size: 18px;
  font-weight: 700;
  margin: 0;
  color: #191f28;
`;

const AlertTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: #191f28;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
`;

const ModalBody = styled.div<{ $type: string }>`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  font-size: 15px;
  line-height: 1.6;
  color: #4e5968;

  ${({ $type }) =>
    $type === "FULL"
      ? css`
          padding: 20px;
        `
      : ""}
`;

const ContentWrapper = styled.div`
  /* 필요시 내부 컨텐츠 스타일 */
`;

const ModalFooter = styled.div`
  padding: 16px 24px;
  display: flex;
  gap: 10px;
  border-top: 1px solid #f0f0f0;

  /* 내용이 없으면 푸터 숨김 (빈 태그 방지용 로직 필요 시 추가) */
  &:empty {
    display: none;
  }
`;

const Button = styled.button`
  flex: 1;
  height: 48px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
`;

const CancelButton = styled(Button)`
  background-color: #f2f4f6;
  color: #4e5968;
  &:hover {
    background-color: #e5e8eb;
  }
`;

const ConfirmButton = styled(Button)<{ $fullWidth?: boolean }>`
  background-color: #3182f6;
  color: white;
  width: ${({ $fullWidth }) => ($fullWidth ? "100%" : "auto")};
  &:hover {
    background-color: #2563eb;
  }
`;
