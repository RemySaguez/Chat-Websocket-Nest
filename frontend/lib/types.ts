export type AuthSession = {
  id: string;
  email: string;
  username: string;
  accentColor: string;
  accessToken: string;
};

export type ChatReaction = {
  emoji: string;
  userNames: string[];
};

export type ChatMessage = {
  id: string;
  authorId: string;
  authorName: string;
  authorColor: string;
  text: string;
  reactions: ChatReaction[];
};
