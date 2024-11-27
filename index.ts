import tdl from "tdl";
import { getTdjson } from "prebuilt-tdlib";
import type { Update } from "tdlib-types";
import fs from "node:fs/promises";
import path from "node:path";

tdl.configure({ tdjson: getTdjson() });

const env = (key: string): string => {
  const val = process.env[key];
  if (val === undefined) {
    throw new Error(`The env var ${key} is not set.`);
  }
  return val;
};

const TG_API_ID = env("TG_API_ID");
const TG_API_HASH = env("TG_API_HASH");
const TG_BOT_TOKEN = env("TG_BOT_TOKEN");
const TG_BOT_ADMIN_USER_ID = env("TG_BOT_ADMIN_USER_ID");
const EXPORTS_DIR = env("EXPORTS_DIR");

const client = tdl.createClient({
  apiId: Number(TG_API_ID),
  apiHash: TG_API_HASH!,
});

const botAdminUserId = Number(TG_BOT_ADMIN_USER_ID);
console.log("Admin ID:", botAdminUserId);

client.on("error", console.error);

type MemberInfo = {
  userId: number;
  invitedByUserId: number;
};

type WriteExportParams = {
  id: string;
  peerId: number;
  members: MemberInfo[];
};

await fs.mkdir(EXPORTS_DIR, { recursive: true });

const writeExport = async (params: WriteExportParams) => {
  await fs.writeFile(
    path.join(EXPORTS_DIR, `${params.id}.json`),
    JSON.stringify(params),
    {
      flag: "wx",
    }
  );
};

const exportMembers = async (chatId: number) => {
  const chat = await client.invoke({ _: "getChat", chat_id: chatId });

  if (chat.type._ !== "chatTypeSupergroup") {
    throw new Error("not a supergroup");
  }

  let offset: undefined | number;

  const membersList: MemberInfo[] = [];

  while (true) {
    const page = await client.invoke({
      _: "getSupergroupMembers",
      supergroup_id: chat.type.supergroup_id,
      filter: { _: "supergroupMembersFilterSearch", query: "" },
      limit: 200,
      offset,
    });

    const pageLen = page.members.length;
    if (pageLen === 0) {
      break;
    }

    offset = (offset || 0) + pageLen;

    for (const member of page.members) {
      if (member.member_id._ !== "messageSenderUser") {
        continue;
      }
      if (member.status._ !== "chatMemberStatusMember") {
        continue;
      }

      membersList.push({
        userId: member.member_id.user_id,
        invitedByUserId: member.inviter_user_id,
      });
    }
  }

  await writeExport({
    id: `${Date.now()}-${chatId}`,
    peerId: chat.type.supergroup_id,
    members: membersList,
  });
};

const handleUpdate = async (update: Update) => {
  if (update._ === "updateNewMessage") {
    const content = update.message.content;
    if (content._ === "messageText") {
      if (content.text.text === "/export") {
        const chat_id = update.message.chat_id;

        if (
          update.message.sender_id._ === "messageSenderUser" &&
          update.message.sender_id.user_id === botAdminUserId
        ) {
          await exportMembers(chat_id);
        } else {
          client.invoke({
            _: "sendMessage",
            chat_id,
            reply_to: {
              _: "inputMessageReplyToMessage",
              message_id: update.message.id,
            },
            input_message_content: {
              _: "inputMessageText",
              text: {
                _: "formattedText",
                text: "Not allowed: not the bot admin",
              },
            },
          });
        }
      } else {
        console.log(`Message: ${content.text.text}`);
      }
    }
  }
};

async function main() {
  await client.loginAsBot(TG_BOT_TOKEN);

  const me = await client.invoke({ _: "getMe" });
  console.log("Bot ID:", me.id);

  for await (const update of client.iterUpdates()) {
    try {
      await handleUpdate(update);
    } catch (error) {
      console.error(error);
    }
  }
}

process.on("SIGINT", () => {
  console.log("Ctrl-C was pressed");
  process.exit();
});

main().catch(console.error).finally(client.close);
