const PlayerStats = require("../../models/PlayerStatsSchema");

const {
    ApplicationCommandOptionType,
    EmbedBuilder,
    ButtonBuilder,
    ActionRowBuilder,
    ButtonStyle,
} = require("discord.js");


function sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
    name: "raid",
    description: "Raid with a party",
    dm_permission: false,
    options: [
        {
            name: "target-user-one",
            description: "Select a user to invite",
            type: ApplicationCommandOptionType.User,
            required: true,
        },
        {
            name: "target-user-two",
            description: "Select a user to invite",
            type: ApplicationCommandOptionType.User,
            required: false,
        },
        {
            name: "target-user-three",
            description: "Select a user to invite",
            type: ApplicationCommandOptionType.User,
            required: false,
        },
    ],

    // Party System for the players
    // need to add in a variable in mongo for isParty
    callback: async (client, interaction) => {
        try {
            /**
             * Creates a party of X given players, minimum of 2
             * The party members will be referenced with array indices
             * 0-3
             */
            const embed = new EmbedBuilder()
            .setTitle("Rock Paper Scissors")
            .setColor("Yellow")
            .setTimestamp();

            const party = [
                interaction.user,
                interaction.options.getUser("target-user-one"),
                interaction.options.getUser("target-user-two"),
                interaction.options.getUser("target-user-three"),
            ];

            let partyStatus = [
                { health: 10, evasion: 25, attack: 1, status: true },
                { health: 10, evasion: 25, attack: 1, status: true },
                { health: 10, evasion: 25, attack: 1, status: true },
                { health: 10, evasion: 25, attack: 1, status: true },
            ];

            let living = 0, players = [];

            console.log(`${party}`);

            for (const key of party.keys()) {
                if (party[key] != null) {
                    players.push(key);
                    living++;
                }
            }

            
            let boss = [
                {name: 'Small Slime', health: living * 10, evasion: 25, attack: 2, status: true},
            ];

            console.log(`Player locations: ${players}`);
            console.log(`living people: ${living}`);
            for (const member of players) {
                console.log(`${party[member]}`);
                await sleep(1000);
            }            

            do {

                // Display everyone's status
                for(const member of players) {
                    console.log(`${party[member]} has ${partyStatus[member].health}`);
                }
                
                console.log(boss.health);
                console.log(boss.name);
                console.log(`${boss.name} has ${boss.health}`);

                // Players Turn
                for(const member of players) {
                    boss.health -= party[member].attack;
                    console.log(`${boss.name} got attacked by ${party[member]}! Health Remaining ${boss.health}`);
                }

                // Bosses Turn
                target = players[Math.floor(Math.random()*(living))];
                partyStatus[target].health -= boss.attack;
                console.log(`${party[target]} got attacked by ${boss.name}! Health Remaining ${partyStatus[target].health}`);

                // End conditions
                if(partyStatus[target].health == 0){
                    partyStatus[target].status = false;

                    // Removes dead players from turn order
                    for (const key of party.keys()) {
                        if (party[key] != null || party[key].status == true) {
                            players.push(key);
                        }
                    }
                    living--;
                    if(living == 1){
                        break;
                    }
                }

                await sleep(2000);
            } while (living == 0 || boss.health == 0);



            /**
             * Phase 1:
             * Raid Boss has X hp
             * Raid Boss has 3 attack
             *      single target, x player x chance
             *      aoe targe, x damage
             * 
             * targeting randomly / or target first player
             *          
             * 
             * Players will +1 atk
             * Everyone evade chance
             * 
             * game ends when everyone 0 or boss 0
             * 
             */

            /* 
            * 
            * 
            * 
            * 
            * 
            * 
            * Phase 2:  Cementing understanding of deeper mechanics   
            * Add floors + mobs
            * 
            * 
            * furture, button for play style, attack defense support
            * 
            * attack more damage                   +1 atk
            * threat get attacked more                         aggro + 50%
            * support less likely to get attack    +1 health    aggro + 10%    
            * 
            * Phase 3:
            * Items   
            */

        } catch (error) {
            console.error("Error with /raid command:", error);
        }
    },
};