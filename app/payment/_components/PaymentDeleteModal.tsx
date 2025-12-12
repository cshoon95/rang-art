"use client";

import React from "react";
import styled from "styled-components";
import { AlertCircle } from "lucide-react";
import {
  useDeletePaymentIncomeData,
  useDeletePaymentExpenditureData,
} from "@/app/_querys";
import { PaymentType } from "@/app/_types/type";

// --- Styles ---
const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  z-index: 1100; /* AddModal보다 높게 */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const Container = styled.div`
  background: white;
  width: 100%;
  max-width: 320px;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  text-align: center;
  animation: popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);

  @keyframes popIn {
    from {
      transform: scale(0.9);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }
`;

const IconWrapper = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: #fee2e2;
  color: #ef4444;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px auto;
`;

const Title = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: #191f28;
  margin-bottom: 8px;
`;

const Desc = styled.p`
  font-size: 14px;
  color: #6b7684;
  margin-bottom: 24px;
  line-height: 1.5;
`;

const Footer = styled.div`
  display: flex;
  gap: 10px;
`;

const Button = styled.button`
  flex: 1;
  height: 44px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: pointer;
`;

const CancelBtn = styled(Button)`
  background: #f2f4f6;
  color: #4e5968;
  &:hover {
    background: #e5e8eb;
  }
`;

const DeleteBtn = styled(Button)`
  background: #ef4444;
  color: white;
  &:hover {
    background: #dc2626;
  }
`;

interface Props {
  id: number;
  type: PaymentType;
  academyCode: string;
  onClose: () => void;
}

export default function PaymentDeleteModal({
  id,
  type,
  academyCode,
  onClose,
}: Props) {
  const { mutateAsync: deleteIncome } = useDeletePaymentIncomeData();
  const { mutateAsync: deleteExpenditure } = useDeletePaymentExpenditureData();

  const handleDelete = async () => {
    try {
      if (type === "income") {
        await deleteIncome({ id, academyCode });
      } else {
        await deleteExpenditure({ id, academyCode });
      }
      onClose();
    } catch (e) {
      console.error(e);
      alert("삭제 실패");
    }
  };

  return (
    <Overlay onClick={onClose}>
      <Container onClick={(e) => e.stopPropagation()}>
        <IconWrapper>
          <AlertCircle size={24} />
        </IconWrapper>
        <Title>내역 삭제</Title>
        <Desc>
          정말 이 내역을 삭제하시겠습니까?
          <br />
          삭제 후에는 복구할 수 없습니다.
        </Desc>
        <Footer>
          <CancelBtn onClick={onClose}>취소</CancelBtn>
          <DeleteBtn onClick={handleDelete}>삭제</DeleteBtn>
        </Footer>
      </Container>
    </Overlay>
  );
}
