import React from "react";
import styled, { keyframes } from "styled-components";

export default function BranchSkeleton() {
  return (
    <Container>
      {/* 1. 헤더 영역 스켈레톤 */}
      <Header>
        {/* 타이틀 영역 */}
        <SkeletonBox width="140px" height="32px" />

        {/* 컨트롤(검색+버튼) 영역 */}
        <Controls>
          <SearchWrapper>
            <SkeletonBox width="100%" height="100%" borderRadius="12px" />
          </SearchWrapper>
          <AddButtonSkeleton />
        </Controls>
      </Header>

      <ListContainer>
        {/* 2. PC Table View 스켈레톤 */}
        <TableScrollWrapper>
          <TableView>
            <thead>
              <tr>
                <th style={{ minWidth: "60px" }}>
                  <SkeletonBox
                    width="30px"
                    height="16px"
                    style={{ margin: "0 auto" }}
                  />
                </th>
                <th style={{ minWidth: "120px" }}>
                  <SkeletonBox
                    width="60px"
                    height="16px"
                    style={{ margin: "0 auto" }}
                  />
                </th>
                <th style={{ minWidth: "100px" }}>
                  <SkeletonBox
                    width="50px"
                    height="16px"
                    style={{ margin: "0 auto" }}
                  />
                </th>
                <th style={{ minWidth: "120px" }}>
                  <SkeletonBox
                    width="80px"
                    height="16px"
                    style={{ margin: "0 auto" }}
                  />
                </th>
                <th style={{ minWidth: "120px" }}>
                  <SkeletonBox
                    width="80px"
                    height="16px"
                    style={{ margin: "0 auto" }}
                  />
                </th>
                <th style={{ minWidth: "200px" }}>
                  <SkeletonBox
                    width="120px"
                    height="16px"
                    style={{ margin: "0 auto" }}
                  />
                </th>
                <th style={{ minWidth: "50px" }}></th>
              </tr>
            </thead>
            <tbody>
              {[...Array(3)].map((_, i) => (
                <tr key={i}>
                  <td>
                    <SkeletonBox
                      width="40px"
                      height="20px"
                      style={{ margin: "0 auto" }}
                    />
                  </td>
                  <td>
                    <SkeletonBox
                      width="80px"
                      height="20px"
                      style={{ margin: "0 auto" }}
                    />
                  </td>
                  <td>
                    <SkeletonBox
                      width="60px"
                      height="20px"
                      style={{ margin: "0 auto" }}
                    />
                  </td>
                  <td>
                    <SkeletonBox
                      width="100px"
                      height="20px"
                      style={{ margin: "0 auto" }}
                    />
                  </td>
                  <td>
                    <SkeletonBox
                      width="100px"
                      height="20px"
                      style={{ margin: "0 auto" }}
                    />
                  </td>
                  <td>
                    <SkeletonBox
                      width="180px"
                      height="20px"
                      style={{ margin: "0 auto" }}
                    />
                  </td>
                  <td>
                    <SkeletonBox
                      width="24px"
                      height="24px"
                      borderRadius="50%"
                      style={{ margin: "0 auto" }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </TableView>
        </TableScrollWrapper>

        {/* 3. Mobile Card View 스켈레톤 */}
        <CardView>
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    width: "100%",
                  }}
                >
                  {/* 아바타 스켈레톤 */}
                  <SkeletonBox
                    width="44px"
                    height="44px"
                    borderRadius="50%"
                    flexShrink={0}
                  />
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      width: "100%",
                    }}
                  >
                    {/* 이름 */}
                    <SkeletonBox width="40%" height="20px" />
                    {/* 서브텍스트 */}
                    <SkeletonBox width="70%" height="14px" />
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                {/* 주소 정보 */}
                <SkeletonBox width="90%" height="16px" />
                <SkeletonBox
                  width="50%"
                  height="16px"
                  style={{ marginTop: "4px" }}
                />
              </CardBody>
            </Card>
          ))}
        </CardView>
      </ListContainer>
    </Container>
  );
}

// --- Animation ---
const shimmer = keyframes`
  0% {
    background-color: #f2f4f6;
  }
  50% {
    background-color: #e5e8eb;
  }
  100% {
    background-color: #f2f4f6;
  }
`;

// --- Skeleton Base Component ---
const SkeletonBox = styled.div<{
  width?: string;
  height?: string;
  borderRadius?: string;
  flexShrink?: number;
}>`
  width: ${(props) => props.width || "100%"};
  height: ${(props) => props.height || "20px"};
  border-radius: ${(props) => props.borderRadius || "6px"};
  flex-shrink: ${(props) => props.flexShrink ?? 1};
  animation: ${shimmer} 1.5s infinite ease-in-out;
`;

// --- Layout Styles (Original에서 가져옴 + 스켈레톤용 수정) ---
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

const Controls = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const SearchWrapper = styled.div`
  width: 240px;
  height: 42px;
  @media (max-width: 768px) {
    flex: 1;
  }
`;

const AddButtonSkeleton = styled(SkeletonBox)`
  width: 42px;
  height: 42px;
  border-radius: 12px;
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
    border-bottom: 1px solid #f2f4f6;
  }
  td {
    padding: 16px;
    border-bottom: 1px solid #f2f4f6;
    vertical-align: middle;
  }
  tr:last-child td {
    border-bottom: none;
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
  border: 1px solid #f2f4f6;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const CardBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 12px;
  border-top: 1px solid #f2f4f6;
`;
