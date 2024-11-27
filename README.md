# telegram-participants-export

A simple tool for exporting Telegram participants.

Currently, only the supergroups are supported.

## Requirements

- [`bun`](https://bun.sh/)
- Writable local filesystem (we are using [tdlib](https://core.telegram.org/tdlib) which stores its data in the SQLite database).

## Setup

1. Clone the repo.

2. Install dependencies.

   ```bash
   bun install
   ```

3. Prepare the configuration parameters.

   ```bash
   export TG_API_ID="12345678" # Telegram API ID
   export TG_API_HASH="00000000000000000000000000000000" # Telegram API Hash
   export TG_BOT_TOKEN="1234567890:Qwertyqwertyqwertyqwertyqwertyqwert" # The bot token from BotFather
   export TG_BOT_ADMIN_USER_ID="1234567890" # Your User ID
   export EXPORTS_DIR="exports" # Where to place the export files
   ```

   Save the snippet above in a file called `.env` and load them into your shell:

   ```bash
   source .env
   ```

   If you are on Windows - use another way to set the environment variables.

4. Run the code.

   ```bash
   bun run index.ts
   ```

## Usage

1. Add the bot to the group you want to export the members for.
2. Send the `/export` command to the group chat you want to export the members from.
3. Grab the list of the exported users on the server.
