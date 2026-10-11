const addressTypeDefs = /* GraphQL */ `
  type Address {
    id: ID!
    label: String!
    recipientName: String!
    postalCode: String!
    street: String!
    number: String!
    complement: String
    neighborhood: String!
    city: String!
    state: String!
    isDefault: Boolean!
  }

  input AddressInput {
    id: ID
    label: String!
    recipientName: String!
    postalCode: String!
    street: String!
    number: String!
    complement: String
    neighborhood: String!
    city: String!
    state: String!
    isDefault: Boolean
  }

  extend type Query {
    myAddresses: [Address!]!
  }

  extend type Mutation {
    saveAddress(data: AddressInput!): Address!
    deleteAddress(id: ID!): Boolean!
    setDefaultAddress(id: ID!): Address!
  }
`;

export { addressTypeDefs };
