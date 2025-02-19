import {
	type ContextMenuCommandSuccessPayload,
	Listener,
	LogLevel,
} from '@sapphire/framework';
import type { Logger } from '@sapphire/plugin-logger';
import { logSuccessCommand } from '../../../lib/discord/utils.js';

export class UserListener extends Listener {
	public override async run(payload: ContextMenuCommandSuccessPayload) {
		await logSuccessCommand(payload);
	}

	public override onLoad() {
		this.enabled = (this.container.logger as Logger).level <= LogLevel.Debug;
		return super.onLoad();
	}
}
