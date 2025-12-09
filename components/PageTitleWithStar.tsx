"use client";

import React from "react";
import styled from "styled-components";
import { Star } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  useFavorites,
  useToggleFavorite,
} from "@/api/favorites/useFavoriteQuery";
interface Props {
  title: React.ReactNode;
}

export default function PageTitleWithStar({ title }: Props) {
  const pathname = usePathname();

  // favoriteList는 [{ id, path, order_index }, ...] 형태입니다.
  const { data: favoriteList = [] } = useFavorites();
  const { mutate: toggleFavorite } = useToggleFavorite();

  // [수정] 객체 배열에서 path가 일치하는 것이 있는지 확인 (some 사용)
  const isFavorite = favoriteList.some((fav: any) => fav.path === pathname);

  const handleToggle = () => {
    toggleFavorite(pathname);
  };

  return (
    <Container>
      {title}
      <StarButton onClick={handleToggle}>
        <Star
          size={24}
          fill={isFavorite ? "#FFD700" : "transparent"}
          color={isFavorite ? "#FFD700" : "#d1d5db"}
          strokeWidth={isFavorite ? 0 : 2}
        />
      </StarButton>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StarButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;

  &:active {
    transform: scale(1.2);
  }
`;
