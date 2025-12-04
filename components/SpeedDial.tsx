"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useModalStore } from "@/store/modalStore";
import {
  Plus,
  Clock,
  MessageCircle,
  Receipt,
  ArrowRightLeft,
} from "lucide-react";

export default function SpeedDial() {
  const router = useRouter();
  const pathname = usePathname();
  const { openModal } = useModalStore();
  const [isOpen, setIsOpen] = useState(false);

  // 페이지 이름 추출 (예: /schedule -> schedule)
  const pageName = pathname?.substring(1) || "dashboard";

  // 페이지별 메뉴 정의 함수
  const getMenuItems = () => {
    const commonItems = [];

    switch (pageName) {
      case "pickup":
      case "schedule":
      case "temp-schedule":
        return [
          {
            label: "시간 추가",
            icon: <Clock size={20} />,
            onClick: () => openModal("TIME_ADD"),
            color: "text-blue-600",
          },
          {
            label: "시간 삭제",
            icon: <Trash2 size={20} />,
            onClick: () => openModal("TIME_DELETE"),
            color: "text-red-500",
          },
          ...(pageName === "schedule"
            ? [
                {
                  label: "임시시간표 이동",
                  icon: <ArrowRightLeft size={20} />,
                  onClick: () => router.push("/temp-schedule"),
                  color: "text-gray-600",
                },
              ]
            : []),
        ];

      case "payment":
        return [
          {
            label: "현금영수증",
            icon: <Receipt size={20} />,
            onClick: () => openModal("CASH_RECEIPT"),
            color: "text-gray-600",
          },
          {
            label: "결제문자",
            icon: <MessageCircle size={20} />,
            onClick: () => openModal("PAYMENT_MSG"),
            color: "text-gray-600",
          },
        ];

      default:
        // 기본적으로 보여줄 메뉴가 없다면 빈 배열 반환
        return [];
    }
  };

  const menuItems = getMenuItems();

  // 메뉴가 없으면 버튼 자체를 숨김
  if (menuItems.length === 0) return null;

  return (
    <>
      {/* 배경 오버레이 (메뉴 열렸을 때 클릭 시 닫힘) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-[2000] transition-opacity backdrop-blur-[2px]"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 우측 중하단 플로팅 버튼 컨테이너 */}
      {/* bottom-24: 바텀 네비게이션 위로 올림, right-6: 우측 여백 */}
      <div className="fixed bottom-24 right-6 z-[9001] flex flex-col items-end gap-4">
        {/* 펼쳐지는 메뉴 아이템들 */}
        <div
          className={`flex flex-col gap-3 transition-all duration-300 origin-bottom-right ${
            isOpen
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-90 translate-y-4 pointer-events-none"
          }`}
        >
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
              // 버튼 스타일: 흰색 배경, 둥근 모서리, 그림자, 라벨+아이콘 배치
              className="flex items-center gap-3 pl-4 pr-3 py-2.5 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-all group"
            >
              <span className="text-sm font-bold text-gray-700 whitespace-nowrap">
                {item.label}
              </span>
              <div
                className={`w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 group-hover:bg-white transition-colors ${item.color}`}
              >
                {item.icon}
              </div>
            </button>
          ))}
        </div>

        {/* 메인 플로팅 버튼 (파란색 +) */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          // 버튼 스타일: 진한 파란색, 큰 그림자, 회전 애니메이션
          className={`w-14 h-14 flex items-center justify-center rounded-full shadow-[0_8px_24px_rgba(49,130,246,0.5)] text-white transition-all duration-300 ${
            isOpen
              ? "bg-gray-800 rotate-[135deg]"
              : "bg-[#3182f6] hover:scale-105 active:scale-95"
          }`}
        >
          <Plus size={28} strokeWidth={2.5} />
        </button>
      </div>
    </>
  );
}

// 필요 시 Trash2 아이콘 import 추가
import { Trash2 } from "lucide-react";
