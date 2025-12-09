"use client";

import { PaymentType } from "@/api/payment/type";
import { usePaymentTotal } from "@/api/payment/usePaymentQuery";
import styled, { css } from "styled-components";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react"; // 아이콘 추가

// --- Types ---
// 데이터 타입을 명시하여 TS 에러 방지
interface MonthlyData {
  month: string;
  total: number;
  count: number;
}

// --- Styles ---
const CardContainer = styled.div<{ $type: PaymentType }>`
  background-color: white;
  border-radius: 24px;
  padding: 24px;
  /* 부드러운 그림자 효과 */
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
  border: 1px solid #f2f4f6;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: transform 0.2s ease;

  /* 호버 시 살짝 떠오르는 효과 */
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 14px 40px rgba(0, 0, 0, 0.06);
  }
`;

// 1행 배치를 위한 상단 Row
const TopRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start; /* 금액이 커서 줄바꿈 되더라도 상단 정렬 유지 */
  gap: 12px;
`;

const TitleGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const IconBox = styled.div<{ $type: PaymentType }>`
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;

  /* 타입에 따른 배경/아이콘 색상 */
  ${({ $type }) =>
    $type === "income"
      ? css`
          background-color: #e8f3ff;
          color: #3182f6;
        `
      : css`
          background-color: #fff0f0;
          color: #e11d48;
        `}
`;

const TitleText = styled.span`
  font-size: 15px;
  font-weight: 600;
  color: #4e5968;
`;

// 금액 스타일 개선
const AmountText = styled.div<{ $type: PaymentType }>`
  font-size: 26px; /* 1행 배치 시 너무 크지 않게 조정 */
  font-weight: 800;
  letter-spacing: -0.5px;
  text-align: right;
  color: ${({ $type }) => ($type === "income" ? "#3182f6" : "#e11d48")};

  /* 숫자가 길어지면 줄바꿈 허용 or 말줄임 선택 */
  word-break: break-all;
  line-height: 1.2;

  span {
    font-size: 16px;
    font-weight: 600;
    color: #8b95a1;
    margin-left: 2px;
  }
`;

const Divider = styled.div`
  height: 1px;
  background-color: #f2f4f6;
  width: 100%;
`;

const BottomRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #8b95a1;
`;

const CountValue = styled.span`
  font-weight: 700;
  color: #333d4b;
`;

interface Props {
  year: string;
  month: string;
  type: PaymentType;
  academyCode: string;
}

export default function PaymentSummary({
  year,
  month,
  type,
  academyCode,
}: Props) {
  const { data: totalData = [] } = usePaymentTotal(year, type, academyCode);

  // 1. 타입 단언(Type Assertion)으로 TS 에러 해결
  // totalData 배열 안에 있는 객체의 형태를 TS가 모르기 때문에 지정해줍니다.
  const currentMonthData = (totalData.find((d: any) => d.month === month) || {
    total: 0,
    count: 0,
  }) as MonthlyData;

  return (
    <CardContainer $type={type}>
      {/* 상단 1행: 타이틀 + 아이콘 vs 금액 */}
      <TopRow>
        <TitleGroup>
          <IconBox $type={type}>
            {type === "income" ? (
              <TrendingUp size={20} />
            ) : (
              <TrendingDown size={20} />
            )}
          </IconBox>
          <TitleText>
            {month}월 {type === "income" ? "총 수입" : "총 지출"}
          </TitleText>
        </TitleGroup>

        <AmountText $type={type}>
          {Number(currentMonthData.total).toLocaleString()}
          <span>원</span>
        </AmountText>
      </TopRow>

      <Divider />

      {/* 하단: 건수 정보 */}
      <BottomRow>
        <span>처리 내역</span>
        <div>
          총 <CountValue>{currentMonthData.count}건</CountValue>
        </div>
      </BottomRow>
    </CardContainer>
  );
}
