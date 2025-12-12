import { useDeleteCustomer } from "@/app/_querys";
import { useToastStore } from "@/store/toastStore";
import { useRouter } from "next/navigation";
import styled from "styled-components";

export const ModalCustomerDelete = ({
  id,
  name,
  academyCode,
  onClose,
}: {
  id: number;
  name: string;
  academyCode: string;
  onClose: () => void;
}) => {
  const { mutate: mutateDeleteCustomer, isPending } = useDeleteCustomer();
  const router = useRouter();
  const { addToast } = useToastStore();
  const handleDelete = () => {
    mutateDeleteCustomer({ id, academyCode } as any, {
      onSuccess: (data) => {
        onClose();
        router.refresh();
        addToast(data.message, "success");
      },
      onError: (error: Error) => {
        addToast(error.message || "삭제 실패", "error");
      },
    });
  };

  return (
    <DeleteContainer>
      <DeleteMessage>
        {name}님의 정보를 <br />
        정말 <strong>삭제</strong>하시겠어요?
      </DeleteMessage>
      <DeleteBtnGroup>
        <CancelBtn onClick={onClose}>취소</CancelBtn>
        <DeleteActionBtn onClick={handleDelete} disabled={isPending}>
          {isPending ? "삭제 중..." : "삭제하기"}
        </DeleteActionBtn>
      </DeleteBtnGroup>
    </DeleteContainer>
  );
};

const DeleteContainer = styled.div`
  padding: 0 10px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  text-align: center;
`;

const DeleteMessage = styled.p`
  font-size: 16px;
  color: #333d4b;
  line-height: 1.5;
  strong {
    color: #ef4444;
    font-weight: 700;
  }
`;

const DeleteBtnGroup = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
`;

const BaseBtn = styled.button`
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  font-size: 14px;
`;
const CancelBtn = styled(BaseBtn)`
  background: #f2f4f6;
  color: #4e5968;
  &:hover {
    background: #e5e8eb;
  }
`;

const DeleteActionBtn = styled(BaseBtn)`
  background: #ef4444;
  color: white;
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  &:hover:not(:disabled) {
    background: #dc2626;
  }
`;
