"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useState, useEffect, useMemo } from "react";
import { signOut, useSession } from "next-auth/react";
import styled, { css } from "styled-components";
import {
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  LogOut,
  Star,
  Bookmark,
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
  Home,
  ClipboardCheck,
  ChartPie,
  BookOpen,
} from "lucide-react";
import { isHiddenHeaderTitlePage } from "@/utils/common";
import { clearAcademySession } from "../api/auth/actions";

// 👇 dnd-kit
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  useFavorites,
  useToggleFavorite,
  useReorderFavorites,
} from "../_querys";
import { HIGH_LEVELS } from "@/utils/list";

// ----------------------------------------------------------------------
// ✅ 1. 메뉴 데이터 구조
// ----------------------------------------------------------------------
type UserLevel = "원장" | "부원장" | "선생님" | "관리자" | number;

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
        allowedLevels: HIGH_LEVELS,
      },
      {
        label: "지점 관리",
        path: "/branch",
        type: "link",
        icon: Building2,
        color: "#f0f9ff",
        allowedLevels: HIGH_LEVELS,
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
        allowedLevels: HIGH_LEVELS,
      },
      {
        label: "등록부",
        path: "/register",
        type: "link",
        icon: FileSignature,
        color: "#f0fdf4",
        allowedLevels: HIGH_LEVELS,
      },
      {
        label: "현금영수증",
        path: "/cash-receipt",
        type: "link",
        icon: Receipt,
        color: "#f5f3ff",
        allowedLevels: HIGH_LEVELS,
      },
      {
        label: "통계",
        path: "/reports",
        type: "link",
        icon: ChartPie,
        color: "#f5f3ff",
        allowedLevels: HIGH_LEVELS,
      },
    ],
  },
];

// 관리자, 원장님

// ----------------------------------------------------------------------
// ✅ 2. 드래그 가능한 아이템 컴포넌트
// ----------------------------------------------------------------------
function SortableFavoriteItem({
  item,
  onClick,
}: {
  item: any;
  onClick: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.dbId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : "auto",
  };

  const Icon = item.icon || Star;

  return (
    <FavoriteCard
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
    >
      <FavIconWrapper $bgColor={item.color}>
        <Icon size={20} color="#333" />
      </FavIconWrapper>
      <FavLabel>{item.label}</FavLabel>
    </FavoriteCard>
  );
}

// ----------------------------------------------------------------------
// ✅ 3. Header Main Component
// ----------------------------------------------------------------------
export const Header = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const userLevel = Number(session?.user?.level) || 3;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [openSections, setOpenSections] = useState<number[]>([0, 1, 2, 3]);

  // --- Data & Mutation ---
  const { data: favoriteData = [] } = useFavorites();
  const { mutate: reorderFavorites } = useReorderFavorites();
  const [orderedFavorites, setOrderedFavorites] = useState<any[]>([]);

  useEffect(() => {
    if (!favoriteData) return;
    const allItems = MENU_STRUCTURE.flatMap((section) => section.items);

    const mapped = favoriteData
      .map((fav: any) => {
        const menuItem = allItems.find((m) => (m.path || m.id) === fav.path);
        if (
          !menuItem ||
          (menuItem.allowedLevels &&
            !menuItem.allowedLevels.includes(userLevel))
        ) {
          return null;
        }
        return { ...menuItem, dbId: fav.id, path: fav.path };
      })
      .filter(Boolean);

    setOrderedFavorites(mapped);
  }, [favoriteData, userLevel]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setOrderedFavorites((items) => {
        const oldIndex = items.findIndex((i) => i.dbId === active.id);
        const newIndex = items.findIndex((i) => i.dbId === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        const reorderPayload = newItems.map((item, index) => ({
          id: item.dbId,
          order_index: index,
        }));
        reorderFavorites(reorderPayload);
        return newItems;
      });
    }
  };

  useEffect(() => {
    if (isMenuOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const handleMenuClick = (item: any) => {
    router.push(item.path);
    setIsMenuOpen(false);
  };

  const handleLogout = async () => {
    await clearAcademySession();
    await signOut({ callbackUrl: "/login" });
  };

  const toggleSection = (idx: number) => {
    setOpenSections((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const isActive = (path: string) =>
    path === "/home" ? pathname === "/home" : pathname.startsWith(path);

  // if (!isHiddenHeaderTitlePage(pathname)) return null;

  return (
    <>
      {/* 🖥️ PC Header (마우스가 있고 화면이 클 때만 보임) */}
      <PcHeaderWrapper>
        <PcHeaderContainer>
          <PcLeft>
            <Logo
              href="/home"
              style={{ fontSize: "24px", marginRight: "40px" }}
            >
              RANG <LogoHighlight>ART</LogoHighlight>
            </Logo>
            <PcNavList>
              <PcNavLink href="/home" $active={isActive("/home")}>
                홈
              </PcNavLink>
              <PcNavLink href="/attendance" $active={isActive("/attendance")}>
                출석부
              </PcNavLink>
              <PcNavLink href="/schedule" $active={isActive("/schedule")}>
                수업 시간표
              </PcNavLink>
              <PcNavLink href="/pickup" $active={isActive("/pickup")}>
                픽업 시간표
              </PcNavLink>
              {HIGH_LEVELS.includes(userLevel) && (
                <PcNavLink href="/payment" $active={isActive("/payment")}>
                  출납부
                </PcNavLink>
              )}
              <PcNavLink href="/memo" $active={isActive("/memo")}>
                노트
              </PcNavLink>
              <PcNavLink href="/calendar" $active={isActive("/calendar")}>
                일정
              </PcNavLink>
              <PcNavLink href="/planning" $active={isActive("/planning")}>
                계획안
              </PcNavLink>
              <PcNavLink href="/customers" $active={isActive("/customers")}>
                회원 관리
              </PcNavLink>
            </PcNavList>
          </PcLeft>

          <PcRight>
            <PcProfileBtn onClick={() => setIsMenuOpen(true)}>
              <PcAvatar>{session?.user?.name?.[0] || "U"}</PcAvatar>
              <PcName>{session?.user?.name} 님</PcName>
              <Menu size={20} color="#4b5563" style={{ marginLeft: 8 }} />
            </PcProfileBtn>
          </PcRight>
        </PcHeaderContainer>
      </PcHeaderWrapper>

      {/* 📱 Mobile & Tablet Bottom Nav (PC 조건이 아닐 때만 보임) */}
      <BottomNavWrapper>
        <BottomLink href="/home" $active={isActive("/home")}>
          <StyledIcon as={Home} $active={isActive("/home")} />
          <Label $active={isActive("/home")}>홈</Label>
        </BottomLink>

        <BottomLink href="/attendance" $active={isActive("/attendance")}>
          <StyledIcon as={ClipboardCheck} $active={isActive("/attendance")} />
          <Label $active={isActive("/attendance")}>출석부</Label>
        </BottomLink>

        {HIGH_LEVELS.includes(userLevel) ? (
          <BottomLink href="/payment" $active={isActive("/payment")}>
            <StyledIcon as={CreditCard} $active={isActive("/payment")} />
            <Label $active={isActive("/payment")}>출납부</Label>
          </BottomLink>
        ) : (
          <BottomLink href="/schedule" $active={isActive("/schedule")}>
            <StyledIcon as={CalendarClock} $active={isActive("/schedule")} />
            <Label $active={isActive("/schedule")}>시간표</Label>
          </BottomLink>
        )}

        <BottomButton onClick={() => setIsMenuOpen(true)} $active={isMenuOpen}>
          <StyledIcon as={Menu} $active={isMenuOpen} />
          <Label $active={isMenuOpen}>전체</Label>
        </BottomButton>
      </BottomNavWrapper>

      {/* 🗄️ Common Drawer */}
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
            <ProfileCard>
              <ProfileInfo>
                <ProfileAvatar>
                  {session?.user?.name?.[0] || "User"}
                </ProfileAvatar>
                <ProfileMeta>
                  <UserName>
                    {session?.user?.name}
                    <LevelBadge>{session?.user?.levelName}</LevelBadge>
                  </UserName>
                  <AcademyName>{session?.user?.academyName}</AcademyName>
                </ProfileMeta>
              </ProfileInfo>
              <LogoutMiniBtn onClick={() => setIsLogoutModalOpen(true)}>
                로그아웃
              </LogoutMiniBtn>
            </ProfileCard>

            {orderedFavorites.length > 0 && (
              <FavoriteSection>
                <SectionLabel>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <Bookmark size={14} fill="#FFD700" color="#FFD700" />
                    즐겨찾기
                  </div>
                  <DragHint>꾹! 눌러서 순서 변경 가능</DragHint>
                </SectionLabel>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={orderedFavorites.map((f) => f.dbId)}
                    strategy={horizontalListSortingStrategy}
                  >
                    <FavoriteScrollArea>
                      {orderedFavorites.map((item) => (
                        <SortableFavoriteItem
                          key={item.dbId}
                          item={item}
                          onClick={() => handleMenuClick(item)}
                        />
                      ))}
                    </FavoriteScrollArea>
                  </SortableContext>
                </DndContext>
              </FavoriteSection>
            )}

            <MenuGrid>
              {MENU_STRUCTURE.map((section, idx) => {
                const visibleItems = section.items.filter((item) => {
                  if (!item.allowedLevels) return true;
                  return item.allowedLevels.includes(userLevel);
                });

                if (visibleItems.length === 0) return null;
                const isOpen = openSections.includes(idx);

                return (
                  <AccordionSection key={idx}>
                    <AccordionHeader onClick={() => toggleSection(idx)}>
                      <HeaderLeft>
                        <section.icon size={18} color="#4b5563" />
                        <SectionTitleText>{section.title}</SectionTitleText>
                      </HeaderLeft>
                      <ChevronDown
                        size={16}
                        color="#9ca3af"
                        style={{
                          transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                          transition: "transform 0.2s",
                        }}
                      />
                    </AccordionHeader>

                    <AccordionContent $isOpen={isOpen}>
                      {visibleItems.map((item, itemIdx) => (
                        <MenuRow
                          key={itemIdx}
                          onClick={() => handleMenuClick(item)}
                        >
                          <RowLeft>
                            <IconBox $bgColor={item.color}>
                              <item.icon size={18} color="#333" />
                            </IconBox>
                            <MenuText>{item.label}</MenuText>
                          </RowLeft>
                          <ChevronRight size={16} color="#e5e7eb" />
                        </MenuRow>
                      ))}
                    </AccordionContent>
                  </AccordionSection>
                );
              })}
            </MenuGrid>

            <VersionInfo>
              RangArt Service v1.0.0
              <br />
              문의: help@rangart.com
            </VersionInfo>
          </DrawerContent>
        </DrawerContainer>
      </DrawerOverlay>

      {/* Logout Modal */}
      {isLogoutModalOpen && (
        <ModalOverlay style={{ zIndex: 11000 }}>
          <ConfirmModalContent>
            <ConfirmTitle>로그아웃</ConfirmTitle>
            <ConfirmDesc>정말 로그아웃 하시겠어요?</ConfirmDesc>
            <ModalActions>
              <CancelButton onClick={() => setIsLogoutModalOpen(false)}>
                취소
              </CancelButton>
              <ConfirmButton onClick={handleLogout}>확인</ConfirmButton>
            </ModalActions>
          </ConfirmModalContent>
        </ModalOverlay>
      )}
    </>
  );
};

// ----------------------------------------------------------------------
// ✅ 4. Styles
// ----------------------------------------------------------------------

const Logo = styled(Link)`
  font-size: 20px;
  font-weight: 900;
  color: #1a1f27;
  text-decoration: none;
`;
const LogoHighlight = styled.span`
  color: #3182f6;
`;

// ==========================================
// 🖥️ PC Header Styles (New Addition)
// ==========================================
const PcHeaderWrapper = styled.header`
  display: none;

  @media (min-width: 1025px) and (hover: hover) {
    display: block;
    position: sticky;
    top: 0;
    z-index: 1000;
    background-color: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid #e5e7eb;
    height: 64px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }
`;

const PcHeaderContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;

  /* ✅ 핵심: 레이아웃과 동일한 규격 적용 */
  max-width: 1400px; /* 최대 너비 제한 */
  margin: 0 auto; /* 중앙 정렬 */
  padding: 0 40px; /* 좌우 여백 (레이아웃과 동일하게 맞춤) */
`;
const PcLeft = styled.div`
  display: flex;
  align-items: center;
  justify-content: left;
`;
const PcNavList = styled.nav`
  display: flex;
  gap: 16px;
  margin-left: 20px;
`;
const PcNavLink = styled(Link)<{ $active?: boolean }>`
  font-size: 16px;
  font-weight: ${(props) => (props.$active ? "700" : "500")};
  color: ${(props) => (props.$active ? "#3182f6" : "#4b5563")};
  padding: 8px 16px;
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.2s;
  background-color: ${(props) => (props.$active ? "#eff6ff" : "transparent")};

  &:hover {
    background-color: ${(props) => (props.$active ? "#eff6ff" : "#f9fafb")};
    color: ${(props) => (props.$active ? "#3182f6" : "#111827")};
  }
`;
const PcRight = styled.div`
  display: flex;
  align-items: center;
  justify-content: end;
`;
const PcProfileBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
  border: 1px solid #e5e7eb;
  padding: 6px 16px 6px 8px;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  &:hover {
    border-color: #d1d5db;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transform: translateY(-1px);
  }
`;
const PcAvatar = styled.div`
  width: 34px;
  height: 34px;
  background-color: #3182f6;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
`;
const PcName = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #374151;
`;

// ==========================================
// 📱 Mobile/Tablet Bottom Nav (Existing)
// ==========================================
// Header.tsx 하단 스타일 정의 부분
const BottomNavWrapper = styled.nav`
  /* 1. 레이아웃 강제 노출 & 기본 설정 */
  display: flex !important;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  border-top: 1px solid #f2f4f6;
  z-index: 100;
  box-shadow: 0 -4px 20px rgba(122, 78, 78, 0.02);
  box-sizing: border-box;

  /* 2. ✅ 기본 모바일 브라우저 환경 (사파리, 크롬 앱 내) */
  /* 높이 70px 기준 */
  height: calc(70px + env(safe-area-inset-bottom));
  padding-bottom: env(safe-area-inset-bottom);

  /* 3. ✅ PWA (홈 화면에 추가 후 실행) 환경 */
  /* 높이 90px 기준 (더 넉넉하게) */
  @media (display-mode: standalone) {
    height: calc(90px + env(safe-area-inset-bottom));
  }

  /* 4. PC 화면 숨김 처리 */
  @media (min-width: 1025px) and (hover: hover) {
    display: none !important;
  }
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

  /* ✅ 기본 모바일 브라우저: 패딩 없음 (중앙 정렬) */
  padding-bottom: 0;

  /* ✅ PWA 환경: 하단을 살짝 띄워줌 */
  @media (display-mode: standalone) {
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

  /* ✅ 기본 모바일 브라우저: 패딩 없음 */
  padding-bottom: 0;

  /* ✅ PWA 환경: 하단 띄움 */
  @media (display-mode: standalone) {
    padding-bottom: 20px;
  }
`;

const StyledIcon = styled.svg<{ $active?: boolean }>`
  width: 24px;
  height: 24px;
  margin-bottom: 4px;
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
`;

// Drawer
const DrawerOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 9999;
  opacity: ${(props) => (props.$isOpen ? 1 : 0)};
  visibility: ${(props) => (props.$isOpen ? "visible" : "hidden")};
  transition: opacity 0.3s ease-in-out, visibility 0.3s;
`;
const DrawerContainer = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 85%;
  max-width: 320px;
  background-color: #fff;
  transform: ${(props) =>
    props.$isOpen ? "translateX(0)" : "translateX(100%)"};
  transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  display: flex;
  flex-direction: column;
  z-index: 10000;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.1);
`;
const DrawerHeader = styled.div`
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  border-bottom: 1px solid #f2f4f6;
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
  padding: 20px;
  background-color: #fff;
`;

// Profile
const ProfileCard = styled.div`
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 4px 12px rgba(49, 130, 246, 0.08);
  border: 1px solid #bae6fd;
`;
const ProfileInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;
const ProfileAvatar = styled.div`
  width: 48px;
  height: 48px;
  background-color: #3182f6;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 20px;
  box-shadow: 0 2px 8px rgba(49, 130, 246, 0.3);
`;
const ProfileMeta = styled.div`
  display: flex;
  flex-direction: column;
`;
const UserName = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 6px;
`;
const LevelBadge = styled.span`
  font-size: 10px;
  background-color: #2563eb;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
  text-transform: uppercase;
`;
const AcademyName = styled.div`
  font-size: 13px;
  color: #64748b;
  margin-top: 2px;
  font-weight: 500;
`;
const LogoutMiniBtn = styled.button`
  align-self: flex-end;
  background-color: white;
  border: 1px solid #e2e8f0;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.1s;
  &:active {
    transform: scale(0.96);
  }
`;

// Favorites
const FavoriteSection = styled.div`
  margin-bottom: 12px;
  padding-bottom: 20px;
  border-bottom: 1px dashed #e5e8eb;
`;
const SectionLabel = styled.div`
  font-size: 12px;
  font-weight: 700;
  color: #94a3b8;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;
const DragHint = styled.span`
  font-size: 10px;
  color: #cbd5e1;
  font-weight: 400;
`;
const FavoriteScrollArea = styled.div`
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 4px;
  &::-webkit-scrollbar {
    display: none;
  }
`;
const FavoriteCard = styled.div`
  min-width: 72px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  touch-action: none;
`;
const FavIconWrapper = styled.div<{ $bgColor: string }>`
  width: 44px;
  height: 44px;
  background-color: ${(props) => props.$bgColor || "#f3f4f6"};
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: transform 0.1s;
  ${FavoriteCard}:active & {
    transform: scale(0.92);
  }
`;
const FavLabel = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: #4b5563;
  text-align: center;
  white-space: nowrap;
`;

// Menu Accordion
const MenuGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;
const AccordionSection = styled.div`
  display: flex;
  flex-direction: column;
`;
const AccordionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 4px;
  cursor: pointer;
  border-bottom: 1px solid transparent;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f9fafb;
    border-radius: 8px;
  }
`;
const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;
const SectionTitleText = styled.span`
  font-size: 14px;
  font-weight: 700;
  color: #374151;
`;
const AccordionContent = styled.div<{ $isOpen: boolean }>`
  overflow: hidden;
  max-height: ${(props) => (props.$isOpen ? "500px" : "0")};
  opacity: ${(props) => (props.$isOpen ? 1 : 0)};
  transition: max-height 0.3s ease-in-out, opacity 0.3s ease-in-out;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-left: 8px; /* 2뎁스 들여쓰기 */
  margin-top: ${(props) => (props.$isOpen ? "4px" : "0")};
`;
const MenuRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 8px;
  cursor: pointer;
  border-radius: 10px;
  &:active {
    background-color: #f3f4f6;
  }
`;
const RowLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;
const IconBox = styled.div<{ $bgColor: string }>`
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background-color: ${(props) => props.$bgColor || "#f3f4f6"};
  display: flex;
  align-items: center;
  justify-content: center;
`;
const MenuText = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: #4b5563;
`;

// Footer Info
const VersionInfo = styled.div`
  margin-top: 40px;
  text-align: center;
  font-size: 11px;
  color: #cbd5e1;
  line-height: 1.5;
`;

// Modals
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  z-index: 11000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;
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
