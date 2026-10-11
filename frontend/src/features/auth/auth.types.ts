type AccountType = "CUSTOMER" | "SELLER" | "ADMIN";

type Address = {
  id: string;
  label: string;
  recipientName: string;
  postalCode: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  isDefault: boolean;
};

type AuthUser = {
  id: string;
  accountType: AccountType;
  name: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  cpfMasked: string | null;
  defaultAddress: Address | null;
  createdAt: string;
};

type AuthPayload = {
  user: AuthUser;
  token: string;
};

type SignInInput = {
  login: string;
  password: string;
};

type SignUpInput = {
  name: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type UpdateProfileInput = {
  name?: string;
  username?: string;
  email?: string;
  avatarImageID?: string;
  removeAvatar?: boolean;
  currentPassword?: string;
  newPassword?: string;
  confirmNewPassword?: string;
  cpf?: string;
};

export type {
  AccountType,
  Address,
  AuthPayload,
  AuthUser,
  SignInInput,
  SignUpInput,
  UpdateProfileInput,
};
