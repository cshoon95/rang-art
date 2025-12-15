"use client";

import React from "react";
import styled from "styled-components";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  CalendarDays,
  Settings,
  Briefcase,
  Wallet,
  CalendarClock,
  Car,
  CalendarRange,
  Users,
  UserCog,
  Building2,
  CreditCard,
  Receipt,
  StickyNote,
  FileSignature,
  Calendar,
  ClipboardCheck,
  ChartPie,
  BookOpen,
} from "lucide-react";

// ----------------------------------------------------------------------
// ✅ 메뉴 데이터 구조 (헤더와 동일하게 유지)
// ----------------------------------------------------------------------
type UserLevel = "원장" | "부원장" | "선생님" | "관리자" | string;

interface MenuItem {
  id?: string;
  label: string;
  path: string;
  type: "link" | "modal";
  icon: any;
  color: string;
  allowedLevels?: UserLevel[];
}

interface MenuSection {
  title: string;
  icon: any;
  items: MenuItem[];
}

const MENU_STRUCTURE: MenuSection[] = [
  {
    title: "시간표",
    icon: CalendarDays,
    items: [
      {
        label: "수업",
        path: "/schedule",
        type: "link",
        icon: CalendarClock,
        color: "#eff6ff",
      },
      {
        label: "픽업",
        path: "/pickup",
        type: "link",
        icon: Car,
        color: "#fff7ed",
      },
      {
        label: "임시",
        path: "/temp-schedule",
        type: "link",
        icon: CalendarRange,
        color: "#f3f4f6",
      },
    ],
  },
  {
    title: "업무",
    icon: Briefcase,
    items: [
      {
        label: "출석부",
        path: "/attendance",
        type: "link",
        icon: ClipboardCheck,
        color: "#f0fdf4",
      },
      {
        label: "일정",
        path: "/calendar",
        type: "link",
        icon: Calendar,
        color: "#eef2ff",
      },
      {
        label: "계획안",
        path: "/planning",
        type: "link",
        icon: BookOpen,
        color: "#eef2ff",
      },
      {
        label: "노트",
        path: "/memo",
        type: "link",
        icon: StickyNote,
        color: "#fff1f2",
      },
    ],
  },
  {
    title: "관리",
    icon: Settings,
    items: [
      {
        label: "회원 관리",
        path: "/customers",
        type: "link",
        icon: Users,
        color: "#ecfdf5",
      },
      {
        label: "직원 관리",
        path: "/employee",
        type: "link",
        icon: UserCog,
        color: "#f0f9ff",
        allowedLevels: ["원장"],
      },
      {
        label: "지점 관리",
        path: "/branch",
        type: "link",
        icon: Building2,
        color: "#f0f9ff",
        allowedLevels: ["원장"],
      },
    ],
  },
  {
    title: "재무",
    icon: Wallet,
    items: [
      {
        label: "출납부",
        path: "/payment",
        type: "link",
        icon: CreditCard,
        color: "#f5f3ff",
        allowedLevels: ["원장"],
      },
      {
        label: "등록부",
        path: "/register",
        type: "link",
        icon: FileSignature,
        color: "#f0fdf4",
        allowedLevels: ["원장"],
      },
      {
        label: "현금영수증",
        path: "/cash-receipt",
        type: "link",
        icon: Receipt,
        color: "#f5f3ff",
        allowedLevels: ["원장"],
      },
      {
        label: "통계",
        path: "/reports",
        type: "link",
        icon: ChartPie,
        color: "#f5f3ff",
        allowedLevels: ["원장"],
      },
    ],
  },
];

// ----------------------------------------------------------------------
// ✅ Footer Component
// ----------------------------------------------------------------------
export const Footer = () => {
  const { data: session } = useSession();
  const userLevel = session?.user?.levelName || "선생님";

  return (
    <FooterWrapper>
      <FooterContent>
        {/* 좌측: 로고 및 저작권 (심플하게) */}
        <BrandSection>
          <Logo href="/home">
            RANG <span className="highlight">ART</span>
          </Logo>
          <CopyRight>
            © {new Date().getFullYear()} Rang Art Inc. All rights reserved.
            <br />
            <span style={{ fontSize: "12px", color: "#9ca3af" }}>
              경기도 군포시 산본천로 18 2층 203호 206호 <br />
            </span>
            <span style={{ fontSize: "12px", color: "#9ca3af" }}>
              문의: cshoon950@naver.com
            </span>
          </CopyRight>
        </BrandSection>

        {/* 우측: 메뉴 링크 (권한별 필터링) */}
        <LinksSection>
          {MENU_STRUCTURE.map((section, idx) => {
            // 1. 권한 필터링: 현재 유저 레벨이 allowedLevels에 포함되거나, allowedLevels가 없는 경우만 표시
            const visibleItems = section.items.filter(
              (item) =>
                !item.allowedLevels || item.allowedLevels.includes(userLevel)
            );

            // 2. 보여줄 아이템이 하나도 없으면 섹션 자체를 렌더링하지 않음
            if (visibleItems.length === 0) return null;

            return (
              <LinkGroup key={idx}>
                <GroupTitle>{section.title}</GroupTitle>
                {visibleItems.map((item, i) => (
                  <FooterLink key={i} href={item.path}>
                    {item.label}
                  </FooterLink>
                ))}
              </LinkGroup>
            );
          })}
        </LinksSection>
      </FooterContent>
    </FooterWrapper>
  );
};

// ----------------------------------------------------------------------
// 🎨 Styles
// ----------------------------------------------------------------------

const FooterWrapper = styled.footer`
  background-color: #fff;
  border-top: 1px solid #e5e7eb;
  margin-top: auto;

  /* 🚨 PC 전용 설정 (모바일/태블릿 숨김) */
  display: none;
  @media (min-width: 1025px) and (hover: hover) {
    display: block;
  }
`;

const FooterContent = styled.div`
  /* 헤더/레이아웃과 동일한 라인 유지를 위한 설정 */
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 50px 40px; /* 상하 여백을 적당히 조절 */

  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

/* 좌측 브랜드 정보 */
const BrandSection = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 300px;
`;

const Logo = styled(Link)`
  font-size: 22px;
  font-weight: 900;
  color: #1a1f27;
  text-decoration: none;
  margin-bottom: 12px;
  letter-spacing: -0.5px;

  .highlight {
    color: #3182f6;
  }
`;

const CopyRight = styled.p`
  font-size: 13px;
  color: #6b7280;
  line-height: 1.6;
  margin: 0;
  font-weight: 400;
`;

/* 우측 링크 그리드 */
const LinksSection = styled.div`
  display: flex;
  gap: 60px; /* 섹션 간 간격 */
`;

const LinkGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 100px;
`;

const GroupTitle = styled.h4`
  font-size: 13px;
  font-weight: 700;
  color: #111827;
  margin: 0;
  margin-bottom: 4px;
`;

const FooterLink = styled(Link)`
  font-size: 13px;
  color: #6b7280;
  text-decoration: none;
  transition: color 0.2s;
  font-weight: 500;

  &:hover {
    color: #3182f6;
  }
`;
