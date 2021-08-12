/*
 * Global.ts – non-Electron depending globally-used module declarations
 */

import { readFileSync } from "fs";
import { resolve } from "path";

/**
 * Outputs a fancy log message in the (DevTools) console.
 * 
 * @param msg Message to log in the console.
 */

export function wLog(msg: string): void {
	console.log("%c[WebCord]", 'color: #69A9C1', msg);
}

export type Person = string & {
	name: string,
	email?: string,
	url?: string;
};

export interface PackageJsonProperties {
	/** NodeJS-friendly application name. */
	name: string,
	/** Application author. */
	author: Person,
	/** Array of application code contributors. */
	contributors?: Array<Person>,
	/** Application homepage (`Readme.md` file). */
	homepage: string,
	/** Application repository. */
	repository: string & {
		/** Repository type (e.g. `git`). */
		type: string,
		/** Repository URL (e.g `git+https://example.com`) */
		url: string;
	};
}

function isPerson(variable: unknown): variable is Person {
	// Check #1: Variable is either string or object.
	if (typeof (variable) !== 'string' && typeof (variable) !== 'object')
		return false;

	// Check #2: When variable is object, it has 'name' key and optionally 'email' and 'url' keys.
	if (typeof (variable) === 'object') {
		if (typeof ((variable as Person).name) !== 'string')
			return false;

		if ((variable as Person).email !== undefined && typeof ((variable as Person).email) !== 'string')
			return false;

		if ((variable as Person).url !== undefined && typeof ((variable as Person).url) !== 'string')
			return false;
	}

	return true;
}

function isPackageJsonComplete(object: unknown): object is PackageJsonProperties {
	// Check #1: 'contributors' is array of 'Person'
	if (typeof (object as PackageJsonProperties).contributors === "object")
		for (const key of (object as Record<string, Array<unknown>>).contributors)
			if (!isPerson(key)) return false;

	// Check #2: 'author' is 'Person'
	if (!isPerson((object as PackageJsonProperties).author))
		return false;

	// Check #3: 'name' and 'homepage' are strings.
	for (const stringKey of ['name', 'homepage'])
		if (typeof ((object as { [key: string]: string; })[stringKey]) !== 'string')
			return false;

	// Check #4: 'repository' is either string or object
	if (typeof (object as PackageJsonProperties).repository !== "string" && typeof (object as PackageJsonProperties).repository !== "object")
		return false;

	// Check #5: As object, 'repository' has 'type' and 'url' keys of type 'string'
	for (const stringKey of ['type', 'url']) {
		const repository = (object as PackageJsonProperties).repository;
		if (typeof (repository) === "object" && typeof ((repository as { [key: string]: string; })[stringKey]) !== "string")
			return false;
	}

	return true;
}

/**
 *
 * Function used to aquire some properties from `package.json`.
 *
 * To avoid leakage of some properties (like `scripts`) to the malicious code,
 * this function has limited number of properties that cannot be exceeded.
 */

function getPackageJsonProperties(): PackageJsonProperties {
	const packageJSON: Record<string, unknown> = JSON.parse(readFileSync(resolve(__dirname, "../../package.json")).toString());
	if (!isPackageJsonComplete(packageJSON))
		throw new TypeError("File 'package.json' does not contain all required properties or/and some of them are of invalid type!");
	return {
		name: packageJSON.name,
		author: packageJSON.author,
		contributors: packageJSON.contributors,
		homepage: packageJSON.homepage,
		repository: packageJSON.repository
	};
}

/**
 * An object containing some properties of `package.json` file.
 * 
 * To avoid leakage of some properties (like `scripts`) to the malicious code,
 * this object has limited number of properties.
 */

export const packageJson = getPackageJsonProperties();