"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import styled from "styled-components";
import {
  Search,
  Plus,
  Smartphone,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useModalStore } from "@/store/modalStore";
import { useGetCustomers } from "@/app/_querys";
import { extractInitialConsonants, getStateLabel } from "@/utils/common";
import { replaceHyphenFormat } from "@/utils/format";
import {
  STATE_FILTER_OPTIONS,
  COUNT_FILTER_OPTIONS,
  STATE_ORDER,
} from "@/utils/list";
import { getDDay } from "@/utils/date";
import PageTitleWithStar from "@/components/PageTitleWithStar";
import Select from "@/components/Select";

// 🌟 [최적화] 모달 컴포넌트들은 초기 로딩에 포함하지 않고 필요할 때만 불러옵니다.
const ModalCustomerManager = dynamic(
  () => import("@/components/modals/ModalCustomerManager"),
  {
    ssr: false,
  },
);
const ModalCustomerDelete = dynamic(
  () =>
    import("@/components/modals/ModalCustomerDelete").then(
      (mod) => mod.ModalCustomerDelete,
    ),
  {
    ssr: false,
  },
);

interface Props {
  initialData: any[];
  academyCode: string;
}

const DEFAULT_ITEMS_PER_PAGE = 10;

// --- Helper Functions ---
const formatPhoneNumber = (phone: string) => {
  if (!phone || phone === "010") return "-";
  return replaceHyphenFormat(phone, "phone");
};

// --- Sub Components (테이블 & 카드 뷰 분리) ---

const CustomersTable = React.memo(
  ({ data, startIndex, onDetail, onDelete }: any) => {
    return (
      <TableView>
        <thead>
          <tr>
            <th
              style={{
                minWidth: "50px",
                position: "sticky",
                left: 0,
                zIndex: 10,
              }}
            >
              No
            </th>
            <th
              style={{
                minWidth: "80px",
                position: "sticky",
                left: "50px",
                zIndex: 10,
              }}
            >
              이름
            </th>
            <th style={{ minWidth: "60px" }}>성별</th>
            <th style={{ minWidth: "100px" }}>생년월일</th>
            <th style={{ minWidth: "80px" }}>수강횟수</th>
            <th style={{ minWidth: "100px" }}>회비</th>
            <th style={{ minWidth: "120px" }}>학생 휴대폰</th>
            <th style={{ minWidth: "100px" }}>학교</th>
            <th style={{ minWidth: "200px" }}>비고</th>
            <th style={{ minWidth: "100px" }}>부모님 성함</th>
            <th style={{ minWidth: "120px" }}>부모님 휴대폰</th>
            <th style={{ minWidth: "150px" }}>현금영수증 번호</th>
            <th style={{ minWidth: "100px" }}>등록일</th>
            <th style={{ minWidth: "80px" }}>D+DAY</th>
            <th style={{ minWidth: "80px" }}>상태</th>
            <th style={{ minWidth: "100px" }}>퇴원일</th>
            <th style={{ minWidth: "50px" }}></th>
          </tr>
        </thead>
        <tbody>
          {data.map((item: any, index: number) => (
            <tr key={item.id} onClick={() => onDetail(item)}>
              <td
                style={{
                  position: "sticky",
                  left: 0,
                  zIndex: 5,
                  backgroundColor: "#fff",
                }}
              >
                {startIndex + index + 1}
              </td>
              <td
                style={{
                  fontWeight: 700,
                  position: "sticky",
                  left: "50px",
                  zIndex: 5,
                  backgroundColor: "#fff",
                }}
              >
                {item.name}
              </td>
              <td>{item.sex === "M" ? "남자" : "여자"}</td>
              <td>{replaceHyphenFormat(item.birth || "", "date")}</td>
              <td>
                {item.count ? (
                  <CountBadge count={item.count}>{item.count}회</CountBadge>
                ) : (
                  "-"
                )}
              </td>
              <td>
                {item.fee ? `${Number(item.fee).toLocaleString()}원` : "-"}
              </td>
              <td>{formatPhoneNumber(item.tel)}</td>
              <td>{item.school || "-"}</td>
              <td style={{ color: "#8b95a1", fontSize: "13px" }}>
                {item.note || "-"}
              </td>
              <td>{item.parentname || "-"}</td>
              <td>{item.cash_number || "-"}</td>
              <td>{formatPhoneNumber(item.parentphone)}</td>
              <td>{replaceHyphenFormat(item.date || "", "date")}</td>
              <td style={{ color: "#3182f6", fontWeight: 600 }}>
                {getDDay(item.date)}
              </td>
              <td>
                <StateBadge $state={item.state}>
                  {getStateLabel(item.state)}
                </StateBadge>
              </td>
              <td>{replaceHyphenFormat(item.discharge || "", "date")}</td>
              <td
                onClick={(e) => onDelete(e, item)}
                style={{ cursor: "pointer" }}
              >
                <MoreBtnWrapper>
                  <MoreIcon />
                </MoreBtnWrapper>
              </td>
            </tr>
          ))}
        </tbody>
      </TableView>
    );
  },
);
CustomersTable.displayName = "CustomersTable";

const CustomersCardList = React.memo(({ data, onDetail, onDelete }: any) => {
  return (
    <CardView>
      {data.map((item: any) => (
        <Card key={item.id} onClick={() => onDetail(item)}>
          <CardHeader>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Avatar>{(item.name || "").charAt(0)}</Avatar>
              <NameArea>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <Name>{item.name}</Name>
                  <StateBadge $state={item.state}>
                    {getStateLabel(item.state)}
                  </StateBadge>
                </div>
                <SubText>
                  {item.school ? `${item.school} | ` : ""}
                  {item.sex === "M" ? "남" : "여"}
                </SubText>
              </NameArea>
            </div>
            <MoreBtnWrapper
              onClick={(e) => onDelete(e, item)}
              style={{ marginRight: "-8px" }}
            >
              <MoreIcon />
            </MoreBtnWrapper>
          </CardHeader>
          <CardBody>
            <InfoRow>
              <Smartphone size={16} color="#b0b8c1" />
              <span>
                {formatPhoneNumber(item.tel) === "-"
                  ? "연락처 없음"
                  : formatPhoneNumber(item.tel)}
              </span>
            </InfoRow>
            {item.note && <NoteRow>📢 {item.note}</NoteRow>}
          </CardBody>
        </Card>
      ))}
    </CardView>
  );
});
CustomersCardList.displayName = "CustomersCardList";

// --- Main Component ---

export default function CustomersClient({ initialData, academyCode }: Props) {
  const { data: customerData = [] } = useGetCustomers(academyCode, initialData);

  // State
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterState, setFilterState] = useState("all");
  const [filterCount, setFilterCount] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);

  const { openModal, closeModal } = useModalStore();

  // 1. 검색어 디바운싱
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchText), 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  // 2. 필터링 로직 (useMemo 최적화)
  const processedData = useMemo(() => {
    // 1. API 응답에 중복된 학생 ID가 있을 경우를 대비해 중복 제거
    const seen = new Set();
    const uniqueData = customerData.filter((item: any) => {
      const duplicate = seen.has(item.id);
      seen.add(item.id);
      return !duplicate;
    });

    const filtered = uniqueData.filter((item) => {
      const name = item.name || "";
      const matchesSearch =
        !debouncedSearch ||
        name.includes(debouncedSearch) ||
        extractInitialConsonants(name).includes(debouncedSearch);

      const matchesState = filterState === "all" || item.state === filterState;
      const matchesCount =
        filterCount === "all" || String(item.count) === filterCount;

      return matchesSearch && matchesState && matchesCount;
    });

    return filtered.sort((a, b) => {
      const orderA = STATE_ORDER[a.state] || 99;
      const orderB = STATE_ORDER[b.state] || 99;
      if (orderA !== orderB) return orderA - orderB;
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [customerData, debouncedSearch, filterState, filterCount]);

  // 3. 페이지네이션 데이터 계산
  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedData.slice(start, start + itemsPerPage);
  }, [processedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(processedData.length / itemsPerPage);

  // 4. 필터 변경 시 페이지 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filterState, filterCount]);

  // 5. 반응형 리사이징
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1180) setItemsPerPage(10);
      else if (window.innerWidth > 800) setItemsPerPage(8);
      else setItemsPerPage(10);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handlers (useCallback)
  const handlePageChange = useCallback(
    (pageNumber: number) => {
      if (pageNumber >= 1 && pageNumber <= totalPages) {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [totalPages],
  );

  const handleAdd = useCallback(() => {
    openModal({
      title: "원생 등록",
      content: <ModalCustomerManager mode="add" academyCode={academyCode} />,
      type: "BOTTOM",
      hideFooter: true,
    });
  }, [openModal, academyCode]);

  const handleDetail = useCallback(
    (customer: any) => {
      openModal({
        title: "원생 정보 수정",
        content: (
          <ModalCustomerManager
            mode="edit"
            academyCode={academyCode}
            initialData={customer}
          />
        ),
        hideFooter: true,
        type: "BOTTOM",
      });
    },
    [openModal, academyCode],
  );

  const handleDeleteCheck = useCallback(
    (e: React.MouseEvent, item: any) => {
      e.stopPropagation();
      openModal({
        title: "회원 삭제",
        content: (
          <ModalCustomerDelete
            id={item.id}
            name={item.name}
            academyCode={academyCode}
            onClose={closeModal}
          />
        ),
        hideFooter: true,
        type: "SIMPLE",
      });
    },
    [openModal, closeModal, academyCode],
  );

  const handleStateChange = useCallback((_: any, value?: string) => {
    if (value) setFilterState(value);
  }, []);

  const handleCountChange = useCallback((_: any, value?: string) => {
    if (value) setFilterCount(value);
  }, []);

  return (
    <Container>
      <Header>
        <PageTitleWithStar
          title={
            <Title>
              <Highlight>회원</Highlight> 목록
            </Title>
          }
        />
        <Controls>
          <FilterGroup>
            <Select
              width="130px"
              value={filterState}
              options={STATE_FILTER_OPTIONS}
              onChange={handleStateChange}
            />
            <Select
              width="130px"
              value={filterCount}
              options={COUNT_FILTER_OPTIONS}
              onChange={handleCountChange}
            />
          </FilterGroup>

          <SearchWrapper>
            <Search size={20} color="#94a3b8" />
            <SearchInput
              placeholder="이름 검색..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </SearchWrapper>
          <AddButton onClick={handleAdd}>
            <Plus size={24} />
          </AddButton>
        </Controls>
      </Header>

      <ListContainer>
        {/* Desktop View */}
        <TableScrollWrapper>
          <CustomersTable
            data={currentItems}
            startIndex={(currentPage - 1) * itemsPerPage}
            onDetail={handleDetail}
            onDelete={handleDeleteCheck}
          />
        </TableScrollWrapper>

        {/* Mobile View */}
        <CustomersCardList
          data={currentItems}
          onDetail={handleDetail}
          onDelete={handleDeleteCheck}
        />
      </ListContainer>

      {/* Pagination */}
      {totalPages > 0 && (
        <PaginationContainer>
          <PageButton
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={20} />
          </PageButton>

          {/* 페이지 번호 최적화 (많아질 경우 말줄임표 처리) */}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(
              (page) =>
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 2 && page <= currentPage + 2),
            )
            .map((page, index, array) => (
              <React.Fragment key={page}>
                {index > 0 && page - array[index - 1] > 1 && (
                  <span style={{ color: "#b0b8c1", margin: "0 4px" }}>...</span>
                )}
                <PageButton
                  $active={currentPage === page}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </PageButton>
              </React.Fragment>
            ))}

          <PageButton
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight size={20} />
          </PageButton>
        </PaginationContainer>
      )}
    </Container>
  );
}

// --------------------------------------------------------------------------
// ✨ Styles (기존과 동일)
// --------------------------------------------------------------------------

const Container = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  background-color: white;
  gap: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(224, 224, 224, 0.4);
  border-radius: 24px;
  @media (max-width: 768px) {
    padding: 16px;
    padding-bottom: 80px;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  @media (max-width: 1024px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 800;
  color: #191f28;
`;

const Highlight = styled.span`
  color: #3182f6;
`;

const Controls = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const FilterGroup = styled.div`
  display: flex;
  gap: 8px;
  @media (max-width: 768px) {
    flex: 1;
    gap: 8px;
    > div {
      flex: 1;
    }
  }
`;

const SearchWrapper = styled.div`
  display: flex;
  align-items: center;
  background: #fff;
  padding: 0 12px;
  border-radius: 12px;
  width: 200px;
  height: 44px; /* Select 높이와 맞춤 (44px) */
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  border: 1px solid #e5e8eb;
  transition: all 0.2s;

  &:focus-within {
    border-color: #3182f6;
    box-shadow: 0 0 0 3px rgba(49, 130, 246, 0.1);
  }

  @media (max-width: 768px) {
    flex: 1;
    min-width: 150px;
    height: 44px; /* 모바일 높이 통일 */
  }
`;

const SearchInput = styled.input`
  border: none;
  outline: none;
  width: 100%;
  margin-left: 8px;
  font-size: 15px;
  font-family: "Pretendard", sans-serif;
  &::placeholder {
    color: #b0b8c1;
  }
`;

const AddButton = styled.button`
  width: 44px; /* Select 높이와 통일 */
  height: 44px;
  border-radius: 12px;
  background: #3182f6;
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(49, 130, 246, 0.3);
  transition: background 0.2s;
  &:hover {
    background: #1b64da;
  }
  @media (max-width: 768px) {
    position: fixed;
    bottom: 200px;
    right: 24px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    box-shadow: 0 4px 16px rgba(49, 130, 246, 0.5);
    z-index: 100;
  }
`;

const ListContainer = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const TableScrollWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
  border-radius: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
  background: #fff;
  border: 1px solid #f2f4f6;

  @media (max-width: 768px) {
    display: none;
  }
`;

const TableView = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  white-space: nowrap;

  th {
    background: #f9fafb;
    padding: 16px;
    font-size: 14px;
    color: #8b95a1;
    text-align: center;
    font-weight: 600;
    border-bottom: 1px solid #f2f4f6;
  }

  td {
    padding: 16px;
    border-bottom: 1px solid #f2f4f6;
    font-size: 15px;
    color: #333d4b;
    text-align: center;
    cursor: pointer;
  }

  tr:last-child td {
    border-bottom: none;
  }
  tr:hover td {
    background: #f9fafb !important;
  }
`;

const CardView = styled.div`
  display: none;
  flex-direction: column;
  gap: 12px;
  @media (max-width: 768px) {
    display: flex;
  }
`;

const Card = styled.div`
  background: #fff;
  padding: 20px;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  border: 1px solid #f2f4f6;
  &:active {
    transform: scale(0.98);
    transition: 0.1s;
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const Avatar = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #e8f3ff;
  color: #3182f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 18px;
`;

const NameArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const Name = styled.span`
  font-size: 17px;
  font-weight: 700;
  color: #191f28;
`;

const SubText = styled.span`
  font-size: 13px;
  color: #8b95a1;
`;

const CardBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 12px;
  border-top: 1px solid #f2f4f6;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #4e5968;
  font-size: 14px;
  font-weight: 500;
`;

const NoteRow = styled.div`
  margin-top: 4px;
  padding: 8px 12px;
  background-color: #f9fafb;
  border-radius: 8px;
  color: #6b7684;
  font-size: 13px;
`;

const StateBadge = styled.span<{ $state: string }>`
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;

  ${({ $state }) => {
    switch ($state) {
      case "0":
        return "background: #e8f3ff; color: #3182f6;";
      case "1":
        return "background: #fff3e0; color: #f97316;";
      case "2":
        return "background: #ffebee; color: #ef4444;";
      case "3":
        return "background: #f2f4f6; color: #4e5968;";
      default:
        return "background: #f2f4f6; color: #4e5968;";
    }
  }}
`;

const CountBadge = styled.span<{ count: string }>`
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;

  ${({ count }) => {
    switch (count) {
      case "1":
        return `background: #f3e8ff; color: #7e22ce;`;
      case "2":
        return `background: #dbeafe; color: #1d4ed8;`;
      case "3":
        return `background: #dcfce7; color: #15803d;`;
      case "4":
        return `background: #fee2e2; color: #b91c1c;`;
      default:
        return `background: #e5e7eb; color: #374151;`;
    }
  }}
`;

const MoreBtnWrapper = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  transition: background 0.2s;

  &:hover {
    background-color: #f2f4f6;
  }
`;

const MoreIcon = styled(MoreVertical)`
  color: #d1d6db;
  width: 20px;
  height: 20px;
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
  flex-wrap: wrap;
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
