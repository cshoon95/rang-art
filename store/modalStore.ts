import { create } from "zustand";
import { ReactNode } from "react";

export type ModalType = "ALERT" | "CONFIRM" | "SIMPLE" | "FULL" | "BOTTOM";

interface ModalState {
  isOpen: boolean;
  type: ModalType;
  title?: string;
  content?: ReactNode | string; // 컴포넌트나 텍스트 모두 허용
  okText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;

  // 모달 열기 함수 (옵션 객체로 받음)
  openModal: (options: {
    type: ModalType;
    title?: string;
    content?: ReactNode | string;
    okText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  }) => void;

  closeModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  isOpen: false,
  type: "SIMPLE",
  title: "",
  content: null,
  okText: "확인",
  cancelText: "취소",
  onConfirm: undefined,
  onCancel: undefined,

  openModal: (options) =>
    set({
      isOpen: true,
      type: options.type,
      title: options.title || "",
      content: options.content || null,
      okText: options.okText || "확인",
      cancelText: options.cancelText || "취소",
      onConfirm: options.onConfirm,
      onCancel: options.onCancel,
    }),

  closeModal: () =>
    set({
      isOpen: false,
      content: null, // 닫을 때 내용 초기화
      onConfirm: undefined,
      onCancel: undefined,
    }),
}));
