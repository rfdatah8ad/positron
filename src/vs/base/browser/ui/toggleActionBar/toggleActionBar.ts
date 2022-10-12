/*---------------------------------------------------------------------------------------------
 *  Copyright (c) RStudio, PBC.
 *--------------------------------------------------------------------------------------------*/

import * as DOM from 'vs/base/browser/dom';
import { Action, IAction, IActionRunner } from 'vs/base/common/actions';
import { IHoverDelegate } from 'vs/base/browser/ui/iconLabel/iconHoverDelegate';
import { BaseActionViewItem } from 'vs/base/browser/ui/actionbar/actionViewItems';
import { ActionBar, ActionsOrientation } from 'vs/base/browser/ui/actionbar/actionbar';

/**
 * ToggleAction class. Represents a toggle action in a ToggleActionBar.
 */
export class ToggleAction extends Action {
	//#region Class Initialization

	/**
	 * Initializes a new instance of the ToggleAction class.
	 * @param id The ID of the action.
	 * @param label The label.
	 * @param tooltip The tooltip.
	 * @param cssClass The CSS class for the action.
	 * @param enabled A value which indicates whether the action is enabled.
	 * @param actionCallback The function to be called when the action is executed.
	 */
	constructor(id: string, label: string, tooltip: string, cssClass: string, enabled: boolean = true, actionCallback?: (event?: unknown) => unknown) {
		super(id, label, cssClass, enabled, actionCallback);
		this.tooltip = tooltip;
	}

	//#endregion Class Initialization

	//#region Public Methods

	/**
	 * Toggle the toggle action on.
	 */
	toggleOn(): void {
		if (!this.checked) {
			this._setChecked(true);
		}
	}

	/**
	 * Toggle the toggle action off.
	 */
	toggleOff(): void {
		if (this.checked) {
			this._setChecked(false);
		}
	}

	//#endregion Public Methods
}

/**
 * IToggleActionViewItemOptions interface.
 */
export interface IToggleActionViewItemOptions {
	hoverDelegate?: IHoverDelegate;
}

/**
 * ToggleActionViewItem class. Provides the visual representation of a ToggleAction
 * and keeps it up to dates when the state of the underlying IAction changes.
 */
class ToggleActionViewItem extends BaseActionViewItem {
	//#region Prive Member Variables

	private readonly _actionContainerClass: string;
	private _actionContainer: HTMLElement | undefined;
	private _actionIcon: HTMLElement | undefined;

	//#endregion Prive Member Variables

	//#region Class Initialization

	/**
	 * Initializes a new instance of the ToggleActionViewItem class.
	 * @param action The action for the view.
	 * @param actionContainerClass The action container class.
	 */
	constructor(
		action: IAction,
		actionContainerClass: string,
		options: IToggleActionViewItemOptions,
	) {
		super(null, action, options);
		this._actionContainerClass = actionContainerClass;
	}

	//#endregion Class Initialization

	/**
	 * Upates the checked state of the view.
	 */
	override updateChecked(): void {
		// If the action is checked, then it's active; otherwise, it's inactive. Adjust the CSS
		// class of the action container accordingly.
		const TOGGLED_CLASS = 'toggled';
		if (this.action.checked) {
			this._actionIcon?.classList.add(TOGGLED_CLASS);
			this._actionContainer?.classList.add(TOGGLED_CLASS);
		} else {
			this._actionIcon?.classList.remove(TOGGLED_CLASS);
			this._actionContainer?.classList.remove(TOGGLED_CLASS);
		}
	}

	/**
	 * Renders the view.
	 * @param container The container into which the view is rendered.
	 */
	override render(container: HTMLElement): void {
		super.render(container);
		this._actionContainer = DOM.$(`.${this._actionContainerClass}`);
		this._actionIcon = DOM.$(`.${this.action.class}`);
		DOM.append(this._actionContainer, this._actionIcon);
		DOM.append(container, this._actionContainer);
		this.updateAriaLabel();
		this.updateTooltip();
	}
}

/**
 * IToggleActionBarOptions interface. This does not extend IActionBarOptions on purpose
 * at this time because we do not want to allow certain things like, for example, the
 * ability to specify a custom IActionViewItemProvider. This may change in the future
 * as new use cases for ToggleActionBar emerge.
 */
export interface IToggleActionBarOptions {
	readonly actionContainerClass: string;
	readonly orientation?: ActionsOrientation;
	readonly actionRunner?: IActionRunner;
	readonly ariaLabel?: string;
	readonly ariaRole?: string;
	readonly hoverDelegate?: IHoverDelegate;
}

/**
 * ToggleActionBar class. A toggle action bar can be thought of as a set of "mutually exclusive on"
 * toggle switches. A toggle action bar with three toggle actions can be in one of the following
 * states:
 * [off] [off] [off]
 * [on]  [off] [off]
 * [off] [on]  [off]
 * [off] [off] [on]
 */
export class ToggleActionBar extends ActionBar {
	//#region Prive Member Variables

	private readonly _actionContainerClass: string;
	private readonly _toggleActions: ToggleAction[];
	private _activeToggleAction: ToggleAction | undefined;

	//#endregion Prive Member Variables

	//#region Class Initialization

	/**
	 * Initializes a new instance of the
	 * @param container
	 * @param options
	 * @param toggleActions
	 */
	constructor(container: HTMLElement, options: IToggleActionBarOptions, toggleActions: ToggleAction[]) {
		super(container, {
			...options,
			...{
				actionViewItemProvider: action => {
					return new ToggleActionViewItem(action, this._actionContainerClass, { hoverDelegate: options.hoverDelegate });
				},
				animated: false,
				preventLoopNavigation: true
			}
		});

		this._actionContainerClass = options.actionContainerClass;

		this._toggleActions = toggleActions;
		this.push(this._toggleActions);
	}

	/**
	 * Gets the active toggle action.
	 */
	get activeToggleAction(): ToggleAction | undefined {
		return this._activeToggleAction;
	}

	/**
	 * Sets the active toggle action.
	 */
	set activeToggleAction(toggleAction: ToggleAction | undefined) {
		// Validate the toggle action.
		if (!toggleAction) {
			return;
		}

		// Validate the toggle action to ensure that it's part of the toggle action bar.
		this.validateToggleAction(toggleAction);

		// Update the toggle action.
		if (this._activeToggleAction !== toggleAction) {
			this._activeToggleAction?.toggleOff();
			this._activeToggleAction = toggleAction;
			this._activeToggleAction.toggleOn();
		}
	}

	/**
	 * Toggles a toggle action on or off.
	 * @param toggleAction The toggle action to toggle.
	 */
	toggleToggleAction(toggleAction: ToggleAction | undefined): void {
		// Validate the toggle action.
		if (!toggleAction) {
			return;
		}

		// Validate the toggle action to ensure that it's part of the toggle action bar.
		this.validateToggleAction(toggleAction);

		// Update the toggle action.
		this._activeToggleAction?.toggleOff();
		this._activeToggleAction = this._activeToggleAction === toggleAction ? undefined : toggleAction;
		this._activeToggleAction?.toggleOn();
	}

	/**
	 * Validates that a toggle action belongs to the toggle action bar.
	 * @param toggleAction The toggle action.
	 */
	private validateToggleAction(toggleAction: ToggleAction) {
		if (this._toggleActions.indexOf(toggleAction) === -1) {
			throw new Error(`Unknown toggle action '${toggleAction.id}'`);
		}
	}
}
