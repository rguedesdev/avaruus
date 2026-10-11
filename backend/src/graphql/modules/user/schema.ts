const userTypeDefs = /* GraphQL */ `
  enum AccountType {
    CUSTOMER
    SELLER
    ADMIN
  }

  type User {
    id: ID!
    accountType: AccountType!
    name: String!
    username: String!
    email: String!
    avatarUrl: String
    cpfMasked: String
    defaultAddress: Address
    createdAt: String!
  }

  type AuthPayload {
    user: User!
    token: String!
  }

  input SignUpInput {
    name: String!
    username: String!
    email: String!
    password: String!
    confirmPassword: String!
  }

  input SignInInput {
    login: String!
    password: String!
  }

  input UpdateProfileInput {
    name: String
    username: String
    email: String
    avatarImageID: ID
    removeAvatar: Boolean
    currentPassword: String
    newPassword: String
    confirmNewPassword: String
    cpf: String
  }

  type Query {
    me: User!
    usernameAvailable(username: String!): Boolean!
    emailAvailable(email: String!): Boolean!
  }

  type Mutation {
    signUp(data: SignUpInput!): AuthPayload!
    signIn(data: SignInInput!): AuthPayload!
    updateProfile(data: UpdateProfileInput!): User!
  }
`;

export { userTypeDefs };
