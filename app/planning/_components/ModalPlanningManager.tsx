"use client";

import React, { useState, useRef, useMemo } from "react";
import styled from "styled-components";
import { Upload, Trash2, Check, X } from "lucide-react";
import { useModalStore } from "@/store/modalStore";
import { useUpsertPlanning, useDeletePlanning } from "@/app/_querys";

// 🚨 최대 용량 설정 (파일 개당 4MB)
const MAX_FILE_SIZE = 4 * 1024 * 1024;

interface Props {
  initialData?: any;
  year: number;
  month: number;
  type: string;
  academyCode: string;
  userId: string;
}

export default function ModalPlanningManager({
  initialData,
  year,
  month,
  type,
  academyCode,
  userId,
}: Props) {
  const { openModal, closeModal } = useModalStore();

  // --- State ---
  const [title, setTitle] = useState(initialData?.title || "");
  const [content, setContent] = useState(initialData?.content || "");

  // ✅ [변경 1] 이미지 상태 관리 (기존 URL들 vs 새로 추가된 파일들)
  const [existingImages, setExistingImages] = useState<string[]>(() => {
    // 1순위: images 배열, 2순위: image_url(구 데이터 호환)
    if (initialData?.images && initialData.images.length > 0) {
      return initialData.images;
    }
    if (initialData?.image_url) {
      return [initialData.image_url];
    }
    return [];
  });

  const [newFiles, setNewFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const upsertMutation = useUpsertPlanning(closeModal);
  const deleteMutation = useDeletePlanning(closeModal);

  // --- Handlers ---

  // 1. 파일 선택 (다중)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    // 용량 체크 및 필터링
    const validFiles: File[] = [];
    let isError = false;

    selectedFiles.forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        isError = true;
      } else {
        validFiles.push(file);
      }
    });

    if (isError) {
      openModal({
        title: "용량 초과",
        content: "일부 이미지가 4MB를 초과하여 제외되었습니다.",
        type: "ALERT",
      });
    }

    // 기존 목록에 추가
    setNewFiles((prev) => [...prev, ...validFiles]);

    // 입력값 초기화 (같은 파일 다시 선택 가능하도록)
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // 2. 기존 이미지 삭제
  const removeExistingImage = (indexToRemove: number) => {
    setExistingImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // 3. 새 파일 삭제
  const removeNewFile = (indexToRemove: number) => {
    setNewFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // 4. 저장
  const handleSave = () => {
    const formData = new FormData();

    if (initialData?.id) formData.append("id", initialData.id);
    formData.append("academyCode", academyCode);
    formData.append("userId", userId);
    formData.append("year", String(year));
    formData.append("month", String(month));
    formData.append("type", type);
    formData.append("title", title);
    formData.append("content", content);

    // ✅ [변경 2] 기존 이미지 목록 (JSON 문자열) + 새 파일들 (Append Loop)
    formData.append("currentImages", JSON.stringify(existingImages));

    newFiles.forEach((file) => {
      formData.append("files", file);
    });

    upsertMutation.mutate(formData);
  };

  const handleDelete = () => {
    openModal({
      title: "삭제 확인",
      content: "정말 삭제하시겠습니까?",
      type: "CONFIRM",
      onConfirm: () => {
        deleteMutation.mutate(initialData.id);
      },
    });
  };

  return (
    <Wrapper>
      <ScrollContent>
        {/* --- 이미지 업로드 섹션 --- */}
        <Section>
          <Label>
            계획안 이미지{" "}
            <span style={{ color: "#94a3b8", fontWeight: 400 }}>
              (최대 4MB)
            </span>
          </Label>

          {/* 이미지 그리드 컨테이너 */}
          <ImageGrid>
            {/* 1. 업로드 버튼 (항상 첫 번째) */}
            <UploadBox onClick={() => fileInputRef.current?.click()}>
              <Upload size={20} className="icon" />
              <span>추가</span>
              <input
                type="file"
                hidden
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                multiple // ✅ 다중 선택 가능
              />
            </UploadBox>

            {/* 2. 기존 이미지 렌더링 */}
            {existingImages.map((url, idx) => (
              <ThumbnailItem key={`existing-${idx}`}>
                <ThumbnailImage src={url} alt="Existing" />
                <DeleteBadge onClick={() => removeExistingImage(idx)}>
                  <X size={12} />
                </DeleteBadge>
              </ThumbnailItem>
            ))}

            {/* 3. 새로 추가된 파일 렌더링 */}
            {newFiles.map((file, idx) => (
              <ThumbnailItem key={`new-${idx}`}>
                {/* createObjectURL은 메모리 관리를 위해 컴포넌트 분리가 좋으나 간편 구현 */}
                <ThumbnailImage
                  src={URL.createObjectURL(file)}
                  alt="New"
                  onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)}
                />
                <DeleteBadge onClick={() => removeNewFile(idx)}>
                  <X size={12} />
                </DeleteBadge>
              </ThumbnailItem>
            ))}
          </ImageGrid>
        </Section>

        {/* --- 텍스트 입력 섹션 --- */}
        <Section>
          <Label>제목</Label>
          <Input
            placeholder="제목을 입력하세요 (예: 5월 계획안)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Section>

        <Section>
          <Label>상세 내용</Label>
          <TextArea
            placeholder="상세 내용을 입력하세요."
            rows={8}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </Section>
      </ScrollContent>

      {/* --- 하단 버튼 --- */}
      <FixedFooter>
        {initialData?.id ? (
          <DeleteBtn onClick={handleDelete} disabled={deleteMutation.isPending}>
            <Trash2 size={18} />
          </DeleteBtn>
        ) : (
          <div />
        )}

        <SaveBtn onClick={handleSave} disabled={upsertMutation.isPending}>
          {upsertMutation.isPending ? (
            "저장 중..."
          ) : (
            <>
              <Check size={18} /> 저장하기
            </>
          )}
        </SaveBtn>
      </FixedFooter>
    </Wrapper>
  );
}

// --------------------------------------------------------------------------
// 🎨 Styles
// --------------------------------------------------------------------------

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
`;

const ScrollContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #e2e8f0;
    border-radius: 3px;
  }
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
  margin-left: 2px;
`;

/* ✅ 그리드 레이아웃으로 변경 */
const ImageGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`;

/* ✅ 업로드 버튼 박스 (정사각형) */
const UploadBox = styled.div`
  width: 100px;
  height: 100px;
  border: 2px dashed #e2e8f0;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  background: #f8fafc;
  transition: all 0.2s;
  color: #64748b;

  &:hover {
    border-color: #3182f6;
    background: #eff6ff;
    color: #3182f6;
  }

  span {
    font-size: 12px;
    font-weight: 600;
  }
`;

/* ✅ 썸네일 아이템 */
const ThumbnailItem = styled.div`
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  background: white;
`;

const ThumbnailImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

/* ✅ 삭제 버튼 (X 뱃지) */
const DeleteBadge = styled.button`
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #ef4444;
    transform: scale(1.1);
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  font-size: 15px;
  outline: none;
  transition: all 0.2s;
  background: white;
  &:focus {
    border-color: #3182f6;
    box-shadow: 0 0 0 3px rgba(49, 130, 246, 0.1);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  font-size: 15px;
  outline: none;
  resize: none;
  transition: all 0.2s;
  font-family: inherit;
  background: white;
  &:focus {
    border-color: #3182f6;
    box-shadow: 0 0 0 3px rgba(49, 130, 246, 0.1);
  }
`;

const FixedFooter = styled.div`
  padding: 16px 24px;
  background: white;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  gap: 12px;
  padding-bottom: max(16px, env(safe-area-inset-bottom));
`;

const ButtonBase = styled.button`
  height: 48px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  transition: all 0.2s;
`;

const DeleteBtn = styled(ButtonBase)`
  width: 48px;
  background: #fee2e2;
  color: #ef4444;
  &:hover {
    background: #fecaca;
    transform: translateY(-1px);
  }
`;

const SaveBtn = styled(ButtonBase)`
  flex: 1;
  background: #3182f6;
  color: white;
  box-shadow: 0 4px 12px rgba(49, 130, 246, 0.2);

  &:hover {
    background: #2563eb;
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(49, 130, 246, 0.3);
  }
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }
`;
