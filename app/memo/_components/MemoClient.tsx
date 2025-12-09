"use client";

import React, { useState, useMemo, useEffect } from "react";
import styled from "styled-components";
import {
  Search as SearchIcon,
  Plus as AddIcon,
  Pin,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useModalStore } from "@/store/modalStore";
import ModalMemoManager from "@/components/modals/ModalMemoManager";
import PageTitleWithStar from "@/components/PageTitleWithStar"; // 별 버튼이 포함된 타이틀 컴포넌트

interface Props {
  initialData: any[];
  academyCode: string;
}

// 날짜 포맷 (연도 포함)
const formatDate = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
};

// 섹션 라벨
const getSectionLabel = (type: string) => {
  switch (type) {
    case "fix":
      return "📌 고정 메모";
    case "today":
      return "🔥 오늘 작성";
    case "week":
      return "📅 이번 주";
    case "month":
      return "🗂️ 이번 달";
    default:
      return "📦 오래된 메모";
  }
};

export default function MemoClient({ initialData, academyCode }: Props) {
  const [searchText, setSearchText] = useState("");

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { openModal } = useModalStore();

  const handleAdd = () => {
    openModal({
      title: "메모 작성",
      content: <ModalMemoManager mode="add" academyCode={academyCode} />,
      type: "SIMPLE",
    });
  };

  const handleDetail = (memo: any) => {
    openModal({
      title: "메모 상세",
      content: (
        <ModalMemoManager
          mode="edit"
          academyCode={academyCode}
          initialData={memo}
        />
      ),
      type: "SIMPLE",
    });
  };

  // 검색 시 페이지 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [searchText]);

  // 1. 데이터 필터링 및 정렬
  const sortedFilteredData = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ).getTime();
    const weekStart = todayStart - 7 * 24 * 60 * 60 * 1000;
    const monthStart = todayStart - 30 * 24 * 60 * 60 * 1000;

    // 검색 필터
    const filtered = initialData.filter((item) => {
      const title = item.title || item.TITLE || "";
      const content = item.content || item.CONTENT || "";
      return title.includes(searchText) || content.includes(searchText);
    });

    // 섹션 부여 및 정렬
    const dataWithSection = filtered.map((item) => {
      const isFixed = item.fixed_yn === "Y" || item.FIXED_YN === "Y";
      let section = "old";

      if (isFixed) section = "fix";
      else {
        const dateStr = item.update_date || item.UPDATE_DATE;
        const itemDate = new Date(dateStr).getTime();
        if (itemDate >= todayStart) section = "today";
        else if (itemDate >= weekStart) section = "week";
        else if (itemDate >= monthStart) section = "month";
      }

      return { ...item, section };
    });

    // 섹션 우선순위
    const sectionOrder: Record<string, number> = {
      fix: 0,
      today: 1,
      week: 2,
      month: 3,
      old: 4,
    };

    return dataWithSection.sort((a, b) => {
      if (sectionOrder[a.section] !== sectionOrder[b.section]) {
        return sectionOrder[a.section] - sectionOrder[b.section];
      }
      // 같은 섹션 내 최신순
      return (
        new Date(b.update_date || b.UPDATE_DATE).getTime() -
        new Date(a.update_date || a.UPDATE_DATE).getTime()
      );
    });
  }, [initialData, searchText]);

  // 2. 현재 페이지 데이터 슬라이싱
  const currentItems = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return sortedFilteredData.slice(indexOfFirstItem, indexOfLastItem);
  }, [sortedFilteredData, currentPage]);

  const totalPages = Math.ceil(sortedFilteredData.length / itemsPerPage);

  // 3. 현재 페이지 아이템 그룹화 (화면 표시용)
  const groupedCurrentItems = useMemo(() => {
    const groups: Record<string, any[]> = {
      fix: [],
      today: [],
      week: [],
      month: [],
      old: [],
    };
    currentItems.forEach((item) => {
      if (groups[item.section]) {
        groups[item.section].push(item);
      }
    });
    return groups;
  }, [currentItems]);

  const sectionKeys = ["fix", "today", "week", "month", "old"];

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Container>
      <Header>
        {/* ⭐ 즐겨찾기 별이 포함된 타이틀 */}
        <PageTitleWithStar title={<Title>MEMO</Title>} />

        <Controls>
          <SearchWrapper>
            <SearchIcon size={18} color="#94a3b8" />
            <SearchInput
              placeholder="메모 검색..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </SearchWrapper>
          <AddButton onClick={handleAdd}>
            <AddIcon size={20} color="#fff" />
          </AddButton>
        </Controls>
      </Header>

      <ContentArea>
        {sectionKeys.map((key) => {
          const items = groupedCurrentItems[key];
          if (!items || items.length === 0) return null;

          return (
            <Section key={key}>
              <SectionTitle>{getSectionLabel(key)}</SectionTitle>
              <Grid>
                {items.map((item) => {
                  const isFixed =
                    item.fixed_yn === "Y" || item.FIXED_YN === "Y";
                  const title = item.title || item.TITLE || "제목 없음";

                  console.log("item.content", item.content);
                  const content =
                    item.content === "<p><br></p>" ? "본문 없음" : item.content;
                  const date = item.update_date || item.UPDATE_DATE;
                  const writer =
                    item.updater_id ||
                    item.register_id ||
                    item.NAME ||
                    "작성자";

                  return (
                    <Card
                      key={item.id}
                      onClick={() => handleDetail(item)}
                      $isFixed={isFixed}
                    >
                      <CardHeader>
                        <CardTitle>{title}</CardTitle>
                        {isFixed && (
                          <Pin size={16} color="#3182f6" fill="#3182f6" />
                        )}
                      </CardHeader>

                      <CardContent
                        dangerouslySetInnerHTML={{ __html: content }}
                      />

                      <CardFooter>
                        <DateInfo>
                          <Clock size={12} />
                          {formatDate(date)}
                        </DateInfo>
                        <Author>{writer}</Author>
                      </CardFooter>
                    </Card>
                  );
                })}
              </Grid>
            </Section>
          );
        })}

        {initialData.length === 0 && (
          <EmptyState>
            <p>작성된 메모가 없습니다.</p>
            <AddButtonLarge onClick={handleAdd}>
              새 메모 작성하기
            </AddButtonLarge>
          </EmptyState>
        )}
      </ContentArea>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <PaginationContainer>
          <PageButton
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={16} />
          </PageButton>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <PageButton
              key={page}
              $active={currentPage === page}
              onClick={() => handlePageChange(page)}
            >
              {page}
            </PageButton>
          ))}

          <PageButton
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight size={16} />
          </PageButton>
        </PaginationContainer>
      )}
    </Container>
  );
}

// --------------------------------------------------------------------------
// ✨ Styled Components
// --------------------------------------------------------------------------

const Container = styled.div`
  padding: 24px;
  background-color: #f2f4f6;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 24px; /* 간격 증가 */
  padding-bottom: 100px; /* 하단 여유 공간 */

  @media (max-width: 768px) {
    padding: 20px;
    gap: 20px;
    margin-bottom: 60px;
  }
`;

// 🔥 [Updated] 헤더 스타일 개선
const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap; /* 모바일 대응 */
  gap: 16px;
  padding-top: 8px;
`;

const Title = styled.h1`
  font-size: 26px; /* 폰트 사이즈 업 */
  font-weight: 800;
  color: #191f28;
  margin: 0;
  letter-spacing: -0.5px;
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 12px; /* 간격 넓힘 */

  @media (max-width: 600px) {
    width: 100%; /* 모바일 꽉 채움 */
  }
`;

const SearchWrapper = styled.div`
  display: flex;
  align-items: center;
  background: #fff;
  padding: 0 14px;
  border-radius: 14px;
  width: 220px;
  height: 44px; /* 높이 증가 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  border: 1px solid transparent;
  transition: all 0.2s ease;

  &:focus-within {
    border-color: #3182f6;
    box-shadow: 0 0 0 3px rgba(49, 130, 246, 0.1);
    width: 260px;
  }

  @media (max-width: 600px) {
    flex: 1;
    width: auto;
    &:focus-within {
      width: auto;
    }
  }
`;

const SearchInput = styled.input`
  border: none;
  outline: none;
  width: 100%;
  margin-left: 10px;
  font-size: 15px;
  background: transparent;

  &::placeholder {
    color: #b0b8c1;
    font-weight: 500;
  }
`;

const AddButton = styled.button`
  min-width: 44px;
  height: 44px;
  border-radius: 14px;
  background: #3182f6;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(49, 130, 246, 0.25);
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);

  &:hover {
    background-color: #1b64da;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(49, 130, 246, 0.35);
  }

  &:active {
    transform: scale(0.95);
  }
`;

// --- Content Styles ---

const ContentArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SectionTitle = styled.h2`
  font-size: 16px;
  font-weight: 700;
  color: #4e5968;
  margin-left: 4px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
`;

const Card = styled.div<{ $isFixed: boolean }>`
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid ${(props) => (props.$isFixed ? "#3182f6" : "#f2f4f6")};
  background-color: ${(props) => (props.$isFixed ? "#f0f9ff" : "white")};
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
  gap: 12px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  min-height: 24px;
`;

const CardTitle = styled.h3`
  font-size: 17px;
  font-weight: 700;
  color: #191f28;
  margin: 0;
  line-height: 1.3;
  word-break: break-all;
`;

const CardContent = styled.div`
  font-size: 14px;
  color: #6b7684;
  line-height: 1.5;
  margin: 0;

  p {
    margin: 0;
  }
  ul,
  ol {
    padding-left: 20px;
    margin: 4px 0;
  }

  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: 21px;
`;

const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
`;

const DateInfo = styled.span`
  font-size: 12px;
  color: #8b95a1;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const Author = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: #333;
  background-color: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 4px;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 60px 0;
  color: #8b95a1;
`;

const AddButtonLarge = styled.button`
  padding: 12px 24px;
  background-color: #3182f6;
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  &:hover {
    background-color: #2563eb;
  }
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: auto;
  padding-top: 20px;
`;

const PageButton = styled.button<{ $active?: boolean }>`
  min-width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid ${({ $active }) => ($active ? "#3182f6" : "#e5e8eb")};
  background-color: ${({ $active }) => ($active ? "#3182f6" : "#fff")};
  color: ${({ $active }) => ($active ? "#fff" : "#4e5968")};
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background-color: ${({ $active }) => ($active ? "#1b64da" : "#f2f4f6")};
    border-color: ${({ $active }) => ($active ? "#1b64da" : "#d1d6db")};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background-color: #f9fafb;
  }
`;
