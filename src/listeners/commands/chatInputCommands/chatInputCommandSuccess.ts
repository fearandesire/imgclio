import { logSuccessCommand } from '@/lib/discord/utils.js';
import {
	type ChatInputCommandSuccessPayload,
	Listener,
	LogLevel,
} from '@sapphire/framework';
import type { Logger } from '@sapphire/plugin-logger';

export class UserListener extends Listener {
	public override run(payload: ChatInputCommandSuccessPayload) {
		logSuccessCommand(payload);
	}

	public override onLoad() {
		this.enabled = (this.container.logger as Logger).level <= LogLevel.Debug;
		return super.onLoad();
	}
}
