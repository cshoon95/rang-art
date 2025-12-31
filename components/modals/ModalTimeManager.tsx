"use client";

import React, { useState } from "react";
import styled, { keyframes, css } from "styled-components";
import { useModalStore } from "@/store/modalStore";
import { useShallow } from "zustand/react/shallow";
import {
  AccessTime,
  DeleteOutline,
  Add,
  Edit,
  Check,
} from "@mui/icons-material";

import { removeTimePattern, replaceTimePattern } from "@/utils/format";
import { useToastStore } from "@/store/toastStore";
import { useRouter } from "next/navigation";
import {
  useDeletePickupTime,
  useDeleteScheduleTime,
  useDeleteTempScheduleTime,
  useInsertPickupTime,
  useInsertScheduleTime,
  useInsertTempScheduleTime,
  useUpdatePickupTime,
  useUpdateScheduleTime,
  useUpdateTempScheduleTime,
} from "@/app/_querys";

interface Props {
  mode: "add" | "edit"; // edit 모드가 추가됨 (edit 모드는 수정/삭제 모두 포함)
  initialTime?: string;
  target: "schedule" | "pickup" | "temp-schedule";
  academyCode: string;
  userId: string;
}

export default function ModalTimeManager({
  mode: initialMode,
  initialTime = "",
  target,
  academyCode,
  userId,
}: Props) {
  const [time, setTime] = useState(initialTime);
  // 'edit' 모드로 들어왔을 때 내부에서 'modify'(수정) 탭인지 'delete'(삭제) 탭인지 관리
  const [activeTab, setActiveTab] = useState<"modify" | "delete">("modify");

  const router = useRouter();
  const { addToast } = useToastStore();
  const { closeModal } = useModalStore(
    useShallow((state) => ({ closeModal: state.closeModal }))
  );

  // --- Hooks (Insert) ---
  const { isPending: isPendingScheduleInsert, mutate: mutateScheduleInsert } =
    useInsertScheduleTime({
      onSuccess: (_, v) => handleSuccess(v.time, "추가"),
    });
  const { isPending: isPendingPickupInsert, mutate: mutatePickupInsert } =
    useInsertPickupTime({
      onSuccess: (_, v) => handleSuccess(v.time, "추가"),
    });
  const { isPending: isPendingTempInsert, mutate: mutateTempInsert } =
    useInsertTempScheduleTime({
      onSuccess: (_, v) => handleSuccess(v.time, "추가"),
    });

  // --- Hooks (Delete) ---
  const { isPending: isPendingScheduleDelete, mutate: mutateScheduleDelete } =
    useDeleteScheduleTime({
      onSuccess: (_, v) => handleSuccess(v.time, "삭제"),
    });
  const { isPending: isPendingPickupDelete, mutate: mutatePickupDelete } =
    useDeletePickupTime({
      onSuccess: (_, v) => handleSuccess(v.time, "삭제"),
    });
  const { isPending: isPendingTempDelete, mutate: mutateTempDelete } =
    useDeleteTempScheduleTime({
      onSuccess: (_, v) => handleSuccess(v.time, "삭제"),
    });

  // --- Hooks (Update) ✅ 추가됨 ---
  const { isPending: isPendingScheduleUpdate, mutate: mutateScheduleUpdate } =
    useUpdateScheduleTime({
      onSuccess: (_, v) => handleSuccess(v.newTime, "수정"),
      onError: (err: any) => alert(err.message || "수정 실패"),
    });
  const { isPending: isPendingPickupUpdate, mutate: mutatePickupUpdate } =
    useUpdatePickupTime({
      onSuccess: (_, v) => handleSuccess(v.newTime, "수정"),
      onError: (err: any) => alert(err.message || "수정 실패"),
    });
  const { isPending: isPendingTempUpdate, mutate: mutateTempUpdate } =
    useUpdateTempScheduleTime({
      onSuccess: (_, v) => handleSuccess(v.newTime, "수정"),
      onError: (err: any) => alert(err.message || "수정 실패"),
    });

  const isAddMode = initialMode === "add";
  const isDeleteTab = !isAddMode && activeTab === "delete";

  const isPending =
    isPendingScheduleInsert ||
    isPendingScheduleDelete ||
    isPendingScheduleUpdate ||
    isPendingPickupInsert ||
    isPendingPickupDelete ||
    isPendingPickupUpdate ||
    isPendingTempInsert ||
    isPendingTempDelete ||
    isPendingTempUpdate;

  const handleSuccess = (timeVal: string, action: string) => {
    closeModal();
    router.refresh();
    addToast(
      `${replaceTimePattern(timeVal)} 시간이 ${action}되었어요.`,
      "success"
    );
  };

  // 저장 (등록 or 수정)
  const handleSave = () => {
    if (!time) return alert("시간을 입력해주세요");
    const cleanTime = removeTimePattern(time);
    const cleanOldTime = removeTimePattern(initialTime);

    // 공통 파라미터
    const baseParam = { academyCode, registerID: userId };

    if (isAddMode) {
      // 등록 로직
      const param = { ...baseParam, time: cleanTime };
      if (target === "schedule") mutateScheduleInsert(param);
      else if (target === "pickup") mutatePickupInsert(param);
      else if (target === "temp-schedule") mutateTempInsert(param);
    } else {
      // 수정 로직
      if (cleanTime === cleanOldTime) return closeModal(); // 변경사항 없음
      const param = { ...baseParam, oldTime: cleanOldTime, newTime: cleanTime };
      if (target === "schedule") mutateScheduleUpdate(param);
      else if (target === "pickup") mutatePickupUpdate(param);
      else if (target === "temp-schedule") mutateTempUpdate(param);
    }
  };

  // 삭제
  const handleDelete = () => {
    if (!initialTime) return;
    const param = { time: removeTimePattern(initialTime), academyCode };

    if (target === "schedule") mutateScheduleDelete(param);
    else if (target === "pickup") mutatePickupDelete(param);
    else if (target === "temp-schedule") mutateTempDelete(param);
  };

  return (
    <Container>
      {/* 관리 모드일 때 탭 표시 */}
      {!isAddMode && (
        <TabContainer>
          <Tab
            $isActive={activeTab === "modify"}
            onClick={() => setActiveTab("modify")}
          >
            시간 수정
          </Tab>
          <Tab
            $isActive={activeTab === "delete"}
            onClick={() => setActiveTab("delete")}
          >
            삭제
          </Tab>
        </TabContainer>
      )}

      {/* 헤더 */}
      <HeaderSection>
        <IconCircle $mode={isDeleteTab ? "delete" : isAddMode ? "add" : "edit"}>
          {isDeleteTab ? (
            <DeleteOutline className="icon" />
          ) : isAddMode ? (
            <AccessTime className="icon" />
          ) : (
            <Edit className="icon" />
          )}
        </IconCircle>
        <TitleArea>
          <Title>
            {isDeleteTab
              ? "시간 삭제"
              : isAddMode
              ? "새로운 시간 등록"
              : "시간 수정"}
          </Title>
          <SubTitle>
            {isDeleteTab
              ? "이 시간을 시간표에서 완전히 삭제하시겠어요?"
              : isAddMode
              ? "시간표에 추가할 시간을 설정해주세요."
              : "기존 시간을 새로운 시간으로 변경합니다."}
          </SubTitle>
        </TitleArea>
      </HeaderSection>

      {/* 입력 영역 */}
      <InputSection>
        <Label>TIME</Label>
        {/* 삭제 모드일 때는 ReadOnly 처리 */}
        <TimeInputWrapper $isReadOnly={isDeleteTab}>
          <TimeInput
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            disabled={isDeleteTab}
            required
          />
          {isDeleteTab && <ReadOnlyOverlay />}
        </TimeInputWrapper>
      </InputSection>

      {/* 버튼 그룹 */}
      <ButtonGroup>
        <CancelButton onClick={closeModal} disabled={isPending}>
          취소
        </CancelButton>

        {isDeleteTab ? (
          <DeleteButton onClick={handleDelete} disabled={isPending}>
            <DeleteOutline style={{ fontSize: "20px", marginRight: "4px" }} />
            {isPending ? "삭제 중..." : "삭제하기"}
          </DeleteButton>
        ) : (
          <ConfirmButton onClick={handleSave} disabled={isPending}>
            {isAddMode ? (
              <Add style={{ fontSize: "20px", marginRight: "4px" }} />
            ) : (
              <Check style={{ fontSize: "20px", marginRight: "4px" }} />
            )}
            {isPending ? "처리 중..." : isAddMode ? "등록하기" : "수정하기"}
          </ConfirmButton>
        )}
      </ButtonGroup>
    </Container>
  );
}

// --------------------------------------------------------------------------
// ✨ Styles (Tab 추가 및 스타일 보강)
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
  position: relative;
`;

const TabContainer = styled.div`
  display: flex;
  background: #f2f4f6;
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 24px;
`;

const Tab = styled.button<{ $isActive: boolean }>`
  flex: 1;
  padding: 10px;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  font-family: "CustomFont", sans-serif;

  ${(props) =>
    props.$isActive
      ? css`
          background: white;
          color: #191f28;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
        `
      : css`
          background: transparent;
          color: #8b95a1;
          &:hover {
            color: #4e5968;
          }
        `}
`;

// 기존 스타일 유지 (IconCircle $mode 타입 확장)
const IconCircle = styled.div<{ $mode: "add" | "delete" | "edit" }>`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

  ${(props) => {
    if (props.$mode === "add")
      return css`
        background-color: #e8f3ff;
        color: #3182f6;
      `;
    if (props.$mode === "delete")
      return css`
        background-color: #ffe4e6;
        color: #e11d48;
      `;
    if (props.$mode === "edit")
      return css`
        background-color: #f0fdf4;
        color: #16a34a;
      `; // 초록색 계열
  }}

  .icon {
    font-size: 32px;
    color: inherit;
  }
`;

// ... 아래 TitleArea, Title, SubTitle, InputSection, Label, TimeInputWrapper, TimeInput, ReadOnlyOverlay, ButtonGroup, Button, CancelButton, ConfirmButton, DeleteButton 등은 기존과 동일하거나 위 코드에 포함됨 ...
// (나머지 스타일 컴포넌트는 기존 코드 그대로 사용하시면 됩니다)

const HeaderSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 32px;
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
`;

const SubTitle = styled.p`
  font-size: 15px;
  color: #8b95a1;
  margin: 0;
  line-height: 1.5;
`;

const InputSection = styled.div`
  margin-bottom: 36px;
  text-align: left;
`;

const Label = styled.span`
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: #8b95a1;
  margin-bottom: 8px;
`;

const TimeInputWrapper = styled.div<{ $isReadOnly?: boolean }>`
  position: relative;
  border-radius: 18px;
  background-color: #f9fafb;
  border: 2px solid transparent;
  transition: all 0.2s;

  ${(props) =>
    !props.$isReadOnly &&
    css`
      border-color: #e5e8eb;
      &:focus-within {
        border-color: #3182f6;
        background-color: #fff;
      }
    `}

  ${(props) =>
    props.$isReadOnly &&
    css`
      background-color: #f2f4f6;
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
  font-family: "CustomFont", sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
  &:disabled {
    opacity: 0.7;
  }
`;

const CancelButton = styled(Button)`
  background-color: #f2f4f6;
  color: #4e5968;
  flex: 0.6;
`;

const ConfirmButton = styled(Button)`
  background-color: #3182f6;
  color: white;
`;

const DeleteButton = styled(Button)`
  background-color: #e11d48;
  color: white;
`;
