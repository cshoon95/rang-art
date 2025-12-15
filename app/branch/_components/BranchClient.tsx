"use client";

import React, { useState, useMemo, useCallback } from "react";
import styled from "styled-components";
import {
  Search as SearchIcon,
  Add as AddIcon,
  Store as StoreIcon,
  MoreVert as MoreVertIcon,
} from "@mui/icons-material";
import { useModalStore } from "@/store/modalStore";
import ModalBranchManager from "@/components/modals/ModalBranchManager";
import PageTitleWithStar from "@/components/PageTitleWithStar";
import { useBranchList, useDeleteBranch } from "@/app/_querys";
import BranchSkeleton from "./BranchSkeleton";

// --- Sub Components ---

const BranchTable = React.memo(({ data, onEdit, onDelete }: any) => {
  return (
    <TableView>
      <thead>
        <tr>
          <th style={{ minWidth: "60px" }}>코드</th>
          <th style={{ minWidth: "120px" }}>지점명</th>
          <th style={{ minWidth: "100px" }}>지점장</th>
          <th style={{ minWidth: "120px" }}>연락처</th>
          <th style={{ minWidth: "120px" }}>사업장번호</th>
          <th style={{ minWidth: "200px" }}>주소</th>
          <th style={{ minWidth: "50px" }}></th>
        </tr>
      </thead>
      <tbody>
        {data?.map((item: any) => (
          <tr key={item.code} onClick={() => onEdit(item)}>
            <td style={{ fontWeight: 700, color: "#3182f6" }}>{item.code}</td>
            <td style={{ fontWeight: 700 }}>{item.name}</td>
            <td>{item.owner || "-"}</td>
            <td>{item.tel || "-"}</td>
            <td>{item.business_no || "-"}</td>
            <td style={{ color: "#6b7684", fontSize: "14px" }}>
              {item.address} {item.detail_address}
            </td>
            <td onClick={(e) => onDelete(e, item.code)}>
              <MoreBtnWrapper>
                <MoreIcon />
              </MoreBtnWrapper>
            </td>
          </tr>
        ))}
      </tbody>
    </TableView>
  );
});
BranchTable.displayName = "BranchTable";

const BranchCardList = React.memo(({ data, onEdit, onDelete }: any) => {
  return (
    <CardView>
      {data?.map((item: any) => (
        <Card key={item.code} onClick={() => onEdit(item)}>
          <CardHeader>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Avatar>{(item.name || "").charAt(0)}</Avatar>
              <NameArea>
                <Name>{item.name}</Name>
                <SubText>
                  코드: {item.code} | 지점장: {item.owner || "미정"}
                </SubText>
                <SubText>사업장번호: {item.business_no}</SubText>
              </NameArea>
            </div>
            <MoreBtnWrapper onClick={(e) => onDelete(e, item.code)}>
              <MoreIcon />
            </MoreBtnWrapper>
          </CardHeader>
          <CardBody>
            <InfoRow>
              <StoreIcon fontSize="small" />
              <span>
                {item.address} <br />
                {item.detail_address}
              </span>
            </InfoRow>
          </CardBody>
        </Card>
      ))}
    </CardView>
  );
});
BranchCardList.displayName = "BranchCardList";

// --- Main Component ---

export default function BranchClient() {
  const [searchText, setSearchText] = useState("");
  const { openModal } = useModalStore();
  const { mutate: deleteBranch } = useDeleteBranch();
  const { data: initialData, isLoading } = useBranchList();

  // 1. 데이터 필터링 (useMemo)
  const filteredData = useMemo(() => {
    if (!initialData) return [];
    return initialData.filter((item: any) => {
      const name = item.name || "";
      const code = item.code || "";
      return name.includes(searchText) || code.includes(searchText);
    });
  }, [initialData, searchText]);

  // Handlers (useCallback)
  const handleAdd = useCallback(() => {
    openModal({
      title: "지점 등록",
      content: <ModalBranchManager mode="add" />,
      type: "SIMPLE",
    });
  }, [openModal]);

  const handleEdit = useCallback(
    (item: any) => {
      openModal({
        title: "지점 정보 수정",
        content: <ModalBranchManager mode="edit" initialData={item} />,
        type: "SIMPLE",
      });
    },
    [openModal]
  );

  const handleDeleteCheck = useCallback(
    (e: React.MouseEvent, code: string) => {
      e.stopPropagation();
      openModal({
        type: "SIMPLE",
        title: "지점 삭제",
        content: "이 지점을 정말 삭제하시겠어요?",
        onConfirm: () => {
          deleteBranch(code);
        },
      });
    },
    [openModal, deleteBranch]
  );

  if (isLoading) return <BranchSkeleton />;

  return (
    <Container>
      <Header>
        <PageTitleWithStar
          title={
            <Title>
              <Highlight>지점</Highlight> 목록
            </Title>
          }
        />
        <Controls>
          <SearchWrapper>
            <SearchIcon style={{ color: "#94a3b8" }} />
            <SearchInput
              placeholder="지점명, 코드 검색..."
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
        {/* PC Table View */}
        <TableScrollWrapper>
          <BranchTable
            data={filteredData}
            onEdit={handleEdit}
            onDelete={handleDeleteCheck}
          />
        </TableScrollWrapper>

        {/* Mobile Card View */}
        <BranchCardList
          data={filteredData}
          onEdit={handleEdit}
          onDelete={handleDeleteCheck}
        />
      </ListContainer>
    </Container>
  );
}

// --------------------------------------------------------------------------
// ✨ Styles (기존과 동일)
// --------------------------------------------------------------------------

const Container = styled.div`
  padding: 24px;
  background-color: white;
  display: flex;
  flex-direction: column;
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
  @media (max-width: 768px) {
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
  align-items: center;
  @media (max-width: 768px) {
    width: 100%;
  }
`;
const SearchWrapper = styled.div`
  display: flex;
  align-items: center;
  background: #fff;
  padding: 0 12px;
  border-radius: 12px;
  width: 240px;
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
const MoreBtnWrapper = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  &:hover {
    background-color: #f2f4f6;
  }
`;
const MoreIcon = styled(MoreVertIcon)`
  color: #d1d6db;
  font-size: 20px;
`;
