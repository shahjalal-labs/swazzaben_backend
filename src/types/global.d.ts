import { MongoClient } from "mongodb";

declare global {
  var _mongoSecondary: Promise<MongoClient> | undefined;
}

export {};
