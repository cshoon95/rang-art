"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import styled from "styled-components";
import {
  Search as SearchIcon,
  Add as AddIcon,
  PhoneIphone as PhoneIcon,
  MoreVert as MoreVertIcon,
  ChevronLeft,
  ChevronRight,
} from "@mui/icons-material";
import { useModalStore } from "@/store/modalStore";
import { extractInitialConsonants, getStateLabel } from "@/utils/common";
import { replaceHyphenFormat } from "@/utils/format";
import ModalCustomerManager from "@/components/modals/ModalCustomerManager";
import {
  STATE_FILTER_OPTIONS,
  COUNT_FILTER_OPTIONS,
  STATE_ORDER,
} from "@/utils/list";
import { getDDay } from "@/utils/date";
import { ModalCustomerDelete } from "@/components/modals/ModalCustomerDelete";
import PageTitleWithStar from "@/components/PageTitleWithStar";

interface Props {
  initialData: any[];
  academyCode: string;
  userRole: string;
}

// --- [신규] 필터용 커스텀 셀렉트 컴포넌트 ---
function FilterSelect({ value, options, onChange }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt: any) => opt.value === value);

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

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <SelectWrapper ref={wrapperRef}>
      <SelectTrigger $isOpen={isOpen} onClick={() => setIsOpen(!isOpen)}>
        <SelectedText>
          {selectedOption ? selectedOption.label : "선택"}
        </SelectedText>
        <ArrowIcon $isOpen={isOpen}>
          <svg
            width="10"
            height="10"
            viewBox="0 0 12 12"
            fill="none"
            style={{ width: "100%", height: "100%" }}
          >
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
          {options.map((opt: any) => (
            <DropdownItem
              key={opt.value}
              $isSelected={opt.value === value}
              onClick={() => handleSelect(opt.value)}
            >
              {opt.label}
            </DropdownItem>
          ))}
        </DropdownList>
      )}
    </SelectWrapper>
  );
}

const DEFAULT_ITEMS_PER_PAGE = 8;

export default function CustomersClient({
  initialData,
  academyCode,
  userRole,
}: Props) {
  const [searchText, setSearchText] = useState("");
  const [filterState, setFilterState] = useState("all");
  const [filterCount, setFilterCount] = useState("all");

  // [페이지네이션 1] 상태 추가
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);

  const { openModal, closeModal } = useModalStore();

  const filteredAndSortedData = useMemo(() => {
    const filtered = initialData.filter((item) => {
      const name = item.name || "";
      const matchesSearch =
        !searchText ||
        name.includes(searchText) ||
        extractInitialConsonants(name).includes(searchText);

      const matchesState = filterState === "all" || item.state === filterState;
      const matchesCount =
        filterCount === "all" || String(item.count) === filterCount;

      return matchesSearch && matchesState && matchesCount;
    });

    return filtered.sort((a, b) => {
      const orderA = STATE_ORDER[a.state] || 99;
      const orderB = STATE_ORDER[b.state] || 99;

      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [initialData, searchText, filterState, filterCount]);

  // [페이지네이션 2] 필터가 바뀌면 1페이지로 초기화
  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, filterState, filterCount]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1180) {
        setItemsPerPage(8);
      } else if (window.innerWidth > 800) {
        setItemsPerPage(8);
      } else {
        setItemsPerPage(4);
      }
    };

    // 초기 실행
    handleResize();

    // 리사이즈 이벤트 등록
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // [페이지네이션 3] 현재 페이지 데이터 계산
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAndSortedData.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);

  // [페이지네이션 4] 페이지 변경 핸들러
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    // 스크롤을 맨 위로 (선택사항)
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAdd = () => {
    openModal({
      title: "원생 등록",
      content: <ModalCustomerManager mode="add" academyCode={academyCode} />,
      type: "SIMPLE",
    });
  };

  const handleDetail = (customer: any) => {
    openModal({
      title: "원생 정보 수정",
      content: (
        <ModalCustomerManager
          mode="edit"
          academyCode={academyCode}
          initialData={customer}
          userRole={userRole}
        />
      ),
      type: "SIMPLE",
    });
  };

  const handleDeleteCheck = (e: React.MouseEvent, item: any) => {
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
      type: "SIMPLE",
    });
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone || phone === "010") return "-";
    return replaceHyphenFormat(phone, "phone");
  };

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
            <FilterSelect
              value={filterState}
              options={STATE_FILTER_OPTIONS}
              onChange={setFilterState}
            />
            <FilterSelect
              value={filterCount}
              options={COUNT_FILTER_OPTIONS}
              onChange={setFilterCount}
            />
          </FilterGroup>

          <SearchWrapper>
            <SearchIcon style={{ color: "#94a3b8" }} />
            <SearchInput
              placeholder="이름 검색..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </SearchWrapper>
          <AddButton onClick={handleAdd}>
            <AddIcon />
          </AddButton>
        </Controls>
      </Header>

      <ListContainer>
        {/* === Desktop Table View === */}
        <TableScrollWrapper>
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
              {/* [수정] filteredAndSortedData -> currentItems 로 변경 */}
              {currentItems.map((item, index) => (
                <tr key={item.id} onClick={() => handleDetail(item)}>
                  <td
                    style={{
                      position: "sticky",
                      left: 0,
                      zIndex: 5,
                      backgroundColor: "#fff",
                    }}
                  >
                    {/* 번호 계산: (현재페이지-1)*10 + 인덱스 + 1 */}
                    {(currentPage - 1) * itemsPerPage + index + 1}
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
                    onClick={(e) => handleDeleteCheck(e, item)}
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
        </TableScrollWrapper>

        {/* === Mobile Card View === */}
        <CardView>
          {/* [수정] filteredAndSortedData -> currentItems 로 변경 */}
          {currentItems.map((item) => (
            <Card key={item.id} onClick={() => handleDetail(item)}>
              <CardHeader>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <Avatar>{(item.name || "").charAt(0)}</Avatar>
                  <NameArea>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
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
                  onClick={(e) => handleDeleteCheck(e, item)}
                  style={{ marginRight: "-8px" }}
                >
                  <MoreIcon />
                </MoreBtnWrapper>
              </CardHeader>
              <CardBody>
                <InfoRow>
                  <PhoneIcon fontSize="small" />
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
      </ListContainer>

      {/* [페이지네이션 5] 페이지네이션 UI 추가 */}
      {totalPages > 0 && (
        <PaginationContainer>
          <PageButton
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft fontSize="small" />
          </PageButton>

          {/* 페이지 번호 (간단하게 모든 페이지 표시 or 10개 제한 가능) */}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            // 페이지가 너무 많으면 로직 추가 필요하지만, 일단 전체 렌더링
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
            <ChevronRight fontSize="small" />
          </PageButton>
        </PaginationContainer>
      )}
    </Container>
  );
}

// --- Styles ---

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
  height: 42px;
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
  width: 42px;
  height: 42px;
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
  svg {
    color: #b0b8c1;
    font-size: 18px;
  }
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

const MoreIcon = styled(MoreVertIcon)`
  color: #d1d6db;
  font-size: 20px;
`;

// [신규] 페이지네이션 스타일
const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
  flex-wrap: wrap; /* 모바일에서 많아지면 줄바꿈 */
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

// --- Custom Select Styles ---
const SelectWrapper = styled.div`
  position: relative;
  width: 130px;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const SelectTrigger = styled.div<{ $isOpen: boolean }>`
  height: 42px;
  padding: 0 12px;
  background: white;
  border-radius: 12px;
  border: 1px solid ${({ $isOpen }) => ($isOpen ? "#3182f6" : "#e5e8eb")};
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: ${({ $isOpen }) =>
    $isOpen
      ? "0 0 0 3px rgba(49, 130, 246, 0.1)"
      : "0 1px 2px rgba(0, 0, 0, 0.04)"};

  &:hover {
    background-color: #f9fafb;
    border-color: ${({ $isOpen }) => ($isOpen ? "#3182f6" : "#d1d6db")};
  }

  @media (max-width: 768px) {
    height: 38px;
    padding: 0 10px;
    border-radius: 10px;
  }
`;

const SelectedText = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #4e5968;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 768px) {
    font-size: 13px;
  }
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
  flex-shrink: 0;

  @media (max-width: 768px) {
    width: 10px;
    height: 10px;
    margin-left: 6px;
  }
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
  box-sizing: border-box;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #ddd;
    border-radius: 4px;
  }
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

  @media (max-width: 768px) {
    font-size: 13px;
    padding: 8px 10px;
  }
`;
