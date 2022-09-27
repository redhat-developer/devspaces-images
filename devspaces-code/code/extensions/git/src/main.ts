/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as nls from 'vscode-nls';
const localize = nls.loadMessageBundle();

import { env, ExtensionContext, workspace, window, Disposable, commands, Uri, version as vscodeVersion, WorkspaceFolder } from 'vscode';
import { findGit, Git, IGit } from './git';
import { Model } from './model';
import { CommandCenter } from './commands';
import { GitFileSystemProvider } from './fileSystemProvider';
import { GitDecorations } from './decorationProvider';
import { Askpass } from './askpass';
import { toDisposable, filterEvent, eventToPromise } from './util';
import TelemetryReporter from '@vscode/extension-telemetry';
import { GitExtension } from './api/git';
import { GitProtocolHandler } from './protocolHandler';
import { GitExtensionImpl } from './api/extension';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { GitTimelineProvider } from './timelineProvider';
import { registerAPICommands } from './api/api1';
import { TerminalEnvironmentManager } from './terminal';
import { OutputChannelLogger } from './log';
import { createIPCServer, IPCServer } from './ipc/ipcServer';
import { GitEditor } from './gitEditor';
import { GitPostCommitCommandsProvider } from './postCommitCommands';
import { GitEditSessionIdentityProvider } from './editSessionIdentityProvider';

const deactivateTasks: { (): Promise<any> }[] = [];

export async function deactivate(): Promise<any> {
	for (const task of deactivateTasks) {
		await task();
	}
}

async function createModel(context: ExtensionContext, outputChannelLogger: OutputChannelLogger, telemetryReporter: TelemetryReporter, disposables: Disposable[]): Promise<Model> {
	const pathValue = workspace.getConfiguration('git').get<string | string[]>('path');
	let pathHints = Array.isArray(pathValue) ? pathValue : pathValue ? [pathValue] : [];

	const { isTrusted, workspaceFolders = [] } = workspace;
	const excludes = isTrusted ? [] : workspaceFolders.map(f => path.normalize(f.uri.fsPath).replace(/[\r\n]+$/, ''));

	if (!isTrusted && pathHints.length !== 0) {
		// Filter out any non-absolute paths
		pathHints = pathHints.filter(p => path.isAbsolute(p));
	}

	const info = await findGit(pathHints, gitPath => {
		outputChannelLogger.logInfo(localize('validating', "Validating found git in: {0}", gitPath));
		if (excludes.length === 0) {
			return true;
		}

		const normalized = path.normalize(gitPath).replace(/[\r\n]+$/, '');
		const skip = excludes.some(e => normalized.startsWith(e));
		if (skip) {
			outputChannelLogger.logInfo(localize('skipped', "Skipped found git in: {0}", gitPath));
		}
		return !skip;
	});

	let ipcServer: IPCServer | undefined = undefined;

	try {
		ipcServer = await createIPCServer(context.storagePath);
	} catch (err) {
		outputChannelLogger.logError(`Failed to create git IPC: ${err}`);
	}

	const askpass = new Askpass(ipcServer);
	disposables.push(askpass);

	const gitEditor = new GitEditor(ipcServer);
	disposables.push(gitEditor);

	const environment = { ...askpass.getEnv(), ...gitEditor.getEnv(), ...ipcServer?.getEnv() };
	const terminalEnvironmentManager = new TerminalEnvironmentManager(context, [askpass, gitEditor, ipcServer]);
	disposables.push(terminalEnvironmentManager);

	outputChannelLogger.logInfo(localize('using git', "Using git {0} from {1}", info.version, info.path));

	const git = new Git({
		gitPath: info.path,
		userAgent: `git/${info.version} (${(os as any).version?.() ?? os.type()} ${os.release()}; ${os.platform()} ${os.arch()}) vscode/${vscodeVersion} (${env.appName})`,
		version: info.version,
		env: environment,
	});
	const model = new Model(git, askpass, context.globalState, outputChannelLogger, telemetryReporter);
	disposables.push(model);

	const onRepository = () => commands.executeCommand('setContext', 'gitOpenRepositoryCount', `${model.repositories.length}`);
	model.onDidOpenRepository(onRepository, null, disposables);
	model.onDidCloseRepository(onRepository, null, disposables);
	onRepository();

	const onOutput = (str: string) => {
		const lines = str.split(/\r?\n/mg);

		while (/^\s*$/.test(lines[lines.length - 1])) {
			lines.pop();
		}

		outputChannelLogger.log(lines.join('\n'));
	};
	git.onOutput.addListener('log', onOutput);
	disposables.push(toDisposable(() => git.onOutput.removeListener('log', onOutput)));

	const cc = new CommandCenter(git, model, outputChannelLogger, telemetryReporter);
	disposables.push(
		cc,
		new GitFileSystemProvider(model),
		new GitDecorations(model),
		new GitTimelineProvider(model, cc),
		new GitEditSessionIdentityProvider(model)
	);

	const postCommitCommandsProvider = new GitPostCommitCommandsProvider();
	model.registerPostCommitCommandsProvider(postCommitCommandsProvider);

	checkGitVersion(info);

	return model;
}

async function isGitRepository(folder: WorkspaceFolder): Promise<boolean> {
	if (folder.uri.scheme !== 'file') {
		return false;
	}

	const dotGit = path.join(folder.uri.fsPath, '.git');

	try {
		const dotGitStat = await new Promise<fs.Stats>((c, e) => fs.stat(dotGit, (err, stat) => err ? e(err) : c(stat)));
		return dotGitStat.isDirectory();
	} catch (err) {
		return false;
	}
}

async function warnAboutMissingGit(): Promise<void> {
	const config = workspace.getConfiguration('git');
	const shouldIgnore = config.get<boolean>('ignoreMissingGitWarning') === true;

	if (shouldIgnore) {
		return;
	}

	if (!workspace.workspaceFolders) {
		return;
	}

	const areGitRepositories = await Promise.all(workspace.workspaceFolders.map(isGitRepository));

	if (areGitRepositories.every(isGitRepository => !isGitRepository)) {
		return;
	}

	const download = localize('downloadgit', "Download Git");
	const neverShowAgain = localize('neverShowAgain', "Don't Show Again");
	const choice = await window.showWarningMessage(
		localize('notfound', "Git not found. Install it or configure it using the 'git.path' setting."),
		download,
		neverShowAgain
	);

	if (choice === download) {
		commands.executeCommand('vscode.open', Uri.parse('https://aka.ms/vscode-download-git'));
	} else if (choice === neverShowAgain) {
		await config.update('ignoreMissingGitWarning', true, true);
	}
}

export async function _activate(context: ExtensionContext): Promise<GitExtensionImpl> {
	const disposables: Disposable[] = [];
	context.subscriptions.push(new Disposable(() => Disposable.from(...disposables).dispose()));

	const outputChannelLogger = new OutputChannelLogger();
	disposables.push(outputChannelLogger);

	const { name, version, aiKey } = require('../package.json') as { name: string; version: string; aiKey: string };
	const telemetryReporter = new TelemetryReporter(name, version, aiKey);
	deactivateTasks.push(() => telemetryReporter.dispose());

	const config = workspace.getConfiguration('git', null);
	const enabled = config.get<boolean>('enabled');

	if (!enabled) {
		const onConfigChange = filterEvent(workspace.onDidChangeConfiguration, e => e.affectsConfiguration('git'));
		const onEnabled = filterEvent(onConfigChange, () => workspace.getConfiguration('git', null).get<boolean>('enabled') === true);
		const result = new GitExtensionImpl();

		eventToPromise(onEnabled).then(async () => result.model = await createModel(context, outputChannelLogger, telemetryReporter, disposables));
		return result;
	}

	try {
		const model = await createModel(context, outputChannelLogger, telemetryReporter, disposables);
		return new GitExtensionImpl(model);
	} catch (err) {
		if (!/Git installation not found/.test(err.message || '')) {
			throw err;
		}

		console.warn(err.message);
		outputChannelLogger.logWarning(err.message);

		/* __GDPR__
			"git.missing" : {
				"owner": "lszomoru"
			}
		*/
		telemetryReporter.sendTelemetryEvent('git.missing');

		commands.executeCommand('setContext', 'git.missing', true);
		warnAboutMissingGit();

		return new GitExtensionImpl();
	} finally {
		disposables.push(new GitProtocolHandler(outputChannelLogger));
	}
}

let _context: ExtensionContext;
export function getExtensionContext(): ExtensionContext {
	return _context;
}

export async function activate(context: ExtensionContext): Promise<GitExtension> {
	_context = context;

	const result = await _activate(context);
	context.subscriptions.push(registerAPICommands(result));
	return result;
}

async function checkGitv1(info: IGit): Promise<void> {
	const config = workspace.getConfiguration('git');
	const shouldIgnore = config.get<boolean>('ignoreLegacyWarning') === true;

	if (shouldIgnore) {
		return;
	}

	if (!/^[01]/.test(info.version)) {
		return;
	}

	const update = localize('updateGit', "Update Git");
	const neverShowAgain = localize('neverShowAgain', "Don't Show Again");

	const choice = await window.showWarningMessage(
		localize('git20', "You seem to have git {0} installed. Code works best with git >= 2", info.version),
		update,
		neverShowAgain
	);

	if (choice === update) {
		commands.executeCommand('vscode.open', Uri.parse('https://aka.ms/vscode-download-git'));
	} else if (choice === neverShowAgain) {
		await config.update('ignoreLegacyWarning', true, true);
	}
}

async function checkGitWindows(info: IGit): Promise<void> {
	if (!/^2\.(25|26)\./.test(info.version)) {
		return;
	}

	const config = workspace.getConfiguration('git');
	const shouldIgnore = config.get<boolean>('ignoreWindowsGit27Warning') === true;

	if (shouldIgnore) {
		return;
	}

	const update = localize('updateGit', "Update Git");
	const neverShowAgain = localize('neverShowAgain', "Don't Show Again");
	const choice = await window.showWarningMessage(
		localize('git2526', "There are known issues with the installed Git {0}. Please update to Git >= 2.27 for the git features to work correctly.", info.version),
		update,
		neverShowAgain
	);

	if (choice === update) {
		commands.executeCommand('vscode.open', Uri.parse('https://aka.ms/vscode-download-git'));
	} else if (choice === neverShowAgain) {
		await config.update('ignoreWindowsGit27Warning', true, true);
	}
}

async function checkGitVersion(info: IGit): Promise<void> {
	await checkGitv1(info);

	if (process.platform === 'win32') {
		await checkGitWindows(info);
	}
}
