"use client";

import React, { useRef, useState } from "react";
import styled from "styled-components";
import { toPng } from "html-to-image";
import CertificateTemplate from "@/components/modals/CertificateTemplate";
import { Download } from "lucide-react";
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
        pixelRatio: 4,
        backgroundColor: "white",
        width: 794,
        height: 1123,
        style: {
          transform: "scale(1)",
          transformOrigin: "top left",
          margin: "0",
        },
      });

      const pdf = new jsPDF("p", "mm", "a4");

      // A4 전체 크기
      const pageWidth = 210;
      const pageHeight = 297;

      // ✅ 여백 설정 (원하는 만큼 mm 단위로 조절하세요)
      const margin = 20; // 상하좌우 10mm 여백

      // 여백을 뺀 실제 이미지 크기 계산
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = pageHeight - margin * 2;

      // 이미지를 중앙에 배치 (x: margin, y: margin)
      pdf.addImage(dataUrl, "PNG", margin, margin, imgWidth, imgHeight);

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
      <ScrollArea>
        {isLoading ? (
          <LoadingWrapper>
            <LoadingText>데이터를 불러오는 중입니다...</LoadingText>
          </LoadingWrapper>
        ) : (
          <ScrollContent>
            {/* 화면에 보일 때는 축소해서 보여줌 */}
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

  /* 데스크탑/PC 설정 */
  height: 100%; /* 80vh -> 100% 변경 */
  max-height: none; /* 90vh 제한 해제 */

  background: #525659;
  border-radius: 12px;
  overflow: hidden;

  /* 모바일 설정 (기존 유지) */
  @media (max-width: 768px) {
    height: 92vh;
    max-height: none;
    border-radius: 0;
    width: 100%;
  }
`;

const ScrollArea = styled.div`
  flex: 1;
  overflow: auto;
  padding: 20px;
  display: flex;
`;

const ScrollContent = styled.div`
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

// 미리보기 박스 (화면 표시용 컨테이너)
const PreviewBox = styled.div`
  /* A4 픽셀(794px)의 0.6배 크기로 화면 차지 */
  width: calc(794px * 0.6);
  height: calc(1123px * 0.6);
  background: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);

  /* 내부 콘텐츠(CaptureTarget)를 시각적으로 축소 */
  & > div {
    transform: scale(0.6);
    transform-origin: top left;
  }

  /* 모바일 대응 */
  @media (max-width: 768px) {
    width: calc(794px * 0.45);
    height: calc(1123px * 0.45);

    & > div {
      transform: scale(0.45);
    }
  }
`;

// 실제 캡처 대상 (원본 A4 크기 유지)
const CaptureTarget = styled.div`
  /* 96dpi 기준 A4 사이즈 
    width: 210mm -> 약 794px
    height: 297mm -> 약 1123px 
  */
  width: 794px;
  height: 1123px;
  background-color: white;
`;

const Footer = styled.div`
  padding: 16px 20px;
  background: white;
  border-top: 1px solid #e5e8eb;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-shrink: 0;
  z-index: 10;

  @media (max-width: 768px) {
    padding-bottom: calc(28px + env(safe-area-inset-bottom));
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
  justify-content: center;
  gap: 8px;
  width: 100%;

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background-color: #1b64da;
  }
`;
