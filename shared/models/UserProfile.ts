export type UserProfile = {
  uid: string;
  displayName?: string;
  photoURL?: string;
  totalScore?: number;
};

export type UserProfileData = {
  name: string;
  email: string;
  createdAt: number | { seconds: number; nanoseconds: number };
};
