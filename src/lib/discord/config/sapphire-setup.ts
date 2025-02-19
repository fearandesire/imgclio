import {
	ApplicationCommandRegistries,
	RegisterBehavior,
} from '@sapphire/framework';
import '@sapphire/plugin-editable-commands/register';
import '@sapphire/plugin-logger/register';
import '@sapphire/plugin-subcommands/register';
import { inspect } from 'node:util';
import * as colorette from 'colorette';

// Set default behavior to bulk overwrite
ApplicationCommandRegistries.setDefaultBehaviorWhenNotIdentical(
	RegisterBehavior.BulkOverwrite,
);

// Enable colorette
colorette.createColors({ useColor: true });

// Set default inspection depth
inspect.defaultOptions.depth = 2;
