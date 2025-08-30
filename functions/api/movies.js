import { MongoClient } from "mongodb";

let client;
let db;

async function connectDB(env) {
  if (!client) {
    client = new MongoClient(env.MONGODB_URI);
    await client.connect();
    db = client.db("sample_mflix"); // change name if needed
  }
  return db;
}

export async function onRequestGet(context) {
  const db = await connectDB(context.env);
  const users = await db.collection("movies").find().toArray();
  return new Response(JSON.stringify(users), {
    headers: { "Content-Type": "application/json" },
  });
}
