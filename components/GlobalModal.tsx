"use client";

import React, { useEffect, useState } from "react";
import styled, { keyframes, css } from "styled-components";
import { useModalStore } from "@/store/modalStore";
import { X } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

export default function GlobalModal() {
  const {
    isOpen,
    type = "SIMPLE",
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

  const [visible, setVisible] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (isOpen) {
      setVisible(true);
      requestAnimationFrame(() => setAnimate(true));
    } else {
      setAnimate(false);
      timeoutId = setTimeout(() => setVisible(false), 300); // 애니메이션 시간 대기
    }
    return () => clearTimeout(timeoutId);
  }, [isOpen]);

  if (!visible) return null;

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    closeModal();
  };

  const isAlertOrConfirm = type === "ALERT" || type === "CONFIRM";
  const isFull = type === "FULL";

  return (
    <Overlay $isOpen={animate} onClick={closeModal} $type={type}>
      <ModalContainer
        $isOpen={animate}
        $type={type}
        onClick={(e) => e.stopPropagation()}
      >
        {/* === 1. 헤더 영역 === */}
        {/* ALERT/CONFIRM은 보통 헤더 없이 본문에 타이틀을 녹이거나 간소화함 */}
        {!isAlertOrConfirm && title && (
          <ModalHeader>
            <HeaderTitle>{title}</HeaderTitle>
            <CloseButton onClick={closeModal}>
              <X size={20} />
            </CloseButton>
          </ModalHeader>
        )}

        {/* === 2. 본문 영역 === */}
        <ModalBody $type={type} $noPadding={isFull}>
          {/* ALERT/CONFIRM일 때 타이틀 강조 */}
          {isAlertOrConfirm && title && <AlertTitle>{title}</AlertTitle>}
          {content}
        </ModalBody>

        {/* === 3. 푸터 영역 === */}
        {!hideFooter && (
          <ModalFooter $type={type}>
            {/* 취소 버튼 (ALERT 제외) */}
            {type !== "ALERT" && (
              <CancelButton onClick={closeModal}>
                {cancelText || "취소"}
              </CancelButton>
            )}

            {/* 확인 버튼 */}
            <ConfirmButton
              onClick={handleConfirm}
              $fullWidth={type === "ALERT" || type === "CONFIRM"}
              $isDanger={type === "CONFIRM"} // CONFIRM은 보통 중요/삭제 동작
            >
              {okText || "확인"}
            </ConfirmButton>
          </ModalFooter>
        )}

        {/* FULL 모드일 때 우측 상단 닫기 버튼 (헤더가 없을 수도 있으므로) */}
        {isFull && !title && (
          <FloatingCloseBtn onClick={closeModal}>
            <X size={24} color="#333" />
          </FloatingCloseBtn>
        )}
      </ModalContainer>
    </Overlay>
  );
}

// --------------------------------------------------------------------------
// ✨ Styles & Animations
// --------------------------------------------------------------------------

// Fade Animation
const fadeIn = css`
  opacity: 1;
  visibility: visible;
`;
const fadeOut = css`
  opacity: 0;
  visibility: hidden;
  transition: visibility 0.3s, opacity 0.3s;
`;

// Slide & Zoom Animations
const slideUp = css`
  transform: translateY(0) scale(1);
  opacity: 1;
`;
const slideDown = css`
  transform: translateY(20px) scale(0.95);
  opacity: 0;
`;
const sheetUp = css`
  transform: translateY(0);
`;
const sheetDown = css`
  transform: translateY(100%);
`;

const Overlay = styled.div<{ $isOpen: boolean; $type: string }>`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  transition: all 0.3s ease-in-out;

  /* 애니메이션 상태 적용 */
  ${({ $isOpen }) => ($isOpen ? fadeIn : fadeOut)}

  /* 타입별 정렬 위치 */
  align-items: ${({ $type }) => ($type === "BOTTOM" ? "flex-end" : "center")};
  justify-content: center;
  padding: ${({ $type }) => ($type === "FULL" ? "0" : "20px")};

  @media (max-width: 768px) {
    /* 모바일에서는 FULL, BOTTOM 모두 꽉 채우거나 아래 붙음 */
    padding: ${({ $type }) => ($type === "FULL" ? "0" : "0 0 20px 0")};
    align-items: ${({ $type }) =>
      $type === "ALERT" || $type === "CONFIRM" ? "center" : "flex-end"};
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #f1f5f9;
  flex-shrink: 0;
  min-height: 60px;
`;

const HeaderTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
`;

const AlertTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 12px;
`;

const CloseButton = styled.button`
  background: #f8fafc;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #64748b;
  transition: 0.2s;
  &:hover {
    background: #e2e8f0;
    color: #0f172a;
  }
`;

const FloatingCloseBtn = styled(CloseButton)`
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 10;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const ModalBody = styled.div<{ $type: string; $noPadding?: boolean }>`
  flex: 1;
  overflow-y: auto;
  font-size: 15px;
  line-height: 1.6;
  color: #475569;
  padding: ${({ $noPadding }) => ($noPadding ? "0" : "24px")};

  /* ALERT/CONFIRM은 패딩을 좀 더 줌 */
  ${({ $type }) =>
    ($type === "ALERT" || $type === "CONFIRM") &&
    css`
      padding: 32px 24px 24px 24px;
    `}
`;
const ModalContainer = styled.div<{ $type: string; $isOpen: boolean }>`
  background: white;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
  white-space: pre-line;

  /* --- [1] 기본 애니메이션 (중앙 팝업) --- */
  ${({ $isOpen }) => ($isOpen ? slideUp : slideDown)}

  /* --- [2] 타입별 스타일 --- */

  /* A. ALERT & CONFIRM */
  ${({ $type }) =>
    ($type === "ALERT" || $type === "CONFIRM") &&
    css`
      width: 320px;
      border-radius: 20px;
      text-align: center;
    `}

  /* B. SIMPLE */
  ${({ $type }) =>
    $type === "SIMPLE" &&
    css`
      width: 100%;
      max-width: 480px;
      max-height: 80vh;
      border-radius: 24px;
    `}

  /* C. BOTTOM */
  ${({ $type, $isOpen }) =>
    $type === "BOTTOM" &&
    css`
      width: 100%;
      max-width: 600px;
      border-radius: 24px 24px 0 0;
      max-height: 90vh;
      transform: translateY(100%);
      ${$isOpen ? sheetUp : sheetDown}

      /* ✅ [수정] 모바일에서 하단 딱 붙이기 위해 마진 제거 */
      margin-bottom: 0;

      @media (min-width: 769px) {
        border-radius: 24px;
        margin-bottom: 20px; /* PC에서는 살짝 띄움 */
      }
    `}

  /* D. FULL */
  ${({ $type }) =>
    $type === "FULL" &&
    css`
      width: 100vw;
      height: 100vh;
      max-width: none;
      max-height: none;
      border-radius: 0;
      margin: 0; /* ✅ [수정] 마진 제거 */
    `}

  /* 모바일 공통 대응 */
  @media (max-width: 768px) {
    ${({ $type }) =>
      ($type === "SIMPLE" || $type === "BOTTOM") &&
      css`
        width: 100%;
        border-radius: 24px 24px 0 0;
        margin: 0; /* ✅ [수정] 확실하게 0으로 설정 */
        bottom: 0;
        position: absolute; /* 바텀 시트처럼 동작 */
      `}

    /* ALERT/CONFIRM은 중앙 정렬 유지 */
    ${({ $type }) =>
      ($type === "ALERT" || $type === "CONFIRM") &&
      css`
        position: relative;
        margin: auto;
      `}
  }
`;

// ... (Header, Body 등 동일)

const ModalFooter = styled.div<{ $type: string }>`
  padding: 16px 24px;
  display: flex;
  gap: 10px;
  background: white;
  border-top: 1px solid #f1f5f9;
  flex-shrink: 0;

  /* ✅ [수정] PWA 하단 안전 영역 처리 개선 */
  /* padding-bottom에 safe-area를 더하되, 배경색이 짤리지 않게 처리 */
  padding-bottom: calc(16px + env(safe-area-inset-bottom));

  ${({ $type }) =>
    ($type === "ALERT" || $type === "CONFIRM") &&
    css`
      border-top: none;
      padding-top: 0;
      padding-bottom: 24px; /* 중앙 팝업은 safe-area 영향 덜 받으므로 고정값 */
    `}
`;
const Button = styled.button`
  flex: 1;
  height: 48px;
  border-radius: 14px;
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
  box-shadow: 0 4px 12px
    ${({ $isDanger }) =>
      $isDanger ? "rgba(239, 68, 68, 0.3)" : "rgba(49, 130, 246, 0.3)"};

  &:hover {
    background-color: ${({ $isDanger }) => ($isDanger ? "#dc2626" : "#2563eb")};
    transform: translateY(-2px);
  }
  &:active {
    transform: translateY(0);
  }
`;
