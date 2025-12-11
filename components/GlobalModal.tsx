"use client";

import React, { useEffect, useState } from "react";
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
    hideFooter = true,
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

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (isOpen) {
      setVisible(true);
    } else {
      timeoutId = setTimeout(() => setVisible(false), 300);
    }
    return () => clearTimeout(timeoutId);
  }, [isOpen]);

  if (!visible) return null;

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    closeModal();
  };

  return (
    <Overlay $isOpen={isOpen} onClick={closeModal}>
      <ModalContainer
        $isOpen={isOpen}
        $type={type}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. 헤더 */}
        {type !== "ALERT" && type !== "CONFIRM" && title && (
          <ModalHeader>
            <HeaderTitle>{title}</HeaderTitle>
            <CloseButton onClick={closeModal}>
              <X size={20} />
            </CloseButton>
          </ModalHeader>
        )}

        {/* 2. 본문 */}
        <ModalBody $type={type} $noPadding={type === "FULL"}>
          {content}
        </ModalBody>

        {/* 3. 푸터 */}
        {!hideFooter && (
          <ModalFooter>
            {(type === "CONFIRM" || type === "FULL" || type === "SIMPLE") && (
              <CancelButton onClick={closeModal}>
                {cancelText || "취소"}
              </CancelButton>
            )}
            <ConfirmButton
              onClick={handleConfirm}
              $fullWidth={type === "ALERT"}
              $isDanger={type === "CONFIRM"}
            >
              {okText || "확인"}
            </ConfirmButton>
          </ModalFooter>
        )}
      </ModalContainer>
    </Overlay>
  );
}

// --------------------------------------------------------------------------
// ✨ Styles
// --------------------------------------------------------------------------

const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;
const fadeOut = keyframes`from { opacity: 1; } to { opacity: 0; }`;
const slideUp = keyframes`from { transform: translateY(20px) scale(0.98); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; }`;
const slideDown = keyframes`from { transform: translateY(0) scale(1); opacity: 1; } to { transform: translateY(20px) scale(0.98); opacity: 0; }`;

const Overlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: ${({ $isOpen }) => ($isOpen ? fadeIn : fadeOut)} 0.25s forwards;

  @media (max-width: 768px) {
    padding: 0;
    align-items: flex-end; /* 모바일: 바텀 시트처럼 아래 정렬 */
  }
`;

const ModalContainer = styled.div<{ $type: string; $isOpen: boolean }>`
  background: white;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  animation: ${({ $isOpen }) => ($isOpen ? slideUp : slideDown)} 0.3s
    cubic-bezier(0.16, 1, 0.3, 1) forwards;

  /* 반응형 크기 설정 */
  width: 100%;
  max-width: 480px;
  max-height: 85vh; /* 화면 꽉 차지 않게 */
  border-radius: 20px;
  overflow: hidden;

  /* FULL 타입일 경우 조금 더 넓게 */
  ${({ $type }) =>
    $type === "FULL" &&
    css`
      max-width: 600px;
    `}

  @media (max-width: 768px) {
    width: 100%;
    max-width: 100%;
    border-radius: 24px 24px 0 0; /* 위쪽만 둥글게 */
    max-height: 90vh;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px;
  background: white;
  border-bottom: 1px solid #f1f5f9;
  flex-shrink: 0;
`;

const HeaderTitle = styled.h3`
  font-size: 17px;
  font-weight: 700;
  margin: 0;
  color: #1e293b;
`;

const CloseButton = styled.button`
  background: #f1f5f9;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s;
  &:hover {
    background: #e2e8f0;
    color: #1e293b;
  }
`;

const ModalBody = styled.div<{ $type: string; $noPadding?: boolean }>`
  flex: 1;
  overflow-y: auto; /* 내용 넘치면 스크롤 */
  font-size: 15px;
  line-height: 1.6;
  color: #475569;

  /* 내부 컴포넌트가 패딩을 직접 제어하도록 0으로 설정 가능 */
  padding: ${({ $noPadding }) => ($noPadding ? "0" : "24px")};

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #cbd5e1;
    border-radius: 3px;
  }
`;

const ModalFooter = styled.div`
  padding: 16px 24px;
  display: flex;
  gap: 12px;
  background: white;
  border-top: 1px solid #f1f5f9;
  flex-shrink: 0;
  padding-bottom: max(16px, env(safe-area-inset-bottom));
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
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CancelButton = styled(Button)`
  background-color: #f1f5f9;
  color: #64748b;
  &:hover {
    background-color: #e2e8f0;
    color: #334155;
  }
`;

const ConfirmButton = styled(Button)<{
  $fullWidth?: boolean;
  $isDanger?: boolean;
}>`
  background-color: ${({ $isDanger }) => ($isDanger ? "#ef4444" : "#3182f6")};
  color: white;
  width: ${({ $fullWidth }) => ($fullWidth ? "100%" : "auto")};
  &:hover {
    background-color: ${({ $isDanger }) => ($isDanger ? "#dc2626" : "#2563eb")};
    transform: translateY(-1px);
  }
`;
