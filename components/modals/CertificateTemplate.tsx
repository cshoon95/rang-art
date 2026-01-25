"use client";

import React, { forwardRef, useMemo } from "react";
import styled from "styled-components";
// ❌ 삭제: import Image from "next/image";
// (Next Image는 캡처 시 문제를 일으킴)
import StampImg from "@/assets/stamp.png";

interface Props {
  data: any[];
  name: string;
  year: string;
  branchInfo: any;
}

const CertificateTemplate = forwardRef<HTMLDivElement, Props>(
  ({ data = [], name, year, branchInfo }, ref) => {
    // ... (데이터 처리 로직은 기존과 동일) ...
    const academyName = branchInfo?.name || "학원명 미기재";
    const businessNo = branchInfo?.business_no || "";
    const fullAddress = `${branchInfo?.address || ""} ${
      branchInfo?.detail_address || ""
    }`.trim();
    const tel = branchInfo?.tel || "";
    const ownerName = branchInfo?.owner || "";

    const fullYearData = useMemo(() => {
      return Array.from({ length: 12 }, (_, i) => {
        const monthNum = i + 1;
        const found = data?.find((item) => Number(item.month) === monthNum);
        return {
          month: monthNum,
          fee: found ? Number(found.fee) : 0,
        };
      });
    }, [data]);

    const totalSum = fullYearData.reduce((sum, item) => sum + item.fee, 0);
    const firstHalf = fullYearData.slice(0, 6);
    const secondHalf = fullYearData.slice(6, 12);

    return (
      <Wrapper ref={ref}>
        <Title>학원교육비(수강료)납입증명서</Title>

        {/* ... (테이블 섹션 1, 2, 3, 4 기존 코드 유지) ... */}

        {/* (중략... 위쪽 테이블 코드는 그대로 두세요) */}

        {/* 1. 신청인 */}
        <SectionTable>
          {/* ... 기존 내용 유지 ... */}
          <tbody>
            <tr>
              <Th
                colSpan={4}
                style={{ textAlign: "left", paddingLeft: "10px" }}
              >
                1. 신 청 인
              </Th>
            </tr>
            <tr>
              <LabelTd>① 성 명</LabelTd>
              <Td></Td>
              <LabelTd>② 주민등록번호</LabelTd>
              <Td></Td>
            </tr>
            <tr>
              <LabelTd>③ 주 소</LabelTd>
              <Td colSpan={3}></Td>
            </tr>
          </tbody>
        </SectionTable>

        {/* 2. 대상 학원생, 3. 수강학원, 4. 납입금액 테이블은 기존 코드 유지... */}
        {/* (코드 길이상 중략합니다. 기존 테이블 코드는 그대로 쓰세요) */}
        <SectionTable>
          <tbody>
            <tr>
              <Th rowSpan={2} style={{ width: "10%" }}>
                대상
                <br />
                학원생
              </Th>
              <LabelTd>④ 성 명</LabelTd>
              <Td>{name}</Td>
              <LabelTd>⑤ 주민등록번호</LabelTd>
              <Td></Td>
            </tr>
            <tr>
              <LabelTd>⑥ 주 소</LabelTd>
              <Td></Td>
              <LabelTd>⑦ 관계</LabelTd>
              <Td></Td>
            </tr>
          </tbody>
        </SectionTable>

        <SectionTable>
          <tbody>
            <tr>
              <Th
                colSpan={4}
                style={{ textAlign: "left", paddingLeft: "10px" }}
              >
                2. 수강학원
              </Th>
            </tr>
            <tr>
              <LabelTd>⑧ 학원명</LabelTd>
              <Td>랑아트 미술학원 {academyName}</Td>
              <LabelTd>⑨ 사업자번호</LabelTd>
              <Td>{businessNo}</Td>
            </tr>
            <tr>
              <LabelTd>⑩ 소재지</LabelTd>
              <Td>{fullAddress}</Td> {/* 👈 올바르게 수정됨 */}
              <LabelTd>⑪ 전화번호</LabelTd>
              <Td>{tel}</Td>
            </tr>
          </tbody>
        </SectionTable>

        <SectionTable>
          <tbody>
            <tr>
              <Th
                colSpan={4}
                style={{ textAlign: "left", paddingLeft: "10px" }}
              >
                3. 수강료 납입금액 ({year}년)
              </Th>
            </tr>
            {/* ... 납입금액 루프 기존 유지 ... */}
            <tr>
              <LabelTd>월 별</LabelTd>
              <LabelTd>납입 금액</LabelTd>
              <LabelTd>월 별</LabelTd>
              <LabelTd>납입 금액</LabelTd>
            </tr>
            {firstHalf.map((item, idx) => {
              const secondItem = secondHalf[idx];
              return (
                <tr key={idx}>
                  <LabelTd>{item.month}월</LabelTd>
                  <Td>{item.fee.toLocaleString()}원</Td>
                  <LabelTd>{secondItem.month}월</LabelTd>
                  <Td>{secondItem.fee.toLocaleString()}원</Td>
                </tr>
              );
            })}
            <tr>
              <LabelTd>연간합계</LabelTd>
              <Td style={{ fontWeight: "bold" }}>
                {totalSum.toLocaleString()}원
              </Td>
              <LabelTd>용도</LabelTd>
              <Td>소득공제용</Td>
            </tr>
          </tbody>
        </SectionTable>

        {/* ✅ [수정] 확인 문구 */}
        <ConfirmBox>
          <p>
            소득세법 제52조 및 동법 시행령 제113조 제1항의 규정에 의하여
            교육비공제를 받고자 하니 위와 같이 학원교육비(수강료)를 납입하였음을
            증명하여 주시기 바랍니다.
          </p>
          <DateRow>
            {new Date().getFullYear()}년 {new Date().getMonth() + 1}월{" "}
            {new Date().getDate()}일
          </DateRow>

          {/* Flex가 좁아져도 줄바꿈 안 되게 수정 */}
          <AcademySignRow>
            <span style={{ marginRight: "28px", whiteSpace: "nowrap" }}>
              신 청 인
            </span>
            <StampArea>(인)</StampArea>
          </AcademySignRow>
        </ConfirmBox>

        {/* ✅ [수정] 하단 서명 */}
        <SignBox>
          <p>위와 같이 학원교육비(수강료)를 납입하였음을 확인합니다.</p>
          <DateRow>
            {new Date().getFullYear()}년 {new Date().getMonth() + 1}월{" "}
            {new Date().getDate()}일
          </DateRow>

          {/* Flex가 좁아져도 줄바꿈 안 되게 수정 */}
          <AcademySignRow style={{ gap: "16px" }}>
            <span style={{ whiteSpace: "nowrap" }}>학 원 장</span>
            <span
              style={{
                fontWeight: "bold",
                fontSize: "16px",
                marginLeft: "0px",
                paddingLeft: "16px",
                whiteSpace: "nowrap", // 이름 길어도 줄바꿈 방지
              }}
            >
              {ownerName}
            </span>
            <StampArea>
              (인)
              {/* ✅ [수정] Next/Image 대신 일반 img 태그 사용 + src.src 사용 */}
              <StampImgTag src={StampImg.src} alt="도장" />
            </StampArea>
          </AcademySignRow>
        </SignBox>
      </Wrapper>
    );
  }
);

CertificateTemplate.displayName = "CertificateTemplate";
export default CertificateTemplate;

// --- Styles ---

const Wrapper = styled.div`
  width: 794px;
  /* ✅ [중요] 모바일에서 화면이 작아도 절대 찌그러지지 않게 최소 너비 고정 */
  min-width: 794px;
  height: 1123px;
  background: white;
  padding: 40px;
  font-family: "Pretendard", sans-serif;
  color: #000;
  box-sizing: border-box;
  margin: 0 auto;

  /* 캡처 시 줄바꿈 방지용 전역 설정 */
  white-space: nowrap;

  /* 내부 텍스트 줄바꿈 허용이 필요한 곳(긴 문장)은 normal로 오버라이딩 */
  p {
    white-space: normal;
  }
`;

// ... (Title, SectionTable, Th, Td, LabelTd 등 기존 스타일 유지) ...
const Title = styled.h1`
  text-align: center;
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 30px;
  border: 2px solid #000;
  padding: 10px;
`;

const SectionTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 10px;
  font-size: 13px;

  th,
  td {
    border: 1px solid #000;
    padding: 6px;
    text-align: center;
    white-space: normal; /* 테이블 내부는 줄바꿈 허용 */
  }
`;

const Th = styled.th`
  background-color: #f3f4f6;
  font-weight: 700;
`;
const LabelTd = styled.td`
  background-color: #f9fafb;
  width: 15%;
`;
const Td = styled.td`
  width: 35%;
`;

const ConfirmBox = styled.div`
  margin-top: 20px;
  padding: 20px;
  border: 1px solid #000;
  border-bottom: none;
  font-size: 13px;
  line-height: 1.6;
`;

const SignBox = styled.div`
  padding: 20px;
  border: 1px solid #000;
  font-size: 13px;
`;

const DateRow = styled.div`
  text-align: center;
  margin-top: 15px;
  font-size: 15px;
  letter-spacing: 2px;
`;

const SignRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 60px;
  margin-top: 15px;
  padding-right: 40px;

  /* ✅ Flex 아이템들이 좁아져도 절대 줄바꿈 하지 않음 */
  flex-wrap: nowrap;
`;

const AcademySignRow = styled(SignRow)`
  align-items: center;
  position: relative;
`;

const StampArea = styled.span`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: right;
  width: 60px;
  height: 24px;
  white-space: nowrap; /* (인) 글자 줄바꿈 방지 */
`;

// ✅ [수정] 일반 img 태그용 스타일 (Next Image 아님)
const StampImgTag = styled.img`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-15%, -50%);
  opacity: 0.8;
  z-index: 1;
  width: 60px; /* 명시적 크기 지정 */
  height: 60px;
`;
