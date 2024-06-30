const {
  ApplicationCommandOptionType,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} = require("discord.js");

class Party {
  constructor(leader) {
    this.leader = leader;
    this.members = [leader];
    this.maxSize = 4;
    this.invitedUsers = new Set();
  }

  addMember(userId) {
    if (this.members.length < this.maxSize && !this.members.includes(userId)) {
      this.members.push(userId);
      return true;
    }
    return false;
  }

  removeMember(userId) {
    const index = this.members.indexOf(userId);
    if (index > -1) {
      this.members.splice(index, 1);
      if (userId === this.leader && this.members.length > 0) {
        this.leader = this.members[0];
      }
      return true;
    }
    return false;
  }

  isFull() {
    return this.members.length === this.maxSize;
  }

  inviteUser(userId) {
    this.invitedUsers.add(userId);
    setTimeout(() => {
      this.invitedUsers.delete(userId);
    }, 60000); // Remove invitation after 1 minute
  }

  isInvited(userId) {
    return this.invitedUsers.has(userId);
  }
}

const parties = new Map();

function createParty(userId) {
  if (!parties.has(userId) && !getPartyByMember(userId)) {
    const newParty = new Party(userId);
    parties.set(userId, newParty);
    return newParty;
  }
  return null;
}

function joinParty(partyLeaderId, userId) {
  const party = parties.get(partyLeaderId);
  if (party && party.isInvited(userId) && party.addMember(userId)) {
    party.invitedUsers.delete(userId);
    return party;
  }
  return null;
}

function leaveParty(partyLeaderId, userId) {
  const party = parties.get(partyLeaderId);
  if (party && party.removeMember(userId)) {
    if (party.members.length === 0) {
      parties.delete(partyLeaderId);
    } else if (userId === partyLeaderId) {
      // Update the parties Map with the new leader
      parties.delete(partyLeaderId);
      parties.set(party.leader, party);
    }
    return true;
  }
  return false;
}

function disbandParty(partyLeaderId) {
  return parties.delete(partyLeaderId);
}

function getPartyByMember(userId) {
  return Array.from(parties.values()).find((p) => p.members.includes(userId));
}

module.exports = {
  Party,
  createParty,
  joinParty,
  leaveParty,
  disbandParty,
  getPartyByMember,
  parties,

  // Command properties
  name: "party",
  description: "Manage your party for the game",
  dm_permission: false,
  options: [
    {
      name: "action",
      description: "Choose an action for your party",
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        { name: "Create", value: "create" },
        { name: "Join", value: "join" },
        { name: "Leave", value: "leave" },
        { name: "Disband", value: "disband" },
        { name: "Info", value: "info" },
        { name: "Invite", value: "invite" },
        { name: "Kick", value: "kick" },
      ],
    },
    {
      name: "target-user",
      description: "The user to invite or kick",
      type: ApplicationCommandOptionType.User,
      required: false,
    },
  ],

  callback: async (client, interaction) => {
    try {
      const action = interaction.options.getString("action");
      const targetUser = interaction.options.getUser("target-user");

      const embed = new EmbedBuilder().setColor("Blue").setTimestamp();

      switch (action) {
        case "create":
          const existingParty = getPartyByMember(interaction.user.id);
          if (existingParty) {
            embed
              .setTitle("Party Creation Failed")
              .setDescription(
                `You are already in a party. Leave your current party before creating a new one.`
              );
          } else {
            const newParty = createParty(interaction.user.id);
            if (newParty) {
              embed
                .setTitle("Party Created")
                .setDescription(`You have created a new party`);
            } else {
              embed
                .setTitle("Party Creation Failed")
                .setDescription(`You already have a party.`);
            }
          }
          break;

        case "join":
          const userParty = getPartyByMember(interaction.user.id);
          if (userParty) {
            embed
              .setTitle("Join Failed")
              .setDescription(`You are already in a party.`);
          } else {
            const partyToJoin = Array.from(parties.values()).find((p) =>
              p.isInvited(interaction.user.id)
            );
            if (partyToJoin) {
              const joinedParty = joinParty(
                partyToJoin.leader,
                interaction.user.id
              );
              if (joinedParty) {
                embed
                  .setTitle("Party Joined")
                  .setDescription(
                    `You have joined <@${partyToJoin.leader}>'s party.`
                  );
              } else {
                embed
                  .setTitle("Join Failed")
                  .setDescription(
                    `Unable to join the party. It might be full.`
                  );
              }
            } else {
              embed
                .setTitle("Join Failed")
                .setDescription(
                  `You haven't been invited to any party or the invitation has expired.`
                );
            }
          }
          break;

        case "leave":
          const party = getPartyByMember(interaction.user.id);
          if (party) {
            const leftParty = leaveParty(party.leader, interaction.user.id);
            if (leftParty) {
              embed
                .setTitle("Party Left")
                .setDescription(`You have left the party.`);
            } else {
              embed
                .setTitle("Leave Failed")
                .setDescription(
                  `Unable to leave the party. You might not be in the party.`
                );
            }
          } else {
            embed
              .setTitle("Leave Failed")
              .setDescription(`You are not in a party.`);
          }
          break;

        case "disband":
          const disbanded = disbandParty(interaction.user.id);
          if (disbanded) {
            embed
              .setTitle("Party Disbanded")
              .setDescription(`Your party has been disbanded.`);
          } else {
            embed
              .setTitle("Disband Failed")
              .setDescription(`You do not have a party to disband.`);
          }
          break;

        case "info":
          const userInfoParty = getPartyByMember(interaction.user.id);
          if (userInfoParty) {
            embed
              .setTitle("Party Information")
              .setDescription(
                `Leader: <@${
                  userInfoParty.leader
                }>\nMembers: ${userInfoParty.members
                  .map((id) => `<@${id}>`)
                  .join(", ")}`
              );
          } else {
            embed
              .setTitle("No Party Found")
              .setDescription(`You are not in a party.`);
          }
          break;

        case "invite":
          if (!targetUser) {
            embed
              .setTitle("Invite Failed")
              .setDescription(`Please specify a user to invite.`);
          } else {
            const leaderParty = parties.get(interaction.user.id);
            if (leaderParty) {
              if (leaderParty.isFull()) {
                embed
                  .setTitle("Invite Failed")
                  .setDescription(`Your party is already full.`);
              } else {
                leaderParty.inviteUser(targetUser.id);
                embed
                  .setTitle("Invitation Sent")
                  .setDescription(
                    `<@${targetUser.id}> has been invited to your party. They have 1 minute to join using /party join.`
                  );
              }
            } else {
              embed
                .setTitle("Invite Failed")
                .setDescription(`You need to create a party first.`);
            }
          }
          break;

        case "kick":
          if (!targetUser) {
            embed
              .setTitle("Kick Failed")
              .setDescription(`Please specify a user to kick.`);
          } else {
            const kickerParty = getPartyByMember(interaction.user.id);
            if (kickerParty) {
              if (kickerParty.leader !== interaction.user.id) {
                embed
                  .setTitle("Kick Failed")
                  .setDescription(
                    `Only the party leader can initiate a kick vote.`
                  );
              } else if (!kickerParty.members.includes(targetUser.id)) {
                embed
                  .setTitle("Kick Failed")
                  .setDescription(`The specified user is not in your party.`);
              } else if (kickerParty.members.length === 2) {
                // If there are only 2 members, kick immediately
                kickerParty.removeMember(targetUser.id);
                embed
                  .setTitle("Player Kicked")
                  .setDescription(
                    `<@${targetUser.id}> has been kicked from the party.`
                  );
              } else {
                // Initiate kick vote
                const votingMembers = kickerParty.members.filter(
                  (id) => id !== interaction.user.id && id !== targetUser.id
                );
                const voteEmbed = new EmbedBuilder()
                  .setColor("Red")
                  .setTitle("Kick Vote")
                  .setDescription(
                    `Vote to kick <@${targetUser.id}> from the party.`
                  );

                const yesButton = new ButtonBuilder()
                  .setCustomId("kick_yes")
                  .setLabel("Yes")
                  .setStyle(ButtonStyle.Danger);

                const noButton = new ButtonBuilder()
                  .setCustomId("kick_no")
                  .setLabel("No")
                  .setStyle(ButtonStyle.Secondary);

                const row = new ActionRowBuilder().addComponents(
                  yesButton,
                  noButton
                );

                const voteMessage = await interaction.channel.send({
                  embeds: [voteEmbed],
                  components: [row],
                });

                const collector = voteMessage.createMessageComponentCollector({
                  time: 30000,
                });

                let yesVotes = 0;
                const requiredVotes = votingMembers.length;

                collector.on("collect", async (i) => {
                  if (votingMembers.includes(i.user.id)) {
                    if (i.customId === "kick_yes") {
                      yesVotes++;
                    }
                    await i.deferUpdate();

                    if (yesVotes === requiredVotes) {
                      collector.stop("kick");
                    }
                  } else {
                    await i.reply({
                      content: "You're not eligible to vote on this kick.",
                      ephemeral: true,
                    });
                  }
                });

                collector.on("end", (collected, reason) => {
                  if (reason === "kick") {
                    kickerParty.removeMember(targetUser.id);
                    interaction.channel.send(
                      `<@${targetUser.id}> has been kicked from the party.`
                    );
                  } else {
                    interaction.channel.send(
                      `The vote to kick <@${targetUser.id}> has failed.`
                    );
                  }
                  voteMessage.edit({ components: [] });
                });

                embed
                  .setTitle("Kick Vote Initiated")
                  .setDescription(
                    `A vote to kick <@${targetUser.id}> has been started.`
                  );
              }
            } else {
              embed
                .setTitle("Kick Failed")
                .setDescription(`You are not in a party.`);
            }
          }
          break;

        default:
          embed
            .setTitle("Invalid Action")
            .setDescription(`The action you provided is not valid.`);
      }

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "An error occurred while processing your request.",
        ephemeral: true,
      });
    }
  },
};
