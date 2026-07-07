export type ReceivedInvite = {
  id: string;
  paperId: string;
  paperTitle: string;
  inviterId: string;
  inviterName: string;
  status: string;
  createdAt: string;
};

export type InviteAction = "accept" | "decline";
