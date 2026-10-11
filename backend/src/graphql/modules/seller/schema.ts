const sellerTypeDefs = /* GraphQL */ `
  enum SellerAddressPurpose { SHIPPING RETURN PICKUP }

  type SellerAddress {
    id: ID!
    label: String!
    recipientName: String!
    postalCode: String!
    street: String!
    number: String!
    complement: String!
    neighborhood: String!
    city: String!
    state: String!
    purposes: [SellerAddressPurpose!]!
  }

  input SellerAddressInput {
    id: ID
    label: String!
    recipientName: String!
    postalCode: String!
    street: String!
    number: String!
    complement: String!
    neighborhood: String!
    city: String!
    state: String!
    purposes: [SellerAddressPurpose!]!
  }

  type SellerDayHours { closed: Boolean!, open: String!, close: String! }
  input SellerDayHoursInput { closed: Boolean!, open: String!, close: String! }
  type SellerBusinessHours {
    monday: SellerDayHours!
    tuesday: SellerDayHours!
    wednesday: SellerDayHours!
    thursday: SellerDayHours!
    friday: SellerDayHours!
    saturday: SellerDayHours!
    sunday: SellerDayHours!
  }
  input SellerBusinessHoursInput {
    monday: SellerDayHoursInput!
    tuesday: SellerDayHoursInput!
    wednesday: SellerDayHoursInput!
    thursday: SellerDayHoursInput!
    friday: SellerDayHoursInput!
    saturday: SellerDayHoursInput!
    sunday: SellerDayHoursInput!
  }

  type SellerSettings {
    slug: String!
    storeName: String!
    phone: String!
    taxDocument: String!
    photoUrl: String!
    photoImageID: ID
    description: String!
    sellerAddresses: [SellerAddress!]!
    businessHours: SellerBusinessHours!
    orderNotifications: Boolean!
    promotionalNotifications: Boolean!
    stockNotifications: Boolean!
    vacationMode: Boolean!
  }

  type PublicStore {
    slug: String!
    storeName: String!
    photoUrl: String!
    description: String!
    vacationMode: Boolean!
  }

  input SellerSettingsInput {
    storeName: String!
    phone: String!
    taxDocument: String!
    photoImageID: ID
    description: String!
    sellerAddresses: [SellerAddressInput!]!
    businessHours: SellerBusinessHoursInput!
    orderNotifications: Boolean!
    promotionalNotifications: Boolean!
    stockNotifications: Boolean!
    vacationMode: Boolean!
  }

  extend type Query {
    mySellerSettings: SellerSettings!
    publicStoreBySlug(slug: String!): PublicStore
  }

  extend type Mutation {
    saveSellerSettings(data: SellerSettingsInput!): SellerSettings!
  }
`;

export { sellerTypeDefs };
