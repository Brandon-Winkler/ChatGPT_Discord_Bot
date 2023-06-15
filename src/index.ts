import { Client, IntentsBitField, Message } from 'discord.js';
import { Configuration, OpenAIApi, ChatCompletionRequestMessage } from 'openai';
import 'dotenv/config'

//create new client for the bot
const bot = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ]       
});

//event listener to notify the bot is online
bot.on('ready', () => {
    console.log('the bot is online')
})

//configure bot to use openai library so it can use chatgpt
const configuration = new Configuration({
    apiKey: process.env.OPENAI_KEY,
})
const openai = new OpenAIApi(configuration);

bot.on('messageCreate', async (message: Message) => {
    //prevent bot from responding to itself and channels not included in the channel ids
    if(message.author.bot) return;
    const channelIds: string[] = process.env.CHANNEL_IDS?.split(',') || [];
    if (!channelIds.includes(message.channel.id)) return;

    //add prefix so that people don't active bot on accident
    if(!message.content.startsWith('/')) return;
    //create log array for bot to reference messages and push content to array
    let conversationLog: ChatCompletionRequestMessage[] = [{role: "user", content: "You are a friendly chat bot."}];
    conversationLog.push({
        role: "user",
        content: message.content,
    });

    //notify user the bot is responding
    await message.channel.sendTyping();

    //reference up to 15 previous messages
    let prevMessages = await message.channel.messages.fetch({ limit: 15 });
    prevMessages.reverse();

    prevMessages.forEach((msg: Message) => {
        if (msg.author.id !== message.author.id) return;

        conversationLog.push({
        role: 'user',
        content: msg.content,
        });
    });

    //create response
    const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: conversationLog,
    })
    const replyMessage = response.data.choices[0].message;

    //check to see if  reply is not null, if not then send the response
    if (replyMessage) {
        message.reply(replyMessage);
    }
})

//log bot into discord
bot.login(process.env.DISCORD_TOKEN);
