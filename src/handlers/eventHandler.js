const path = require("path");
const getAllFiles = require("../utils/getAllFiles");
const PlayerStats = require("../models/PlayerStatsSchema");

module.exports = (client) => {
  const eventFolders = getAllFiles(path.join(__dirname, "..", "events"), true);

  for (const eventFolder of eventFolders) {
    const eventFiles = getAllFiles(eventFolder);
    eventFiles.sort((a, b) => a > b);

    const eventName = eventFolder.replace(/\\/g, "/").split("/").pop();

    client.on(eventName, async (arg) => {
      for (const eventFile of eventFiles) {
        const eventFunction = require(eventFile);
        await eventFunction(client, arg);
      }
    });
  }

  // Handler to register users to DB after joining
  module.exports = (client) => {
    client.on("guildMemberAdd", async (member) => {

      // Check if the user already exists in the database
      const userExists = await PlayerStats.findOne({
        userId: member.id,
        guildId: member.guild.id,
      });

      if (!userExists) {
        // If the user does not exist, create a new entry
        const newUser = new PlayerStats({
          userId: member.id,
          guildId: member.guild.id,
        });

        await newUser.save();
        console.log(
          `Registered new user: ${member.id} in guild: ${member.guild.id}`
        );
      } else {
        console.log(
          `User: ${member.id} already registered in guild: ${member.guild.id}`
        );
      }
    });
  };
};
