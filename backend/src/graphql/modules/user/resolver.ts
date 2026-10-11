import UserService from "./service.js";

const userResolvers = {
  Query: {
    me: (_parent: unknown, _args: unknown, context: any) =>
      UserService.me(context.authUser?.id),
    usernameAvailable: (_parent: unknown, { username }: { username: string }) =>
      UserService.usernameAvailable(username),
    emailAvailable: (_parent: unknown, { email }: { email: string }) =>
      UserService.emailAvailable(email),
  },
  Mutation: {
    signUp: (_parent: unknown, { data }: { data: unknown }) => UserService.signUp(data),
    signIn: (_parent: unknown, { data }: { data: unknown }) => UserService.signIn(data),
    updateProfile: (_parent: unknown, { data }: { data: unknown }, context: any) =>
      UserService.updateProfile(context.authUser?.id, data),
  },
};

export { userResolvers };
