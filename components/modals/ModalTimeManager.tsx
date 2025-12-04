"use client";

import React, { useState } from "react";
import styled, { keyframes, css } from "styled-components";
import { useModalStore } from "@/store/modalStore";
import { useShallow } from "zustand/react/shallow";
import { AccessTime, DeleteOutline, Add } from "@mui/icons-material";
import {
  useInsertScheduleTime,
  useDeleteScheduleTime,
} from "@/api/schedule/useScheduleQuery";
import { removeTimePattern, replaceTimePattern } from "@/utils/format";
import { useToastStore } from "@/store/toastStore";
import { useRouter } from "next/navigation";
import { Variable } from "lucide-react";
import {
  useDeletePickupTime,
  useInsertPickupTime,
} from "@/api/pickup/usePickupQuery";
import {
  useInsertTempScheduleTime,
  useDeleteTempScheduleTime,
} from "@/api/temp-schedule/useTempScheduleQuery";

// ✅ React Query Hooks Import
// 🚀 추후 Pickup 훅이 만들어지면 여기서 import 하세요!
// import { useInsertPickupTime, useDeletePickupTime } from "@/hooks/queries/usePickupTime";

interface Props {
  mode: "add" | "delete";
  initialTime?: string;
  // ⭐ 분기 처리를 위한 타겟 Prop 추가
  target: "schedule" | "pickup" | "temp-schedule";
}

export default function ModalTimeManager({
  mode,
  initialTime = "",
  target,
}: Props) {
  const [time, setTime] = useState(initialTime);
  const router = useRouter();
  const { addToast } = useToastStore();
  const { closeModal } = useModalStore(
    useShallow((state) => ({
      closeModal: state.closeModal,
    }))
  );

  // -----------------------------------------------------------------------
  // ✅ 1. React Query Hooks 호출
  // (React Hooks는 조건문 안에서 호출할 수 없으므로, 상단에서 모두 호출해둡니다.)
  // -----------------------------------------------------------------------

  // Schedule용 훅
  const { isPending: isPendingScheduleInsert, mutate: mutateScheduleInsert } =
    useInsertScheduleTime({
      onSuccess: (_, variables) => {
        const { time } = variables;
        closeModal();
        router.refresh();
        addToast(`${replaceTimePattern(time)} 시간이 추가되었어요.`, "success");
      },
    });

  const { isPending: isPendingScheduleDelete, mutate: mutateScheduleDelete } =
    useDeleteScheduleTime({
      onSuccess: (_, variables) => {
        const { time } = variables;
        closeModal();
        router.refresh();
        addToast(`${replaceTimePattern(time)} 시간이 삭제되었어요.`, "success");
      },
    });

  // Pickup 훅
  const { isPending: isPendingPickupInsert, mutate: mutatePickupInsert } =
    useInsertPickupTime({
      onSuccess: (_, variables) => {
        const { time } = variables;
        closeModal();
        router.refresh();
        addToast(`${replaceTimePattern(time)} 시간이 추가되었어요.`, "success");
      },
    });

  const { isPending: isPendingPickupDelete, mutate: mutatePickupDelete } =
    useDeletePickupTime({
      onSuccess: (_, variables) => {
        const { time } = variables;
        closeModal();
        router.refresh();
        addToast(`${replaceTimePattern(time)} 시간이 삭제되었어요.`, "success");
      },
    });

  // Temp-Schedule용 훅
  const {
    isPending: isPendingTempScheduleInsert,
    mutate: mutateTempScheduleInsert,
  } = useInsertTempScheduleTime({
    onSuccess: (_, variables) => {
      const { time } = variables;
      closeModal();
      router.refresh();
      addToast(`${replaceTimePattern(time)} 시간이 추가되었어요.`, "success");
    },
  });

  const {
    isPending: isPendingTempScheduleDelete,
    mutate: mutateTempScheduleDelete,
  } = useDeleteTempScheduleTime({
    onSuccess: (_, variables) => {
      const { time } = variables;
      closeModal();
      router.refresh();
      addToast(`${replaceTimePattern(time)} 시간이 삭제되었어요.`, "success");
    },
  });

  const isAddMode = mode === "add";
  const isPending =
    isPendingScheduleInsert ||
    isPendingScheduleDelete ||
    isPendingPickupInsert ||
    isPendingPickupDelete ||
    isPendingTempScheduleInsert ||
    isPendingTempScheduleDelete;

  // -----------------------------------------------------------------------
  // ✅ 3. 저장 핸들러 (분기 처리)
  // -----------------------------------------------------------------------
  const handleSave = () => {
    if (!time) return alert("시간을 입력해주세요");

    const param = {
      time: removeTimePattern(time),
      academyCode: "2", // 필요 시 전역 상태나 props로 전달
      registerID: "admin",
    };

    if (target === "schedule") {
      mutateScheduleInsert(param);
    } else if (target === "pickup") {
      mutatePickupInsert(param);
    } else if (target === "temp-schedule") {
      mutateTempScheduleInsert(param);
    }
  };

  // -----------------------------------------------------------------------
  // ✅ 4. 삭제 핸들러 (분기 처리)
  // -----------------------------------------------------------------------
  const handleDelete = () => {
    if (!initialTime) return;

    const param = {
      time: removeTimePattern(initialTime),
      academyCode: "2",
    };

    if (target === "schedule") {
      mutateScheduleDelete(param);
    } else if (target === "pickup") {
      mutatePickupDelete(param);
    } else if (target === "temp-schedule") {
      mutateTempScheduleDelete(param);
    }
  };

  const titlePrefix = {
    schedule: "[수업] ",
    "temp-schedule": "[임시] ", // 또는 "temp_schedule": "[임시] " (DB 테이블명에 맞게)
    pickup: "[픽업] ",
  };

  return (
    <Container>
      {/* 1. 헤더 */}
      <HeaderSection>
        <IconCircle $mode={mode}>
          {isAddMode ? (
            <AccessTime className="icon" />
          ) : (
            <DeleteOutline className="icon" />
          )}
        </IconCircle>
        <TitleArea>
          {/* target에 따라 텍스트를 다르게 보여줄 수도 있음 */}
          <Title>
            {titlePrefix[target]}
            {isAddMode ? "새로운 시간 등록" : "시간 삭제"}
          </Title>
          <SubTitle>
            {isAddMode
              ? "시간표에 추가할 시간을 설정해주세요."
              : "해당 시간을 시간표에서 제거하시겠어요"}
          </SubTitle>
        </TitleArea>
      </HeaderSection>

      {/* 2. 입력 영역 */}
      <InputSection>
        <Label>TIME</Label>
        <TimeInputWrapper $isReadOnly={!isAddMode}>
          <TimeInput
            type="time"
            value={time}
            onChange={(e) => {
              setTime(e.target.value);
            }}
            disabled={!isAddMode}
            required
          />
          {!isAddMode && <ReadOnlyOverlay />}
        </TimeInputWrapper>
      </InputSection>

      {/* 3. 버튼 그룹 */}
      <ButtonGroup>
        <CancelButton onClick={closeModal} disabled={isPending}>
          취소
        </CancelButton>
        {isAddMode ? (
          <ConfirmButton onClick={handleSave} disabled={isPending}>
            <Add style={{ fontSize: "20px", marginRight: "4px" }} />
            {isPending ? "등록 중..." : "등록하기"}
          </ConfirmButton>
        ) : (
          <DeleteButton onClick={handleDelete} disabled={isPending}>
            <DeleteOutline style={{ fontSize: "20px", marginRight: "4px" }} />
            {isPending ? "삭제 중..." : "삭제하기"}
          </DeleteButton>
        )}
      </ButtonGroup>
    </Container>
  );
}

// --------------------------------------------------------------------------
// ✨ Styles (변경 없음 - 그대로 사용)
// --------------------------------------------------------------------------

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  padding: 32px 24px;
  text-align: center;
  background: #fff;
  animation: ${fadeIn} 0.3s ease-out;
  width: 100%;
  max-width: 400px;
  box-sizing: border-box;
  @media (max-width: 480px) {
    padding: 24px 20px;
    max-width: 100%;
  }
`;

const HeaderSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 32px;
  @media (max-width: 480px) {
    margin-bottom: 24px;
  }
`;

const IconCircle = styled.div<{ $mode: "add" | "delete" }>`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: ${(props) =>
    props.$mode === "add" ? "#e8f3ff" : "#ffe4e6"};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

  .icon {
    font-size: 32px;
    color: ${(props) => (props.$mode === "add" ? "#3182f6" : "#e11d48")};
  }

  @media (max-width: 480px) {
    width: 56px;
    height: 56px;
    margin-bottom: 12px;
    .icon {
      font-size: 28px;
    }
  }
`;

const TitleArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Title = styled.h2`
  font-size: 22px;
  font-weight: 800;
  color: #191f28;
  margin: 0;
  font-family: "CustomFont", sans-serif;
  letter-spacing: -0.5px;
  word-break: keep-all;
  @media (max-width: 480px) {
    font-size: 20px;
  }
`;

const SubTitle = styled.p`
  font-size: 15px;
  color: #8b95a1;
  margin: 0;
  line-height: 1.5;
  word-break: keep-all;
  padding: 0 10px;
  @media (max-width: 480px) {
    font-size: 14px;
  }
`;

const InputSection = styled.div`
  margin-bottom: 36px;
  position: relative;
  text-align: left;
  @media (max-width: 480px) {
    margin-bottom: 28px;
  }
`;

const Label = styled.span`
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: #8b95a1;
  margin-bottom: 8px;
  margin-left: 4px;
  letter-spacing: 0.5px;
`;

const TimeInputWrapper = styled.div<{ $isReadOnly?: boolean }>`
  position: relative;
  border-radius: 18px;
  background-color: #f9fafb;
  border: 2px solid transparent;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;

  ${(props) =>
    !props.$isReadOnly &&
    css`
      border-color: #e5e8eb;
      &:hover {
        border-color: #b1b8c0;
        background-color: #fff;
      }
      &:focus-within {
        border-color: #3182f6;
        background-color: #fff;
        box-shadow: 0 0 0 4px rgba(49, 130, 246, 0.1);
      }
    `}

  ${(props) =>
    props.$isReadOnly &&
    css`
      background-color: #f2f4f6;
      border-color: transparent;
      opacity: 0.8;
    `}
`;

const TimeInput = styled.input`
  width: 100%;
  padding: 18px;
  font-size: 28px;
  font-weight: 700;
  text-align: center;
  color: #333;
  border: none;
  background: transparent;
  outline: none;
  font-family: "CustomFont", sans-serif;
  cursor: pointer;

  @media (max-width: 480px) {
    font-size: 24px;
    padding: 16px;
  }

  &::-webkit-calendar-picker-indicator {
    cursor: pointer;
    opacity: 0.6;
    transition: 0.2s;
  }
  &::-webkit-calendar-picker-indicator:hover {
    opacity: 1;
  }
`;

const ReadOnlyOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: transparent;
  cursor: not-allowed;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
`;

const Button = styled.button`
  flex: 1;
  height: 56px;
  border-radius: 16px;
  font-size: 16px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: "CustomFont", sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;

  &:active {
    transform: scale(0.96);
  }
  @media (max-width: 480px) {
    height: 52px;
    font-size: 15px;
    border-radius: 14px;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const CancelButton = styled(Button)`
  background-color: #f2f4f6;
  color: #4e5968;
  flex: 0.6;
  &:hover {
    background-color: #e5e8eb;
    color: #191f28;
  }
`;

const ConfirmButton = styled(Button)`
  background-color: #3182f6;
  color: white;
  box-shadow: 0 4px 10px rgba(49, 130, 246, 0.2);
  &:hover {
    background-color: #1b64da;
    box-shadow: 0 6px 14px rgba(49, 130, 246, 0.3);
    transform: translateY(-1px);
  }
  &:active {
    transform: translateY(0);
  }
`;

const DeleteButton = styled(Button)`
  background-color: #e11d48;
  color: white;
  box-shadow: 0 4px 10px rgba(225, 29, 72, 0.2);
  &:hover {
    background-color: #be123c;
    box-shadow: 0 6px 14px rgba(225, 29, 72, 0.3);
    transform: translateY(-1px);
  }
`;
