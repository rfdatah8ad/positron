/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Posit, PBC.
 *--------------------------------------------------------------------------------------------*/

import React = require('react');
import { localize } from 'vs/nls';
import { usePositronTopBarContext } from 'vs/workbench/browser/parts/positronTopBar/positronTopBarContext';
import { TopBarMenuButton } from 'vs/workbench/browser/parts/positronTopBar/components/topBarMenuButton';
import { URI } from 'vs/base/common/uri';
import { isMacintosh } from 'vs/base/common/platform';
import { Action, IAction, Separator } from 'vs/base/common/actions';
import { IRecent, isRecentFolder, isRecentWorkspace } from 'vs/platform/workspaces/common/workspaces';
import { IOpenRecentAction } from 'vs/workbench/browser/parts/titlebar/menubarControl';
import { IWindowOpenable } from 'vs/platform/window/common/window';
import { unmnemonicLabel } from 'vs/base/common/labels';
import { PositronTopBarState } from 'vs/workbench/browser/parts/positronTopBar/positronTopBarState';
import { commandAction } from 'vs/workbench/browser/parts/positronTopBar/actions';
import { IsMacNativeContext } from 'vs/platform/contextkey/common/contextkeys';

const MAX_MENU_RECENT_ENTRIES = 10;

const kOpenFile = 'workbench.action.files.openFile';
const kOpenFileFolder = 'workbench.action.files.openFileFolder';
const kOpenFolder = 'workbench.action.files.openFolder';
const kOpenRecent = 'workbench.action.openRecent';
const kClearRecentFiles = 'workbench.action.clearRecentFiles';

export const kOpenMenuCommands = [
	kOpenFile,
	kOpenFileFolder,
	kOpenFolder,
	kOpenRecent,
	kClearRecentFiles
];

/**
 * TopBarOpenMenu component.
 * @returns The component.
 */
export const TopBarOpenMenu = () => {

	// Hooks.
	const context = usePositronTopBarContext()!;

	// fetch actions when menu is shown
	const actions = async () => {

		const actions: IAction[] = [];
		const addAction = (id: string, label?: string) => {
			const action = commandAction(id, label, context);
			if (action) {
				actions.push(action);
			}
		};

		// core open actions
		if (IsMacNativeContext.getValue(context.contextKeyService)) {
			addAction(kOpenFileFolder, localize('positronOpenFile', "Open File..."));
		} else {
			addAction(kOpenFile);
		}

		addAction(kOpenFolder, localize('positronOpenWorkspace', "Open Workspace..."));
		actions.push(new Separator());

		// recent files/workspaces actions
		const recent = await context?.workspacesService.getRecentlyOpened();
		if (recent && context) {
			const recentActions = [
				...recentMenuActions(recent.workspaces, context),
				...recentMenuActions(recent.files, context)
			];
			if (recentActions.length > 0) {
				actions.push(...recentActions);
				actions.push(new Separator());
				addAction(kOpenRecent);
				actions.push(new Separator());
				addAction(kClearRecentFiles);
			}
		}
		return actions;
	};

	// compontent
	return (
		<TopBarMenuButton
			actions={actions}
			iconId='positron-open'
			tooltip={localize('positronOpenFileWorkspace', "Open File/Workspace")}
		/>
	);
};

function recentMenuActions(recent: IRecent[], context: PositronTopBarState,) {
	const actions: IAction[] = [];
	if (recent.length > 0) {
		for (let i = 0; i < MAX_MENU_RECENT_ENTRIES && i < recent.length; i++) {
			actions.push(createOpenRecentMenuAction(context, recent[i]));
		}
		actions.push(new Separator());
	}
	return actions;
}

// based on code in menubarControl.ts
function createOpenRecentMenuAction(context: PositronTopBarState, recent: IRecent): IOpenRecentAction {

	let label: string;
	let uri: URI;
	let commandId: string;
	let openable: IWindowOpenable;
	const remoteAuthority = recent.remoteAuthority;

	if (isRecentFolder(recent)) {
		uri = recent.folderUri;
		label = recent.label || context.labelService.getWorkspaceLabel(uri, { verbose: true });
		commandId = 'openRecentFolder';
		openable = { folderUri: uri };
	} else if (isRecentWorkspace(recent)) {
		uri = recent.workspace.configPath;
		label = recent.label || context.labelService.getWorkspaceLabel(recent.workspace, { verbose: true });
		commandId = 'openRecentWorkspace';
		openable = { workspaceUri: uri };
	} else {
		uri = recent.fileUri;
		label = recent.label || context.labelService.getUriLabel(uri);
		commandId = 'openRecentFile';
		openable = { fileUri: uri };
	}

	const ret: IAction = new Action(commandId, unmnemonicLabel(label), undefined, undefined, event => {
		const browserEvent = event as KeyboardEvent;
		const openInNewWindow = event && ((!isMacintosh && (browserEvent.ctrlKey || browserEvent.shiftKey)) || (isMacintosh && (browserEvent.metaKey || browserEvent.altKey)));

		return context.hostService.openWindow([openable], {
			forceNewWindow: !!openInNewWindow,
			remoteAuthority: remoteAuthority || null // local window if remoteAuthority is not set or can not be deducted from the openable
		});
	});

	return Object.assign(ret, { uri, remoteAuthority });
}
