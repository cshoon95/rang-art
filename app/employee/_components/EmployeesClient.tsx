"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import styled from "styled-components";
import {
  Search as SearchIcon,
  PhoneIphone as PhoneIcon,
  MoreVert as MoreVertIcon,
} from "@mui/icons-material";
// ✅ [New] 페이지네이션용 아이콘 추가
import { ChevronLeft, ChevronRight } from "lucide-react";

import { useModalStore } from "@/store/modalStore";
import { extractInitialConsonants } from "@/utils/common";
import ModalEmployeeManager from "@/components/modals/ModalEmployeeManager";
import { ModalEmployeeDelete } from "@/components/modals/ModalEmployeeDelete";
import PageTitleWithStar from "@/components/PageTitleWithStar";

interface Props {
  initialData: any[];
  academyCode: string;
}

// --- 상수 및 옵션 ---
const LEVEL_FILTER_OPTIONS = [
  { value: "all", label: "모든 직급" },
  { value: "1", label: "원장님" },
  { value: "2", label: "부원장님" },
  { value: "3", label: "선생님" },
  { value: "4", label: "스탭" },
];

const STATE_FILTER_OPTIONS = [
  { value: "all", label: "모든 상태" },
  { value: "O", label: "재직" },
  { value: "X", label: "퇴사" },
];

// 정렬 순서
const LEVEL_ORDER: { [key: string]: number } = {
  원장님: 1,
  부원장님: 2,
  선생님: 3,
  스탭: 4,
};

// --- 커스텀 필터 셀렉트 ---
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

export default function EmployeesClient({ initialData, academyCode }: Props) {
  const [searchText, setSearchText] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterState, setFilterState] = useState("all");

  // ✅ [New] 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // 기본값

  const { openModal, closeModal } = useModalStore();

  // ✅ [New] 반응형 itemsPerPage 설정
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1180) {
        setItemsPerPage(10);
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

  // ✅ 검색어/필터 변경 시 1페이지로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, filterLevel, filterState]);

  // 데이터 필터링 및 정렬
  const filteredAndSortedData = useMemo(() => {
    const filtered = initialData.filter((item) => {
      const name = item.NAME || "";
      const matchesSearch =
        !searchText ||
        name.includes(searchText) ||
        extractInitialConsonants(name).includes(searchText);

      const matchesLevel =
        filterLevel === "all" || item.LEVEL_CD === filterLevel;
      const matchesState = filterState === "all" || item.STATE === filterState;

      return matchesSearch && matchesLevel && matchesState;
    });

    return filtered.sort((a, b) => {
      if (a.STATE !== b.STATE) return a.STATE === "O" ? -1 : 1;

      const orderA = LEVEL_ORDER[a.LEVEL] || 99;
      const orderB = LEVEL_ORDER[b.LEVEL] || 99;
      if (orderA !== orderB) return orderA - orderB;

      return (a.NAME || "").localeCompare(b.NAME || "");
    });
  }, [initialData, searchText, filterLevel, filterState]);

  // ✅ [New] 페이지네이션 데이터 슬라이싱
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedData, currentPage, itemsPerPage]);

  // ✅ [New] 페이지 번호 배열 생성 함수
  const getPageNumbers = () => {
    const pageNumbers = [];
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);

    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    return pageNumbers;
  };

  const handleAdd = () => {
    openModal({
      title: "직원 등록",
      content: <ModalEmployeeManager mode="add" academyCode={academyCode} />,
      type: "SIMPLE",
    });
  };

  const handleDetail = (employee: any) => {
    openModal({
      title: "직원 정보 수정",
      content: (
        <ModalEmployeeManager
          mode="edit"
          academyCode={academyCode}
          initialData={employee}
        />
      ),
      type: "SIMPLE",
    });
  };

  const handleDeleteCheck = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    openModal({
      title: "직원 삭제",
      content: (
        <ModalEmployeeDelete
          id={id}
          academyCode={academyCode}
          onClose={closeModal}
        />
      ),
      type: "SIMPLE",
    });
  };

  return (
    <Container>
      <Header>
        <PageTitleWithStar
          title={
            <Title>
              <Highlight>EMPLOYEE</Highlight> LIST
            </Title>
          }
        />
        <Controls>
          <FilterGroup>
            <FilterSelect
              value={filterLevel}
              options={LEVEL_FILTER_OPTIONS}
              onChange={setFilterLevel}
            />
            <FilterSelect
              value={filterState}
              options={STATE_FILTER_OPTIONS}
              onChange={setFilterState}
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
        </Controls>
      </Header>

      <ListContainer>
        {/* PC View */}
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
                <th style={{ minWidth: "80px" }}>직급</th>
                <th style={{ minWidth: "80px" }}>승인 여부</th>
                <th style={{ minWidth: "120px" }}>연락처</th>
                <th style={{ minWidth: "100px" }}>생년월일</th>
                <th style={{ minWidth: "100px" }}>입사일</th>
                <th style={{ minWidth: "100px" }}>급여</th>
                <th style={{ minWidth: "150px" }}>계좌번호</th>
                <th style={{ minWidth: "200px" }}>비고</th>
                <th style={{ minWidth: "50px" }}></th>
              </tr>
            </thead>
            <tbody>
              {/* ✅ filteredAndSortedData 대신 paginatedData 사용 */}
              {paginatedData.map((item, index) => (
                <tr key={item.IDX} onClick={() => handleDetail(item)}>
                  <td
                    style={{
                      position: "sticky",
                      left: 0,
                      zIndex: 5,
                      backgroundColor: "#fff",
                    }}
                  >
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
                    {item.NAME}
                  </td>
                  <td>
                    <LevelBadge $level={item.LEVEL}>{item.LEVEL}</LevelBadge>
                  </td>
                  <td>
                    <StateBadge $state={item.STATE}>
                      {item.STATE === "O" ? "O" : "X"}
                    </StateBadge>
                  </td>
                  <td>{item.TEL || "-"}</td>
                  <td>{item.BIRTH}</td>
                  <td>{item.DATE}</td>
                  <td>{item.SALARY ? item.SALARY : "-"}</td>
                  <td>{item.ACCOUNT || "-"}</td>
                  <td style={{ color: "#8b95a1", fontSize: "13px" }}>
                    {item.NOTE || "-"}
                  </td>
                  <td
                    onClick={(e) => handleDeleteCheck(e, item.ID)}
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

        {/* Mobile View */}
        <CardView>
          {/* ✅ filteredAndSortedData 대신 paginatedData 사용 */}
          {paginatedData.map((item) => (
            <Card key={item.IDX} onClick={() => handleDetail(item)}>
              <CardHeader>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <Avatar>{(item.NAME || "").charAt(0)}</Avatar>
                  <NameArea>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Name>{item.NAME}</Name>
                      <StateBadge $state={item.STATE}>
                        {item.STATE === "O" ? "재직" : "퇴사"}
                      </StateBadge>
                    </div>
                    <SubText>
                      {item.LEVEL} | {item.TENURE}
                    </SubText>
                  </NameArea>
                </div>
                <MoreBtnWrapper
                  onClick={(e) => handleDeleteCheck(e, item.ID)}
                  style={{ marginRight: "-8px" }}
                >
                  <MoreIcon />
                </MoreBtnWrapper>
              </CardHeader>
              <CardBody>
                <InfoRow>
                  <PhoneIcon fontSize="small" />
                  <span>{item.TEL || "연락처 없음"}</span>
                </InfoRow>
                {item.NOTE && <NoteRow>📢 {item.NOTE}</NoteRow>}
              </CardBody>
            </Card>
          ))}
        </CardView>
      </ListContainer>

      {/* ✅ [New] 페이지네이션 UI */}
      {filteredAndSortedData.length > 0 && (
        <PaginationWrapper>
          <PageButton
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={16} />
          </PageButton>

          {getPageNumbers().map((pageNum) => (
            <PageNumber
              key={pageNum}
              $active={pageNum === currentPage}
              onClick={() => setCurrentPage(pageNum)}
            >
              {pageNum}
            </PageNumber>
          ))}

          <PageButton
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
          >
            <ChevronRight size={16} />
          </PageButton>
        </PaginationWrapper>
      )}
    </Container>
  );
}

// ... (기존 스타일 코드들: LevelBadge, StateBadge, Container, Header ... 등 동일) ...

// ✅ [New] 페이지네이션 스타일 추가
const PaginationWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  padding-bottom: 20px;
  margin-top: auto; /* 리스트가 짧을 때도 하단에 위치하도록 */
`;

const PageButton = styled.button`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e5e8eb;
  background-color: white;
  border-radius: 8px;
  cursor: pointer;
  color: #333;
  transition: all 0.2s;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background-color: #f9fafb;
  }

  &:hover:not(:disabled) {
    background-color: #f2f4f6;
    border-color: #d1d5db;
  }
`;

const PageNumber = styled.button<{ $active?: boolean }>`
  min-width: 32px;
  height: 32px;
  padding: 0 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 14px;
  font-weight: ${(props) => (props.$active ? "700" : "500")};
  cursor: pointer;
  border: ${(props) => (props.$active ? "none" : "1px solid #e5e8eb")};
  background-color: ${(props) => (props.$active ? "#3182f6" : "white")};
  color: ${(props) => (props.$active ? "white" : "#333")};
  transition: all 0.2s;

  &:hover {
    ${(props) =>
      !props.$active &&
      `
        background-color: #f2f4f6;
        border-color: #d1d5db;
      `}
  }
`;

// [아래는 기존에 있던 스타일 코드들입니다. 생략하지 않고 그대로 사용하시면 됩니다.]
// (LevelBadge, StateBadge, Container, Header, Title, Highlight, Controls, FilterGroup...)
// (SelectWrapper, SelectTrigger, SelectedText, ArrowIcon, DropdownList, DropdownItem...)
// (SearchWrapper, SearchInput, AddButton, ListContainer, TableScrollWrapper, TableView...)
// (CardView, Card, CardHeader, Avatar, NameArea, Name, SubText, CardBody, InfoRow, NoteRow, MoreBtnWrapper, MoreIcon...)

// --- 기존 스타일 (참고용 - 실제 코드엔 위에서 생략된 부분도 모두 포함해야 함) ---
const LevelBadge = styled.span<{ $level: string }>`
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  ${({ $level }) => {
    if ($level === "원장님") return "background: #f3e8ff; color: #7e22ce;";
    if ($level === "부원장님") return "background: #dbeafe; color: #1d4ed8;";
    if ($level === "선생님") return "background: #e8f3ff; color: #3182f6;";
    if ($level === "스탭") return "background: #ffedd5; color: #c2410c;";
    return "background: #f2f4f6; color: #4e5968;";
  }}
`;

const StateBadge = styled.span<{ $state: string }>`
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  ${({ $state }) =>
    $state === "O"
      ? "background: #dcfce7; color: #15803d;"
      : "background: #ffebee; color: #ef4444;"}
`;

const Container = styled.div`
  padding: 24px;
  background-color: #f2f4f6;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 20px;
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
const ListContainer = styled.div`
  flex: 1;
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
