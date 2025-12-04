"use client";

import React from "react";
import styled from "styled-components";
import Link from "next/link";
import { Github, Instagram } from "lucide-react"; // 아이콘 추가 (선택 사항)

export const Footer = () => {
  return (
    <FooterWrapper>
      <FooterContainer>
        {/* 좌측: 로고 및 설명 */}
        <LeftSection>
          <Logo>
            MONEY <span className="highlight">STAR</span>
          </Logo>
          <Description>
            한별 & 수훈의 더 나은 미래를 위한
            <br />
            스마트 자산 관리 플랫폼
          </Description>
          <SocialLinks>
            <IconLink href="#" target="_blank">
              <Github size={18} />
            </IconLink>
            <IconLink href="#" target="_blank">
              <Instagram size={18} />
            </IconLink>
          </SocialLinks>
          <CopyRight>
            © {new Date().getFullYear()} Money Star Project. All rights
            reserved.
          </CopyRight>
        </LeftSection>

        {/* 우측: 링크 그룹 */}
        <RightSection>
          <LinkGroup>
            <LinkTitle>서비스</LinkTitle>
            <FooterLink href="/home">홈</FooterLink>
            <FooterLink href="/investment">투자 현황</FooterLink>
            <FooterLink href="/schedule">일정 관리</FooterLink>
          </LinkGroup>
          <LinkGroup>
            <LinkTitle>고객지원</LinkTitle>
            <FooterLink href="#">공지사항</FooterLink>
            <FooterLink href="#">자주 묻는 질문</FooterLink>
            <FooterLink href="#">버그 제보</FooterLink>
          </LinkGroup>
          <LinkGroup>
            <LinkTitle>약관</LinkTitle>
            <FooterLink href="#">이용약관</FooterLink>
            <FooterLink href="#">개인정보처리방침</FooterLink>
          </LinkGroup>
        </RightSection>
      </FooterContainer>
    </FooterWrapper>
  );
};

// --- Styles ---

const FooterWrapper = styled.footer`
  background-color: #fff; /* 깔끔한 화이트 배경 */
  border-top: 1px solid #f0f0f0; /* 아주 연한 구분선 */
  padding: 60px 0 80px;
  color: #4e5968;
  margin-top: auto;

  /* 🌟 태블릿(1024px) 이하에서는 아예 숨김 (모바일/아이패드 대응) */
  @media (max-width: 1024px) {
    display: none;
  }
`;

const FooterContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

// --- 좌측 섹션 ---
const LeftSection = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 320px;
`;

const Logo = styled.div`
  font-size: 22px;
  font-weight: 800;
  color: #191f28;
  letter-spacing: -0.5px;
  margin-bottom: 12px;
  font-family: "Toss Product Sans", sans-serif;

  .highlight {
    color: #3182f6; /* 토스 블루 */
  }
`;

const Description = styled.p`
  font-size: 14px;
  color: #8b95a1;
  line-height: 1.6;
  margin: 0 0 24px 0;
  font-weight: 500;
`;

const SocialLinks = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
`;

const IconLink = styled.a`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #f9fafb;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8b95a1;
  transition: all 0.2s;
  border: 1px solid #f0f0f0;

  &:hover {
    background-color: #f2f4f6;
    color: #333;
    transform: translateY(-2px);
  }
`;

const CopyRight = styled.p`
  font-size: 12px;
  color: #b0b8c1;
  font-weight: 400;
  font-family: "CustomFont", sans-serif;
`;

// --- 우측 섹션 ---
const RightSection = styled.div`
  display: flex;
  gap: 80px; /* 간격 넓게 */
`;

const LinkGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const LinkTitle = styled.h4`
  font-size: 14px;
  font-weight: 700;
  color: #333d4b;
  margin: 0;
`;

const FooterLink = styled(Link)`
  font-size: 14px;
  color: #8b95a1;
  text-decoration: none;
  transition: color 0.2s ease;
  font-weight: 500;

  &:hover {
    color: #3182f6; /* 호버 시 파란색 */
    text-decoration: underline;
  }
`;
