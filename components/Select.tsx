"use client";

import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components";

interface Option {
  label: string;
  value: string;
}

interface Props {
  options: Option[];
  value: string;
  // onChange의 첫 번째 인자 타입을 좀 더 유연하게 any로 받거나, 이벤트를 무시할 수 있게 처리
  onChange: (
    e?: any, // ✅ ChangeEvent 대신 any로 변경하여 MouseEvent 호환성 확보
    value?: string
  ) => void;
  width?: string;
}

export default function Select({
  options,
  value,
  onChange,
  width = "130px",
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ handleSelect의 이벤트 타입 수정 (MouseEvent 허용)
  const handleSelect = (
    e: React.MouseEvent<HTMLLIElement> | React.ChangeEvent<any>,
    val: string
  ) => {
    // 부모에게 전달할 때는 이벤트 객체(e)를 그대로 넘겨줍니다.
    // 부모 쪽에서 e.target을 안 쓰거나, 커스텀 로직으로 처리하므로 any로 넘겨도 무방합니다.
    onChange(e, val);
    setIsOpen(false);
  };

  return (
    <SelectWrapper ref={wrapperRef} style={{ width }}>
      <SelectTrigger
        $isOpen={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <SelectedText>
          {selectedOption ? selectedOption.label : "선택"}
        </SelectedText>
        <ArrowIcon $isOpen={isOpen}>
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path
              d="M2.5 4.5L6 8L9.5 4.5"
              stroke={isOpen ? "#3182f6" : "#8B95A1"}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </ArrowIcon>
      </SelectTrigger>
      {isOpen && (
        <DropdownList>
          {options.map((opt) => (
            <DropdownItem
              key={opt.value}
              $isSelected={opt.value === value}
              // ✅ 이제 handleSelect가 MouseEvent를 받을 수 있으므로 에러가 사라집니다.
              onClick={(e) => handleSelect(e, opt.value)}
            >
              {opt.label}
            </DropdownItem>
          ))}
        </DropdownList>
      )}
    </SelectWrapper>
  );
}

// ... (스타일 코드는 기존과 동일하게 유지)
const SelectWrapper = styled.div`
  position: relative;
  @media (max-width: 768px) {
    width: 100% !important;
  }
`;

// ... (나머지 스타일들)
const SelectTrigger = styled.button<{ $isOpen: boolean }>`
  /* div 대신 button으로 바꾸는 것이 웹 접근성 및 탭 이동에 좋습니다 */
  width: 100%;

  /* ✅ [수정 1] PC & 아이패드(태블릿) 기본 높이 */
  height: 44px;

  padding: 0 12px;
  background: white;
  border-radius: 12px;
  border: 1px solid ${({ $isOpen }) => ($isOpen ? "#3182f6" : "#e5e8eb")};
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  box-shadow: ${({ $isOpen }) =>
    $isOpen
      ? "0 0 0 3px rgba(49, 130, 246, 0.1)"
      : "0 1px 2px rgba(0, 0, 0, 0.04)"};

  &:hover {
    background-color: #f9fafb;
    border-color: ${({ $isOpen }) => ($isOpen ? "#3182f6" : "#d1d6db")};
  }

  /* ✅ [수정 2] 모바일(휴대폰) 환경에서 높이 조정 */
  @media (max-width: 768px) {
    height: 42px;
  }
`;

const SelectedText = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #4e5968;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ArrowIcon = styled.div<{ $isOpen: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 12px;
  height: 12px;
  transform: ${({ $isOpen }) => ($isOpen ? "rotate(180deg)" : "rotate(0deg)")};
  transition: transform 0.2s ease;
  margin-left: 8px;
`;

const DropdownList = styled.ul`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  width: 100%;
  padding: 6px;
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e8eb;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  z-index: 100;
  max-height: 240px;
  overflow-y: auto;
  list-style: none;
  margin: 0;
  box-sizing: border-box; /* 추가 */
`;

const DropdownItem = styled.li<{ $isSelected: boolean }>`
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 14px;
  color: ${({ $isSelected }) => ($isSelected ? "#3182f6" : "#333d4b")};
  font-weight: ${({ $isSelected }) => ($isSelected ? "700" : "500")};
  background-color: ${({ $isSelected }) =>
    $isSelected ? "#e8f3ff" : "transparent"};
  cursor: pointer;
  transition: background-color 0.1s;
  &:hover {
    background-color: ${({ $isSelected }) =>
      $isSelected ? "#e8f3ff" : "#f2f4f6"};
  }
`;
