"use client";

import React, { forwardRef, useMemo } from "react";
import styled from "styled-components";
import Image from "next/image";
import StampImg from "@/assets/stamp.png";

interface Props {
  data: any[];
  name: string;
  year: string;
  branchInfo: any;
}

const CertificateTemplate = forwardRef<HTMLDivElement, Props>(
  ({ data = [], name, year, branchInfo }, ref) => {
    // 지점 정보가 없을 경우 대비 안전한 디폴트값
    const academyName = branchInfo?.name || "학원명 미기재";
    const businessNo = branchInfo?.business_no || "";
    const fullAddress = `${branchInfo?.address || ""} ${
      branchInfo?.detail_address || ""
    }`.trim();
    const tel = branchInfo?.tel || "";
    const ownerName = branchInfo?.owner || "";

    // ✅ 1월~12월 데이터 채우기 (데이터 없으면 fee: 0)
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

    // 총 합계 계산
    const totalSum = fullYearData.reduce((sum, item) => sum + item.fee, 0);

    // 데이터를 6개월씩 나눔
    const firstHalf = fullYearData.slice(0, 6);
    const secondHalf = fullYearData.slice(6, 12);

    return (
      <Wrapper ref={ref}>
        <Title>학원교육비(수강료)납입증명서</Title>

        {/* 1. 신청인 */}
        <SectionTable>
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

        {/* 2. 대상 학원생 */}
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

        {/* 3. 수강학원 */}
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
              <Td>{fullAddress}</Td>
              <LabelTd>⑪ 전화번호</LabelTd>
              <Td>{tel}</Td>
            </tr>
          </tbody>
        </SectionTable>

        {/* 4. 납입금액 */}
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
                  {/* 1~6월 */}
                  <LabelTd>{item.month}월</LabelTd>
                  {/* ✅ 수정됨: 0보다 클 때 조건 제거 -> 무조건 0원 표시 */}
                  <Td>{item.fee.toLocaleString()}원</Td>

                  {/* 7~12월 */}
                  <LabelTd>{secondItem.month}월</LabelTd>
                  {/* ✅ 수정됨: 0보다 클 때 조건 제거 -> 무조건 0원 표시 */}
                  <Td>{secondItem.fee.toLocaleString()}원</Td>
                </tr>
              );
            })}
            <tr>
              <LabelTd>연간합계</LabelTd>
              {/* ✅ 수정됨: 합계도 0원이면 0원으로 표시 */}
              <Td style={{ fontWeight: "bold" }}>
                {totalSum.toLocaleString()}원
              </Td>
              <LabelTd>용도</LabelTd>
              <Td>소득공제용</Td>
            </tr>
          </tbody>
        </SectionTable>

        {/* 확인 문구 */}
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
          <AcademySignRow>
            <span
              style={{
                marginRight: "12px",
              }}
            >
              신 청 인
            </span>

            <StampArea>(인)</StampArea>
          </AcademySignRow>
        </ConfirmBox>

        {/* 하단 서명 */}
        <SignBox>
          <p>위와 같이 학원교육비(수강료)를 납입하였음을 확인합니다.</p>
          <DateRow>
            {new Date().getFullYear()}년 {new Date().getMonth() + 1}월{" "}
            {new Date().getDate()}일
          </DateRow>
          <AcademySignRow style={{ gap: "16px" }}>
            <span>학 원 장</span>
            <span
              style={{
                fontWeight: "bold",
                fontSize: "16px",
                marginLeft: "0px",
                paddingLeft: "16px",
              }}
            >
              {ownerName}
            </span>
            <StampArea>
              (인)
              <StampImage src={StampImg} alt="도장" width={60} height={60} />
            </StampArea>
          </AcademySignRow>
        </SignBox>
      </Wrapper>
    );
  }
);

CertificateTemplate.displayName = "CertificateTemplate";
export default CertificateTemplate;

// --- Styles (기존과 동일) ---
const Wrapper = styled.div`
  width: 794px;
  height: 1123px;
  background: white;
  padding: 40px;
  font-family: "Pretendard", sans-serif;
  color: #000;
  box-sizing: border-box;
  margin: 0 auto;
`;

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
`;

const StampImage = styled(Image)`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-15%, -50%);
  opacity: 0.8;
  z-index: 1;
`;
