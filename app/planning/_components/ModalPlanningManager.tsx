"use client";

import React, { useState, useRef } from "react";
import styled from "styled-components";
import { Upload, Trash2, Check, Image as ImageIcon } from "lucide-react";
import { useModalStore } from "@/store/modalStore";
import { useUpsertPlanning, useDeletePlanning } from "@/app/_querys";

// 🚨 [추가 1] 최대 용량 설정 (Vercel 제한 고려하여 4MB로 설정)
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB

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
  // ✅ [추가 2] 알림창을 띄우기 위해 openModal 추가
  const { openModal, closeModal } = useModalStore();

  const [title, setTitle] = useState(initialData?.title || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [previewSrc, setPreviewSrc] = useState<string>(
    initialData?.image_url || ""
  );
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const upsertMutation = useUpsertPlanning(closeModal);
  const deleteMutation = useDeletePlanning(closeModal);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];

    if (selectedFile) {
      // 🚨 [추가 3] 용량 체크 로직
      if (selectedFile.size > MAX_FILE_SIZE) {
        openModal({
          title: "용량 초과",
          content: "이미지 크기는 4MB 이하로 해주세요.\n(서버 전송 제한)",
          type: "ALERT",
        });

        // 선택된 파일 초기화 (같은 파일 다시 선택 가능하도록 value 비움)
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      setFile(selectedFile);
      setPreviewSrc(URL.createObjectURL(selectedFile));
    }
  };

  const handleSave = () => {
    // 저장 전 한 번 더 체크 (선택사항)
    if (file && file.size > MAX_FILE_SIZE) {
      openModal({
        title: "용량 초과",
        content: "이미지 크기가 4MB를 초과하여 저장할 수 없습니다.",
        type: "ALERT",
      });
      return;
    }

    const formData = new FormData();
    if (initialData?.id) formData.append("id", initialData.id);
    formData.append("academyCode", academyCode);
    formData.append("userId", userId);
    formData.append("year", String(year));
    formData.append("month", String(month));
    formData.append("type", type);
    formData.append("title", title);
    formData.append("content", content);
    formData.append("currentImageUrl", initialData?.image_url || "");
    if (file) formData.append("file", file);

    upsertMutation.mutate(formData);
  };

  const handleDelete = () => {
    // 삭제 확인 모달 사용
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
      {/* 🟢 스크롤 가능한 본문 영역 */}
      <ScrollContent>
        {/* 이미지 업로드 */}
        <Section>
          <Label>계획안 이미지</Label>
          <ImageUploadBox onClick={() => fileInputRef.current?.click()}>
            {previewSrc ? (
              <PreviewImage src={previewSrc} alt="Preview" />
            ) : (
              <UploadPlaceholder>
                <IconCircle>
                  <Upload size={20} />
                </IconCircle>
                <span className="text">이미지를 등록해주세요</span>
                {/* 문구 수정 */}
                <span className="sub">클릭하여 업로드 (4MB 제한)</span>
              </UploadPlaceholder>
            )}
            <input
              type="file"
              hidden
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
            />
          </ImageUploadBox>
        </Section>

        {/* ... (나머지 입력 필드들 기존과 동일) ... */}
        <Section>
          <Label>제목</Label>
          <Input
            placeholder="제목을 입력하세요 (예: 5월 가정통신문)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Section>

        <Section>
          <Label>상세 내용</Label>
          <TextArea
            placeholder="학부모님께 전달할 내용을 입력하세요."
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </Section>
      </ScrollContent>

      {/* 🔴 하단 고정 버튼 영역 */}
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

// ... (스타일 코드는 기존과 동일하므로 생략 가능, ImageUploadBox 내부 텍스트만 10MB -> 4MB로 변경된 것 확인) ...
// 스타일 하단에 기존 스타일 그대로 유지해주세요.
const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
`;
// ... (나머지 스타일들) ...

const ScrollContent = styled.div`
  flex: 1; /* 남은 공간 모두 차지 */
  overflow-y: auto; /* 내용 넘치면 스크롤 */
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;

  /* 스크롤바 커스텀 */
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

const ImageUploadBox = styled.div`
  width: 100%;
  height: 180px; /* 적당한 높이 */
  border: 2px dashed #e2e8f0;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  background: #f8fafc;
  transition: all 0.2s;
  position: relative;

  &:hover {
    border-color: #3182f6;
    background: #eff6ff;
    .icon-circle {
      background: #3182f6;
      color: white;
    }
  }
`;

const PreviewImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
`;

const UploadPlaceholder = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;

  .text {
    font-size: 14px;
    font-weight: 600;
    color: #334155;
  }
  .sub {
    font-size: 12px;
    color: #94a3b8;
  }
`;

const IconCircle = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #e2e8f0;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  margin-bottom: 4px;
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

// 🔴 고정된 푸터 (항상 보임)
const FixedFooter = styled.div`
  padding: 16px 24px;
  background: white;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0; /* 크기 줄어들지 않음 */
  gap: 12px;

  /* 모바일 하단 안전 영역 (아이폰 등) */
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
