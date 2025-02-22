/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2024 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/


import { expect } from '@playwright/test';
import { Code } from '../code';

const COLUMN_HEADERS = '.data-explorer-panel .column-2 .data-grid-column-headers';
const HEADER_TITLES = '.data-grid-column-header .title-description .title';
const DATA_GRID_ROWS = '.data-explorer-panel .column-2 .data-grid-rows';
const DATA_GRID_ROW = '.data-grid-row';
const CLOSE_DATA_EXPLORER = '.tab .codicon-close';
const IDLE_STATUS = '.status-bar-indicator .icon.idle';
const SCROLLBAR_LOWER_RIGHT_CORNER = '.data-grid-scrollbar-corner';
const DATA_GRID_TOP_LEFT = '.data-grid-corner-top-left';
const ADD_FILTER_BUTTON = '.codicon-positron-add-filter';
const COLUMN_SELECTOR = '.positron-modal-overlay .drop-down-column-selector';
const COLUMN_INPUT = '.positron-modal-overlay .column-search-input .text-input';
const COLUMN_SELECTOR_CELL = '.column-selector-cell';
const FUNCTION_SELECTOR = '.positron-modal-overlay .drop-down-list-box';
const FILTER_SELECTOR = '.positron-modal-overlay .row-filter-parameter-input .text-input';
const APPLY_FILTER = '.positron-modal-overlay .button-apply-row-filter';
const STATUS_BAR = '.positron-data-explorer .status-bar';
const OVERLAY_BUTTON = '.positron-modal-overlay .positron-button';

export interface CellData {
	[key: string]: string;
}

/*
 *  Reuseable Positron data explorer functionality for tests to leverage.
 */
export class PositronDataExplorer {

	constructor(private code: Code) { }

	/*
	 * Get the currently visible data explorer table data
	 */
	async getDataExplorerTableData(): Promise<object[]> {

		// unreliable:
		//await this.code.waitForElement(IDLE_STATUS);
		await this.code.driver.getLocator(IDLE_STATUS).waitFor({ state: 'visible', timeout: 30000 });

		// we have seen intermittent failures where the data explorer is not fully loaded
		// even though the status bar is idle. This wait is to ensure the data explorer is fully loaded
		// chosing 1000ms as a safe wait time because waitForElement polls at 100ms
		await this.code.wait(1000);

		const headers = await this.code.waitForElements(`${COLUMN_HEADERS} ${HEADER_TITLES}`, false);
		const rows = await this.code.waitForElements(`${DATA_GRID_ROWS} ${DATA_GRID_ROW}`, true);
		const headerNames = headers.map((header) => header.textContent);

		const tableData: object[] = [];
		for (const row of rows) {
			const rowData: CellData = {};
			let columnIndex = 0;
			for (const cell of row.children) {
				const innerText = cell.textContent;
				const headerName = headerNames[columnIndex];
				// workaround for extra offscreen cells
				if (!headerName) {
					continue;
				}
				rowData[headerName] = innerText;
				columnIndex++;
			}
			tableData.push(rowData);
		}

		return tableData;
	}

	async closeDataExplorer() {
		await this.code.waitAndClick(CLOSE_DATA_EXPLORER);
	}

	async clickLowerRightCorner() {
		await this.code.waitAndClick(SCROLLBAR_LOWER_RIGHT_CORNER);
	}

	async clickUpperLeftCorner() {
		await this.code.waitAndClick(DATA_GRID_TOP_LEFT);
	}

	/*
	 * Add a filter to the data explorer.  Only works for a single filter at the moment.
	 */
	async addFilter(columnName: string, functionText: string, filterValue: string) {

		await this.code.waitAndClick(ADD_FILTER_BUTTON);

		// worakaround for column being set incorrectly
		await expect(async () => {
			await this.code.waitAndClick(COLUMN_SELECTOR);
			const columnText = `${columnName}\n`;
			await this.code.waitForSetValue(COLUMN_INPUT, columnText);
			await this.code.waitAndClick(COLUMN_SELECTOR_CELL);
			const checkValue = (await this.code.waitForElement(COLUMN_SELECTOR)).textContent;
			expect(checkValue).toBe(columnName);
		}).toPass();


		await this.code.waitAndClick(FUNCTION_SELECTOR);

		// note that base Microsoft funtionality does not work with "has text" type selection
		const equalTo = this.code.driver.getLocator(`${OVERLAY_BUTTON} div:has-text("${functionText}")`);
		await equalTo.click();

		const filterValueText = `${filterValue}\n`;
		await this.code.waitForSetValue(FILTER_SELECTOR, filterValueText);

		await this.code.waitAndClick(APPLY_FILTER);
	}

	async getDataExplorerStatusBar() {
		return await this.code.waitForElement(STATUS_BAR, (e) => e!.textContent.includes('Showing'));
	}

	async selectColumnMenuItem(columnIndex: number, menuItem: string) {

		await this.code.waitAndClick(`.data-grid-column-header:nth-child(${columnIndex}) .sort-button`);

		await this.code.driver.getLocator(`.positron-modal-overlay div.title:has-text("${menuItem}")`).click();

	}
}
