"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import styled, { keyframes, css } from "styled-components";
import {
  Home,
  TrendingUp,
  CreditCard,
  DollarSign,
  Menu,
  X,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { isHiddenHeaderPage, isHiddenHeaderTitlePage } from "@/utils/common";

// 🌟 1. 메뉴 데이터 정의 (여기서 링크/모달 여부를 설정하세요!)
const MENU_STRUCTURE = [
  {
    title: "시간표",
    items: [
      { label: "수업 시간표", path: "/schedule", type: "link" },
      { label: "픽업 시간표", path: "/pickup", type: "link" },
      { label: "임시 시간표", path: "/temp-schedule", type: "link" },
    ],
  },
  {
    title: "월간 관리",
    items: [
      { label: "급여 내역", path: "/salary", type: "link" },
      { label: "투자 내역", path: "/Investment-amount", type: "link" },
      { label: "지출 내역", path: "/expenditure", type: "link" },
      // 👇 모달로 띄울 메뉴 예시
      { label: "일정 관리", id: "schedule", type: "modal" },
      { label: "고정 지출", id: "fixed", type: "modal" },
    ],
  },
  {
    title: "성과 관리",
    items: [
      { label: "투자 성과", path: "/report", type: "link" },
      { label: "누적 수익", path: "/overall", type: "link" },
      { label: "배당 상세", path: "/dividend-detail", type: "link" },
    ],
  },
];

export const Header = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // 🌟 2. 활성화된 모달 상태 (null이면 닫힘, 문자열이면 해당 모달 열림)
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const { data: session } = useSession();

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = ""; // 빈 문자열로 초기화 (auto 대신)
    }

    // 컴포넌트 언마운트 시 스크롤 복구 (안전장치)
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  // 페이지 이동 시 드로어 닫기
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const isActive = (path: string) => {
    if (path === "/home") return pathname === "/home";
    return pathname.startsWith(path);
  };

  // 🌟 3. 메뉴 클릭 핸들러
  const handleMenuClick = (item: any) => {
    if (item.type === "modal") {
      setActiveModal(item.id); // 모달 열기 (드로어는 유지)
      // setIsMenuOpen(false); // 원하면 드로어를 닫을 수도 있음
    } else {
      router.push(item.path); // 페이지 이동
      setIsMenuOpen(false); // 드로어 닫기
    }
  };

  return (
    <>
      {!isHiddenHeaderTitlePage(pathname) && (
        <HeaderWrapper>
          <HeaderContainer>
            <Logo href="/">
              MONEY <LogoHighlight>STAR</LogoHighlight>
            </Logo>
          </HeaderContainer>
        </HeaderWrapper>
      )}

      <BottomNavWrapper>
        <BottomLink href="/" $active={isActive("/home")}>
          <StyledIcon as={Home} $active={isActive("/home")} />
          <Label $active={isActive("/home")}>홈</Label>
        </BottomLink>
        <BottomLink href="/investment" $active={isActive("/investment")}>
          <StyledIcon as={TrendingUp} $active={isActive("/investment")} />
          <Label $active={isActive("/investment")}>주식</Label>
        </BottomLink>
        <BottomLink href="/expenditure" $active={isActive("/expenditure")}>
          <StyledIcon as={CreditCard} $active={isActive("/expenditure")} />
          <Label $active={isActive("/expenditure")}>가계</Label>
        </BottomLink>
        <BottomLink href="/salary" $active={isActive("/salary")}>
          <StyledIcon as={DollarSign} $active={isActive("/salary")} />
          <Label $active={isActive("/salary")}>급여</Label>
        </BottomLink>
        <BottomButton onClick={() => setIsMenuOpen(true)} $active={isMenuOpen}>
          <StyledIcon as={Menu} $active={isMenuOpen} />
          <Label $active={isMenuOpen}>전체</Label>
        </BottomButton>
      </BottomNavWrapper>

      <DrawerOverlay $isOpen={isMenuOpen} onClick={() => setIsMenuOpen(false)}>
        <DrawerContainer
          $isOpen={isMenuOpen}
          onClick={(e) => e.stopPropagation()}
        >
          <DrawerHeader>
            <DrawerTitle>전체 메뉴</DrawerTitle>
            <CloseBtn onClick={() => setIsMenuOpen(false)}>
              <X size={24} color="#333" />
            </CloseBtn>
          </DrawerHeader>

          <DrawerContent>
            <SimpleProfile>
              <ProfileIcon>
                {session?.user?.email?.[0]?.toUpperCase() || "U"}
              </ProfileIcon>
              <ProfileText>
                <Email>{session?.user?.email}</Email>
                <SubText>오늘도 부자 되세요! 💰</SubText>
              </ProfileText>
            </SimpleProfile>

            {/* 🌟 4. 메뉴 리스트 렌더링 (데이터 기반) */}
            <MenuGrid>
              {MENU_STRUCTURE.map((section, idx) => (
                <div key={idx}>
                  <MenuSectionTitle>{section.title}</MenuSectionTitle>
                  {section.items.map((item: any, itemIdx) => (
                    <MenuRow
                      key={itemIdx}
                      onClick={() => handleMenuClick(item)} // 클릭 핸들러 연결
                      $isModal={item.type === "modal"}
                    >
                      <MenuText>{item.label}</MenuText>
                      <ChevronRight size={18} color="#ccc" />
                    </MenuRow>
                  ))}
                </div>
              ))}
            </MenuGrid>

            <FooterActions>
              <LogoutButton onClick={() => setIsLogoutModalOpen(true)}>
                <LogOut size={18} /> 로그아웃
              </LogoutButton>
            </FooterActions>
          </DrawerContent>
        </DrawerContainer>
      </DrawerOverlay>

      {/* 🌟 5. 메뉴 클릭 시 뜨는 공통 모달 */}
      {activeModal && (
        <ModalOverlay style={{ zIndex: 2500 }}>
          {" "}
          {/* 드로어보다 위에 뜨도록 */}
          <ContentModal>
            <ModalHeader>
              <ModalTitle>
                {
                  MENU_STRUCTURE.flatMap((s) => s.items).find(
                    (i) => i.id === activeModal
                  )?.label
                }
              </ModalTitle>
              <CloseBtn onClick={() => setActiveModal(null)}>
                <X size={24} />
              </CloseBtn>
            </ModalHeader>

            <ModalBody>
              {/* 여기에 모달 내용을 조건부로 넣으시면 됩니다 */}
              {activeModal === "schedule" && (
                <p>📅 일정 관리 기능이 준비 중입니다.</p>
              )}
              {activeModal === "fixed" && (
                <p>💸 고정 지출 내역을 확인하는 화면입니다.</p>
              )}
              {/* 기본 내용 */}
              {!["schedule", "fixed"].includes(activeModal) && (
                <p>준비 중인 기능입니다.</p>
              )}
            </ModalBody>

            <ModalFooter>
              <ConfirmButton onClick={() => setActiveModal(null)}>
                확인
              </ConfirmButton>
            </ModalFooter>
          </ContentModal>
        </ModalOverlay>
      )}

      {/* 로그아웃 모달 */}
      {isLogoutModalOpen && (
        <ModalOverlay>
          <ConfirmModalContent>
            <ConfirmTitle>로그아웃</ConfirmTitle>
            <ConfirmDesc>정말 로그아웃 하시겠습니까?</ConfirmDesc>
            <ModalActions>
              <CancelButton onClick={() => setIsLogoutModalOpen(false)}>
                취소
              </CancelButton>
              <ConfirmButton onClick={() => signOut({ callbackUrl: "/login" })}>
                확인
              </ConfirmButton>
            </ModalActions>
          </ConfirmModalContent>
        </ModalOverlay>
      )}
    </>
  );
};

// --- Styles ---

const HeaderWrapper = styled.header`
  position: sticky;
  top: 0;
  z-index: 900;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #f0f0f0;
  height: 56px;
`;

const HeaderContainer = styled.div`
  max-width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
`;

const Logo = styled(Link)`
  font-size: 20px;
  font-weight: 900;
  color: #1a1f27;
  text-decoration: none;
  letter-spacing: -0.5px;
  font-family: "Toss Product Sans", sans-serif;
`;

const LogoHighlight = styled.span`
  color: #3182f6;
`;

const BottomNavWrapper = styled.nav`
  display: flex;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  border-top: 1px solid #f2f4f6;
  z-index: 1000;
  padding-bottom: env(safe-area-inset-bottom);
  height: 60px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.02);

  @media (display-mode: standalone) {
    height: 80px;
    padding-bottom: 20px;
  }
`;

const BottomLink = styled(Link)<{ $active?: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: ${(props) => (props.$active ? "#3182f6" : "#b0b8c1")};
  transition: color 0.2s;
  -webkit-tap-highlight-color: transparent;
  padding-top: 6px;
`;

const BottomButton = styled.button<{ $active?: boolean }>`
  flex: 1;
  background: none;
  border: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: ${(props) => (props.$active ? "#3182f6" : "#b0b8c1")};
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  padding-top: 6px;
`;

const StyledIcon = styled.svg<{ $active?: boolean }>`
  width: 24px;
  height: 24px;
  margin-bottom: 4px;
  transition: transform 0.1s;

  ${(props) =>
    props.$active &&
    css`
      transform: scale(1.1);
      stroke-width: 2.5px;
    `}
`;

const Label = styled.span<{ $active?: boolean }>`
  font-size: 10px;
  font-weight: ${(props) => (props.$active ? "700" : "500")};
  letter-spacing: -0.2px;
`;

const DrawerHeader = styled.div`
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background-color: #fff;
`;

const DrawerTitle = styled.h2`
  font-size: 17px;
  font-weight: 700;
  color: #191f28;
`;

const CloseBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
`;

const DrawerContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0 20px 40px 20px;
`;

const SimpleProfile = styled.div`
  background-color: #f9fafb;
  border-radius: 16px;
  padding: 20px;
  margin-top: 10px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ProfileIcon = styled.div`
  width: 40px;
  height: 40px;
  background-color: #3182f6;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 18px;
`;

const ProfileText = styled.div`
  display: flex;
  flex-direction: column;
`;

const Email = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #333;
`;

const SubText = styled.div`
  font-size: 12px;
  color: #8b95a1;
  margin-top: 2px;
`;

const MenuGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const MenuSectionTitle = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #8b95a1;
  margin-top: 20px;
  margin-bottom: 6px;
  padding-left: 8px;
`;

// Link 대신 div를 사용하여 클릭 핸들러 적용
const MenuRow = styled.div<{ $isModal?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  &:active {
    background-color: #f2f4f6;
  }
`;

const MenuText = styled.span`
  font-size: 15px;
  font-weight: 500;
  color: #333d4b;
`;

const FooterActions = styled.div`
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #f2f4f6;
`;

const LogoutButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  background-color: #f9fafb;
  border: none;
  border-radius: 12px;
  color: #ef4444;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
`;

// --- 모달 스타일 ---
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: fadein 0.2s ease-out;

  @keyframes fadein {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

// 내용 모달 (조금 더 큼)
const ContentModal = styled.div`
  background: white;
  width: 100%;
  max-width: 360px;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  animation: slideup 0.3s cubic-bezier(0.16, 1, 0.3, 1);

  @keyframes slideup {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
`;

const ModalTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  margin: 0;
  color: #191f28;
`;

const ModalBody = styled.div`
  padding: 24px;
  min-height: 100px;
  color: #4e5968;
  font-size: 15px;
  line-height: 1.6;
`;

const ModalFooter = styled.div`
  padding: 16px 20px;
`;

// 확인 모달 (작음 - 로그아웃용)
const ConfirmModalContent = styled.div`
  background: white;
  width: 100%;
  max-width: 300px;
  border-radius: 20px;
  padding: 24px;
  text-align: center;
`;

const ConfirmTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 8px;
  color: #191f28;
`;
const ConfirmDesc = styled.p`
  font-size: 14px;
  color: #6b7684;
  margin-bottom: 24px;
`;
const ModalActions = styled.div`
  display: flex;
  gap: 10px;
`;
const ModalBtn = styled.button`
  flex: 1;
  height: 48px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  border: none;
  cursor: pointer;
`;
const CancelButton = styled(ModalBtn)`
  background-color: #f2f4f6;
  color: #4e5968;
`;
const ConfirmButton = styled(ModalBtn)`
  background-color: #3182f6;
  color: white;
`;
const DrawerOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);

  /* 🔥 z-index를 아주 높게 설정 (헤더, 바텀네비보다 위에 오도록) */
  z-index: 9999;

  /* 열림/닫힘 상태에 따른 가시성 제어 */
  opacity: ${(props) => (props.$isOpen ? 1 : 0)};
  visibility: ${(props) => (props.$isOpen ? "visible" : "hidden")};
  transition: opacity 0.3s ease-in-out, visibility 0.3s;

  /* 닫혀있을 때 클릭 이벤트 방지 */
  pointer-events: ${(props) => (props.$isOpen ? "auto" : "none")};
`;

const DrawerContainer = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 85%;
  max-width: 340px;
  background-color: #fff;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.1);

  /* 🔥 transform으로 슬라이드 효과 */
  transform: ${(props) =>
    props.$isOpen ? "translateX(0)" : "translateX(100%)"};
  transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);

  display: flex;
  flex-direction: column;
  z-index: 10000; /* 오버레이보다 높게 */
`;
