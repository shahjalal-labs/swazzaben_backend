// lib/mongoSecondary.ts
import { MongoClient } from "mongodb";

const uri =
  "mongodb+srv://RJGDFPWS:9ZfWVtnrO7XUjnGu@cluster0.mi2xoxt.mongodb.net/RJGDFPWS?appName=Cluster0";
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!global._mongoSecondary) {
  client = new MongoClient(uri);
  global._mongoSecondary = client.connect();
}

clientPromise = global._mongoSecondary;

export async function GETRJGDFPWSDB() {
  const client = await clientPromise;
  return client.db(process.env.RJGDFPWS);
}
