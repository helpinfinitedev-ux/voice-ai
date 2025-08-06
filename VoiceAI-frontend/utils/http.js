export const HTTPService = {
  setHeaders: ({ user, session }) => ({
    headers: {
      'session-id': session?.id,
      'user-id': user?.id,
    },
  }),
};
