"use client";

import React from "react";
import styled, { keyframes } from "styled-components";
import { useToastStore } from "@/store/toastStore";
import { CheckCircle, ErrorOutline, InfoOutlined } from "@mui/icons-material";

export default function ToastSystem() {
  const { toasts } = useToastStore();

  return (
    <ToastContainer>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} $type={toast.type}>
          {/* 타입별 아이콘 */}
          {toast.type === "success" && <CheckCircle className="icon success" />}
          {toast.type === "error" && <ErrorOutline className="icon error" />}
          {toast.type === "info" && <InfoOutlined className="icon info" />}

          <Message>{toast.message}</Message>
        </ToastItem>
      ))}
    </ToastContainer>
  );
}

// --- Styles ---

const slideUp = keyframes`
  // 시작 위치를 조금 더 아래로, 스케일을 조금 더 작게 시작하여 팝업 느낌 강조
  from { opacity: 0; transform: translateY(30px) scale(0.9); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

const ToastContainer = styled.div`
  position: fixed;
  bottom: 32px; // 바닥에서 조금 더 띄움
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 8px; // 간격 살짝 좁힘
  align-items: center;
  pointer-events: none;
`;

const ToastItem = styled.div<{ $type: string }>`
  display: flex;
  align-items: center;
  gap: 10px; // 아이콘과 텍스트 사이 간격 조정
  // 패딩을 줄여서 더 컴팩트하게 만듦
  padding: 10px 16px;

  // 더 둥근 모서리 (알약 모양)
  border-radius: 99px;

  // 배경색: 조금 더 어둡고 투명하게 변경하여 고급스러운 느낌
  background-color: rgba(33, 37, 41, 0.85);

  // 테두리: 아주 미세한 투명 테두리를 추가하여 경계선 강조 (Glassmorphism 핵심)
  border: 1px solid rgba(255, 255, 255, 0.1);

  color: white;

  // 그림자: 더 부드럽고 깊이감 있는 2중 그림자 사용
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08);

  // 블러 효과 강화
  backdrop-filter: blur(12px);

  // 애니메이션 곡선 변경 (조금 더 쫀득한 느낌)
  animation: ${slideUp} 0.35s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;

  // 불필요한 최소 너비 제거 (내용에 맞게 크기 조절)
  // min-width: 250px; 삭제
  max-width: 85vw; // 모바일에서 너무 꽉 차지 않게 여백 확보
  justify-content: center;
  white-space: nowrap; // 텍스트 한 줄로 표시 (선택사항)

  .icon {
    // 아이콘 크기 살짝 축소하여 텍스트와 균형 맞춤
    font-size: 18px;
    &.success {
      color: #2ecc71; // 조금 더 밝은 에메랄드 그린
    }
    &.error {
      color: #e74c3c; // 조금 더 부드러운 레드
    }
    &.info {
      color: #3498db; // 조금 더 부드러운 블루
    }
  }
`;

const Message = styled.span`
  font-size: 14px; // 폰트 사이즈 살짝 축소 (취향에 따라 15px 유지 가능)
  font-weight: 500; // 600(Bold) -> 500(Medium)으로 변경하여 세련된 느낌
  font-family: "CustomFont", -apple-system, BlinkMacSystemFont, system-ui,
    Roboto, sans-serif;
  line-height: 1.4;
  letter-spacing: -0.3px; // 자간을 살짝 좁혀서 단단한 느낌
`;
