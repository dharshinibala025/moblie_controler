process.env.MONGOMS_VERSION = "6.0.0";
process.env.MONGOMS_DOWNLOAD_URL = "";

const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;

const connect = async () => {
  mongoServer = await MongoMemoryServer.create({
    binary: {
      version: "6.0.0",
      os: {
        os: process.platform,
        dist: "win32",
        release: "2019",
      },
    },
  });
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  return uri;
};

const closeDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
};

const clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};

module.exports = { connect, closeDatabase, clearDatabase };
