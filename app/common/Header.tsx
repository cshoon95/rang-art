"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useState, useEffect, useMemo } from "react";
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
  Star,
  Bookmark,
  CalendarDays,
  Users,
  Building,
  PieChart,
  GripVertical, // 드래그 핸들 아이콘
} from "lucide-react";
import { isHiddenHeaderPage, isHiddenHeaderTitlePage } from "@/utils/common";
import { clearAcademySession } from "../api/auth/actions";

// 👇 dnd-kit 임포트
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  TouchSensor,
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
  useReorderFavorites,
  useToggleFavorite,
} from "@/api/favorites/useFavoriteQuery";

// 메뉴 데이터
const MENU_STRUCTURE = [
  {
    title: "시간표",
    items: [
      {
        label: "수업 시간표",
        path: "/schedule",
        type: "link",
        icon: CalendarDays,
      },
      {
        label: "픽업 시간표",
        path: "/pickup",
        type: "link",
        icon: CalendarDays,
      },
      {
        label: "임시 시간표",
        path: "/temp-schedule",
        type: "link",
        icon: CalendarDays,
      },
    ],
  },
  {
    title: "관리",
    items: [
      { label: "회원 관리", path: "/customers", type: "link", icon: Users },
      { label: "출납 관리", path: "/payment", type: "link", icon: Users },
      { label: "직원 관리", path: "/employee", type: "link", icon: Users },
      { label: "지점 관리", path: "/branch", type: "link", icon: Building },
    ],
  },
  {
    title: "작업",
    items: [
      { label: "노트", path: "/memo", type: "link", icon: Users },
      { label: "일정", path: "/calendar", type: "link", icon: Users },
      { label: "등록부", path: "/register", type: "link", icon: Building },
      {
        label: "현금영수증 발행",
        path: "/cash-receipt",
        type: "link",
        icon: Building,
      },
    ],
  },
  // {
  //   title: "성과 관리",
  //   items: [
  //     { label: "투자 성과", path: "/report", type: "link", icon: PieChart },
  //     { label: "누적 수익", path: "/overall", type: "link", icon: PieChart },
  //     {
  //       label: "배당 상세",
  //       path: "/dividend-detail",
  //       type: "link",
  //       icon: DollarSign,
  //     },
  //   ],
  // },
];

// --- [NEW] 드래그 가능한 아이템 컴포넌트 ---
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
  } = useSortable({ id: item.dbId }); // DB ID를 key로 사용

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
      // 드래그 핸들만 리스너를 달면 핸들로만 이동 가능,
      // 여기선 전체 터치로 이동하고 싶다면 listeners를 여기에,
      // 클릭과 겹치지 않게 하려면 pressDelay 등을 줘야 함.
      // 여기서는 '꾹 눌러서 드래그' 설정을 센서에 넣었으므로 전체에 적용.
      {...listeners}
      onClick={onClick}
    >
      <FavIconWrapper>
        <Icon size={20} color="#3182f6" />
      </FavIconWrapper>
      <FavLabel>{item.label}</FavLabel>
    </FavoriteCard>
  );
}

export const Header = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // 🔥 데이터 & 액션
  // favoriteData: [{ id, path, order_index }, ...]
  const { data: favoriteData = [] } = useFavorites();
  const { mutate: toggleFavorite } = useToggleFavorite();
  const { mutate: reorderFavorites } = useReorderFavorites();

  // [NEW] 로컬 상태로 순서 관리 (드래그 중 즉각 반응을 위해)
  const [orderedFavorites, setOrderedFavorites] = useState<any[]>([]);

  // 1. DB 데이터와 메뉴 구조 매핑하여 로컬 상태 초기화
  useEffect(() => {
    if (!favoriteData) return;

    const allItems = MENU_STRUCTURE.flatMap((section) => section.items);

    // DB의 즐겨찾기 목록 순서대로 매핑
    const mapped = favoriteData
      .map((fav: any) => {
        const menuItem = allItems.find((m) => (m.path || m.id) === fav.path);
        if (!menuItem) return null;
        return {
          ...menuItem,
          dbId: fav.id, // 정렬용 Unique ID
          path: fav.path,
        };
      })
      .filter(Boolean);

    setOrderedFavorites(mapped);
  }, [favoriteData]);

  // 2. 현재 페이지가 즐겨찾기인지 확인 (헤더 별 아이콘용)
  const currentMenuItem = useMemo(() => {
    const allItems = MENU_STRUCTURE.flatMap((section) => section.items);
    return allItems.find((item) => item.path === pathname);
  }, [pathname]);

  const isCurrentPageFavorite = useMemo(() => {
    if (!currentMenuItem) return false;
    return favoriteData.some((f: any) => f.path === currentMenuItem.path);
  }, [currentMenuItem, favoriteData]);

  // 3. dnd-kit 센서 설정 (터치, 마우스 대응)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px 이상 움직여야 드래그 시작 (클릭과 구분)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setOrderedFavorites((items) => {
        const oldIndex = items.findIndex((i) => i.dbId === active.id);
        const newIndex = items.findIndex((i) => i.dbId === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);

        // 🔥 순서 변경 API 호출 (id와 새로운 index 전송)
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
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const isActive = (path: string) => {
    if (path === "/home") return pathname === "/home";
    return pathname.startsWith(path);
  };

  const handleMenuClick = (item: any) => {
    if (item.type === "modal") {
      setActiveModal(item.id);
    } else {
      router.push(item.path);
      setIsMenuOpen(false);
    }
  };

  const handleStarClick = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    toggleFavorite(path);
  };

  const handleToggleCurrentPage = () => {
    if (currentMenuItem) {
      toggleFavorite(currentMenuItem.path || currentMenuItem.id);
    }
  };

  const handleLogout = async () => {
    await clearAcademySession();
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <>
      {!isHiddenHeaderTitlePage(pathname) && (
        <HeaderWrapper>
          <HeaderContainer>
            <Logo href="/">
              MONEY <LogoHighlight>STAR</LogoHighlight>
            </Logo>
            {currentMenuItem && (
              <HeaderStarBtn onClick={handleToggleCurrentPage}>
                <Star
                  size={24}
                  fill={isCurrentPageFavorite ? "#FFD700" : "transparent"}
                  color={isCurrentPageFavorite ? "#FFD700" : "#b0b8c1"}
                  strokeWidth={isCurrentPageFavorite ? 0 : 2}
                />
              </HeaderStarBtn>
            )}
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

            {/* 🔥 [NEW] 즐겨찾기 섹션 (드래그 가능) */}
            {orderedFavorites.length > 0 && (
              <FavoriteSection>
                <SectionLabel>
                  <Bookmark size={14} fill="#FFD700" color="#FFD700" />
                  즐겨찾는 메뉴
                  <DragHint>꾹 눌러서 순서 변경</DragHint>
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
              {MENU_STRUCTURE.map((section, idx) => (
                <div key={idx}>
                  <MenuSectionTitle>{section.title}</MenuSectionTitle>
                  {section.items.map((item: any, itemIdx) => {
                    const isFav = favoriteData.some(
                      (f: any) => f.path === (item.path || item.id)
                    );
                    return (
                      <MenuRow
                        key={itemIdx}
                        onClick={() => handleMenuClick(item)}
                        $isModal={item.type === "modal"}
                      >
                        <MenuText>{item.label}</MenuText>
                        <RightActions>
                          {/* <StarBtn
                            onClick={(e) =>
                              handleStarClick(e, item.path || item.id)
                            }
                          >
                            <Star
                              size={20}
                              fill={isFav ? "#FFD700" : "transparent"}
                              color={isFav ? "#FFD700" : "#d1d5db"}
                            />
                          </StarBtn> */}
                          <ChevronRight size={18} color="#ccc" />
                        </RightActions>
                      </MenuRow>
                    );
                  })}
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

      {/* 모달 관련 코드들 (유지) */}
      {activeModal && (
        <ModalOverlay style={{ zIndex: 11000 }}>
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
              <p>준비 중인 기능입니다.</p>
            </ModalBody>
            <ModalFooter>
              <ConfirmButton onClick={() => setActiveModal(null)}>
                확인
              </ConfirmButton>
            </ModalFooter>
          </ContentModal>
        </ModalOverlay>
      )}

      {isLogoutModalOpen && (
        <ModalOverlay style={{ zIndex: 11000 }}>
          <ConfirmModalContent>
            <ConfirmTitle>로그아웃</ConfirmTitle>
            <ConfirmDesc>정말 로그아웃 하시겠습니까?</ConfirmDesc>
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

// --- Styles ---

const DragHint = styled.span`
  font-size: 11px;
  color: #94a3b8;
  font-weight: 400;
  margin-left: auto;
`;

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
  justify-content: space-between;
  padding: 0 16px;
`;
const HeaderStarBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.1s;
  &:active {
    transform: scale(1.2);
  }
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
const FavoriteSection = styled.div`
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px dashed #e5e8eb;
`;
const SectionLabel = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: #333;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
`;
const FavoriteScrollArea = styled.div`
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 4px;
  padding-right: 4px;
  touch-action: pan-x;
  &::-webkit-scrollbar {
    display: none;
  }
`;
const FavoriteCard = styled.div`
  min-width: 80px;
  height: 80px;
  background-color: #f9fafb;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: box-shadow 0.2s, background-color 0.2s;
  touch-action: none; /* 드래그를 위해 터치 액션 제한 */
  &:hover {
    background-color: #e8f3ff;
    border-color: #dbeafe;
  }
  &:active {
    transform: scale(0.96);
  }
`;
const FavIconWrapper = styled.div`
  width: 36px;
  height: 36px;
  background-color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`;
const FavLabel = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: #4e5968;
  text-align: center;
  letter-spacing: -0.3px;
`;
const RightActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;
const StarBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
  &:active {
    transform: scale(1.2);
  }
`;

// ... 기존 스타일 (BottomNavWrapper 등) 모두 유지
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
  transform: ${(props) =>
    props.$isOpen ? "translateX(0)" : "translateX(100%)"};
  transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  display: flex;
  flex-direction: column;
  z-index: 10000;
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
