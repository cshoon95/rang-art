"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import styled, { css } from "styled-components";
import { format } from "date-fns";
import {
  X,
  Clock,
  Calendar as CalIcon,
  CheckCircle2,
  Circle,
  AlertCircle,
} from "lucide-react";
import {
  useInsertCalendar,
  useUpdateCalendar,
  useDeleteCalendar,
} from "@/app/_querys";
import { MappedEvent } from "@/app/_types/type";
import { useModalStore } from "@/store/modalStore";

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  academyCode: string;
  userId: string;
  selectedEvent: MappedEvent | null;
  initialDate?: Date;
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
  const [dateError, setDateError] = useState<string>("");
  const { openModal, closeModal } = useModalStore();

  const [formData, setFormData] = useState({
    content: "",
    startDate: format(new Date(), "yyyy-MM-dd"),
    startTime: "09:00",
    endDate: format(new Date(), "yyyy-MM-dd"),
    endTime: "10:00",
    isHoliday: false,
  });

  const insertMutation = useInsertCalendar(academyCode, onClose);
  const updateMutation = useUpdateCalendar(academyCode, onClose);
  const deleteMutation = useDeleteCalendar(academyCode, onClose);

  useEffect(() => {
    if (isOpen) {
      setContentError(false);
      setDateError("");

      if (selectedEvent && selectedEvent.resource) {
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

  // ✅ [핵심 추가] 실시간 유효성 검사 (버튼 활성화 여부 결정)
  const isFormValid = useMemo(() => {
    // 1. 내용 입력 확인
    if (!formData.content.trim()) return false;

    // 2. 날짜/시간 순서 확인
    const start = new Date(`${formData.startDate}T${formData.startTime}`);
    const end = new Date(`${formData.endDate}T${formData.endTime}`);

    // 종료 시간이 시작 시간보다 같거나 빠르면 무효 (Start < End 여야 함)
    return start < end;
  }, [formData]);

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    if (newStartDate > formData.endDate) {
      setFormData((prev) => ({
        ...prev,
        startDate: newStartDate,
        endDate: newStartDate,
      }));
    } else {
      setFormData((prev) => ({ ...prev, startDate: newStartDate }));
    }
    setDateError("");
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value;
    // 날짜 자체의 역전 방지
    if (newEndDate < formData.startDate) {
      setDateError("종료일은 시작일보다 빠를 수 없습니다.");
      setFormData((prev) => ({ ...prev, endDate: prev.startDate }));
      return;
    }
    setFormData((prev) => ({ ...prev, endDate: newEndDate }));
    setDateError("");
  };

  const handleSave = () => {
    if (!isFormValid) {
      // 강제 호출 시 방어 로직 (버튼 비활성화로 인해 호출될 일은 거의 없음)
      if (!formData.content.trim()) {
        setContentError(true);
        contentInputRef.current?.focus();
      } else {
        setDateError("종료 시간은 시작 시간보다 늦어야 합니다.");
      }
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
    if (selectedEvent) {
      openModal({
        type: "ALERT",
        title: "지점 삭제",
        content: "정말 삭제하시겠어요?",
        onConfirm: () => {
          deleteMutation.mutate(Number(selectedEvent.id), {
            onSuccess: () => {
              closeModal();
            },
          });
        },
      });
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
                  <CheckCircle2 size={24} />
                ) : (
                  <Circle size={24} />
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
                onChange={handleStartDateChange}
              />
            </InputGroup>
            <InputGroup>
              <Label>
                <Clock size={14} /> 시간
              </Label>
              <Input
                type="time"
                value={formData.startTime}
                onChange={(e) => {
                  setFormData({ ...formData, startTime: e.target.value });
                  setDateError("");
                }}
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
                onChange={handleEndDateChange}
              />
            </InputGroup>
            <InputGroup>
              <Label>
                <Clock size={14} /> 시간
              </Label>
              <Input
                type="time"
                value={formData.endTime}
                onChange={(e) => {
                  setFormData({ ...formData, endTime: e.target.value });
                  setDateError("");
                }}
              />
            </InputGroup>
          </Row>

          {/* 에러 메시지는 여전히 보여주되, 버튼이 비활성화됨을 인지시킴 */}
          {!isFormValid && formData.content && !dateError && (
            <FormErrorBox>
              <AlertCircle size={16} />
              종료 시간은 시작 시간보다 늦어야 합니다.
            </FormErrorBox>
          )}

          {dateError && (
            <FormErrorBox>
              <AlertCircle size={16} />
              {dateError}
            </FormErrorBox>
          )}
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
          {/* ✅ 버튼 비활성화 조건 추가: !isFormValid */}
          <SaveButton
            onClick={handleSave}
            disabled={
              insertMutation.isPending ||
              updateMutation.isPending ||
              !isFormValid
            }
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
// ✨ Styled Components
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
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  height: 50px;
  padding: 0 14px;
  border: 2px solid transparent;
  border-radius: 14px;
  font-size: 16px;
  font-family: inherit;
  color: #191f28;
  background: #f4f6f8;
  outline: none;
  transition: all 0.2s;
  box-sizing: border-box;

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

  &[type="date"],
  &[type="time"] {
    display: block;
    line-height: 50px;
    font-family: inherit;
  }

  @media (max-width: 600px) {
    height: 44px;
    line-height: 44px;
    font-size: 16px;
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

const FormErrorBox = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px;
  background-color: #fff5f5;
  border-radius: 10px;
  color: #ef4444;
  font-size: 13px;
  font-weight: 600;
  animation: fadeIn 0.3s ease;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-5px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
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
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 50px;
  width: 52px;
  height: 52px;

  &:hover {
    background-color: ${({ $active }) => ($active ? "#fee2e2" : "#f2f4f6")};
  }

  @media (max-width: 768px) {
    min-width: 46px;
    width: 46px;
    height: 46px;
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
  /* ✅ 비활성화 스타일 강화 */
  &:disabled {
    background-color: #d1d5db; /* 회색 */
    color: #9ca3af;
    cursor: not-allowed;
    opacity: 1; /* 투명도 대신 색상으로 제어 */
  }
`;

const DeleteButton = styled(Button)`
  background: #fff0f0;
  color: #e11d48;
  &:hover:not(:disabled) {
    background: #fee2e2;
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
