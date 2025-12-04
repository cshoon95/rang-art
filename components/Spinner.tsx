import { Box, CircularProgress, styled } from "@mui/material";

export const Spinner = () => {
  return (
    <SpinnerOverlay>
      <StyledCircularProgress />
    </SpinnerOverlay>
  );
};

const SpinnerOverlay = styled(Box)(({ theme }) => ({
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(255, 255, 255, 0.8)", // 반투명 흰색 배경
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1300, // 모달보다 앞에 오도록 높은 zIndex 설정
}));

const StyledCircularProgress = styled(CircularProgress)(({ theme }) => ({
  color: theme.palette.primary.main, // 스피너 색상
  width: "40px !important", // 크기 조정
  height: "40px !important", // 크기 조정
}));
