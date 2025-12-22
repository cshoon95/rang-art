"use client";

import React, { useRef, useState } from "react";
import styled from "styled-components";
import { toPng } from "html-to-image";
import { useModalStore } from "@/store/modalStore";
import CertificateTemplate from "@/components/modals/CertificateTemplate";
import { Download, X } from "lucide-react";
import jsPDF from "jspdf";
import { useStudentPaymentData, useBranchDetail } from "@/app/_querys";

interface Props {
  academyCode: string;
  year: string;
  name: string;
}

export default function ModalCertificate({ academyCode, year, name }: Props) {
  const [isDownloading, setIsDownloading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: paymentData, isLoading: isPaymentLoading } =
    useStudentPaymentData(academyCode, year, name);

  const { data: branchData, isLoading: isBranchLoading } =
    useBranchDetail(academyCode);

  const isLoading = isPaymentLoading || isBranchLoading;

  const handleDownload = async () => {
    if (!ref.current) return;
    setIsDownloading(true);

    try {
      await toPng(ref.current, { cacheBust: true });
      const dataUrl = await toPng(ref.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: "white",
      });

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = 210;
      const pdfHeight = 297;

      pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`교육비납입증명서_${name}_${year}.pdf`);
    } catch (err) {
      console.error("Download Failed:", err);
      alert("다운로드에 실패했습니다.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Container>
      {/* ✅ 스크롤 영역 (내용물만 스크롤됨) */}
      <ScrollArea>
        {isLoading ? (
          <LoadingWrapper>
            <LoadingText>데이터를 불러오는 중입니다...</LoadingText>
          </LoadingWrapper>
        ) : (
          <ScrollContent>
            {/* 스케일링된 미리보기 박스 */}
            <PreviewBox>
              <CaptureTarget ref={ref}>
                <CertificateTemplate
                  data={paymentData || []}
                  name={name}
                  year={year}
                  branchInfo={branchData}
                />
              </CaptureTarget>
            </PreviewBox>
          </ScrollContent>
        )}
      </ScrollArea>

      {/* ✅ 하단 고정 푸터 */}
      <Footer>
        <DownloadBtn
          onClick={handleDownload}
          disabled={isDownloading || isLoading}
        >
          <Download size={18} />
          {isDownloading ? "PDF 생성 중..." : "PDF 다운로드"}
        </DownloadBtn>
      </Footer>
    </Container>
  );
}

// --- Styles ---

const Container = styled.div`
  display: flex;
  flex-direction: column;

  /* PC 기본 설정 */
  height: 80vh;
  max-height: 90vh;
  background: #525659;
  border-radius: 12px;
  overflow: hidden;

  /* 📱 모바일 설정: 화면을 꽉 채워서 푸터를 바닥으로 밀어냄 */
  @media (max-width: 768px) {
    height: 92vh; /* 화면 높이 100% */
    max-height: none; /* 높이 제한 해제 */
    border-radius: 0; /* 둥근 모서리 제거 */
    width: 100%; /* 가로도 꽉 차게 */
  }
`;

const ScrollArea = styled.div`
  flex: 1; /* 남은 공간 모두 차지 */
  overflow: auto; /* ✅ 여기서만 스크롤 발생 */
  padding: 20px;
  display: flex; /* flex를 써야 margin: auto가 먹힘 */
`;

const ScrollContent = styled.div`
  /* ✅ 핵심: 화면보다 내용이 작을 땐 중앙, 클 땐 스크롤 가능하게 */
  margin: auto;
  min-width: fit-content;
  min-height: fit-content;
`;

const LoadingWrapper = styled.div`
  margin: auto;
`;

const LoadingText = styled.div`
  color: white;
  font-size: 16px;
`;

const PreviewBox = styled.div`
  /* ✅ PC(일반) 미리보기 배율 수정 
     기존 0.8 -> 0.6 으로 변경 (더 줄이고 싶으면 0.5 등으로 수정하세요)
  */
  width: calc(794px * 0.6);
  height: calc(1123px * 0.6);

  & > div {
    /* 내부 콘텐츠 스케일도 동일하게 맞춰줍니다 */
    transform: scale(0.6);
    transform-origin: top left;
  }

  /* 모바일 설정 (기존 유지 0.45) */
  @media (max-width: 768px) {
    width: calc(794px * 0.45);
    height: calc(1123px * 0.45);

    & > div {
      transform: scale(0.45);
    }
  }

  background: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);

  /* (선택사항) 크기가 줄어들면서 여백이 너무 휑해 보이지 않도록 마진 추가 */
  /* margin-top: 20px;
  margin-bottom: 20px; */
`;
const CaptureTarget = styled.div`
  width: 794px;
  height: 1123px;
  background-color: white;
`;

const Footer = styled.div`
  padding: 16px 20px; /* 상하 16, 좌우 20으로 통일감 부여 */
  background: white;
  border-top: 1px solid #e5e8eb;

  display: flex;
  justify-content: flex-end;
  gap: 12px; /* 버튼 사이 간격을 조금 더 넓게 */
  flex-shrink: 0;
  z-index: 10;

  /* 📱 PWA 및 모바일 대응: 하단 여백 대폭 강화 */
  @media (max-width: 768px) {
    /* 1. 기본 여백(16px) + Safe Area 
       2. 추가 여백(8px~12px)을 더해 홈 바와 버튼 사이에 시각적 숨통을 틔움 
    */
    padding-bottom: calc(28px + env(safe-area-inset-bottom));

    /* 만약 버튼이 가로로 꽉 차는 스타일이라면 중앙 정렬로 변경 고려 */
    justify-content: center;
  }
`;

const Button = styled.button`
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  font-size: 14px;
`;

const DownloadBtn = styled(Button)`
  background: #3182f6;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center; /* 아이콘과 텍스트 중앙 정렬 */
  gap: 8px;
  width: 100%; /* 가로 꽉 차게 */

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background-color: #1b64da;
  }
`;
