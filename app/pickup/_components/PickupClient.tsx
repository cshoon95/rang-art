"use client";

import React, { useState, useEffect, useTransition } from "react";
import styled, { css } from "styled-components";
import { extractInitialConsonants } from "@/utils/common";
import { useModalStore } from "@/store/modalStore";
import ModalTimeManager from "@/components/modals/ModalTimeManager";
import {
  Search as SearchIcon,
  Add as AddIcon,
  GridView as GridViewIcon,
  ViewDay as ViewDayIcon,
} from "@mui/icons-material";
import { replaceTimeFormat, replaceTimePattern } from "@/utils/format";
import { useUpsertPickup } from "@/api/pickup/usePickupQuery";
import { WEEKDAY_LIST } from "@/utils/list";
import PageTitleWithStar from "@/components/PageTitleWithStar";

interface Props {
  initialTimeList: any[];
  initialDataList: any[];
}

export default function PickupClient({
  initialTimeList,
  initialDataList,
}: Props) {
  const [searchText, setSearchText] = useState("");
  const [activeDay, setActiveDay] = useState(0);
  const [isAllView, setIsAllView] = useState(false);
  const [isPending, startTransition] = useTransition(); // Server Action용

  const openModal = useModalStore((state) => state.openModal);
  // ✅ Upsert Mutation 사용
  const { mutate: mutateUpsertPickup } = useUpsertPickup();

  useEffect(() => {
    const today = new Date().getDay();
    if (today >= 1 && today <= 5) {
      setActiveDay(today - 1);
    } else {
      setActiveDay(0);
    }
  }, []);

  // ✅ Blur 이벤트 핸들러: 내용 변경 시 저장 (Server Action 사용)
  const handleOnBlur: React.FocusEventHandler<HTMLDivElement> = (e) => {
    const text = e.currentTarget.innerText.trim();
    const refId = e.currentTarget.id.split("-");
    const time = refId[0];
    const day = refId[1];
    const originalContent = e.currentTarget.getAttribute("data-original");

    if (text === originalContent) return;

    mutateUpsertPickup({
      content: text,
      time,
      day,
      academyCode: "2",
      registerID: "admin",
    });
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value.toLowerCase());
  };

  const handleAddTime = () => {
    openModal({
      type: "SIMPLE",
      title: "픽업 시간 추가",
      content: <ModalTimeManager mode="add" target="pickup" />,
    });
  };

  const handleManageTime = (timeValue: string) => {
    openModal({
      type: "SIMPLE",
      title: "픽업 시간 관리",
      content: (
        <ModalTimeManager
          mode="delete"
          initialTime={replaceTimePattern(timeValue)}
          target="pickup"
        />
      ),
    });
  };

  // 데이터 가공 (5일 * 1컬럼)
  const rows = initialTimeList?.map((item: any) => {
    const obj: any = { days: WEEKDAY_LIST, time: item.TIME };
    const filterList =
      initialDataList?.filter((d: any) => d.TIME === item.TIME) || [];

    for (let i = 0; i < 5; i++) {
      let contents = "";
      if (filterList.length > 0) {
        const data = filterList.find((d: any) => {
          return WEEKDAY_LIST[i].value === Number(d.DAY);
        });
        contents = data?.CONTENT || "";
      }
      obj["contents" + String(i)] = contents;
    }
    return obj;
  });

  return (
    <Container>
      <Header>
        <HeaderTop>
          <PageTitleWithStar
            title={
              <Title>
                <Highlight>PICKUP</Highlight> SCHEDULE
              </Title>
            }
          />
          <Controls>
            <SearchWrapper>
              <SearchIcon style={{ fontSize: "20px", color: "#8b95a1" }} />
              <SearchInput
                placeholder="학생 검색..."
                value={searchText}
                onChange={handleSearchChange}
              />
            </SearchWrapper>
            <AddButton onClick={handleAddTime} title="시간 추가">
              <AddIcon style={{ fontSize: "24px" }} />
            </AddButton>
          </Controls>
        </HeaderTop>

        <MobileControlBar>
          {!isAllView && (
            <TabList>
              {WEEKDAY_LIST.map((day) => (
                <TabButton
                  key={day.value}
                  $isActive={activeDay === day.value}
                  onClick={() => setActiveDay(day.value)}
                >
                  {day.label}
                </TabButton>
              ))}
            </TabList>
          )}

          <ViewToggleButton
            onClick={() => setIsAllView(!isAllView)}
            $isAllView={isAllView}
          >
            {isAllView ? <ViewDayIcon /> : <GridViewIcon />}
            <span>{isAllView ? "요일별" : "한 눈에"}</span>
          </ViewToggleButton>
        </MobileControlBar>
      </Header>

      <TableWrapper>
        <Table $isAllView={isAllView}>
          <Thead>
            <tr>
              <ThStickyCorner>TIME</ThStickyCorner>
              {WEEKDAY_LIST.map((day) => (
                <ThStickyTop
                  key={day.value}
                  colSpan={1} // 픽업은 하루에 1열
                  $isVisible={isAllView || day.value === activeDay}
                >
                  {day.label}
                </ThStickyTop>
              ))}
            </tr>
          </Thead>
          <tbody>
            {rows.map((row: any) => (
              <tr key={row.time}>
                <ThStickyLeft onClick={() => handleManageTime(row.time)}>
                  {replaceTimeFormat(row.time)}
                </ThStickyLeft>

                {Array.from({ length: 5 }, (_, index) => {
                  const dayIndex = index;
                  const contentKey = `contents${index}`;
                  const id = `${row.time}-${row.days[dayIndex].value}`;
                  const content = row[contentKey] ?? "";

                  const isHighlighted =
                    searchText &&
                    content &&
                    (content.toLowerCase().includes(searchText) ||
                      extractInitialConsonants(content).includes(searchText));

                  return (
                    <Td
                      key={id}
                      id={id}
                      onBlur={handleOnBlur}
                      contentEditable={true}
                      suppressContentEditableWarning={true}
                      $isHighlighted={!!isHighlighted}
                      $isVisible={isAllView || dayIndex === activeDay}
                      $isDayEnd={true} // 모든 칸이 요일의 끝임 (1열 구조이므로)
                      data-original={content}
                    >
                      {content}
                    </Td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </Table>
      </TableWrapper>
    </Container>
  );
}

// --------------------------------------------------------------------------
// ✨ Styled Components (제공해주신 코드와 동일 스타일, 색상만 오렌지 테마 적용)
// --------------------------------------------------------------------------

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 24px;
  background-color: #f2f4f6; // 기존 배경색 유지
  overflow: hidden;
  gap: 20px;
  @media (max-width: 768px) {
    padding: 16px;
    gap: 16px;
  }
`;

const Header = styled.header`
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex-shrink: 0;
`;

const HeaderTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 800;
  color: #191f28;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  @media (max-width: 768px) {
    font-size: 20px;
  }
`;

// 픽업 테마 컬러 (Orange)
const Highlight = styled.span`
  color: #3182f6;
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const MobileControlBar = styled.div`
  display: none;
  gap: 8px;
  @media (max-width: 768px) {
    display: flex;
    width: 100%;
  }
`;

const TabList = styled.div`
  flex: 1;
  display: flex;
  background-color: #e5e8eb;
  padding: 4px;
  border-radius: 12px;
`;

const TabButton = styled.button<{ $isActive: boolean }>`
  flex: 1;
  border: none;
  background-color: ${(props) => (props.$isActive ? "#fff" : "transparent")};
  color: ${(props) =>
    props.$isActive ? "#3182f6" : "#8b95a1"}; // Active Orange
  font-weight: ${(props) => (props.$isActive ? "800" : "600")};
  padding: 8px 0;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: ${(props) =>
    props.$isActive ? "0 2px 4px rgba(0,0,0,0.05)" : "none"};
  font-family: "CustomFont";
`;

const ViewToggleButton = styled.button<{ $isAllView: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 16px;
  border: none;
  flex: ${(props) => (props.$isAllView ? "1" : "0 0 auto")};
  background-color: #333d4b;
  color: #fff;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  font-family: "CustomFont";
  transition: all 0.3s ease;
  white-space: nowrap;
  justify-content: center;
  height: ${(props) => (props.$isAllView ? "45px" : "")};

  svg {
    font-size: 18px;
  }

  &:active {
    transform: scale(0.96);
  }
`;

const SearchWrapper = styled.div`
  display: flex;
  align-items: center;
  background-color: #fff;
  border: 1px solid #e5e8eb;
  border-radius: 12px;
  padding: 0 12px;
  width: 260px;
  height: 42px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
  transition: all 0.2s ease;
  &:focus-within {
    border-color: #3182f6; // Focus Orange
    box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
  }
  @media (max-width: 768px) {
    flex: 1;
    width: auto;
  }
`;

const SearchInput = styled.input`
  border: none;
  background: transparent;
  width: 100%;
  height: 100%;
  margin-left: 8px;
  font-size: 15px;
  color: #333;
  outline: none;
  font-family: "CustomFont";
  &::placeholder {
    color: #b0b8c1;
  }
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border: none;
  border-radius: 12px;
  background-color: #fff;
  color: #3182f6; // Icon Orange
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e8eb;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  &:hover {
    background-color: #3182f6; // Hover Orange
    color: #fff;
    transform: translateY(-2px);
    border-color: #3182f6;
  }
  &:active {
    transform: translateY(0);
  }
`;

const TableWrapper = styled.div`
  flex: 1;
  background-color: #fff;
  border-radius: 20px;
  overflow: auto;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e8eb;
  position: relative;
  &::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #d1d6db;
    border-radius: 5px;
    border: 2px solid transparent;
    background-clip: padding-box;
  }
  &::-webkit-scrollbar-track {
    background-color: transparent;
  }
  &::-webkit-scrollbar-corner {
    background-color: transparent;
  }
`;

const Table = styled.table<{ $isAllView: boolean }>`
  width: 100%;
  min-width: 800px;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;

  @media (max-width: 768px) {
    min-width: ${(props) => (props.$isAllView ? "600px" : "100%")};
    width: ${(props) => (props.$isAllView ? "auto" : "100%")};
  }
`;

const Thead = styled.thead`
  background-color: #f9fafb;
`;

const CellBase = styled.td<{ $isVisible?: boolean }>`
  padding: 10px;
  text-align: center;
  vertical-align: middle;
  border-bottom: 1px solid #f2f4f6;
  border-right: 1px solid #f2f4f6;

  font-size: 14px;
  height: 56px;
  word-break: keep-all;
  white-space: pre-wrap;
  line-height: 1.4;

  @media (max-width: 768px) {
    font-size: 13px;
    padding: 6px;
    height: 50px;
    display: ${(props) => (props.$isVisible ? "table-cell" : "none")};
  }
`;

const ThStickyCorner = styled(CellBase).attrs({ as: "th" })`
  position: sticky;
  top: 0;
  left: 0;
  z-index: 50;
  background-color: #f2f9ff;
  color: #0ea5e9;
  font-weight: 800;
  width: 80px;
  min-width: 80px;
  border-right: 2px solid #cbd5e1;
  border-bottom: 2px solid #e0f2fe;
  @media (max-width: 768px) {
    display: table-cell;
    width: 60px;
    min-width: 60px;
    font-size: 12px;
  }
`;

const ThStickyTop = styled(CellBase).attrs({ as: "th" })`
  position: sticky;
  top: 0;
  z-index: 40;
  background-color: #f2f9ff;
  color: #0284c7;
  font-weight: 700;
  font-size: 16px;
  border-bottom: 2px solid #e0f2fe;
  border-right: 2px solid #cbd5e1; // 헤더 구분선
`;

const ThStickyLeft = styled(CellBase).attrs({ as: "th" })`
  position: sticky;
  left: 0;
  z-index: 30;
  background-color: #fff;
  color: #64748b;
  font-weight: 700;
  font-size: 13px;
  border-right: 2px solid #cbd5e1; // 시간축 구분선
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    background-color: #eff6ff;
    color: #0ea5e9;
  }
  @media (max-width: 768px) {
    display: table-cell;
    font-size: 12px;
  }
`;

const Td = styled(CellBase)<{
  $isHighlighted?: boolean;
  $isEvenColumn?: boolean;
  $isDayEnd?: boolean;
}>`
  background-color: ${(props) => (props.$isEvenColumn ? "#f9fafb" : "#fff")};
  color: #334155;
  transition: all 0.2s;
  cursor: text;

  // 요일 구분선
  ${(props) =>
    props.$isDayEnd &&
    css`
      border-right: 2px solid #cbd5e1 !important;
    `}

  &:hover {
    background-color: #e0f2fe;
  }
  &:focus {
    outline: none;
    background-color: #fff;
    box-shadow: inset 0 0 0 2px #3182f6;
    z-index: 10;
    position: relative;
  }
  ${(props) =>
    props.$isHighlighted &&
    css`
      background-color: #fff7ed !important;
      color: #c2410c !important;
      font-weight: 700;
      box-shadow: inset 0 0 0 2px #fdba74;
    `}
`;
