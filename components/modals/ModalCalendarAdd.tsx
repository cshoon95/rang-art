"use client";

import React, { useState, useEffect, useRef } from "react";
import styled, { css } from "styled-components";
import { format } from "date-fns";
import {
  X,
  Clock,
  Calendar as CalIcon,
  CheckCircle2,
  Circle,
} from "lucide-react";
import {
  useInsertCalendar,
  useUpdateCalendar,
  useDeleteCalendar,
} from "@/app/_querys";
import { MappedEvent } from "@/app/_types/type";

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  academyCode: string;
  userId: string;
  selectedEvent: MappedEvent | null; // 수정 시 선택된 이벤트
  initialDate?: Date; // 새 일정 등록 시 기본 날짜
}

export default function ModalCalendarAdd({
  isOpen,
  onClose,
  academyCode,
  userId,
  selectedEvent,
  initialDate = new Date(),
}: ScheduleModalProps) {
  const contentInputRef = useRef<HTMLInputElement>(null);
  const [contentError, setContentError] = useState(false);

  // 폼 상태
  const [formData, setFormData] = useState({
    content: "",
    startDate: format(new Date(), "yyyy-MM-dd"),
    startTime: "09:00",
    endDate: format(new Date(), "yyyy-MM-dd"),
    endTime: "10:00",
    isHoliday: false,
  });

  // API Hooks
  const insertMutation = useInsertCalendar(academyCode, onClose);
  const updateMutation = useUpdateCalendar(academyCode, onClose);
  const deleteMutation = useDeleteCalendar(academyCode, onClose);

  // 모달이 열릴 때 데이터 초기화 or 바인딩
  useEffect(() => {
    if (isOpen) {
      setContentError(false);
      if (selectedEvent && selectedEvent.resource) {
        // [수정 모드]
        const { resource } = selectedEvent;
        setFormData({
          content: resource.content,
          startDate: resource.start_date,
          startTime: resource.start_time.substring(0, 5),
          endDate: resource.end_date,
          endTime: resource.end_time.substring(0, 5),
          isHoliday: resource.isHoliday || resource.type === "school_holiday",
        });
      } else {
        // [등록 모드] initialDate 기준 설정
        const dateStr = format(initialDate, "yyyy-MM-dd");
        setFormData({
          content: "",
          startDate: dateStr,
          startTime: "09:00",
          endDate: dateStr,
          endTime: "10:00",
          isHoliday: false,
        });
      }
    }
  }, [isOpen, selectedEvent, initialDate]);

  const handleSave = () => {
    if (!formData.content.trim()) {
      setContentError(true);
      contentInputRef.current?.focus();
      return;
    }

    const payload = {
      content: formData.content,
      startDate: formData.startDate,
      startTime: formData.startTime,
      endDate: formData.endDate,
      endTime: formData.endTime,
      type: formData.isHoliday ? "school_holiday" : "event",
    };

    if (selectedEvent && selectedEvent.id) {
      updateMutation.mutate({
        ...payload,
        id: Number(selectedEvent.id),
        updater_id: userId,
      });
    } else {
      insertMutation.mutate({
        ...payload,
        register_id: userId,
      });
    }
  };

  const handleDelete = () => {
    if (selectedEvent && confirm("정말 삭제하시겠습니까?")) {
      deleteMutation.mutate(Number(selectedEvent.id));
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            {selectedEvent ? "일정 수정" : "새 일정 등록"}
          </ModalTitle>
          <CloseBtn onClick={onClose}>
            <X size={22} />
          </CloseBtn>
        </ModalHeader>

        <ModalBody>
          <InputGroup>
            <Label>
              일정 내용 <RequiredMark>*</RequiredMark>
            </Label>
            <ContentRow>
              <div style={{ flex: 1, position: "relative" }}>
                <Input
                  ref={contentInputRef}
                  value={formData.content}
                  onChange={(e) => {
                    setFormData({ ...formData, content: e.target.value });
                    if (e.target.value) setContentError(false);
                  }}
                  placeholder="예: 학부모 상담"
                  $error={contentError}
                  autoFocus
                />
                {contentError && (
                  <ErrorMessage>내용을 입력해주세요.</ErrorMessage>
                )}
              </div>

              <HolidayButton
                type="button"
                $active={formData.isHoliday}
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    isHoliday: !prev.isHoliday,
                  }))
                }
                title="학원 휴일로 지정"
              >
                {formData.isHoliday ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <Circle size={18} />
                )}
                <span>휴일</span>
              </HolidayButton>
            </ContentRow>
          </InputGroup>

          <Row>
            <InputGroup>
              <Label>
                <CalIcon size={14} /> 시작일
              </Label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
              />
            </InputGroup>
            <InputGroup>
              <Label>
                <Clock size={14} /> 시간
              </Label>
              <Input
                type="time"
                value={formData.startTime}
                onChange={(e) =>
                  setFormData({ ...formData, startTime: e.target.value })
                }
              />
            </InputGroup>
          </Row>
          <Row>
            <InputGroup>
              <Label>
                <CalIcon size={14} /> 종료일
              </Label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
              />
            </InputGroup>
            <InputGroup>
              <Label>
                <Clock size={14} /> 시간
              </Label>
              <Input
                type="time"
                value={formData.endTime}
                onChange={(e) =>
                  setFormData({ ...formData, endTime: e.target.value })
                }
              />
            </InputGroup>
          </Row>
        </ModalBody>

        <ModalFooter>
          {selectedEvent && selectedEvent.resource && (
            <DeleteButton
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "삭제 중..." : "삭제"}
            </DeleteButton>
          )}
          <SaveButton
            onClick={handleSave}
            disabled={insertMutation.isPending || updateMutation.isPending}
          >
            {insertMutation.isPending || updateMutation.isPending
              ? "저장 중"
              : "저장"}
          </SaveButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
}

// --------------------------------------------------------------------------
// ✨ Styled Components (모달 전용 스타일만 이동)
// --------------------------------------------------------------------------

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: white;
  width: 420px;
  max-width: 100%;
  border-radius: 28px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  animation: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  @keyframes slideUp {
    from {
      transform: translateY(40px) scale(0.95);
      opacity: 0;
    }
    to {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
  }
`;

const ModalHeader = styled.div`
  padding: 24px 28px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ModalTitle = styled.h3`
  font-size: 20px;
  font-weight: 700;
  color: #191f28;
  margin: 0;
`;

const CloseBtn = styled.button`
  background: #f2f4f6;
  border: none;
  cursor: pointer;
  color: #6b7684;
  padding: 8px;
  border-radius: 50%;
  transition: 0.2s;
  &:hover {
    background: #e5e8eb;
    color: #333;
  }
`;

const ModalBody = styled.div`
  padding: 0 28px 28px 28px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
  flex: 1;
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #ddd;
    border-radius: 4px;
  }
  @media (max-width: 600px) {
    padding: 0 16px 20px 16px;
    gap: 16px;
  }
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
`;

const Row = styled.div`
  display: flex;
  gap: 12px;
  @media (max-width: 600px) {
    gap: 8px;
  }
`;

const Input = styled.input<{ $error?: boolean }>`
  width: 100%;

  /* ✅ [핵심 1] 모바일 브라우저 기본 스타일 초기화 */
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;

  /* ✅ [핵심 2] 높이 강제 고정 (padding 대신 height로 제어) */
  height: 50px; /* PC 기준 넉넉한 높이 */
  padding: 0 14px; /* 좌우 패딩만 설정 */

  border: 2px solid transparent;
  border-radius: 14px;
  font-size: 16px;
  font-family: inherit;
  color: #191f28;
  background: #f4f6f8;
  outline: none;
  transition: all 0.2s;
  box-sizing: border-box; /* 패딩 포함 크기 계산 */

  ${({ $error }) =>
    $error &&
    css`
      background: #fff5f5;
      border-color: #ef4444;
      box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
    `}

  &:focus {
    background: white;
    border-color: ${({ $error }) => ($error ? "#ef4444" : "#3182f6")};
    box-shadow: 0 0 0 4px
      ${({ $error }) =>
        $error ? "rgba(239, 68, 68, 0.1)" : "rgba(49, 130, 246, 0.1)"};
  }

  /* ✅ [핵심 3] 날짜/시간 인풋 전용 스타일 보정 */
  &[type="date"],
  &[type="time"] {
    display: block; /* flex 레이아웃 깨짐 방지 */
    line-height: 50px; /* 텍스트 수직 정렬 */
    /* iOS 기본 폰트 무시하고 상속받기 */
    font-family: inherit;
  }

  /* 📱 모바일 대응 */
  @media (max-width: 600px) {
    height: 44px; /* 모바일 높이 조정 */
    line-height: 44px;
    font-size: 16px; /* iOS 자동 확대 방지 (16px 이상 권장) */
    border-radius: 12px;
    padding: 0 12px;

    &::-webkit-calendar-picker-indicator {
      transform: scale(0.9);
      margin-left: 0;
    }
  }
`;

const ContentRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
`;

const Label = styled.label`
  font-size: 13px;
  font-weight: 600;
  color: #8b95a1;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const RequiredMark = styled.span`
  color: #ef4444;
  margin-left: 2px;
`;

const ErrorMessage = styled.span`
  font-size: 12px;
  color: #ef4444;
  font-weight: 600;
  margin-top: 6px;
  display: block;
  animation: shake 0.3s ease-in-out;
  @keyframes shake {
    0%,
    100% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(-2px);
    }
    75% {
      transform: translateX(2px);
    }
  }
`;

const HolidayButton = styled.button<{ $active: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 10px 8px;
  border-radius: 12px;
  border: 1px solid ${({ $active }) => ($active ? "#fda4af" : "#e5e8eb")};
  background-color: ${({ $active }) => ($active ? "#fff0f0" : "#f9fafb")};
  color: ${({ $active }) => ($active ? "#e11d48" : "#6b7684")};
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 50px;
  height: 52px;
  &:hover {
    background-color: ${({ $active }) => ($active ? "#fee2e2" : "#f2f4f6")};
  }
`;

const ModalFooter = styled.div`
  padding: 20px 28px;
  background-color: white;
  border-top: 1px solid #f2f4f6;
  display: flex;
  gap: 12px;
`;

const Button = styled.button`
  padding: 14px 20px;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
`;

const SaveButton = styled(Button)`
  background: #3182f6;
  color: white;
  flex: 1;
  &:hover:not(:disabled) {
    background: #1b64da;
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const DeleteButton = styled(Button)`
  background: #fff0f0;
  color: #e11d48;
  &:hover:not(:disabled) {
    background: #fee2e2;
  }
`;
