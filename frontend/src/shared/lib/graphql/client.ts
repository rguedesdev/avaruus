type GraphQLErrorPayload = {
  message: string;
  extensions?: { code?: string };
};

type GraphQLResponse<TData> = {
  data?: TData;
  errors?: GraphQLErrorPayload[];
};

const graphQLEndpoint =
  process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:3333/graphql";

class GraphQLRequestError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "GraphQLRequestError";
    this.code = code;
  }
}

async function graphQLRequest<TData, TVariables extends Record<string, unknown>>(
  query: string,
  variables: TVariables,
  token?: string | null,
): Promise<TData> {
  const response = await fetch(graphQLEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });

  let payload: GraphQLResponse<TData>;
  try {
    payload = (await response.json()) as GraphQLResponse<TData>;
  } catch {
    throw new GraphQLRequestError("O servidor retornou uma resposta inválida.");
  }

  const graphQLError = payload.errors?.[0];
  if (graphQLError) {
    throw new GraphQLRequestError(graphQLError.message, graphQLError.extensions?.code);
  }
  if (!response.ok || !payload.data) {
    throw new GraphQLRequestError("Não foi possível concluir a solicitação.");
  }

  return payload.data;
}

export { graphQLRequest, GraphQLRequestError };
