const { gql } = require('apollo-server-core');

const typeDefs = gql`
  type Query {
    currentTime: String!
    sumNumbersInRange(begin: Int!, end: Int!): Int!
    taskMainList: [Task!]
    allUsers: [User]
    search(term: String!): [SearchResultItem!]
    taskInfo(id: ID!): Task
    me: User
  }

  type NumbersInRange {
    sum: Int!
    type: Int!
  }

  interface SearchResultItem {
    id: ID
    content: String
  }

  type Task implements SearchResultItem {
    id: ID # Must be present
    content: String # Must be present
    tags: [String]!
    approachCount: Int!
    createdAt: String!
    author: User!
    approachList: [Approach!]!
  }

  type Approach implements SearchResultItem {
    id: ID # Must be present
    content: String # Must be present
    createdAt: String!
    task: Task!
    voteCount: Int!
    author: User!
    detailList: [ApproachDetail!]!
  }

  enum ApproachDetailCategory {
    NOTE
    EXPLANATION
    WARNING
  }

  type ApproachDetail {
    content: String!
    category: ApproachDetailCategory!
  }

  type User {
    id: ID
    username: String 
    name: String
    taskList: [Task]
    createdAt: String
  }

  input AuthInput {
    username: String!
    password: String!
  }

  input UserInput {
    username: String!
    password: String!
    firstName: String
    lastName: String
  }

  input TaskInput {
    content: String!
    tags: [String!]!
    isPrivate: Boolean!
  }

  input ApproachDetailInput {
    content: String!
    category: ApproachDetailCategory!
  }

  input ApproachInput {
    content: String!
    detailList: [ApproachDetailInput!]!
  }

  input ApproachVoteInput {
    up: Boolean!
  }

  type ApproachPayload {
    errors: [UserError!]!
    approach: Approach
  }

  type UserError {
    message: String!
  }

  type UserPayload {
    errors: [UserError!]!
    user: User
    authToken: String!
  }

  type UserDeletePayload {
    errors: [UserError!]!
    deletedUserId: ID
  }

  type TaskPayload {
    errors: [UserError!]!
    task: Task
  }

  type Mutation {
    userCreate(input: UserInput!): UserPayload!
    userLogin(input: AuthInput!): UserPayload!
    userDelete: UserDeletePayload!
    taskCreate(input: TaskInput!): TaskPayload!
    approachCreate(taskId: ID!, input: ApproachInput!): ApproachPayload!
    approachVote(approachId: ID!, input: ApproachVoteInput!): ApproachPayload!
  }

  type Subscription {
    voteChanged(taskId: ID!): Approach!
    taskMainListChanged: [Task!]
  }

`;

module.exports = typeDefs;
