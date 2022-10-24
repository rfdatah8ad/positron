/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Posit, PBC.
 *--------------------------------------------------------------------------------------------*/

const React = require('react');
import { FC, useState } from 'react';
import { localize } from 'vs/nls';
import { ServicesAccessor } from 'vs/editor/browser/editorExtensions';
import { showPositronModalDialog } from 'vs/workbench/browser/parts/positronModalDialog/positronModalDialog';
import { ILayoutService } from 'vs/platform/layout/browser/layoutService';
import { IFileDialogService } from 'vs/platform/dialogs/common/dialogs';
import { IPathService } from 'vs/workbench/services/path/common/pathService';
import { browseForParentDirectory, defaultParentDirectory, NewWorkspaceDialogContext } from 'vs/workbench/browser/parts/positronTopBar/dialogs/newWorkspaceDialog';
import { TextInput } from 'vs/workbench/browser/parts/positronTopBar/dialogs/components/textInput';
import { CheckBoxInput } from 'vs/workbench/browser/parts/positronTopBar/dialogs/components/checkBoxInput';
import { DirectoryInput } from 'vs/workbench/browser/parts/positronTopBar/dialogs/components/directoryInput';

export interface NewWorkspaceFromGitDialogData {
	repo: string;
	parentDirectory: string;
	newWindow: boolean;
}

export async function showNewWorkspaceFromGitDialog(accessor: ServicesAccessor): Promise<NewWorkspaceFromGitDialogData | undefined> {

	// get services
	const layoutService = accessor.get(ILayoutService);
	const fileDialogs = accessor.get(IFileDialogService);
	const pathService = accessor.get(IPathService);

	// default input
	const input: NewWorkspaceFromGitDialogData = {
		repo: '',
		parentDirectory: await defaultParentDirectory(fileDialogs, await pathService.path),
		newWindow: false
	};

	return showPositronModalDialog<NewWorkspaceFromGitDialogData, NewWorkspaceDialogContext>(
		input,
		NewWorkspaceFromGitDialogEditor,
		localize('positronNewWorkspaceDialogTitle', "New Workspace from Git"),
		400,
		300,
		layoutService,
		{ fileDialogs }
	);
}


interface NewWorkspaceFromGitDialogProps {
	input: NewWorkspaceFromGitDialogData;
	context: NewWorkspaceDialogContext;
	onAccept: (f: () => NewWorkspaceFromGitDialogData) => void;
}

const NewWorkspaceFromGitDialogEditor: FC<NewWorkspaceFromGitDialogProps> = (props) => {

	// dialog state (report on accept)
	const [state, setState] = useState<NewWorkspaceFromGitDialogData>(props.input);
	props.onAccept(() => state);

	// browse for parent directory
	const browseForParent = async () => {
		const parentDirectory = await browseForParentDirectory(props.context, state.parentDirectory);
		if (parentDirectory) {
			setState({ ...state, parentDirectory });
		}
	};

	return (
		<>
			<TextInput
				autoFocus label='Repository URL' value={state.repo}
				onChange={e => setState({ ...state, repo: e.target.value })}
			/>
			<DirectoryInput
				label='Create workspace as subdirectory of'
				value={state.parentDirectory}
				onBrowse={browseForParent}
				onChange={e => setState({ ...state, parentDirectory: e.target.value })}
			/>
			<CheckBoxInput
				label='Open in a new window' checked={state.newWindow}
				onChange={e => setState({ ...state, newWindow: e.target.checked })}
			/>
		</>
	);



};

