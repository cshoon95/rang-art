"use client";

import React, { useState, useMemo, useRef } from "react";
import styled, { keyframes } from "styled-components";
import { useModalStore } from "@/store/modalStore";
import { useSession } from "next-auth/react";
import { Pin, AlertCircle } from "lucide-react";
import dynamic from "next/dynamic";

import "react-quill-new/dist/quill.snow.css";
import { useUpsertMemo, useDeleteMemo } from "@/app/_querys";

const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => <div style={{ height: "250px", background: "#f9fafb" }} />,
});

interface Props {
  mode: "add" | "edit";
  academyCode: string;
  initialData?: any;
}

export default function ModalMemoManager({
  mode,
  academyCode,
  initialData,
}: Props) {
  const { data: session } = useSession();

  // 🌟 포커싱을 위한 Ref
  const titleRef = useRef<HTMLInputElement>(null);

  // 🌟 에러 상태
  const [showError, setShowError] = useState(false);

  const initialTitle = initialData?.title || "";
  const initialContent = initialData?.content || "";
  const initialFixed =
    initialData?.fixed_yn === "Y" || initialData?.FIXED_YN === "Y";

  const [formData, setFormData] = useState({
    title: initialTitle,
    content: initialContent,
    fixedYn: initialFixed,
  });

  const { closeModal } = useModalStore();
  const { mutate: upsertMemo, isPending } = useUpsertMemo();
  const { mutate: deleteMemo } = useDeleteMemo();

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (value.trim()) setShowError(false); // 입력 시 에러 해제
  };

  const handleContentChange = (content: string) => {
    setFormData((prev) => ({ ...prev, content }));

    // 내용이 입력되면 에러 해제 (HTML 태그 제거 후 확인)
    const cleanText = content.replace(/<[^>]+>/g, "").trim();
    if (cleanText.length > 0) setShowError(false);
  };

  const toggleFixed = () => {
    setFormData((prev) => ({ ...prev, fixedYn: !prev.fixedYn }));
  };

  const handleSubmit = () => {
    // 🌟 [핵심] 제목이나 내용 중 하나라도 있는지 체크
    const hasTitle = !!formData.title.trim();

    // 에디터 특성상 태그(<p> 등)를 제외한 순수 텍스트만 추출해서 검사
    const cleanContent = formData.content.replace(/<[^>]+>/g, "").trim();
    const hasContent = cleanContent.length > 0;

    if (!hasTitle && !hasContent) {
      setShowError(true); // 에러 표시
      titleRef.current?.focus(); // 제목으로 포커스
      return;
    }

    upsertMemo(
      {
        id: initialData?.id || initialData?.ID,
        academyCode,
        userId: session?.user?.email || "unknown",
        ...formData,
      },
      {
        onSuccess: () => closeModal(),
      }
    );
  };

  const handleDelete = () => {
    if (confirm("정말 삭제하시겠습니까?")) {
      deleteMemo(initialData?.id || initialData?.ID, {
        onSuccess: () => closeModal(),
      });
    }
  };

  const modules = useMemo(() => {
    return {
      toolbar: [
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
      ],
    };
  }, []);

  return (
    <Container>
      <Header>
        <Input
          ref={titleRef} // Ref 연결
          name="title"
          value={formData.title}
          onChange={handleTitleChange}
          placeholder="제목을 입력하세요"
          autoFocus
        />
        <PinButton
          type="button"
          $active={formData.fixedYn}
          onClick={toggleFixed}
        >
          <Pin size={20} fill={formData.fixedYn ? "#3182f6" : "none"} />
        </PinButton>
      </Header>

      <QuillWrapper>
        <ReactQuill
          theme="snow"
          value={formData.content}
          onChange={handleContentChange}
          modules={modules}
          placeholder="내용을 자유롭게 입력하세요..."
        />
      </QuillWrapper>

      {/* 🌟 에러 메시지 표시 */}
      {showError && (
        <ErrorMsg>
          <AlertCircle size={14} />
          제목 또는 내용을 입력해주세요.
        </ErrorMsg>
      )}

      <Footer $mode={mode}>
        {mode === "edit" && (
          <DeleteBtn onClick={handleDelete} type="button">
            삭제
          </DeleteBtn>
        )}
        <SaveBtn onClick={handleSubmit} disabled={isPending}>
          {isPending ? "저장 중..." : "저장"}
        </SaveBtn>
      </Footer>
    </Container>
  );
}

// --- Styles ---
const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 10px 4px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid #f2f4f6;
  padding-bottom: 8px;
`;

const Input = styled.input`
  flex: 1;
  font-size: 18px;
  font-weight: 700;
  border: none;
  outline: none;
  &::placeholder {
    color: #b0b8c1;
  }
`;

const PinButton = styled.button<{ $active: boolean }>`
  background: none;
  border: none;
  cursor: pointer;
  color: ${(props) => (props.$active ? "#3182f6" : "#d1d6db")};
  transform: ${(props) => (props.$active ? "rotate(-45deg)" : "rotate(0)")};
  transition: all 0.2s;
  &:hover {
    color: #3182f6;
  }
`;

const QuillWrapper = styled.div`
  .ql-editor {
    min-height: 250px;
    font-size: 15px;
    font-family: "Pretendard", sans-serif;
    line-height: 1.6;
    padding-left: 0;

    &.ql-blank::before {
      color: #b0b8c1;
      font-style: normal;
    }
  }

  .ql-toolbar.ql-snow {
    border: none;
    border-bottom: 1px solid #f2f4f6;
    padding: 8px 0;
  }

  .ql-container.ql-snow {
    border: none;
  }
  .ql-editor.ql-blank::before {
    /* 기본값은 left: 15px 정도입니다. 원하는 대로 조정하세요. */
    left: 5px !important;
    top: 10px !important;

    /* 폰트 스타일 수정 */
    color: #a0a0a0;
    font-style: normal;
    font-size: 16px;
  }
`;

// 🌟 에러 메시지 애니메이션
const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
`;

const ErrorMsg = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: #ef4444;
  font-size: 13px;
  font-weight: 600;
  animation: ${shake} 0.3s ease-in-out;
  padding-left: 4px;
`;

const Footer = styled.div<{ $mode: "add" | "edit" }>`
  display: flex;
  justify-content: ${(props) =>
    props.$mode === "add" ? "end" : "space-between"};
  gap: 8px;
  margin-top: 4px;
`;

const Button = styled.button`
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s;
`;

const DeleteBtn = styled(Button)`
  background-color: #fff0f3;
  color: #e11d48;
  &:hover {
    opacity: 0.8;
  }
`;

const SaveBtn = styled(Button)`
  background-color: #3182f6;
  color: white;
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  &:hover {
    opacity: 0.9;
  }
`;
